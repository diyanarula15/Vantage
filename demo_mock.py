import os
from unittest.mock import MagicMock, patch
import json

# Set dummy env vars before importing anything
os.environ["GEMINI_API_KEY"] = "mock_key_for_demo"

from vantage_llm import LLMClient
from ingestor import VantageIngestor
from brain import ask_data
from narrator import Narrator

def mock_json(self, prompt: str):
    prompt_lower = prompt.lower()
    
    # 1. Ingestion Mock
    if "context graph" in prompt_lower:
        return {
            "context_graph": {
                "dataset_name": "Sales Data",
                "entities": [{
                    "table": "sales",
                    "primary_key_guess": None,
                    "time_column_guess": "Date",
                    "description": "Sales records containing region, category, revenue, and customer contact.",
                    "columns": [
                        {"name": "Date", "semantic_type": "time", "business_meaning": "Transaction Date", "pii_risk": "none"},
                        {"name": "Region", "semantic_type": "dimension", "business_meaning": "Geographic Sales Region", "pii_risk": "none"},
                        {"name": "Category", "semantic_type": "dimension", "business_meaning": "Product Category", "pii_risk": "none"},
                        {"name": "Sales", "semantic_type": "metric", "business_meaning": "Revenue in USD", "pii_risk": "none"},
                        {"name": "CustomerEmail", "semantic_type": "identifier", "business_meaning": "Contact email of buyer", "pii_risk": "high"}
                    ]
                }]
            },
            "metric_dictionary": {
                "metrics": [
                    {"name": "Total Sales", "description": "Sum of all sales revenue", "sql_formula": "SUM(Sales)", "grain_hint": "row"}
                ]
            }
        }
        
    # 2. Plan Generation Mock
    if "plan for text-to-sql" in prompt_lower:
        return {"plan_steps": ["Identify North America sales", "Group by Category", "Sum revenue", "Sort descending"]}

    # 3. SQL Synthesis/Repair Mock
    if "sql synthesizer" in prompt_lower or "csr-rag critic" in prompt_lower:
        return {"sql": "SELECT Category, SUM(Sales) as Total_Sales FROM sales WHERE Region = 'North America' GROUP BY Category ORDER BY Total_Sales DESC", "fixed_sql": "SELECT Category, SUM(Sales) as Total_Sales FROM sales WHERE Region = 'North America' GROUP BY Category ORDER BY Total_Sales DESC"}
        
    # 4. PII Filter Mock
    if "privacy filter" in prompt_lower:
        # Just return the row we pass assuming regex handled it, or mock specific behavior
        return {"rows": json.loads(prompt.split("Rows:\n")[1].strip())}
        
    return {}

def mock_embed_texts(self, texts):
    # Dummy embedding vector 128 elements
    return [[0.1] * 128 for _ in texts]

def mock_text(self, prompt, **kwargs):
    if "business narrator" in prompt.lower():
        return "North America generated $2,700 in Electronics and $2,000 in Software. The data indicates strong demand for Software products overall."
    return "Mock response"

print("--- 🎬 Vantage Mock Demonstration ---")

with patch.object(LLMClient, 'json', autospec=True) as mock_j, \
     patch.object(LLMClient, 'embed_texts', autospec=True) as mock_e, \
     patch.object(LLMClient, 'text', autospec=True) as mock_t:
     
    mock_j.side_effect = mock_json
    mock_e.side_effect = mock_embed_texts
    mock_t.side_effect = mock_text

    print("\n1️⃣ INGESTION LAYER")
    print("Uploading: sales.csv")
    engine = VantageIngestor()
    # Muting ChromaDB persistent warnings by passing mock config if necessary, or just running:
    try:
        result = engine.ingest("sales.csv")
        print(f"✅ Ingestion Complete: Created SQLite table '{result['table_name']}' ({result['rows']} rows)")
    except Exception as e:
        print(f"Error: {e}")

    print("\n2️⃣ ORCHESTRATION LAYER (TAG + CSR)")
    query = "What were the total sales in North America by Category?"
    print(f"User Query: '{query}'")
    try:
        payload = ask_data(query)
        print("🧠 TAG Execution Plan:")
        for i, step in enumerate(payload['plan'], 1):
            print(f"   {i}. {step}")
        print(f"\n⚙️ Generated SQL:\n   {payload['sql']}")
        print(f"\n📊 Raw Database Results: {payload['rows']}")
    except Exception as e:
        print(f"Error: {e}")

    print("\n3️⃣ DELIVERY LAYER (PII Filter + Narrator)")
    try:
        narrator = Narrator()
        safe_rows = narrator.redact_pii(payload.get("rows", []))
        summary = narrator.summarize(query, safe_rows)
        
        print(f"🔒 Output after Privacy Filter (Regex + LLM): {safe_rows}")
        print(f"\n💬 Narrator Final Output:\n   {summary}")
    except Exception as e:
        print(f"Error: {e}")

print("\n------------------------------------")
