import { normalizeLoadedUnit, buildSavePayload } from './create-logic.js';

export const name = 'create-logic';

export async function run(h) {

  await h.describe('normalizeLoadedUnit', async h => {
    await h.test('preserves unit name', async (assert) => {
      const result = normalizeLoadedUnit({ name: 'Stehen', entries: [] });
      assert(result.name, 'Stehen');
    });

    await h.test('empty entries returns empty array', async (assert) => {
      assert(normalizeLoadedUnit({ name: 'X', entries: [] }).entries, []);
    });

    await h.test('missing entries returns empty array', async (assert) => {
      assert(normalizeLoadedUnit({ name: 'X' }).entries, []);
    });

    await h.test('normalizes is_target on fragments', async (assert) => {
      const unit = {
        name: 'X',
        entries: [{ word: 'gehen', target_language: 'german', sentences: [
          { english: 'I go.', fragments: [
            { text: 'Ich', is_target: false },
            { text: 'gehe', is_target: true }
          ]}
        ]}]
      };
      const frags = normalizeLoadedUnit(unit).entries[0].sentences[0].fragments;
      assert(frags, [{ text: 'Ich', is_target: false }, { text: 'gehe', is_target: true }]);
    });

    await h.test('falls back to legacy target field', async (assert) => {
      const unit = {
        name: 'X',
        entries: [{ word: 'gehen', target_language: 'german', sentences: [
          { english: 'I go.', fragments: [
            { text: 'Ich', target: false },
            { text: 'gehe', target: true }
          ]}
        ]}]
      };
      const frags = normalizeLoadedUnit(unit).entries[0].sentences[0].fragments;
      assert(frags, [{ text: 'Ich', is_target: false }, { text: 'gehe', is_target: true }]);
    });

    await h.test('defaults is_target to false when both fields absent', async (assert) => {
      const unit = {
        name: 'X',
        entries: [{ word: 'gehen', target_language: 'german', sentences: [
          { english: 'I go.', fragments: [{ text: 'Ich' }] }
        ]}]
      };
      const frags = normalizeLoadedUnit(unit).entries[0].sentences[0].fragments;
      assert(frags[0].is_target, false);
    });

    await h.test('preserves other entry fields', async (assert) => {
      const unit = {
        name: 'X',
        entries: [{ word: 'gehen', target_language: 'german', sentences: [] }]
      };
      const entry = normalizeLoadedUnit(unit).entries[0];
      assert(entry.word, 'gehen');
      assert(entry.target_language, 'german');
    });
  });

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

