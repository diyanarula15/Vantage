import concurrent.futures
import datetime
import hashlib
import json
import logging
import os
import re
import sqlite3
from typing import Any, Optional

import chromadb
import yaml
from dotenv import load_dotenv

from vantage_llm import LLMClient

logger = logging.getLogger("vantage_brain")
logging.basicConfig(level=logging.INFO)

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
        except Exception as e:
            logger.error(f"Semantic Cache check failed: {e}")
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

    def _synthesize_sql_execution(
        self,
        query: str,
        schema: dict[str, Any],
        metric_dictionary: dict[str, Any],
        retrieval: dict[str, Any],
        date_bounds: dict[str, Any]
    ) -> dict[str, Any]:
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        prompt = f'''
You are a master SQLite synthesizer and analytics planner.
Analyze the user question and generate an execution plan and the final SQLite query.

Question: {query}
Temporal Rules: Real date is {current_date}, bounds {json.dumps(date_bounds)}
Schema: {json.dumps(schema, indent=2)}
GraphRAG Semantics: {json.dumps(retrieval, indent=2)}
Metric dictionary: {json.dumps(metric_dictionary, indent=2)}

Constraints:
- Determine intent: FACTUAL, DIAGNOSTIC, COMPARISON, or SUMMARY.
- If DIAGNOSTIC/COMPARISON, USE GROUP BY to break down metrics.
- MUST use column names exactly as they appear in schema.
- NEVER use single quotes for column names! Use double quotes (e.g. "Column Name").

Return JSON exactly as:
{{
  "intent": "FACTUAL",
  "plan_steps": ["step 1", "step 2"],
  "sql": "SELECT ..."
}}
'''
        payload = self.llm.json(prompt)
        return {
            "intent": payload.get("intent", "FACTUAL").strip().upper(),
            "plan_steps": [str(item) for item in payload.get("plan_steps", [])],
            "sql": payload.get("sql", "").strip()
        }

    def _normalize_sql_value(self, value: Any) -> Any:
        if isinstance(value, (datetime.date, datetime.datetime, datetime.time)):
            return value.isoformat()
        return value

    def _run_sql(self, sql: str) -> tuple[list[str], list[dict[str, Any]]]:
        if not re.match(r"^\s*(WITH|SELECT)\b", sql, re.IGNORECASE):
            raise ValueError(f"Only SELECT or WITH queries are allowed for security. Attempted: {sql[:30]}")
            
        with sqlite3.connect(self.db_path) as connection:
            cursor = connection.cursor()
            try:
                cursor.execute("PRAGMA query_only = ON;")
            except Exception as e:
                logger.warning(f"Could not enforce PRAGMA query_only: {e}")
                
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

    def _generate_plotly(self, query: str, columns: list[str], rows: list[dict[str, Any]]) -> Optional[dict[str, Any]]:
        if not rows:
            return None
        
        sample = json.dumps(rows[:10], default=str)
        prompt = f"""
You are a top-tier Data Visualization Expert.
Generate an interactive Plotly visualization config based exactly on this user query and data sample.

Query: "{query}"
Columns: {columns}
Data Sample: {sample}

Identify the best visual format (bar, pie, line, scatter). Create the exact JSON dict containing the Plotly 'data' array and 'layout' dictionary object.
IMPORTANT: Do not return anything outside the JSON. Return only the JSON:
{{
  "data": [...],
  "layout": {{...}}
}}
"""
        try:
            return self.llm.json(prompt)
        except Exception as e:
            logger.error(f"Plotly generation failed: {e}")
            return None

    def simulate_scenario(self, instruction: str, query: str) -> dict[str, Any]:
        metadata = self._load_metadata()
        schema = metadata.get("schema", {})
        metric_dictionary = self._load_metrics()
        date_bounds = metadata.get("date_bounds", {})
        
        embedding = self.llm.embed_texts([query], input_type="search_query")[0]
        retrieval = self._search_semantics(embedding)
        
        synthesis = self._synthesize_sql_execution(query, schema, metric_dictionary, retrieval, date_bounds)
        sql_select = synthesis["sql"]
        plan_steps = synthesis["plan_steps"]
        intent = synthesis["intent"]
        
        match = re.search(r"FROM\s+[\"']?([a-zA-Z0-9_]+)[\"']?", sql_select, re.IGNORECASE)
        table_name = match.group(1) if match else metadata.get("table_name")
        sandbox_table = table_name + "_sim_" + datetime.datetime.now().strftime("%H%M%S")
        
        update_prompt = f"""
You are a SQL simulator. Write an UPDATE statement that alters the table "{sandbox_table}" according to the user's simulation instruction.
Instruction: {instruction}
Schema: {json.dumps(schema, indent=2)}
Rules:
- NEVER USE DDL (DROP, CREATE, ALTER). Return exactly one standard SQLite UPDATE command.
- If they say "increase margin by 10%", do `UPDATE {sandbox_table} SET margin = margin * 1.1`
Return JSON only: {{"sql": "UPDATE ..."}}
"""
        update_payload = self.llm.json(update_prompt)
        update_sql = update_payload.get("sql", "")

        columns, rows = [], []
        execution_error = None
        sql_select_sim = sql_select.replace(table_name, sandbox_table, 1)

        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(f"CREATE TABLE {sandbox_table} AS SELECT * FROM {table_name}")
                cursor.execute(update_sql)
                conn.commit()
                cursor.execute(sql_select_sim)
                data = cursor.fetchall()
                columns = [item[0] for item in (cursor.description or [])]
                for row in data:
                    rows.append({
                        c: self._normalize_sql_value(v) for c, v in zip(columns, row)
                    })
                cursor.execute(f"DROP TABLE {sandbox_table}")
                conn.commit()
        except Exception as e:
            execution_error = str(e)
            logger.error(f"Simulation execution failed: {e}")
            try:
                with sqlite3.connect(self.db_path) as conn:
                    conn.cursor().execute(f"DROP TABLE IF EXISTS {sandbox_table}")
            except:
                pass

        plotly_config = None
        if rows:
            plotly_config = self._generate_plotly(query, columns, rows)

        return {
            "query": query,
            "intent": "SIMULATION",
            "plan": plan_steps,
            "sql": sql_select,
            "simulated_sql": update_sql,
            "plotly_config": plotly_config,
            "data_quality": {"error": execution_error} if execution_error else {"status": "ok"},
            "columns": columns,
            "rows": rows
        }

    def ask_data(self, query: str) -> dict[str, Any]:
        # --- Parallelise I/O-bound work: embed query AND load metadata at the same time ---
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as boot_pool:
            future_embed = boot_pool.submit(self.llm.embed_texts, [query], input_type="search_query")
            future_meta = boot_pool.submit(self._load_metadata)
            embedding = future_embed.result()[0]
            metadata = future_meta.result()

        metric_dictionary = self._load_metrics()
        schema = metadata.get("schema", {})
        date_bounds = metadata.get("date_bounds", {})

        # Cache check + semantic search both use the embedding — run in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as lookup_pool:
            future_cache = lookup_pool.submit(self._check_cache, embedding)
            future_retrieval = lookup_pool.submit(self._search_semantics, embedding)
            cached_sql, cache_distance = future_cache.result()
            retrieval = future_retrieval.result()

        plan_steps = []
        sql = ""
        intent = "FACTUAL"
        execution_error = None
        repaired = False
        columns, rows = [], []
        cached_run_success = False

        if cached_sql:
            try:
                columns, rows = self._run_sql(cached_sql)
                sql = cached_sql
                plan_steps = [f"[GBEC] Glass-Box Cache Hit! (L2 Distance: {cache_distance:.3f})"]
                cached_run_success = True
            except Exception as cache_err:
                logger.warning(f"Cached SQL failed execution, falling back to full synthesis: {cache_err}")

        if not cached_run_success:
            synthesis = self._synthesize_sql_execution(query, schema, metric_dictionary, retrieval, date_bounds)
            intent = synthesis["intent"]
            plan_steps = synthesis["plan_steps"]
            sql = synthesis["sql"]
            if not sql:
                raise ValueError("Model did not return SQL")

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

        # IMPORTANT: Do not generate Plotly here in ask_data because we moved it to run parallel in api.py
        # Actually in api.py we call _generate_plotly explicitly. We can leave it out here or just return None to save a call.
        # Wait, `simulate_scenario` calls `_generate_plotly` directly, so we need the method to exist. We'll leave it out of `ask_data` to not double-generate.

        return {
            "query": query,
            "intent": intent,
            "plan": plan_steps,
            "sql": sql,
            "repaired": repaired,
            "data_quality": {"error": execution_error} if execution_error else {"status": "ok"},
            "initial_error": execution_error,
            "columns": columns,
            "rows": rows,
            "source": metadata.get("source_file"),
            "table": metadata.get("table_name"),
        }

def ask_data(query: str) -> dict[str, Any]:
    brain = VantageBrain()
    return brain.ask_data(query)

