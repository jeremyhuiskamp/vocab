"""Pydantic schemas for constraining Gemini structured output."""

from pydantic import BaseModel, Field, model_validator


# --- Vocabulary practice (target word in sentences, fill-in-the-blank ready) ---


class SentenceFragment(BaseModel):
    """One segment of a sentence. Target segments are the word being practised (to show as blank)."""

    text: str = Field(description="The segment text (e.g. a word, prefix, or punctuation)")
    is_target: bool = Field(
        description="True if this segment is part of the target word the learner must fill in (e.g. one or more fragments for a separable verb)."
    )


class SentencePair(BaseModel):
    """One example sentence in the target language, broken so the target word is identified, plus English translation."""

    fragments: list[SentenceFragment] = Field(
        description="The sentence in the target language split into segments. Exactly the segments with is_target=True form the word being practised; they may be non-adjacent (e.g. German separable verb: 'stehe' ... 'auf' for 'aufstehen')."
    )
    english: str = Field(description="English translation of the full sentence.")

    @model_validator(mode="after")
    def at_least_one_target_fragment(self) -> "SentencePair":
        if not any(f.is_target for f in self.fragments):
            raise ValueError("At least one fragment must have is_target=True (the word being practised).")
        return self


class GenerateSentencesResponse(BaseModel):
    """Response from generating example sentences for a target word."""

    sentences: list[SentencePair] = Field(
        description="Between 3 and 5 natural example sentences that use the target word, with translations and the target word marked in fragments.",
        min_length=3,
        max_length=5,
    )


class GenerateSentencesRequest(BaseModel):
    """Request to generate example sentences for a word to practise."""

    word: str = Field(description="The word in the target language (e.g. 'chien', 'aufstehen')")
    target_language: str = Field(
        description="Target language: 'french' or 'german'",
        examples=["french"],
    )


class SuggestWordsRequest(BaseModel):
    """Request for Gemini to suggest words matching a description."""

    description: str = Field(description="Description of the kind of words wanted (e.g. 'root stehen with various prefixes')")
    target_language: str = Field(description="Target language: 'french' or 'german'")


class SuggestedWordsResponse(BaseModel):
    """Gemini response: list of suggested words in the target language."""

    words: list[str] = Field(
        description="Concrete vocabulary words in the target language that match the description",
        min_length=1,
        max_length=20,
    )


class SaveVocabRequest(BaseModel):
    """Payload to save practise material (word + edited sentences) to disk."""

    word: str = Field(description="The word in the target language")
    target_language: str = Field(description="Target language: 'french' or 'german'")
    sentences: list[SentencePair] = Field(description="Edited list of sentence pairs to save")


# --- Units (e.g. chapter of vocab words) ---


class UnitEntry(BaseModel):
    """One word's practise material within a unit."""

    word: str = Field(description="The word in the target language")
    target_language: str = Field(description="Target language: 'french' or 'german'")
    sentences: list[SentencePair] = Field(description="Sentence pairs for this word")


class Unit(BaseModel):
    """A named unit of vocabulary (e.g. a chapter)."""

    name: str = Field(description="Display name of the unit")
    entries: list[UnitEntry] = Field(default_factory=list, description="Words and their sentences")


class SaveUnitRequest(BaseModel):
    """Payload to save a full unit to disk."""

    unit_name: str = Field(description="Display name of the unit")
    entries: list[UnitEntry] = Field(description="All words and their sentences in the unit")
