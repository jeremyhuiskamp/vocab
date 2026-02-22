"""Gemini API client and helpers for structured (Pydantic) output."""

from typing import TypeVar

from google import genai
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

# Lazy client so env is loaded first (e.g. by main.py loading .env)
_client: genai.Client | None = None


def get_client() -> genai.Client:
    """Return the Gemini client. Loads API key from GEMINI_API_KEY or GOOGLE_API_KEY env."""
    global _client
    if _client is None:
        _client = genai.Client()
    return _client


def generate_structured(
    prompt: str,
    response_schema: type[T],
    *,
    model: str = "gemini-2.5-flash",
) -> T:
    """
    Generate content from Gemini constrained to a Pydantic model's JSON schema.

    The model's fields and Field(description=...) are used to build the JSON schema
    sent to the API, so the response matches your types and descriptions.

    Returns the response parsed and validated as the given Pydantic model.
    """
    client = get_client()
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": response_schema,
        },
    )
    if response.parsed is None:
        raise ValueError("Gemini returned no parseable content", response.text)
    return response.parsed  # type: ignore[return-value]
