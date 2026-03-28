export function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\u00c0-\u024f]+/g, '-').replace(/^-|-$/g, '') || 'unit';
}

export function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function emptySentence() {
  return { fragments: [{ text: '', is_target: true }], english: '' };
}
