from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
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
    sql: str | None = None
    data_quality: dict | None = None
    rows: list | None = None

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)