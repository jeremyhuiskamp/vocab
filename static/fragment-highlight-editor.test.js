export const name = 'fragment-highlight-editor';

// ── Helpers ───────────────────────────────────────────

async function makeEditor(h, frags, { language } = {}) {
  const el = document.createElement('fragment-highlight-editor');
  if (language) el.language = language;
  h.getContainer().appendChild(el);
  if (frags) el.fragments = frags;
  await el.updateComplete;
  return el;
}

function setEditText(editor, text) {
  const editEl = editor.shadowRoot.getElementById('edit');
  editEl.value = text;
  editEl.dispatchEvent(new Event('input', { bubbles: true }));
}

function wordSpan(editor, word) {
  const spans = editor.shadowRoot.getElementById('render').querySelectorAll('.w');
  return Array.from(spans).find(s => s.textContent === word) ?? null;
}

function clickWord(editor, word) {
  const span = wordSpan(editor, word);
  if (!span) throw new Error(`Word not found: "${word}"`);
  editor._onClick(parseInt(span.dataset.i));
}

function spaceWord(editor, word) {
  const span = wordSpan(editor, word);
  if (!span) throw new Error(`Word not found: "${word}"`);
  editor._onKeyDown({ key: ' ', preventDefault: () => { } }, parseInt(span.dataset.i));
}

function fmt(frags) {
  return frags.map(f => f.is_target ? `[${f.text}]` : f.text).join('');
}

// ── Tests ─────────────────────────────────────────────

export async function run(h) {

  await h.describe('load', async h => {
    await h.test('fragments round-trip', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die Sonne ist ', is_target: false },
        { text: 'aufgegangen', is_target: true },
        { text: '.', is_target: false },
      ]);
      assert(fmt(ed.fragments), 'Die Sonne ist [aufgegangen].');
    });
  });

  await h.describe('tokenizer', async h => {
    await h.test('trailing period is not part of final word', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Hello world.', is_target: false }]);
      const spans = ed.shadowRoot.getElementById('render').querySelectorAll('.w');
      const words = Array.from(spans).map(s => s.textContent);
      assert(words.includes('.'), false);
      assert(words[words.length - 1], 'world');
    });
  });

  await h.describe('click', async h => {
    await h.test('highlights a word', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Die Sonne ist aufgegangen.', is_target: false }]);
      clickWord(ed, 'ist');
      assert(fmt(ed.fragments), 'Die Sonne [ist] aufgegangen.');
    });

    await h.test('removes highlight from highlighted word', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die Sonne ', is_target: false },
        { text: 'ist', is_target: true },
        { text: ' aufgegangen.', is_target: false },
      ]);
      clickWord(ed, 'ist');
      assert(fmt(ed.fragments), 'Die Sonne ist aufgegangen.');
    });
  });

  await h.describe('space key', async h => {
    await h.test('highlights a word', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Die Sonne ist aufgegangen.', is_target: false }]);
      spaceWord(ed, 'Sonne');
      assert(fmt(ed.fragments), 'Die [Sonne] ist aufgegangen.');
    });

    await h.test('removes highlight', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die ', is_target: false },
        { text: 'Sonne', is_target: true },
        { text: ' ist aufgegangen.', is_target: false },
      ]);
      spaceWord(ed, 'Sonne');
      assert(fmt(ed.fragments), 'Die Sonne ist aufgegangen.');
    });
  });

  await h.describe('edit', async h => {
    await h.test('suffix highlight preserved after text change', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die Sonne hat ', is_target: false },
        { text: 'aufgegangen', is_target: true },
        { text: '.', is_target: false },
      ]);
      setEditText(ed, 'Die Sonne ist aufgegangen.');
      assert(fmt(ed.fragments), 'Die Sonne ist [aufgegangen].');
    });

    await h.test('full scenario: edit "hat"→"ist", highlight "ist"', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die Sonne hat ', is_target: false },
        { text: 'aufgegangen', is_target: true },
        { text: '.', is_target: false },
      ]);
      setEditText(ed, 'Die Sonne ist aufgegangen.');
      await ed.updateComplete;
      clickWord(ed, 'ist');
      assert(fmt(ed.fragments), 'Die Sonne [ist] [aufgegangen].');
    });
  });

  await h.describe('change event', async h => {
    await h.test('fires on click with correct detail', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Hello world.', is_target: false }]);
      let fired = null;
      ed.addEventListener('change', e => { fired = e.detail; });
      clickWord(ed, 'world');
      assert(fmt(fired), 'Hello [world].');
    });

    await h.test('fires on edit', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Hello world.', is_target: false }]);
      let fired = null;
      ed.addEventListener('change', e => { fired = e.detail; });
      setEditText(ed, 'Hello there.');
      assert(fired !== null, true);
    });
  });

  await h.describe('accessibility', async h => {
    await h.test('aria-pressed is "true" after highlight', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Hello world.', is_target: false }]);
      clickWord(ed, 'world');
      await ed.updateComplete;
      assert(wordSpan(ed, 'world').getAttribute('aria-pressed'), 'true');
    });

    await h.test('aria-pressed is "false" when not highlighted', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Hello world.', is_target: false }]);
      assert(wordSpan(ed, 'world').getAttribute('aria-pressed'), 'false');
    });
  });

  await h.describe('multiple highlights', async h => {
    await h.test('coexist independently', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'one two three four.', is_target: false }]);
      clickWord(ed, 'one');
      clickWord(ed, 'three');
      assert(fmt(ed.fragments), '[one] two [three] four.');
    });
  });

  await h.describe('setter', async h => {
    await h.test('re-renders with new fragments', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'original text.', is_target: false }]);
      ed.fragments = [
        { text: 'new ', is_target: false },
        { text: 'value', is_target: true },
        { text: '.', is_target: false },
      ];
      await ed.updateComplete;
      assert(fmt(ed.fragments), 'new [value].');
    });
  });

  await h.describe('space insertion', async h => {
    await h.test('missing space added between fragments', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die Sonne', is_target: false },
        { text: 'ist', is_target: false },
        { text: 'aufgegangen', is_target: true },
      ]);
      assert(ed.shadowRoot.getElementById('edit').value, 'Die Sonne ist aufgegangen');
    });

    await h.test('no space added before punctuation', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'aufgegangen', is_target: true },
        { text: '.', is_target: false },
      ]);
      assert(ed.shadowRoot.getElementById('edit').value, 'aufgegangen.');
    });

    await h.test('no double space when fragment already ends with space', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die Sonne ', is_target: false },
        { text: 'ist', is_target: true },
      ]);
      assert(ed.shadowRoot.getElementById('edit').value, 'Die Sonne ist');
    });

    await h.test('spaces preserved in round-trip', async (assert) => {
      const ed = await makeEditor(h, [
        { text: 'Die Sonne', is_target: false },
        { text: 'ist', is_target: true },
        { text: 'aufgegangen', is_target: false },
        { text: '.', is_target: false },
      ]);
      assert(ed.shadowRoot.getElementById('edit').value, 'Die Sonne ist aufgegangen.');
    });
  });

  await h.describe('language', async h => {
    await h.test('label shown when language prop set', async (assert) => {
      const ed = await makeEditor(h, [{ text: 'Bonjour.', is_target: false }], { language: 'French' });
      assert(ed.shadowRoot.querySelector('.label').textContent, 'French');
    });
  });
}
