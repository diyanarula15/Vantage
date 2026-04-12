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
        regex_cleaned = self._regex_redact_records(rows)
        try:
            return self._llm_entity_redact(regex_cleaned)
        except Exception:
            return regex_cleaned

    def summarize(self, question: str, rows: list[dict[str, Any]]) -> str:
        preview = rows[:20]
        prompt = f"""
You are a business narrator for non-technical users.
Write exactly 2 concise sentences and avoid jargon.

RULES:
1. If the "Result preview" is completely empty or [] or None, you MUST reply exactly with: "No records found matching those parameters in the dataset." Do not hallucinate variables.
2. If data exists, highlight the biggest contributors, outliers, or notable concentrations (e.g. "X accounted for Y%").

Question: {question}
Result preview: {json.dumps(preview, indent=2)}
"""
        text = self.llm.text(prompt)
        normalized = " ".join(text.strip().split())
        if normalized.count(".") >= 2:
            return normalized
        return f"{normalized} Source reflects the latest uploaded dataset."
