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
