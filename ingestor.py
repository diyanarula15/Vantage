import json
import os
import re
import sqlite3
from datetime import date, datetime, time
from pathlib import Path
from typing import Any, Optional

import chromadb
import pandas as pd
import yaml
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect as sqlalchemy_inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError

SUPPORTED_WAREHOUSES = {
    "postgresql",
    "mysql",
    "snowflake",
    "redshift",
    "bigquery",
    "databricks",
}

from vantage_llm import LLMClient


load_dotenv()


def _safe_table_name(file_path: str) -> str:
    stem = Path(file_path).stem.lower()
    stem = re.sub(r"[^a-z0-9_]+", "_", stem)
    stem = re.sub(r"_+", "_", stem).strip("_")
    return stem or "uploaded_data"


class VantageIngestor:
    def __init__(self) -> None:
        self.db_path = os.getenv("VANTAGE_DB_PATH", "./data/vantage.db")
        self.metadata_path = os.getenv("VANTAGE_METADATA_PATH", "./data/metadata.json")
        self.metrics_path = os.getenv("VANTAGE_METRICS_PATH", "./data/metric_dictionary.yaml")
        self.chroma_path = os.getenv("VANTAGE_CHROMA_PATH", "./data/chroma")

        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.metadata_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.metrics_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.chroma_path).mkdir(parents=True, exist_ok=True)

        self.llm = LLMClient()
        self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)

    def _read_file(self, file_path: str) -> pd.DataFrame:
        lower = file_path.lower()
        if lower.endswith(".csv"):
            return pd.read_csv(file_path)
        if lower.endswith(".xlsx") or lower.endswith(".xls"):
            return pd.read_excel(file_path)
        raise ValueError("Unsupported file type. Use CSV or Excel.")

    def _write_sqlite(self, df: pd.DataFrame, table_name: str) -> None:
        with sqlite3.connect(self.db_path) as connection:
            df.to_sql(table_name, connection, if_exists="replace", index=False)

    def _read_database(self, connection_string: str, table_name: Optional[str] = None) -> tuple[dict[str, pd.DataFrame], list[str]]:
        try:
            url = make_url(connection_string)
        except Exception as exc:
            raise ValueError(f"Invalid database connection string: {exc}") from exc

        dialect = url.drivername.split("+")[0]
        if dialect not in SUPPORTED_WAREHOUSES:
            raise ValueError(
                f"Unsupported warehouse dialect '{dialect}'. Supported: {', '.join(sorted(SUPPORTED_WAREHOUSES))}"
            )

        try:
            engine = create_engine(connection_string, future=True)
        except ImportError as exc:
            raise ImportError(
                "SQLAlchemy driver not installed. Install SQLAlchemy and the appropriate warehouse driver for your source."
            ) from exc

        def quote_identifier(name: str) -> str:
            preparer = connection.dialect.identifier_preparer
            if '.' in name:
                return '.'.join(preparer.quote(part) for part in name.split('.'))
            return preparer.quote(name)

        tables_data: dict[str, pd.DataFrame] = {}
        with engine.connect() as connection:
            inspector = sqlalchemy_inspect(connection)
            if table_name:
                raw_tables = [table_name]
            else:
                raw_tables = inspector.get_table_names()
            if not raw_tables:
                raise ValueError("No tables were found in the target database.")

            for raw_table in raw_tables:
                quoted_name = quote_identifier(raw_table)
                query = text(f"SELECT * FROM {quoted_name}")
                tables_data[raw_table] = pd.read_sql(query, connection)

        return tables_data, raw_tables

    def ingest_database(self, connection_string: str, table_name: Optional[str] = None) -> dict[str, Any]:
        tables_data, raw_table_names = self._read_database(connection_string, table_name)

        safe_names = {raw: _safe_table_name(raw) for raw in raw_table_names}
        all_schemas = []
        combined_entities = []
        combined_relationships = []
        combined_metrics: list[dict[str, Any]] = []
        total_rows = 0
        total_columns = 0
        min_date, max_date = None, None

        for raw_table, df in tables_data.items():
            safe_name = safe_names[raw_table]
            self._write_sqlite(df, safe_name)
            schema = self._schema_snapshot(safe_name)
            all_schemas.append(schema)

            context_graph, metric_dictionary = self._generate_metadata_and_metrics(safe_name, df, schema)
            combined_entities.extend(context_graph.get("entities", []))
            combined_relationships.extend(context_graph.get("relationships", []))

            for metric in metric_dictionary.get("metrics", []):
                metric["source_table"] = safe_name
                combined_metrics.append(metric)

            total_rows += int(df.shape[0])
            total_columns += int(df.shape[1])

            for col in df.columns:
                if str(df[col].dtype) in ['object', 'string'] or 'datetime' in str(df[col].dtype):
                    try:
                        if not pd.to_numeric(df[col], errors='coerce').notna().sum() > len(df) * 0.5:
                            parsed = pd.to_datetime(df[col], errors='coerce')
                            if not parsed.isna().all():
                                col_min = parsed.min()
                                col_max = parsed.max()
                                if min_date is None or col_min < min_date:
                                    min_date = col_min
                                if max_date is None or col_max > max_date:
                                    max_date = col_max
                    except Exception:
                        pass

        date_bounds = {
            "min_date": min_date.strftime('%Y-%m-%d') if min_date else None,
            "max_date": max_date.strftime('%Y-%m-%d') if max_date else None,
        }

        dialect = make_url(connection_string).drivername.split("+")[0]
        schema_payload = all_schemas[0] if len(all_schemas) == 1 else {raw_table: schema for raw_table, schema in zip(raw_table_names, all_schemas)}
        context_graph = {
            "dataset_name": "warehouse_import",
            "entities": combined_entities,
            "relationships": combined_relationships,
        }
        metric_dictionary = {"metrics": combined_metrics}

        metadata = {
            "source_type": dialect,
            "source_tables": raw_table_names,
            "primary_table": safe_names[raw_table_names[0]],
            "row_count": total_rows,
            "column_count": total_columns,
            "schema": schema_payload,
            "context_graph": context_graph,
            "date_bounds": date_bounds,
            "instant_insights": self._generate_instant_insights(safe_names[raw_table_names[0]], tables_data[raw_table_names[0]]),
        }

        with open(self.metadata_path, "w", encoding="utf-8") as metadata_file:
            json.dump(metadata, metadata_file, indent=2)

        with open(self.metrics_path, "w", encoding="utf-8") as metrics_file:
            yaml.safe_dump(metric_dictionary, metrics_file, sort_keys=False)

        self._index_semantics(safe_names[raw_table_names[0]], context_graph, metric_dictionary)

        return {
            "primary_table": safe_names[raw_table_names[0]],
            "source_tables": raw_table_names,
            "db_path": self.db_path,
            "metadata_path": self.metadata_path,
            "metrics_path": self.metrics_path,
            "rows": total_rows,
            "columns": total_columns,
            "instant_insights": metadata["instant_insights"],
        }

    def _schema_snapshot(self, table_name: str) -> dict[str, Any]:
        with sqlite3.connect(self.db_path) as connection:
            cursor = connection.cursor()
            columns = cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
            return {
                "database": self.db_path,
                "table": table_name,
                "columns": [
                    {
                        "name": item[1],
                        "sqlite_type": item[2],
                        "not_null": bool(item[3]),
                        "is_pk": bool(item[5]),
                    }
                    for item in columns
                ],
            }

    @staticmethod
    def _json_default(value: Any):
        if isinstance(value, (datetime, date, time)):
            return value.isoformat()
        return str(value)

    def _generate_metadata_and_metrics(
        self,
        table_name: str,
        df: pd.DataFrame,
        schema: dict[str, Any],
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        sample_rows = df.head(12).fillna("").to_dict(orient="records")
        dtypes = {column: str(dtype) for column, dtype in df.dtypes.items()}

        prompt = f"""
You are a data onboarding expert for a self-service text-to-SQL system.
Given a single uploaded table, infer a robust context graph and metric dictionary.

Table name: {table_name}
Schema snapshot: {json.dumps(schema, indent=2)}
Pandas dtypes: {json.dumps(dtypes, indent=2)}
Sample rows: {json.dumps(sample_rows, indent=2, default=self._json_default)}

Return JSON only with shape:
{{
  "context_graph": {{
    "dataset_name": "string",
    "entities": [
      {{
        "table": "string",
        "primary_key_guess": "string_or_null",
        "time_column_guess": "string_or_null",
        "description": "business description",
        "columns": [
          {{
            "name": "string",
            "semantic_type": "dimension|metric|time|identifier|text|category|other",
            "business_meaning": "string",
            "pii_risk": "none|low|medium|high"
          }}
        ]
      }}
    ],
    "relationships": [
      {{
        "left_table": "string",
        "left_column": "string",
        "right_table": "string",
        "right_column": "string",
        "relationship_type": "one-to-many|many-to-one|one-to-one|unknown",
        "confidence": 0.0
      }}
    ]
  }},
  "metric_dictionary": {{
    "metrics": [
      {{
        "name": "string",
        "description": "string",
        "sql_formula": "SQL expression reusable in SELECT, e.g. SUM(revenue)",
        "grain_hint": "row|daily|monthly|region|category|unknown"
      }}
    ]
  }}
}}

Rules:
- Must work for generic business datasets.
- Include at least 5 useful metrics if possible.
- If churn/ROI is possible, include them.
- SQL formulas must target SQLite dialect.
"""
        payload = self.llm.json(prompt)
        context_graph = payload.get("context_graph", {})
        metric_dictionary = payload.get("metric_dictionary", {"metrics": []})
        return context_graph, metric_dictionary

    def _index_semantics(
        self,
        table_name: str,
        context_graph: dict[str, Any],
        metric_dictionary: dict[str, Any],
    ) -> None:
        collection = self.chroma_client.get_or_create_collection("column_semantics_v3")

        entities = context_graph.get("entities", [])
        column_payload: list[dict[str, Any]] = []
        
        # 1. Embed raw columns
        for entity in entities:
            for column in entity.get("columns", []):
                record = {
                    "table": entity.get("table", table_name),
                    "column": column.get("name"),
                    "semantic_type": column.get("semantic_type", "other"),
                    "business_meaning": column.get("business_meaning", ""),
                    "pii_risk": column.get("pii_risk", "none"),
                }
                if record["column"]:
                    column_payload.append(record)
                    
        # 2. Embed GraphRAG relationships (ontology edges)
        for rel in context_graph.get("relationships", []):
            rel_doc = f"Relationship: {rel.get('left_table')}.{rel.get('left_column')} maps to {rel.get('right_table')}.{rel.get('right_column')} ({rel.get('relationship_type')})"
            column_payload.append({
                "table": rel.get("left_table", table_name),
                "column": "GRAPH_EDGE",
                "semantic_type": "graph_relationship",
                "business_meaning": rel_doc,
                "pii_risk": "none"
            })
            
        # 3. Embed Metric mathematical logic
        for metric in metric_dictionary.get("metrics", []):
            metric_table = metric.get("source_table", table_name)
            met_doc = f"Metric Ontology '{metric.get('name')}': {metric.get('description')}. Formula constraint: {metric.get('sql_formula')}."
            column_payload.append({
                "table": metric_table,
                "column": f"METRIC_{metric.get('name')}",
                "semantic_type": "metric_formula",
                "business_meaning": met_doc,
                "pii_risk": "none"
            })

        if not column_payload:
            return

        docs = [
            f"Table {item['table']}, column {item['column']}: {item['business_meaning']}. Semantic type: {item['semantic_type']}"
            for item in column_payload
        ]
        metadatas = [
            {
                "table": item["table"],
                "column": item["column"],
                "semantic_type": item["semantic_type"],
                "pii_risk": item["pii_risk"],
            }
            for item in column_payload
        ]
        ids = [f"{item['table']}::{item['column']}" for item in column_payload]
        embeddings = self.llm.embed_texts(docs)

        existing_ids = set(collection.get(include=[]).get("ids", []))
        new_docs, new_meta, new_ids, new_embeddings = [], [], [], []
        for document, metadata, identifier, embedding in zip(docs, metadatas, ids, embeddings):
            if identifier in existing_ids:
                collection.delete(ids=[identifier])
            new_docs.append(document)
            new_meta.append(metadata)
            new_ids.append(identifier)
            new_embeddings.append(embedding)

        collection.add(
            ids=new_ids,
            documents=new_docs,
            metadatas=new_meta,
            embeddings=new_embeddings,
        )

    def _generate_instant_insights(self, table_name: str, df: pd.DataFrame) -> dict[str, Any]:
        try:
            sample_rows = df.head(10).fillna("").to_dict(orient="records")
            prompt = f"""
We just ingested a business dataset named '{table_name}'.
Sample rows: {json.dumps(sample_rows, indent=2, default=self._json_default)}

Please provide a highly synthesized summary of this data.
Return JSON ONLY exactly like this:
{{
  "confidence": 85,
  "biggest_driver": "A 1-sentence insight about the largest contributor or segment.",
  "key_trend": "A 1-sentence insight about the timeline or distribution.",
  "top_insight": "A 1-sentence broad conclusion about the dataset's nature."
}}
"""
            payload = self.llm.json(prompt)
            return {
                "confidence": payload.get("confidence", 85),
                "biggest_driver": payload.get("biggest_driver", "Insights extracted successfully."),
                "key_trend": payload.get("key_trend", "Trends require detailed time-series queries."),
                "top_insight": payload.get("top_insight", "Dataset semantic layer constructed.")
            }
        except Exception:
            return {
                "confidence": 35,
                "biggest_driver": "Data successfully mapped semantic fields.",
                "key_trend": "Trend analysis requires querying the specific time intervals.",
                "top_insight": "The dataset is ready for natural language intelligence."
            }

    def ingest(self, file_path: str) -> dict[str, Any]:
        df = self._read_file(file_path)
        table_name = _safe_table_name(file_path)

        self._write_sqlite(df, table_name)
        schema = self._schema_snapshot(table_name)
        context_graph, metric_dictionary = self._generate_metadata_and_metrics(table_name, df, schema)

        min_date, max_date = None, None
        for col in df.columns:
            if str(df[col].dtype) in ['object', 'string'] or 'datetime' in str(df[col].dtype):
                try:
                    # Prevent numbers from becoming 1970 UNIX times randomly
                    if not pd.to_numeric(df[col], errors='coerce').notna().sum() > len(df)*0.5:
                        parsed = pd.to_datetime(df[col], errors='coerce')
                        if not parsed.isna().all():
                            col_min = parsed.min()
                            col_max = parsed.max()
                            if min_date is None or col_min < min_date: min_date = col_min
                            if max_date is None or col_max > max_date: max_date = col_max
                except Exception:
                    pass
                    
        date_bounds = {
            "min_date": min_date.strftime('%Y-%m-%d') if min_date else None,
            "max_date": max_date.strftime('%Y-%m-%d') if max_date else None
        }

        metadata = {
            "source_file": str(file_path),
            "table_name": table_name,
            "row_count": int(df.shape[0]),
            "column_count": int(df.shape[1]),
            "schema": schema,
            "context_graph": context_graph,
            "date_bounds": date_bounds,
            "instant_insights": self._generate_instant_insights(table_name, df)
        }

        with open(self.metadata_path, "w", encoding="utf-8") as metadata_file:
            json.dump(metadata, metadata_file, indent=2)

        with open(self.metrics_path, "w", encoding="utf-8") as metrics_file:
            yaml.safe_dump(metric_dictionary, metrics_file, sort_keys=False)

        self._index_semantics(table_name, context_graph, metric_dictionary)

        return {
            "table_name": table_name,
            "db_path": self.db_path,
            "metadata_path": self.metadata_path,
            "metrics_path": self.metrics_path,
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),
            "instant_insights": metadata["instant_insights"]
        }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ingest CSV/Excel into Vantage")
    parser.add_argument("file", help="Path to CSV/Excel")
    args = parser.parse_args()

    engine = VantageIngestor()
    result = engine.ingest(args.file)
    print(json.dumps(result, indent=2))
