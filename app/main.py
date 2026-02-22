from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from app.schemas import (
    GenerateSentencesRequest,
    GenerateSentencesResponse,
    SaveUnitRequest,
    SuggestWordsRequest,
    SuggestedWordsResponse,
)
from app.units import get_unit, list_units, save_unit
from app.vocab import TARGET_LANGUAGE_NAMES, generate_sentences, suggest_words

# Load .env from project root so GEMINI_API_KEY is available to the Gemini client
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="Vocab API", version="0.1.0")

@app.post("/vocab/sentences", response_model=GenerateSentencesResponse)
def vocab_sentences(body: GenerateSentencesRequest) -> GenerateSentencesResponse:
    """
    Generate example sentences for a word to practise.

    Returns 3–5 sentences. Each has the target-language sentence as fragments (with
    the target word marked for fill-in-the-blank) and an English translation.
    """
    if body.target_language.lower() not in TARGET_LANGUAGE_NAMES:
        raise HTTPException(
            status_code=400,
            detail=f"target_language must be one of: {list(TARGET_LANGUAGE_NAMES.keys())}",
        )
    try:
        return generate_sentences(word=body.word.strip(), target_language=body.target_language.lower())
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/vocab/suggest-words", response_model=SuggestedWordsResponse)
def vocab_suggest_words(body: SuggestWordsRequest) -> SuggestedWordsResponse:
    """
    Ask Gemini for word suggestions matching a description (e.g. "root stehen with various prefixes").
    Returns a list of words in the target language; the admin can then generate sentences for any of them.
    """
    if body.target_language.lower() not in TARGET_LANGUAGE_NAMES:
        raise HTTPException(
            status_code=400,
            detail=f"target_language must be one of: {list(TARGET_LANGUAGE_NAMES.keys())}",
        )
    try:
        return suggest_words(
            description=body.description.strip(),
            target_language=body.target_language.lower(),
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/vocab/units")
def vocab_list_units() -> list[dict]:
    """List all saved units (slug + name)."""
    return list_units()


@app.get("/vocab/units/{slug}")
def vocab_get_unit(slug: str) -> dict:
    """Load a unit by slug. Returns { name, entries }."""
    unit = get_unit(slug)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit.model_dump(mode="json")


@app.post("/vocab/save")
def vocab_save(body: SaveUnitRequest) -> dict:
    """
    Save a unit (name + entries) to data/units/{slug}.json.
    Entries can be empty for a new unit; add words via Generate.
    """
    try:
        path = save_unit(body)
        return {"ok": True, "path": str(path)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Serve admin UI (must be last so other routes take precedence)
static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
