"""Vocabulary practice: generate example sentences and suggest words via Gemini."""

from app.gemini import generate_structured
from app.schemas import GenerateSentencesResponse, SuggestedWordsResponse

# Supported target languages for an English-speaking learner
TARGET_LANGUAGE_NAMES = {"french": "French", "german": "German"}


def build_sentences_prompt(word: str, target_language: str) -> str:
    lang_name = TARGET_LANGUAGE_NAMES.get(target_language.lower(), target_language)
    return f"""You are helping an English speaker practise vocabulary in {lang_name}.

Generate 3 to 5 natural, varied example sentences that all use this {lang_name} word: "{word}".

For each sentence:
1. Write the sentence in {lang_name}, split into fragments. Each fragment is either:
   - part of the sentence that is NOT the target word (is_target: false), or
   - part of the target word (is_target: true).
2. The target word may be a single fragment (e.g. "chien") or multiple non-adjacent fragments (e.g. in German separable verbs: "steht" ... "auf" for "aufstehen"). Use as many fragments as needed so the learner will later fill in exactly the target word (or its parts).
3. Provide the full English translation of the sentence.

Use natural, everyday {lang_name}. Vary sentence structure and context. Do not repeat the same sentence pattern."""


def generate_sentences(word: str, target_language: str) -> GenerateSentencesResponse:
    """Generate example sentences containing the target word, with translations and target word marked in fragments."""
    prompt = build_sentences_prompt(word, target_language)
    return generate_structured(prompt, response_schema=GenerateSentencesResponse)


def build_suggest_words_prompt(description: str, target_language: str) -> str:
    lang_name = TARGET_LANGUAGE_NAMES.get(target_language.lower(), target_language)
    return f"""You are helping a teacher create vocabulary practice material for English speakers learning {lang_name}.

The teacher describes the kind of words they want for their unit. Suggest 5 to 15 concrete {lang_name} words that match their description.

Teacher's description: "{description}"

Return only the list of words (in {lang_name}). Choose useful, common words that fit the description. For compound or separable verbs, give the infinitive form (e.g. aufstehen, not aufgestanden)."""


def suggest_words(description: str, target_language: str) -> SuggestedWordsResponse:
    """Ask Gemini for a list of words matching the description."""
    prompt = build_suggest_words_prompt(description.strip(), target_language.lower())
    return generate_structured(prompt, response_schema=SuggestedWordsResponse)
