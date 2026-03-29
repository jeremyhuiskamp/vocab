// test-harness.js

/**
 * CLI runner. Call at the bottom of any test file that should run outside the browser.
 * Files that call runCLI are auto-discovered by the Taskfile; browser-only test files
 * (like fragment-highlight-editor.test.js) simply don't call it and are skipped.
 */
export async function runCLI(suiteName, runFn) {
  if (typeof document !== 'undefined') return;
  let passed = 0, failed = 0;

  function makeH(indent) {
    return {
      async test(description, fn) {
        try {
          await fn((actual, expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected))
              throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
          });
          console.log(`${indent}✓ ${description}`);
          passed++;
        } catch (err) {
          console.log(`${indent}✗ ${description}: ${err.message}`);
          failed++;
        }
      },
      async describe(name, fn) {
        console.log(`${indent}${name}`);
        await fn(makeH(indent + '  '));
      }
    };
  }

  console.log(`\n${suiteName}`);
  await runFn(makeH('  '));
  console.log(`  ${passed + failed} tests — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

export class Harness {
  constructor() {
    this.results = [];
    this._container = null;
    this._section = null;
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

  async describe(name, fn) {
    this.results.push({ type: 'section', name });
    const prev = this._section;
    this._section = name;
    await fn(this);
    this._section = prev;
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
