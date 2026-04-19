import json
import re
from typing import Any

from vantage_llm import LLMClient


EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}\b")
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")


class Narrator:
    def __init__(self) -> None:
        self.llm = LLMClient()

    def _regex_redact_text(self, value: str) -> str:
        value = EMAIL_REGEX.sub("[REDACTED_EMAIL]", value)
        value = PHONE_REGEX.sub("[REDACTED_PHONE]", value)
        value = SSN_REGEX.sub("[REDACTED_ID]", value)
        return value

    def _regex_redact_records(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        redacted_rows: list[dict[str, Any]] = []
        for row in rows:
            redacted = {}
            for key, value in row.items():
                if isinstance(value, str):
                    redacted[key] = self._regex_redact_text(value)
                else:
                    redacted[key] = value
            redacted_rows.append(redacted)
        return redacted_rows

    def _llm_entity_redact(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        prompt = f"""
You are a privacy filter.
Mask remaining personally identifiable information (PII) in this JSON array of rows.
Possible PII includes person names, personal addresses, account identifiers, and free-text personal references.
Preserve structure and non-PII values.
Use tokens [REDACTED_NAME], [REDACTED_ADDRESS], [REDACTED_ID] when needed.
Return JSON only as {{"rows": [ ... ]}}.

Rows:
{json.dumps(rows, indent=2)}
"""
        payload = self.llm.json(prompt)
        llm_rows = payload.get("rows", rows)
        if isinstance(llm_rows, list):
            return llm_rows
        return rows

    def redact_pii(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        # Just use regex to save massive latency from LLM calls!
        return self._regex_redact_records(rows)

    def suggest_follow_ups(self, question: str, answer: str) -> list[str]:
        prompt = f"""
You are an analytical assistant.
Given the user's previous question and your textual answer, suggest 3 highly relevant and insightful follow-up questions the user could ask next to dive deeper into the data or find root causes. Keep them concise.
Return JSON only as: {{"questions": ["question 1", "question 2", "question 3"]}}

Previous Question: {question}
Answer Given: {answer}
"""
        try:
            payload = self.llm.json(prompt)
            questions = payload.get("questions", [])
            if isinstance(questions, list):
                return questions[:3]
            return []
        except Exception as e:
            import logging
            logging.getLogger("vantage_narrator").warning(f"Failed to generate follow-ups: {e}")
            return []

    def summarize(self, question: str, rows: list[dict[str, Any]]) -> str:
        preview = rows[:20]
        prompt = f"""
You are a top-tier business data narrator.
You are given a question and a subset of internal company data (Result preview). 
Write 2-3 concise sentences and completely avoid technical jargon.

CRITICAL ACCURACY RULES:
- The internal 'Result preview' data is the absolute ground truth. NEVER modify, guess, round incorrectly, or contradict the internal numbers. Every metric you state must be 100% accurate to the preview.
- If using web-searched external context, only provide verified, high-confidence macro facts. Do not mix internal data and external estimates.

RULES:
1. If the "Result preview" is completely empty or [] or None, you MUST reply exactly with: "No records found matching those parameters in the dataset." Do not hallucinate variables.
2. If data exists, synthesize the primary internal data insight first (e.g., biggest contributors, outliers).
3. IF RELEVANT to the question or industry, leverage your web search knowledge to append 1-2 additional sentences explaining external real-world macro market trends, industry benchmarks, or context that helps explain the internal data. 
4. If external context is not highly relevant or verified, skip step 3 and stick strictly to interpreting the internal numbers.
5. Format your answer as a single, continuous, flawlessly blended string. Do NOT use markdown or bullet points.

Question: {question}
Result preview: {json.dumps(preview, indent=2)}
"""
        text = self.llm.text(prompt, use_web=False, search_query=question)
        normalized = " ".join(text.strip().replace("\n", " ").split())
        if normalized.count(".") >= 2:
            return normalized
        return f"{normalized} Source reflects the latest uploaded dataset."



    
    def summarize_simulation(self, query: str, instruction: str, simulated_rows: list) -> str:
        prompt = f'''
You are a highly advanced Strategic Financial Advisor and Data Scientist.
The user asked an original question: "{query}"
Then the user requested a What-If scenario: "{instruction}"
Here is the resulting simulated data: {simulated_rows[:15]}

Your task: Provide extremely actionable, advanced, and stunningly formulated business insights. 
- Do not just read the numbers. 
- Give concrete, strategic reallocation advice (e.g., "Since expenses decreased by 10%, the resulting $500k surplus should be aggressively reinvested into R&D or high-yield marketing channels to compound growth.").
- Use a visionary and authoritative tone. Make it sound like a McKinsey partner is advising the CEO.
- Keep it to 3-4 impactful sentences. Do NOT use markdown.
'''
        text = self.llm.text(prompt)
        return " ".join(text.strip().replace("\n", " ").split())

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
            normalized = " ".join(summary.strip().replace("\n", " ").split())
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
