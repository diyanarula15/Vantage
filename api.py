from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import asyncio
import shutil
import os
import time

from ingestor import VantageIngestor
import brain
from narrator import Narrator

import logging

import hashlib

_query_cache = {}
_simulate_cache = {}

def get_cache_key(*args):
    s = "|".join([str(a) for a in args])
    return hashlib.md5(s.encode()).hexdigest()


logger = logging.getLogger("vantage_api")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Vantage Intelligence API")

# Initialize expensive resources globally
try:
    vantage_brain = brain.VantageBrain()
    narrator = Narrator()
except Exception as e:
    logger.error(f"Failed to initialize core agents: {e}")
    # Will fail later upon usage, but allows app to boot
    vantage_brain = None
    narrator = None

# Enable CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("./data/uploads", exist_ok=True)

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    sql: Optional[str] = None
    data_quality: Optional[dict] = None
    plotly_config: Optional[dict] = None
    rows: Optional[list] = None
    follow_up_questions: Optional[list] = None

class DatabaseIngestRequest(BaseModel):
    source_type: str
    connection_string: str
    table_name: Optional[str] = None

@app.post("/api/upload")
async def upload_dataset(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    file_path = f"./data/uploads/{file.filename}"
    content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    def _run_ingest():
        try:
            ingestor = VantageIngestor()
            ingestor.ingest(file_path)
        except Exception as e:
            print(f"Error in background ingest: {e}")
    
    # Run the heavy ingestion pipeline in the background so we don't block the endpoint
    background_tasks.add_task(_run_ingest)
    return {"status": "success", "message": "Neural indexing and profiling started."}

@app.post("/api/connect")
async def connect_database(req: DatabaseIngestRequest):
    source_type = req.source_type.lower()
    supported = {"postgresql", "mysql", "snowflake", "redshift", "bigquery", "databricks"}
    if source_type not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported source_type '{req.source_type}'. Supported: {', '.join(sorted(supported))}"
        )

    try:
        ingestor = VantageIngestor()
        result = ingestor.ingest_database(req.connection_string, req.table_name)
        return {
            "status": "success",
            "source_type": source_type,
            "source_tables": result.get("source_tables"),
            "primary_table": result.get("primary_table"),
            "source_table": result.get("primary_table"),
            "rows": result.get("rows"),
            "columns": result.get("columns"),
            "metadata_path": result.get("metadata_path"),
            "metrics_path": result.get("metrics_path"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SimulationRequest(BaseModel):
    query: str
    scenario_instruction: str

class SimulationResponse(BaseModel):
    answer: str
    original_sql: Optional[str] = None
    simulated_sql: Optional[str] = None
    plotly_config: Optional[dict] = None
    rows: Optional[list] = None
    follow_up_questions: Optional[list] = None

@app.post("/api/simulate", response_model=SimulationResponse)
def run_simulation(req: SimulationRequest):
    if not vantage_brain or not narrator:
        raise HTTPException(status_code=500, detail="Core agents not initialized.")
        
    cache_key = get_cache_key(req.query, req.scenario_instruction)
    if cache_key in _simulate_cache:
        return _simulate_cache[cache_key]

    try:
        payload = vantage_brain.simulate_scenario(req.scenario_instruction, req.query)
        sql = payload.get("sql")
        simulation_sql = payload.get("simulated_sql")
        rows = payload.get("rows", [])
        plotly_config = payload.get("plotly_config", None)
        
        preview_rows = rows[:15]
        safe_rows = narrator.redact_pii(preview_rows)
        summary = narrator.summarize_simulation(req.query, req.scenario_instruction, safe_rows)
        follow_ups = narrator.suggest_follow_ups(req.query, summary)
        
        resp = SimulationResponse(
            answer=summary,
            original_sql=sql,
            simulated_sql=simulation_sql,
            plotly_config=plotly_config,
            rows=safe_rows,
            follow_up_questions=follow_ups
        )
        _simulate_cache[cache_key] = resp
        return resp
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metadata")
def get_metadata():
    import json
    meta_path = "./data/metadata.json"
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            return json.load(f)
    return {"columns": [], "data_quality": {}}

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_data(req: ChatRequest):
    if not vantage_brain or not narrator:
        raise HTTPException(status_code=500, detail="Core agents not initialized.")
        
    cache_key = get_cache_key(req.query)
    if cache_key in _query_cache:
        return _query_cache[cache_key]

    try:
        import concurrent.futures

        # 1. Execute SQL query (must happen first to get rows)
        payload = vantage_brain.ask_data(req.query)
        sql = payload.get("sql")
        rows = payload.get("rows", [])
        dq = payload.get("data_quality", {})
        columns = payload.get("columns", [])
        preview_rows = rows[:15]

        # 2. Run all three post-processing tasks independently
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)
        future_plotly = executor.submit(vantage_brain._generate_plotly, req.query, columns, preview_rows)
        future_pii = executor.submit(narrator.redact_pii, preview_rows)
        # narrate_and_suggest doesn't need safe_rows from pii — it can run on preview_rows directly
        future_narration = executor.submit(narrator.narrate_and_suggest, req.query, preview_rows)

        plotly_config = future_plotly.result()
        safe_rows = future_pii.result()
        narration_result = future_narration.result()
        executor.shutdown(wait=False)

        summary = narration_result["summary"]
        follow_ups = narration_result["follow_up_questions"]

        resp = ChatResponse(
            answer=summary,
            sql=sql,
            data_quality=dq,
            plotly_config=plotly_config,
            rows=safe_rows,
            follow_up_questions=follow_ups
        )
        _query_cache[cache_key] = resp
        return resp
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Serve React Frontend Build
frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist):
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        path_to_file = os.path.join(frontend_dist, catchall)
        if os.path.isfile(path_to_file):
            return FileResponse(path_to_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)