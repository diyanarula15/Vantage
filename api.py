from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import shutil
import os
import time

from ingestor import VantageIngestor
import brain
from narrator import Narrator

app = FastAPI(title="Vantage Intelligence API")

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
    rows: Optional[list] = None

class DatabaseIngestRequest(BaseModel):
    source_type: str
    connection_string: str
    table_name: Optional[str] = None

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    file_path = f"./data/uploads/{file.filename}"
    content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    try:
        # Run the powerful ingestion pipeline
        ingestor = VantageIngestor()
        ingestor.ingest(file_path)
        return {"status": "success", "message": "Neural indexing and profiling complete."}
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}\nTraceback: {traceback_str}")

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
    try:
        vantage_brain = brain.VantageBrain()
        narrator = Narrator()
        
        # 1. Ask Brain for SQL and data
        payload = vantage_brain.ask_data(req.query)
        sql = payload.get("sql")
        rows = payload.get("rows", [])
        dq = payload.get("data_quality", {})
        
        # 2. Redact PII
        safe_rows = narrator.redact_pii(rows)
        
        # 3. Narrate Insights
        summary = narrator.summarize(req.query, safe_rows)
        
        return ChatResponse(
            answer=summary,
            sql=sql,
            data_quality=dq,
            rows=safe_rows[:15] # Send back a small preview
        )
    except Exception as e:
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