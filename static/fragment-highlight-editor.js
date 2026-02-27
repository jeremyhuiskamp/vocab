import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class FragmentHighlightEditor extends LitElement {

  static properties = {
    _tokens: { state: true },
    language: { type: String },
  };

  static styles = css`
    :host { display: block; }
    .field {
      margin-bottom: 0.5rem;
    }
    .field:last-child {
      margin-bottom: 0;
    }
    .label {
      display: block;
      font-size: 0.8rem;
      color: var(--muted, #767676);
      margin-bottom: 0.25rem;
      user-select: none;
    }
    #edit {
      -webkit-appearance: none;
      appearance: none;
      display: block;
      font: inherit;
      color: inherit;
      width: 100%;
      padding: 0.35rem 0.5rem;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #ccc);
      border-radius: var(--radius, 4px);
      outline: none;
      box-sizing: border-box;
    }
    #edit:focus {
      border-color: var(--accent, #286983);
    }
    #render {
      display: block;
      width: 100%;
      padding: 0.35rem 0.5rem;
      box-sizing: border-box;
    }
    .w {
      cursor: pointer;
      outline: none;
      display: inline-block;
      vertical-align: baseline;
      line-height: inherit;
    }
    .w:focus {
      border-radius: 2px;
      box-shadow: 0 0 0 2px var(--accent, currentColor);
    }
    .w.is_target {
      border-bottom: 2px solid var(--accent, currentColor);
      padding-bottom: 1px;
    }
  `;

  constructor() {
    super();
    this._tokens = [];
    this.language = '';
  }

  // ── Public API ───────────────────────────────────────

  get fragments() { return this._fragmentsFromTokens(this._tokens); }

  set fragments(frags) {
    this._tokens = this._tokensFromFragments(frags);
    this.updateComplete.then(() => this._syncEdit());
  }

  // ── Tokenizer ────────────────────────────────────────

  _tokenize(str) {
    const result = [];
    const re = /[\p{L}\p{N}]+|[^\p{L}\p{N}]/gu;
    let m;
    while ((m = re.exec(str)) !== null) {
      const text = m[0];
      result.push({ text, is_target: false, isWord: /[\p{L}\p{N}]/u.test(text) });
    }
    return result;
  }

  _tokensFromFragments(frags) {
    const result = [];
    for (let fi = 0; fi < frags.length; fi++) {
      const frag = frags[fi];
      const toks = this._tokenize(frag.text);

      // Insert a space between fragments if:
      // - the previous fragment didn't end with whitespace, AND
      // - this fragment doesn't start with punctuation (i.e. starts with a word char).
      // Deliberately generous: we'd rather add an extra space than lose one.
      if (fi > 0 && toks.length > 0) {
        const prevText = frags[fi - 1].text;
        const nextChar = frag.text[0] ?? '';
        const prevEndsWithSpace = /\s$/.test(prevText);
        const nextStartsWithPunct = !/[\p{L}\p{N}]/u.test(nextChar);
        if (!prevEndsWithSpace && !nextStartsWithPunct) {
          result.push({ text: ' ', is_target: false, isWord: false });
        }
      }

      for (const t of toks) {
        t.is_target = !!(frag.is_target && t.isWord);
        result.push(t);
      }
    }
    return result;
  }

  _fragmentsFromTokens(toks) {
    if (!toks.length) return [];
    const frags = [];
    let cur = { text: toks[0].text, is_target: !!(toks[0].is_target && toks[0].isWord) };
    for (let i = 1; i < toks.length; i++) {
      const tgt = !!(toks[i].is_target && toks[i].isWord);
      if (tgt === cur.is_target) { cur.text += toks[i].text; }
      else { frags.push(cur); cur = { text: toks[i].text, is_target: tgt }; }
    }
    frags.push(cur);
    return frags.filter(f => f.text.length > 0);
  }

  _plainText(toks) { return toks.map(t => t.text).join(''); }

  // ── Sync input value ────────────────────────────────

  _syncEdit() {
    const el = this.shadowRoot.getElementById('edit');
    if (el && el.value !== this._plainText(this._tokens))
      el.value = this._plainText(this._tokens);
  }

  // ── Handlers ─────────────────────────────────────────

  _onEditInput(e) {
    const newText = e.target.value || '';
    const oldText = this._plainText(this._tokens);
    if (newText === oldText) return;

    const oldHL = new Set();
    let pos = 0;
    for (const t of this._tokens) {
      if (t.is_target && t.isWord) for (let i = 0; i < t.text.length; i++) oldHL.add(pos + i);
      pos += t.text.length;
    }

    let pre = 0;
    while (pre < oldText.length && pre < newText.length && oldText[pre] === newText[pre]) pre++;
    let suf = 0;
    const maxSuf = Math.min(oldText.length - pre, newText.length - pre);
    while (suf < maxSuf && oldText[oldText.length - 1 - suf] === newText[newText.length - 1 - suf]) suf++;

    const newToks = this._tokenize(newText);
    pos = 0;
    for (const t of newToks) {
      if (t.isWord) {
        const end = pos + t.text.length;
        if (end <= pre && [...Array(t.text.length).keys()].every(i => oldHL.has(pos + i)))
          t.is_target = true;
        const fromEnd = newText.length - end;
        if (fromEnd < suf) {
          const shift = oldText.length - newText.length;
          if ([...Array(t.text.length).keys()].every(i => oldHL.has(pos + i + shift)))
            t.is_target = true;
        }
      }
      pos += t.text.length;
    }

    this._tokens = newToks;
    this._dispatch();
  }

  _onClick(i) {
    this._tokens = this._tokens.map((t, j) => j === i ? { ...t, is_target: !t.is_target } : t);
    this._dispatch();
  }

  _onKeyDown(e, i) {
    if (e.key !== ' ') return;
    e.preventDefault();
    this._onClick(i);
  }

  // ── Render ────────────────────────────────────────────

  render() {
    const langLabel = this.language || 'Sentence';
    return html`
      <div class="field">
        <span class="label">${langLabel}</span>
        <input id="edit" type="text" spellcheck="false"
               @input=${this._onEditInput}>
      </div>
      <div class="field">
        <span class="label">Select blanks</span>
        <div id="render" role="group" aria-label="Select blanks" tabindex="-1">
          ${this._tokens.map((tok, i) => tok.isWord
      ? html`<span
                data-i=${i}
                class="w ${tok.is_target ? 'is_target' : ''}"
                tabindex="0"
                role="button"
                aria-pressed=${tok.is_target ? 'true' : 'false'}
                @click=${() => this._onClick(i)}
                @keydown=${e => this._onKeyDown(e, i)}
              >${tok.text}</span>`
      : html`<span>${tok.text}</span>`
    )}
        </div>
      </div>
    `;
  }

  // ── Change event ──────────────────────────────────────

  _dispatch() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: this.fragments,
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('fragment-highlight-editor', FragmentHighlightEditor);
