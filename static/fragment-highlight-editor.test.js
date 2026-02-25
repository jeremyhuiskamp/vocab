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
  editor._onKeyDown({ key: ' ', preventDefault: () => {} }, parseInt(span.dataset.i));
}

function fmt(frags) {
  return frags.map(f => f.target ? `[${f.text}]` : f.text).join('');
}

// ── Tests ─────────────────────────────────────────────

export async function run(h) {

  await h.test('load: fragments round-trip', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die Sonne ist ', target: false },
      { text: 'aufgegangen',   target: true  },
      { text: '.',             target: false },
    ]);
    assert(fmt(ed.fragments), 'Die Sonne ist [aufgegangen].');
  });

  await h.test('tokenizer: trailing period is not part of final word', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Hello world.', target: false }]);
    const spans = ed.shadowRoot.getElementById('render').querySelectorAll('.w');
    const words = Array.from(spans).map(s => s.textContent);
    assert(words.includes('.'), false);
    assert(words[words.length - 1], 'world');
  });

  await h.test('click: highlights a word', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Die Sonne ist aufgegangen.', target: false }]);
    clickWord(ed, 'ist');
    assert(fmt(ed.fragments), 'Die Sonne [ist] aufgegangen.');
  });

  await h.test('click: removes highlight from highlighted word', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die Sonne ',    target: false },
      { text: 'ist',           target: true  },
      { text: ' aufgegangen.', target: false },
    ]);
    clickWord(ed, 'ist');
    assert(fmt(ed.fragments), 'Die Sonne ist aufgegangen.');
  });

  await h.test('space key: highlights a word', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Die Sonne ist aufgegangen.', target: false }]);
    spaceWord(ed, 'Sonne');
    assert(fmt(ed.fragments), 'Die [Sonne] ist aufgegangen.');
  });

  await h.test('space key: removes highlight', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die ',              target: false },
      { text: 'Sonne',             target: true  },
      { text: ' ist aufgegangen.', target: false },
    ]);
    spaceWord(ed, 'Sonne');
    assert(fmt(ed.fragments), 'Die Sonne ist aufgegangen.');
  });

  await h.test('edit: suffix highlight preserved after text change', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die Sonne hat ', target: false },
      { text: 'aufgegangen',   target: true  },
      { text: '.',             target: false },
    ]);
    setEditText(ed, 'Die Sonne ist aufgegangen.');
    assert(fmt(ed.fragments), 'Die Sonne ist [aufgegangen].');
  });

  await h.test('full scenario: edit "hat"→"ist", highlight "ist"', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die Sonne hat ', target: false },
      { text: 'aufgegangen',   target: true  },
      { text: '.',             target: false },
    ]);
    setEditText(ed, 'Die Sonne ist aufgegangen.');
    await ed.updateComplete;
    clickWord(ed, 'ist');
    assert(fmt(ed.fragments), 'Die Sonne [ist] [aufgegangen].');
  });

  await h.test('change event: fires on click with correct detail', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Hello world.', target: false }]);
    let fired = null;
    ed.addEventListener('change', e => { fired = e.detail; });
    clickWord(ed, 'world');
    assert(fmt(fired), 'Hello [world].');
  });

  await h.test('change event: fires on edit', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Hello world.', target: false }]);
    let fired = null;
    ed.addEventListener('change', e => { fired = e.detail; });
    setEditText(ed, 'Hello there.');
    assert(fired !== null, true);
  });

  await h.test('accessibility: aria-pressed is "true" after highlight', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Hello world.', target: false }]);
    clickWord(ed, 'world');
    await ed.updateComplete;
    assert(wordSpan(ed, 'world').getAttribute('aria-pressed'), 'true');
  });

  await h.test('accessibility: aria-pressed is "false" when not highlighted', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Hello world.', target: false }]);
    assert(wordSpan(ed, 'world').getAttribute('aria-pressed'), 'false');
  });

  await h.test('multiple highlights coexist', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'one two three four.', target: false }]);
    clickWord(ed, 'one');
    clickWord(ed, 'three');
    assert(fmt(ed.fragments), '[one] two [three] four.');
  });

  await h.test('setter: re-renders with new fragments', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'original text.', target: false }]);
    ed.fragments = [
      { text: 'new ',  target: false },
      { text: 'value', target: true  },
      { text: '.',     target: false },
    ];
    await ed.updateComplete;
    assert(fmt(ed.fragments), 'new [value].');
  });


  await h.test('space insertion: missing space added between fragments', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die Sonne', target: false },
      { text: 'ist',       target: false },
      { text: 'aufgegangen', target: true },
    ]);
    assert(ed.shadowRoot.getElementById('edit').value, 'Die Sonne ist aufgegangen');
  });

  await h.test('space insertion: no space added before punctuation', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'aufgegangen', target: true },
      { text: '.',           target: false },
    ]);
    assert(ed.shadowRoot.getElementById('edit').value, 'aufgegangen.');
  });

  await h.test('space insertion: no double space when fragment already ends with space', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die Sonne ', target: false },
      { text: 'ist',        target: true  },
    ]);
    assert(ed.shadowRoot.getElementById('edit').value, 'Die Sonne ist');
  });

  await h.test('space insertion: spaces preserved in round-trip', async (assert) => {
    const ed = await makeEditor(h, [
      { text: 'Die Sonne', target: false },
      { text: 'ist',       target: true  },
      { text: 'aufgegangen', target: false },
      { text: '.',         target: false },
    ]);
    assert(ed.shadowRoot.getElementById('edit').value, 'Die Sonne ist aufgegangen.');
  });


  await h.test('language: label shown when language prop set', async (assert) => {
    const ed = await makeEditor(h, [{ text: 'Bonjour.', target: false }], { language: 'French' });
    const label = ed.shadowRoot.querySelector('.label');
    assert(label.textContent, 'French');
  });

}
