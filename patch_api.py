import re

with open('/Users/apple/Desktop/vantage/Vantage/api.py', 'r') as f:
    content = f.read()

# Replace the chat_with_data logic
chat_data_pattern = re.compile(r"(@app\.post\(\"/api/chat\", response_model=ChatResponse\)\ndef chat_with_data\(req: ChatRequest\):).*?(return ChatResponse\()", re.DOTALL)

def replacement(match):
    res = '''@app.post("/api/chat", response_model=ChatResponse)
def chat_with_data(req: ChatRequest):
    if not vantage_brain or not narrator:
        raise HTTPException(status_code=500, detail="Core agents not initialized.")
    try:
        import concurrent.futures
        
        # 1. Execute SQL Execution Engine
        payload = vantage_brain.ask_data(req.query)
        sql = payload.get("sql")
        rows = payload.get("rows", [])
        dq = payload.get("data_quality", {})
        columns = payload.get("columns", [])
        preview_rows = rows[:15]
        
        # 2. Run Parallel Post-Processing (Plotly Generation + PII Redaction)
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_plotly = executor.submit(vantage_brain._generate_plotly, req.query, columns, preview_rows)
            future_pii = executor.submit(narrator.redact_pii, preview_rows)
            
            plotly_config = future_plotly.result()
            safe_rows = future_pii.result()
            
            # 3. Narrate Insights and Follow-up Questions (Combined into 1 prompt)
            future_narration = executor.submit(narrator.narrate_and_suggest, req.query, safe_rows)
            narration_result = future_narration.result()
            
        summary = narration_result["summary"]
        follow_ups = narration_result["follow_up_questions"]
        
        return ChatResponse('''
    return res

content = chat_data_pattern.sub(replacement, content)

with open('/Users/apple/Desktop/vantage/Vantage/api.py', 'w') as f:
    f.write(content)
print("api.py patched successfully")
