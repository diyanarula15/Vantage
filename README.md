# Vantage: Universal Text-to-SQL (Self-Service)

Vantage is a self-service intelligence platform: upload any valid CSV/Excel, and immediately "talk" to it through a Streamlit dashboard or Slack.

## Why this architecture works

Vantage uses a **Triple-Layer Brain**:

1. **Ingestion Engine (Auto-Onboarding)**
   - Profiles incoming data with `pandas` + Gemini Flash
   - Generates:
     - `metadata.json` with a **Context Graph**
     - `metric_dictionary.yaml` with reusable SQL formulas
   - Stores semantic column meanings in ChromaDB

2. **Orchestration Layer (TAG + CSR-RAG)**
   - **Planner (TAG):** decomposes user intent into steps
   - **Synthesizer:** builds SQLite SQL using metric dictionary formulas
   - **Critic (CSR-RAG):** executes SQL, catches failures, and performs one schema-aware repair pass

3. **Delivery Layer**
   - **Narrator:** explains answers in plain business language
   - **Privacy Filter:** masks PII via regex + LLM entity redaction

---

## Context Graph Engineering (Core Differentiator)

Vantage does **Context Graph Engineering**, not just table loading.

- It converts raw columns into business entities and semantic types.
- It stores relationships and metric semantics in machine-readable form.
- It indexes definitions (not raw rows) in ChromaDB for reliable semantic retrieval.

This makes the platform resilient across different datasets without manual schema tuning.

---

## Project Structure

- `ingestor.py` — upload ingestion, SQLite creation, metadata/metrics generation, Chroma indexing
- `brain.py` — `ask_data(query)` with TAG planning + SQL synthesis + CSR repair loop
- `narrator.py` — PII redaction + two-sentence summary
- `interfaces.py` — Streamlit UI and Slack Bolt listener
- `vantage_llm.py` — Gemini Flash + embeddings helper
- `requirements.txt` — Python dependencies
- `.env.example` — required environment variables

---

## Setup

1. Create and activate a Python environment.
2. Install dependencies.
3. Copy `.env.example` to `.env` and fill in API keys/tokens.

### Minimal run (Streamlit)

```bash
pip install -r requirements.txt
cp .env.example .env
streamlit run interfaces.py
```

### Ingest via CLI (optional)

```bash
python ingestor.py /path/to/transactions.csv
```

### Slack listener

```bash
python interfaces.py --mode slack
```

---

## Expected Flow

1. Upload a CSV/Excel file.
2. Vantage auto-generates Context Graph + Metric Dictionary.
3. Ask a question (UI or Slack).
4. TAG planner creates query plan.
5. SQL is synthesized and validated with one CSR repair iteration if needed.
6. Result is privacy-filtered and narrated in simple language.

---

## Notes

- SQLite is used as the execution backend.
- Gemini Flash is used for all LLM reasoning tasks.
- ChromaDB stores semantic metadata embeddings for retrieval.
