import { runCLI } from './test-harness.js';
import { slugify, escapeHtml, emptySentence } from './utils.js';

export const name = 'utils';

export async function run(h) {
  await h.test('slugify: spaces become hyphens', async (assert) => {
    assert(slugify('hello world'), 'hello-world');
  });

  await h.test('slugify: lowercased', async (assert) => {
    assert(slugify('Chapter Five'), 'chapter-five');
  });

  await h.test('slugify: leading and trailing hyphens stripped', async (assert) => {
    assert(slugify('  hello  '), 'hello');
  });

  await h.test('slugify: special chars stripped', async (assert) => {
    assert(slugify('hello! world?'), 'hello-world');
  });

  await h.test('slugify: accented chars preserved', async (assert) => {
    assert(slugify('über'), 'über');
  });

  await h.test('slugify: empty string returns "unit"', async (assert) => {
    assert(slugify(''), 'unit');
  });

  await h.test('escapeHtml: escapes <', async (assert) => {
    assert(escapeHtml('<b>'), '&lt;b&gt;');
  });

  await h.test('escapeHtml: escapes &', async (assert) => {
    assert(escapeHtml('a & b'), 'a &amp; b');
  });

  await h.test('escapeHtml: escapes "', async (assert) => {
    assert(escapeHtml('"quoted"'), '&quot;quoted&quot;');
  });

  await h.test('escapeHtml: leaves plain text unchanged', async (assert) => {
    assert(escapeHtml('hello world'), 'hello world');
  });

  await h.test('emptySentence: returns correct shape', async (assert) => {
    assert(emptySentence(), { fragments: [{ text: '', is_target: true }], english: '' });
  });

  await h.test('emptySentence: each call returns a new object', async (assert) => {
    const a = emptySentence();
    const b = emptySentence();
    a.english = 'modified';
    assert(b.english, '');
  });
}

await runCLI(name, run);
