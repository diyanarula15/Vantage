import json
import os
import re
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

import cohere
from duckduckgo_search import DDGS

_env_dir = Path(__file__).resolve().parent
load_dotenv(_env_dir / ".env")
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

    def text(self, prompt: str, response_mime_type: Optional[str] = None, use_web: bool = False, temperature: float = 0.0, search_query: Optional[str] = None) -> str:
        # Currently Cohere natively supports response_format for JSON format in newer agents, 
        # but the prompt engineering usually works well too.
        # We can pass response_format if requested.
        kwargs = {
            "model": self.model_name,
            "message": prompt,
            "temperature": temperature,
        }
        
        if use_web and search_query:
            try:
                with DDGS() as ddgs:
                    results = [r for r in ddgs.text(search_query, max_results=3)]
                if results:
                    # Cohere natively accepts an array of strings or dicts for RAG grounding
                    kwargs["documents"] = results
            except Exception as e:
                print(f"Warning: DuckDuckGo search failed: {e}")
        
        response = self.client.chat(**kwargs)
        return (response.text or "").strip()

    def json(self, prompt: str) -> Any:
        # Often with Cohere for JSON we just append an instruction
        json_prompt = prompt + "\n\nPlease ensure your response is ONLY valid JSON, with no markdown formatting or extra text."
        response_text = self.text(json_prompt)
        return _extract_json_block(response_text)

    def embed_texts(
        self,
        texts: list[str],
        *,
        input_type: str = "search_document",
    ) -> list[list[float]]:
        response = self.client.embed(
            texts=texts,
            model=self.embed_model_name,
            input_type=input_type,
        )
        return response.embeddings
