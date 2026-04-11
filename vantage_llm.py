import json
import os
import re
from importlib import import_module
from typing import Any

from dotenv import load_dotenv

try:
    from google import genai as modern_genai
    from google.genai import types as modern_types
except Exception:
    modern_genai = None
    modern_types = None


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


class GeminiClient:
    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY in environment.")

        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.embed_model_name = os.getenv("GEMINI_EMBED_MODEL", "models/text-embedding-004")
        self.api_mode = "legacy"
        self.legacy_genai = None

        if modern_genai is not None:
            self.api_mode = "modern"
            self.modern_client = modern_genai.Client(api_key=api_key)
        else:
            try:
                self.legacy_genai = import_module("google.generativeai")
                self.legacy_genai.configure(api_key=api_key)
            except Exception as error:
                raise ImportError(
                    "No Gemini SDK found. Install `google-genai` or `google-generativeai`."
                ) from error

    def text(self, prompt: str, response_mime_type: str | None = None) -> str:
        if self.api_mode == "modern":
            config = None
            if response_mime_type and modern_types is not None:
                config = modern_types.GenerateContentConfig(response_mime_type=response_mime_type)
            result = self.modern_client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            return (getattr(result, "text", "") or "").strip()

        model = self.legacy_genai.GenerativeModel(self.model_name)
        generation_config = {}
        if response_mime_type:
            generation_config["response_mime_type"] = response_mime_type
        result = model.generate_content(prompt, generation_config=generation_config or None)
        return (result.text or "").strip()

    def json(self, prompt: str) -> Any:
        response = self.text(prompt, response_mime_type="application/json")
        return _extract_json_block(response)

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        if self.api_mode == "modern":
            for text in texts:
                if modern_types is not None:
                    config = modern_types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
                else:
                    config = None
                result = self.modern_client.models.embed_content(
                    model=self.embed_model_name,
                    contents=text,
                    config=config,
                )
                embeddings = getattr(result, "embeddings", None)
                if embeddings:
                    values = getattr(embeddings[0], "values", None)
                    if values:
                        vectors.append(list(values))
                        continue
                raise ValueError("Embedding API returned no vectors.")
            return vectors

        for text in texts:
            result = self.legacy_genai.embed_content(
                model=self.embed_model_name,
                content=text,
                task_type="retrieval_document",
            )
            vectors.append(result["embedding"])
        return vectors
