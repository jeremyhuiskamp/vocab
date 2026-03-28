import { runCLI } from './test-harness.js';
import { flattenUnit, getQuestionPriority, selectNextQuestions, gradeAnswers } from './practise-logic.js';

export const name = 'practise-logic';

const MOCK_UNIT = {
  entries: [
    {
      sentences: [
        {
          fragments: [{ text: 'Ich', is_target: false }, { text: 'gehe', is_target: true }],
          english: 'I go.'
        },
        {
          // no targets — should be skipped
          fragments: [{ text: 'Du bist hier', is_target: false }],
          english: 'You are here.'
        },
        {
          fragments: [{ text: 'Er', is_target: false }, { text: 'geht', is_target: true }],
          english: 'He goes.'
        }
      ]
    },
    {
      sentences: [
        {
          fragments: [{ text: 'wir', is_target: true }, { text: 'gehen', is_target: true }],
          english: 'we go.'
        }
      ]
    }
  ]
};

export async function run(h) {

  // ── flattenUnit ──────────────────────────────────────

  await h.test('flattenUnit: skips sentences with no target fragments', async (assert) => {
    const result = flattenUnit(MOCK_UNIT);
    assert(result.length, 3);
  });

  await h.test('flattenUnit: assigns IDs as entryIndex-sentenceIndex', async (assert) => {
    const result = flattenUnit(MOCK_UNIT);
    assert(result[0].id, '0-0');
    assert(result[1].id, '0-2');
    assert(result[2].id, '1-0');
  });

  await h.test('flattenUnit: preserves fragments array', async (assert) => {
    const result = flattenUnit(MOCK_UNIT);
    assert(result[0].fragments, [
      { text: 'Ich', is_target: false },
      { text: 'gehe', is_target: true }
    ]);
  });

  await h.test('flattenUnit: sets targetFragments to is_target fragments only', async (assert) => {
    const result = flattenUnit(MOCK_UNIT);
    assert(result[2].targetFragments, [
      { text: 'wir', is_target: true },
      { text: 'gehen', is_target: true }
    ]);
  });

  await h.test('flattenUnit: preserves english text', async (assert) => {
    const result = flattenUnit(MOCK_UNIT);
    assert(result[0].english, 'I go.');
  });

  await h.test('flattenUnit: empty unit returns empty array', async (assert) => {
    assert(flattenUnit({ entries: [] }), []);
    assert(flattenUnit({}), []);
  });

  // ── getQuestionPriority ──────────────────────────────

  await h.test('getQuestionPriority: unseen question gets priority 1000', async (assert) => {
    const orig = Math.random;
    try {
      Math.random = () => 0;
      const q = { id: 'a' };
      assert(getQuestionPriority(q, {}), 1000);
    } finally {
      Math.random = orig;
    }
  });

  await h.test('getQuestionPriority: all-wrong recent history gives high priority', async (assert) => {
    const orig = Math.random;
    try {
      Math.random = () => 0;
      const q = { id: 'a' };
      const stats = { a: { attempts: 1, correct: 0, recent: [false] } };
      // lowScoreBonus = (1 - 0) * 100 = 100, fewAttemptsBonus = 10/2 = 5, fuzz = 0
      assert(getQuestionPriority(q, stats), 105);
    } finally {
      Math.random = orig;
    }
  });

  await h.test('getQuestionPriority: all-correct recent history gives low priority', async (assert) => {
    const orig = Math.random;
    try {
      Math.random = () => 0;
      const q = { id: 'a' };
      const stats = { a: { attempts: 1, correct: 1, recent: [true] } };
      // lowScoreBonus = 0, fewAttemptsBonus = 10/2 = 5, fuzz = 0
      assert(getQuestionPriority(q, stats), 5);
    } finally {
      Math.random = orig;
    }
  });

  await h.test('getQuestionPriority: unseen outranks seen question with wrong history', async (assert) => {
    const orig = Math.random;
    try {
      Math.random = () => 0;
      const unseen = { id: 'a' };
      const seen = { id: 'b' };
      const stats = { b: { attempts: 5, correct: 0, recent: [false, false, false, false, false] } };
      const unseenP = getQuestionPriority(unseen, stats);
      const seenP = getQuestionPriority(seen, stats);
      assert(unseenP > seenP, true);
    } finally {
      Math.random = orig;
    }
  });

  // ── selectNextQuestions ──────────────────────────────

  await h.test('selectNextQuestions: returns empty array for empty input', async (assert) => {
    assert(selectNextQuestions([], {}, 5), []);
  });

  await h.test('selectNextQuestions: returns at most N questions', async (assert) => {
    const orig = Math.random;
    try {
      Math.random = () => 0;
      const questions = flattenUnit(MOCK_UNIT);
      const result = selectNextQuestions(questions, {}, 2);
      assert(result.length, 2);
    } finally {
      Math.random = orig;
    }
  });

  await h.test('selectNextQuestions: returns all questions when count exceeds total', async (assert) => {
    const orig = Math.random;
    try {
      Math.random = () => 0;
      const questions = flattenUnit(MOCK_UNIT);
      const result = selectNextQuestions(questions, {}, 100);
      assert(result.length, questions.length);
    } finally {
      Math.random = orig;
    }
  });

  await h.test('selectNextQuestions: picks unseen before seen', async (assert) => {
    const orig = Math.random;
    try {
      Math.random = () => 0;
      const questions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      // a and c are seen (correct history), b is unseen
      const stats = {
        a: { attempts: 3, correct: 3, recent: [true, true, true] },
        c: { attempts: 2, correct: 2, recent: [true, true] }
      };
      const result = selectNextQuestions(questions, stats, 1);
      assert(result[0].id, 'b');
    } finally {
      Math.random = orig;
    }
  });

  // ── gradeAnswers ─────────────────────────────────────

  const Q = {
    id: 'q1',
    english: 'I go.',
    fragments: [
      { text: 'Ich', is_target: false },
      { text: 'gehe', is_target: true }
    ]
  };

  await h.test('gradeAnswers: correct answer is marked correct', async (assert) => {
    const stats = {};
    const results = gradeAnswers([Q], stats, (qId, fi) => fi === 1 ? 'gehe' : '');
    assert(results[0].allCorrect, true);
    assert(results[0].answers[0].correct, true);
  });

  await h.test('gradeAnswers: incorrect answer is marked incorrect', async (assert) => {
    const stats = {};
    const results = gradeAnswers([Q], stats, () => 'wrong');
    assert(results[0].allCorrect, false);
    assert(results[0].answers[0].correct, false);
    assert(results[0].answers[0].value, 'wrong');
    assert(results[0].answers[0].expected, 'gehe');
  });

  await h.test('gradeAnswers: increments attempts', async (assert) => {
    const stats = {};
    gradeAnswers([Q], stats, () => 'gehe');
    assert(stats['q1'].attempts, 1);
  });

  await h.test('gradeAnswers: increments correct only on correct answer', async (assert) => {
    const stats = {};
    gradeAnswers([Q], stats, () => 'gehe');
    assert(stats['q1'].correct, 1);
    gradeAnswers([Q], stats, () => 'wrong');
    assert(stats['q1'].correct, 1);
    assert(stats['q1'].attempts, 2);
  });

  await h.test('gradeAnswers: recent window is capped at 5', async (assert) => {
    const stats = { q1: { attempts: 5, correct: 5, recent: [true, true, true, true, true] } };
    gradeAnswers([Q], stats, () => 'wrong');
    assert(stats['q1'].recent.length, 5);
    assert(stats['q1'].recent[4], false);
  });

  await h.test('gradeAnswers: appends to recent window', async (assert) => {
    const stats = {};
    gradeAnswers([Q], stats, () => 'gehe');
    assert(stats['q1'].recent, [true]);
    gradeAnswers([Q], stats, () => 'wrong');
    assert(stats['q1'].recent, [true, false]);
  });

  await h.test('gradeAnswers: non-target fragments are not graded', async (assert) => {
    const stats = {};
    const results = gradeAnswers([Q], stats, () => 'gehe');
    assert(results[0].answers.length, 1);
  });
}

await runCLI(name, run);
