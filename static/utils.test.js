import { slugify, escapeHtml, emptySentence } from './utils.js';

export const name = 'utils';

export async function run(h) {
  await h.describe('slugify', async h => {
    await h.test('spaces become hyphens', async (assert) => {
      assert(slugify('hello world'), 'hello-world');
    });

    await h.test('lowercased', async (assert) => {
      assert(slugify('Chapter Five'), 'chapter-five');
    });

    await h.test('leading and trailing hyphens stripped', async (assert) => {
      assert(slugify('  hello  '), 'hello');
    });

    await h.test('special chars stripped', async (assert) => {
      assert(slugify('hello! world?'), 'hello-world');
    });

    await h.test('accented chars preserved', async (assert) => {
      assert(slugify('über'), 'über');
    });

    await h.test('empty string returns "unit"', async (assert) => {
      assert(slugify(''), 'unit');
    });
  });

  await h.describe('escapeHtml', async h => {
    await h.test('escapes <', async (assert) => {
      assert(escapeHtml('<b>'), '&lt;b&gt;');
    });

    await h.test('escapes &', async (assert) => {
      assert(escapeHtml('a & b'), 'a &amp; b');
    });

    await h.test('escapes "', async (assert) => {
      assert(escapeHtml('"quoted"'), '&quot;quoted&quot;');
    });

    await h.test('leaves plain text unchanged', async (assert) => {
      assert(escapeHtml('hello world'), 'hello world');
    });
  });

  await h.describe('emptySentence', async h => {
    await h.test('returns correct shape', async (assert) => {
      assert(emptySentence(), { fragments: [{ text: '', is_target: true }], english: '' });
    });

    await h.test('each call returns a new object', async (assert) => {
      const a = emptySentence();
      const b = emptySentence();
      a.english = 'modified';
      assert(b.english, '');
    });
  });
}

