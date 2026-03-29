import { buildSavePayload } from './create-logic.js';

export const name = 'create-logic';

export async function run(h) {
  await h.describe('buildSavePayload', async h => {
    const sentence = (fragments, english = 'test') => ({ fragments, english });
    const frag = (text, is_target) => ({ text, is_target });

    await h.test('passes through valid sentences', async (assert) => {
      const entries = [{ word: 'gehen', target_language: 'german', sentences: [
        sentence([frag('Ich', false), frag('gehe', true)])
      ]}];
      assert(buildSavePayload(entries)[0].sentences.length, 1);
    });

    await h.test('drops sentences with no target fragments', async (assert) => {
      const entries = [{ word: 'gehen', target_language: 'german', sentences: [
        sentence([frag('Ich', false), frag('gehe', false)])
      ]}];
      assert(buildSavePayload(entries)[0].sentences.length, 0);
    });

    await h.test('drops sentences where all fragment text is empty', async (assert) => {
      const entries = [{ word: 'gehen', target_language: 'german', sentences: [
        sentence([frag('', false), frag('', true)])
      ]}];
      assert(buildSavePayload(entries)[0].sentences.length, 0);
    });

    await h.test('drops sentences where all fragment text is whitespace', async (assert) => {
      const entries = [{ word: 'gehen', target_language: 'german', sentences: [
        sentence([frag('   ', false), frag('  ', true)])
      ]}];
      assert(buildSavePayload(entries)[0].sentences.length, 0);
    });

    await h.test('preserves word and target_language', async (assert) => {
      const entries = [{ word: 'gehen', target_language: 'german', sentences: [] }];
      const result = buildSavePayload(entries)[0];
      assert(result.word, 'gehen');
      assert(result.target_language, 'german');
    });

    await h.test('handles multiple entries independently', async (assert) => {
      const entries = [
        { word: 'gehen', target_language: 'german', sentences: [
          sentence([frag('gehe', true)])
        ]},
        { word: 'laufen', target_language: 'german', sentences: [
          sentence([frag('', true)])  // empty — dropped
        ]}
      ];
      const result = buildSavePayload(entries);
      assert(result[0].sentences.length, 1);
      assert(result[1].sentences.length, 0);
    });
  });
}
