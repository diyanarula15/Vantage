import re

with open('/Users/apple/Desktop/vantage/Vantage/narrator.py', 'r') as f:
    content = f.read()

# Merge summarize and suggest_follow_ups
new_method = """
    def narrate_and_suggest(self, question: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
        preview = rows[:20]
        prompt = f'''
You are a business data narrator and analytical assistant.
Return ONLY JSON with a "summary" and "follow_up_questions".

Task 1 (summary): Write 2-3 concise sentences interpreting the Result preview without technical jargon. 
- If empty, say "No records found matching those parameters."
- If relevant, leverage your knowledge of external trends context. Do NOT use markdown/bullets.

Task 2 (follow_up_questions): Suggest 3 highly relevant insightful follow-up questions to dive deeper. Keep them concise.

Question: {question}
Result preview: {json.dumps(preview, indent=2)}

Format (JSON only):
{{
  "summary": "...",
  "follow_up_questions": ["q1", "q2", "q3"]
}}
'''
        try:
            payload = self.llm.json(prompt)
            summary = payload.get("summary", "Could not generate summary.")
            normalized = " ".join(summary.strip().replace("\\n", " ").split())
            if normalized.count(".") < 2:
                normalized += " Source reflects the uploaded dataset."
                
            return {
                "summary": normalized,
                "follow_up_questions": payload.get("follow_up_questions", [])[:3]
            }
        except Exception as e:
            import logging
            logging.getLogger("vantage_narrator").warning(f"Failed synthesis: {e}")
            return {"summary": "Insight generation failed.", "follow_up_questions": []}
"""

content = content + "\n\n" + new_method

with open('/Users/apple/Desktop/vantage/Vantage/narrator.py', 'w') as f:
    f.write(content)
print("narrator.py patched successfully")
