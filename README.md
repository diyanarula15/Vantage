# 🧿 Vantage: Chat with your Data


Deployed link - https://vantage-app-xgtt.onrender.com
Vantage is a plug-and-play data assistant built to actually get the numbers right. Drop in any CSV or Excel file, and you can instantly start asking questions about your data via a sleek React dashboard or directly in Slack. 

We built Vantage to fix the "AI hallucination" problem in data analytics by tightly coupling an LLM to a real SQLite execution engine.

---

## ✨ Core Pillars: Clarity, Trust, & Speed
Vantage is designed around three foundational principles, backed by a rigorous technical pipeline, to ensure you actually use the answers you get:
- **Clarity (MADD & Plotly):** Instead of just dumping raw data tables, an automated Multi-Agent Driver Discovery (MADD) algorithm intercepts output rows on the fly. It deterministically calculates percentage distributions and root-cause drivers across dimensions, feeding that structured metadata into an auto-generated Plotly visual layer alongside a contextual NLP narrative.
- **Trust (CSR-RAG & SQLite Coupling):** You never have to blindly trust an LLM. Vantage tightly couples the language model to a hard-coded SQLite execution dialect. If a syntax or schema hallucination occurs, the Context-Schema-Repair (CSR) RAG loop catches the deterministic database error and automatically heals the code in the background. The full execution trace, including the exact raw SQL, is then completely exposed in the UI so every single number is mathematically verifiable.
- **Speed (GBEC L2-Caching):** By hashing incoming questions into an embedded semantic Vector DB (ChromaDB), the Glass-Box Execution Cache (GBEC) performs a sub-millisecond vector search. If the semantic distance falls below a strict `<0.20` threshold, the entire intensive LLM reasoning stack is completely bypassed, instantly firing the pre-verified SQL for true zero-latency retrieval.

---

## 🚀 Key Features

### 1. The Reasoning Engine (Built for Accuracy)
Under the hood, Vantage treats your data like a real database, not just text to guess on:
- **Semantic Caching:** We map your columns into ChromaDB. If someone asks a question we've seen before, we skip the LLM entirely and serve the cached SQL for instant, zero-latency answers.
- **Auto-Healing SQL:** If our agent generates a bad SQL query that throws a syntax error, it doesn't just crash. A background repair loop catches the SQLite error, reads the schema, and automatically writes a fix before you ever see it.

### 2. Instant "Data DNA" Onboarding
No painful manual configuration or strict schemas required.
- **Plug and Play:** Upload almost any generic CSV or Excel file (financials, server logs, sales data) and Vantage figures out the types on its own.
- **Zero-Query Insights:** The second your file finishes uploading, the UI preemptively serves up the top trends, drivers, and anomalies in your data before you even have to type a question.

### 3. The "Why" Engine
Instead of just being a text-to-SQL bot, Vantage acts as a proactive analytical partner.
- **Driver Discovery:** We don't just tell you *what* happened; we run algorithms over the output to explain *why* it happened (e.g., breaking down the exact percentage a specific category contributed to a spike).
- **Proactive Flow:** Context-aware follow-up suggestions, transparent reasoning steps, and auto-generated Plotly graphs keep you exploring instead of hitting dead ends.

### 4. Interactive 3-Panel UI
We built a premium analytics experience directly inside React.
- **Independent Scrolling Zones:** The UI is split into your Data overview, an interactive chat canvas, and a "Trust panel" that shows the exact raw SQL running behind the scenes.
- **Privacy First:** Visual indicators let you know exactly when any sensitive string fields (PII) have been stripped from the results.

### 5. Out-of-the-Box Integrations (Slack + Beyond)

Vantage goes beyond dashboards by integrating directly with your workflow and data stack.

- **Slack Bot:** Run queries and receive insights inside Slack using interactive responses.
- **Data Stack Connectivity:** Designed to work with SQL warehouses and databases like PostgreSQL, MySQL, BigQuery, and Redshift.
- **Unified Layer:** Combines multiple data sources into a single semantic intelligence system.


---

## 📂 Project Architecture

![alt text](image.png)

Vantage operates on a secure, closed-loop **Triple-Layer Pipeline**:
1. **Ingestor (The Loader):** Raw flat files are scrubbed, mapped into a secure SQLite database, and conceptually pushed into a ChromaDB semantic index.
2. **Brain (The Orchestrator):** Human questions trigger a TAG-planner that checks memory caches, generates SQL securely, and autonomously auto-repairs any syntax or schema mismatches in milliseconds.
3. **Delivery (The Explainer):** Output is piped through a narrator to strip PII and calculate data drivers before being pushed to the React UI or Slack Bot.

---

## 🛠️ Quickstart & Setup

1. **Environment Initialization**
   Create and activate a Python 3.10+ virtual environment.
   ```bash
   pip install -r requirements.txt
   cp .env.example .env
   ```
   *Fill in your required LLM and Slack API keys inside `.env`.*

2. **Run the React Frontend + FastAPI Backend**
   The application now features a high-end React landing page and a robust FastAPI backend.
   
   **Terminal 1 (Backend):**
   ```bash
   uvicorn api:app --host 0.0.0.0 --port 8000 --reload
   ```

   **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **CLI Data Ingestion (Optional)**
   ```bash
   python ingestor.py /path/to/your_data.csv
   ```

4. **Launch the Slack Agent**
   ```bash
   python interfaces.py --mode slack
   ```

---

*Vantage sets a new standard for text-to-SQL — where stunning design meets unparalleled factual integrity.*
