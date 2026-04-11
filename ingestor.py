import json
import os
import re
import sqlite3
from pathlib import Path
from typing import Any

import chromadb
import pandas as pd
import yaml
from dotenv import load_dotenv

from vantage_llm import GeminiClient


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

        self.llm = GeminiClient()
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
Sample rows: {json.dumps(sample_rows, indent=2)}

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
    ) -> None:
        collection = self.chroma_client.get_or_create_collection("column_semantics")

        entities = context_graph.get("entities", [])
        column_payload: list[dict[str, Any]] = []
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

    def ingest(self, file_path: str) -> dict[str, Any]:
        df = self._read_file(file_path)
        table_name = _safe_table_name(file_path)

        self._write_sqlite(df, table_name)
        schema = self._schema_snapshot(table_name)
        context_graph, metric_dictionary = self._generate_metadata_and_metrics(table_name, df, schema)

        metadata = {
            "source_file": str(file_path),
            "table_name": table_name,
            "row_count": int(df.shape[0]),
            "column_count": int(df.shape[1]),
            "schema": schema,
            "context_graph": context_graph,
        }

        with open(self.metadata_path, "w", encoding="utf-8") as metadata_file:
            json.dump(metadata, metadata_file, indent=2)

        with open(self.metrics_path, "w", encoding="utf-8") as metrics_file:
            yaml.safe_dump(metric_dictionary, metrics_file, sort_keys=False)

        self._index_semantics(table_name, context_graph)

        return {
            "table_name": table_name,
            "db_path": self.db_path,
            "metadata_path": self.metadata_path,
            "metrics_path": self.metrics_path,
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),
        }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Ingest CSV/Excel into Vantage")
    parser.add_argument("file", help="Path to CSV/Excel")
    args = parser.parse_args()

    engine = VantageIngestor()
    result = engine.ingest(args.file)
    print(json.dumps(result, indent=2))
