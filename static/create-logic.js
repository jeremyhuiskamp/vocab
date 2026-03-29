/**
 * Transform raw unit data from the API into the editor state shape.
 * Handles the legacy `target` field as a fallback for `is_target`.
 */
export function normalizeLoadedUnit(unit) {
  const entries = (unit.entries || []).map(e => ({
    ...e,
    sentences: e.sentences.map(s => ({
      ...s,
      fragments: s.fragments.map(f => ({
        text: f.text,
        is_target: f.target ?? f.is_target ?? false
      }))
    }))
  }));
  return { name: unit.name, entries };
}

/**
 * Build the entries payload for POST /vocab/save.
 * Drops sentences that have no target fragments or no non-empty text.
 */
export function buildSavePayload(entries) {
  return entries.map(e => ({
    word: e.word,
    target_language: e.target_language,
    sentences: e.sentences.filter(s =>
      s.fragments.some(f => f.is_target) && s.fragments.some(f => f.text.trim() !== '')
    )
  }));
}
