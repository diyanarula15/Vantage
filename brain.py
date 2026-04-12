import datetime
import hashlib
import json
import os
import sqlite3
from typing import Any, Optional

import chromadb
import yaml
from dotenv import load_dotenv

from vantage_llm import LLMClient


load_dotenv()


class VantageBrain:
    def __init__(self) -> None:
        self.db_path = os.getenv("VANTAGE_DB_PATH", "./data/vantage.db")
        self.metadata_path = os.getenv("VANTAGE_METADATA_PATH", "./data/metadata.json")
        self.metrics_path = os.getenv("VANTAGE_METRICS_PATH", "./data/metric_dictionary.yaml")
        self.chroma_path = os.getenv("VANTAGE_CHROMA_PATH", "./data/chroma")

        self.llm = LLMClient()
        self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)

    def _load_metadata(self) -> dict[str, Any]:
        if not os.path.exists(self.metadata_path):
            raise FileNotFoundError("metadata.json not found. Please ingest a file first.")
        with open(self.metadata_path, "r", encoding="utf-8") as file:
            return json.load(file)

    def _load_metrics(self) -> dict[str, Any]:
        if not os.path.exists(self.metrics_path):
            return {"metrics": []}
        with open(self.metrics_path, "r", encoding="utf-8") as file:
            return yaml.safe_load(file) or {"metrics": []}

    def _search_semantics(self, embedding: list[float], top_k: int = 8) -> dict[str, Any]:
        collection = self.chroma_client.get_or_create_collection("column_semantics_v3")
        result = collection.query(query_embeddings=[embedding], n_results=top_k)

        metadatas = result.get("metadatas", [[]])[0]
        documents = result.get("documents", [[]])[0]
        return {
            "metadatas": metadatas,
            "documents": documents,
        }

    def _check_cache(self, embedding: list[float]) -> tuple[Optional[str], float]:
        collection = self.chroma_client.get_or_create_collection("semantic_cache")
        try:
            result = collection.query(query_embeddings=[embedding], n_results=1)
            if not result.get("ids") or not result["ids"][0]:
                return None, 0.0
            
            distance = result["distances"][0][0]
            threshold = float(os.getenv("SEMANTIC_CACHE_THRESHOLD", "0.20"))
            if distance <= threshold:
                metadatas = result["metadatas"][0][0]
                return metadatas.get("sql"), distance
        except Exception:
            return None, 0.0
        return None, 0.0

    def _save_to_cache(self, query: str, sql: str, embedding: list[float]) -> None:
        collection = self.chroma_client.get_or_create_collection("semantic_cache")
        query_hash = hashlib.md5(query.encode("utf-8")).hexdigest()
        
        collection.upsert(
            ids=[query_hash],
            documents=[query],
            embeddings=[embedding],
            metadatas=[{"sql": sql}]
        )

    def _route_intent(self, query: str) -> str:
        prompt = f"""
You are an intent router for an analytics system.
Classify the query into one of: FACTUAL, DIAGNOSTIC, COMPARISON, SUMMARY.
DIAGNOSTIC = asking 'why', seeking root causes, variances, or drops.
COMPARISON = comparing two periods, segments, or entities vs each other.
SUMMARY = high level breakdown or overview.
FACTUAL = list, sum, or generic questions.

Query: {query}
Return JSON only: {{"intent": "FACTUAL|DIAGNOSTIC|COMPARISON|SUMMARY"}}
"""
        try:
            return self.llm.json(prompt).get("intent", "FACTUAL").strip().upper()
        except:
            return "FACTUAL"

    def _build_plan(
        self,
        query: str,
        schema: dict[str, Any],
        retrieval: dict[str, Any],
        date_bounds: dict[str, Any],
        intent: str
    ) -> list[str]:
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
You are the TAG Planner for text-to-SQL.
Create a short execution plan for the user question.

Question: {query}
Intent Identified: {intent}
Temporal Rules:
- Current Reality Date: {current_date}
- Dataset Boundaries: {json.dumps(date_bounds)} 
Use these to map phrases like "last month" correctly.

Schema: {json.dumps(schema, indent=2)}
GraphRAG Semantic Ontology: {json.dumps(retrieval, indent=2)}

Return JSON with:
{{"plan_steps": ["step 1", "step 2", "step 3"]}}
"""
        payload = self.llm.json(prompt)
        plan_steps = payload.get("plan_steps", [])
        return [str(item) for item in plan_steps]

    def _generate_sql(
        self,
        query: str,
        plan_steps: list[str],
        schema: dict[str, Any],
        metric_dictionary: dict[str, Any],
        retrieval: dict[str, Any],
        date_bounds: dict[str, Any],
        intent: str
    ) -> str:
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        intent_rules = ""
        if intent in ["DIAGNOSTIC", "COMPARISON"]:
            intent_rules = "- intent is analytics! MUST USE GROUP BY to break down the metric by relevant dimensions (e.g., region, category) to show variance or comparison. Calculate deltas if possible."

        prompt = f"""
You are a SQL synthesizer for SQLite.
Generate a single SQLite query that answers the question.

Question: {query}
Plan steps: {json.dumps(plan_steps, indent=2)}
Temporal Rules: Real date is {current_date}, bounds {json.dumps(date_bounds)}
Schema: {json.dumps(schema, indent=2)}
Metric dictionary: {json.dumps(metric_dictionary, indent=2)}

Constraints:
- Use metric dictionary formulas consistently.
- Only use columns from schema.
- Prefer clear aliases.
- CRITICAL SQLite RULE: NEVER use single quotes for column names! Use double quotes (e.g. "Column Name") for columns with spaces. Single quotes are ONLY for strings.
{intent_rules}
- Return JSON only as: {{"sql": "SELECT ..."}}
"""
        payload = self.llm.json(prompt)
        sql = payload.get("sql", "").strip()
        if not sql:
            raise ValueError("Model did not return SQL.")
        return sql

    def _normalize_sql_value(self, value: Any) -> Any:
        if isinstance(value, (datetime.date, datetime.datetime, datetime.time)):
            return value.isoformat()
        return value

    def _run_sql(self, sql: str) -> tuple[list[str], list[dict[str, Any]]]:
        with sqlite3.connect(self.db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(sql)
            data = cursor.fetchall()
            columns = [item[0] for item in (cursor.description or [])]
            rows = []
            for row in data:
                normalized_row = {
                    column: self._normalize_sql_value(value)
                    for column, value in zip(columns, row)
                }
                rows.append(normalized_row)
            return columns, rows

    def _repair_sql_once(
        self,
        original_sql: str,
        error_message: str,
        schema: dict[str, Any],
        metric_dictionary: dict[str, Any],
        query: str,
    ) -> str:
        prompt = f"""
You are the CSR-RAG critic for SQL repair.
Fix SQL based on SQLite error and known schema.

User question: {query}
Original SQL: {original_sql}
SQLite error: {error_message}
Schema: {json.dumps(schema, indent=2)}
Metric dictionary: {json.dumps(metric_dictionary, indent=2)}

Return JSON only: {{"fixed_sql": "SELECT ..."}}
"""
        payload = self.llm.json(prompt)
        fixed_sql = payload.get("fixed_sql", "").strip()
        if not fixed_sql:
            raise ValueError("CSR-RAG repair failed to provide SQL.")
        return fixed_sql

    def ask_data(self, query: str) -> dict[str, Any]:
        metadata = self._load_metadata()
        metric_dictionary = self._load_metrics()
        schema = metadata.get("schema", {})
        date_bounds = metadata.get("date_bounds", {})

        intent = self._route_intent(query)
        embedding = self.llm.embed_texts([query], input_type="search_query")[0]
        cached_sql, cache_distance = self._check_cache(embedding)

        retrieval = self._search_semantics(embedding)
        plan_steps = []
        sql = ""
        execution_error = None
        repaired = False
        columns, rows = [], []
        cached_run_success = False

        if cached_sql:
            try:
                columns, rows = self._run_sql(cached_sql)
                sql = cached_sql
                plan_steps = [f"[GBEC] Glass-Box Cache Hit! (L2 Distance: {cache_distance:.3f})", f"Intent Executed: {intent}"]
                cached_run_success = True
            except Exception:
                pass # Fall back to full synthesis
        
        if not cached_run_success:
            plan_steps = self._build_plan(query, schema, retrieval, date_bounds, intent)
            sql = self._generate_sql(query, plan_steps, schema, metric_dictionary, retrieval, date_bounds, intent)

        execution_error = None
        repaired = False

        if not cached_run_success:
            try:
                columns, rows = self._run_sql(sql)
                self._save_to_cache(query, sql, embedding)
            except Exception as error:
                execution_error = str(error)
                try:
                    repaired_sql = self._repair_sql_once(
                        original_sql=sql,
                        error_message=execution_error,
                        schema=schema,
                        metric_dictionary=metric_dictionary,
                        query=query,
                    )
                    columns, rows = self._run_sql(repaired_sql)
                    sql = repaired_sql
                    repaired = True
                    self._save_to_cache(query, sql, embedding)
                except Exception as repair_error:
                    execution_error += f" | Repair also failed: {str(repair_error)}"
                    columns, rows = [], []
                    repaired = True
                    sql = repaired_sql if 'repaired_sql' in locals() else sql

        return {
            "query": query,
            "intent": intent,
            "plan": plan_steps,
            "sql": sql,
            "repaired": repaired,
            "initial_error": execution_error,
            "columns": columns,
            "rows": rows,
            "source": metadata.get("source_file"),
            "table": metadata.get("table_name"),
        }


def ask_data(query: str) -> dict[str, Any]:
    brain = VantageBrain()
    return brain.ask_data(query)
