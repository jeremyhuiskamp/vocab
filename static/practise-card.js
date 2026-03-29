import { LitElement, html, nothing } from './lit.js';

class PracticeCard extends LitElement {
  static properties = {
    question: { type: Object },
    stat:     { type: Object },
    mode:     { type: String },  // 'question' | 'result'
    answers:  { type: Array },
  };

  // Use the main document for styles instead of shadow DOM
  createRenderRoot() { return this; }

  get inputs() {
    return Array.from(this.querySelectorAll('input.gap'));
  }

  _renderFragment(frag, fi) {
    if (!frag.is_target) {
      return html`<span class="text">${frag.text}</span>`;
    }
    if (this.mode === 'result') {
      const a = this.answers?.[this._answerIndex++];
      return html`
        <span class="result-feedback ${a?.correct ? 'correct' : 'incorrect'}">
          ${a?.value || '(empty)'}
          ${a && !a.correct ? html`<span class="expected"> → ${a.expected}</span>` : nothing}
        </span>`;
    }
    return html`<input type="text" class="gap" placeholder="…"
      data-question-id=${this.question.id} data-frag-index=${fi}>`;
  }

  willUpdate() {
    const isResult = this.mode === 'result';
    const allCorrect = !this.answers || this.answers.every(a => a.correct);
    this.className = 'practice-card' + (isResult && !allCorrect ? ' incorrect' : '');
  }

  render() {
    if (!this.question) return nothing;
    this._answerIndex = 0;

    return html`
      <div class="english">${this.question.english}</div>
      ${this.stat?.attempts > 0 ? html`
        <span class="question-stats">${this.stat.correct} / ${this.stat.attempts}</span>
      ` : nothing}
      <div class="foreign">
        ${this.question.fragments.map((frag, fi) => this._renderFragment(frag, fi))}
      </div>`;
  }
}

customElements.define('practice-card', PracticeCard);
