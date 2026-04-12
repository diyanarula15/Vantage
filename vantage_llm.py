import json
import os
import re
from typing import Any, Optional

from dotenv import load_dotenv

import cohere

load_dotenv()

def _extract_json_block(raw_text: str) -> Any:
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", text)
        if not match:
            raise
        return json.loads(match.group(0))

class LLMClient:
    def __init__(self) -> None:
        api_key = os.getenv("COHERE_API_KEY")
        if not api_key:
            raise ValueError("Missing COHERE_API_KEY in environment.")

        self.model_name = os.getenv("COHERE_MODEL", "command-a-03-2025")
        self.embed_model_name = os.getenv("COHERE_EMBED_MODEL", "embed-v4.0")
        
        self.client = cohere.Client(api_key=api_key)

    def text(self, prompt: str, response_mime_type: Optional[str] = None) -> str:
        # Currently Cohere natively supports response_format for JSON format in newer agents, 
        # but the prompt engineering usually works well too.
        # We can pass response_format if requested.
        kwargs = {
            "model": self.model_name,
            "message": prompt,
        }
        
        response = self.client.chat(**kwargs)
        return (response.text or "").strip()

    def json(self, prompt: str) -> Any:
        # Often with Cohere for JSON we just append an instruction
        json_prompt = prompt + "\n\nPlease ensure your response is ONLY valid JSON, with no markdown formatting or extra text."
        response_text = self.text(json_prompt)
        return _extract_json_block(response_text)

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        response = self.client.embed(
            texts=texts,
            model=self.embed_model_name,
            input_type="search_document"
        )
        return response.embeddings
