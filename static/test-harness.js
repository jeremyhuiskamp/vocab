// test-harness.js

export class Harness {
  constructor() {
    this.results = [];
    this._container = null;
  }

  getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.style.cssText = 'position:absolute;left:-9999px';
      this._container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this._container);
    }
    return this._container;
  }

  // Runs fn, passing it a bound assert that always records `description`.
  // fn receives assert as its only argument, so there is no shared mutable
  // state and no prototype override — nothing that async can race against.
  async test(description, fn) {
    const assert = (actual, expected) => {
      const as = JSON.stringify(actual);
      const es = JSON.stringify(expected);
      this.results.push({ ok: as === es, description, actual: as, expected: es });
    };
    try {
      await fn(assert);
    } catch (err) {
      this.results.push({
        ok: false,
        description,
        actual: String(err),
        expected: '(no error thrown)',
      });
    }
  }
}
