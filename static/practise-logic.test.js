import { flattenUnit, getQuestionPriority, selectNextQuestions, gradeAnswers, computeStats } from './practise-logic.js';

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

  await h.describe('flattenUnit', async h => {
    await h.test('skips sentences with no target fragments', async (assert) => {
      assert(flattenUnit(MOCK_UNIT).length, 3);
    });

    await h.test('assigns IDs as entryIndex-sentenceIndex', async (assert) => {
      const result = flattenUnit(MOCK_UNIT);
      assert(result[0].id, '0-0');
      assert(result[1].id, '0-2');
      assert(result[2].id, '1-0');
    });

    await h.test('preserves fragments array', async (assert) => {
      assert(flattenUnit(MOCK_UNIT)[0].fragments, [
        { text: 'Ich', is_target: false },
        { text: 'gehe', is_target: true }
      ]);
    });

    await h.test('sets targetFragments to is_target fragments only', async (assert) => {
      assert(flattenUnit(MOCK_UNIT)[2].targetFragments, [
        { text: 'wir', is_target: true },
        { text: 'gehen', is_target: true }
      ]);
    });

    await h.test('preserves english text', async (assert) => {
      assert(flattenUnit(MOCK_UNIT)[0].english, 'I go.');
    });

    await h.test('empty unit returns empty array', async (assert) => {
      assert(flattenUnit({ entries: [] }), []);
      assert(flattenUnit({}), []);
    });
  });

  await h.describe('getQuestionPriority', async h => {
    await h.test('unseen question gets priority 1000', async (assert) => {
      const orig = Math.random;
      try {
        Math.random = () => 0;
        assert(getQuestionPriority({ id: 'a' }, {}), 1000);
      } finally {
        Math.random = orig;
      }
    });

    await h.test('all-wrong recent history gives high priority', async (assert) => {
      const orig = Math.random;
      try {
        Math.random = () => 0;
        const stats = { a: { attempts: 1, correct: 0, recent: [false] } };
        // lowScoreBonus = (1 - 0) * 100 = 100, fewAttemptsBonus = 10/2 = 5, fuzz = 0
        assert(getQuestionPriority({ id: 'a' }, stats), 105);
      } finally {
        Math.random = orig;
      }
    });

    await h.test('all-correct recent history gives low priority', async (assert) => {
      const orig = Math.random;
      try {
        Math.random = () => 0;
        const stats = { a: { attempts: 1, correct: 1, recent: [true] } };
        // lowScoreBonus = 0, fewAttemptsBonus = 10/2 = 5, fuzz = 0
        assert(getQuestionPriority({ id: 'a' }, stats), 5);
      } finally {
        Math.random = orig;
      }
    });

    await h.test('unseen outranks seen question with wrong history', async (assert) => {
      const orig = Math.random;
      try {
        Math.random = () => 0;
        const stats = { b: { attempts: 5, correct: 0, recent: [false, false, false, false, false] } };
        assert(getQuestionPriority({ id: 'a' }, stats) > getQuestionPriority({ id: 'b' }, stats), true);
      } finally {
        Math.random = orig;
      }
    });
  });

  await h.describe('selectNextQuestions', async h => {
    await h.test('returns empty array for empty input', async (assert) => {
      assert(selectNextQuestions([], {}, 5), []);
    });

    await h.test('returns at most N questions', async (assert) => {
      const orig = Math.random;
      try {
        Math.random = () => 0;
        assert(selectNextQuestions(flattenUnit(MOCK_UNIT), {}, 2).length, 2);
      } finally {
        Math.random = orig;
      }
    });

    await h.test('returns all questions when count exceeds total', async (assert) => {
      const orig = Math.random;
      try {
        Math.random = () => 0;
        const questions = flattenUnit(MOCK_UNIT);
        assert(selectNextQuestions(questions, {}, 100).length, questions.length);
      } finally {
        Math.random = orig;
      }
    });

    await h.test('picks unseen before seen', async (assert) => {
      const orig = Math.random;
      try {
        Math.random = () => 0;
        const questions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
        const stats = {
          a: { attempts: 3, correct: 3, recent: [true, true, true] },
          c: { attempts: 2, correct: 2, recent: [true, true] }
        };
        assert(selectNextQuestions(questions, stats, 1)[0].id, 'b');
      } finally {
        Math.random = orig;
      }
    });
  });

  await h.describe('gradeAnswers', async h => {
    const Q = {
      id: 'q1',
      english: 'I go.',
      fragments: [
        { text: 'Ich', is_target: false },
        { text: 'gehe', is_target: true }
      ]
    };

    await h.test('correct answer is marked correct', async (assert) => {
      const results = gradeAnswers([Q], {}, (qId, fi) => fi === 1 ? 'gehe' : '');
      assert(results[0].allCorrect, true);
      assert(results[0].answers[0].correct, true);
    });

    await h.test('incorrect answer is marked incorrect', async (assert) => {
      const results = gradeAnswers([Q], {}, () => 'wrong');
      assert(results[0].allCorrect, false);
      assert(results[0].answers[0].correct, false);
      assert(results[0].answers[0].value, 'wrong');
      assert(results[0].answers[0].expected, 'gehe');
    });

    await h.test('increments attempts', async (assert) => {
      const stats = {};
      gradeAnswers([Q], stats, () => 'gehe');
      assert(stats['q1'].attempts, 1);
    });

    await h.test('increments correct only on correct answer', async (assert) => {
      const stats = {};
      gradeAnswers([Q], stats, () => 'gehe');
      assert(stats['q1'].correct, 1);
      gradeAnswers([Q], stats, () => 'wrong');
      assert(stats['q1'].correct, 1);
      assert(stats['q1'].attempts, 2);
    });

    await h.test('recent window is capped at 5', async (assert) => {
      const stats = { q1: { attempts: 5, correct: 5, recent: [true, true, true, true, true] } };
      gradeAnswers([Q], stats, () => 'wrong');
      assert(stats['q1'].recent.length, 5);
      assert(stats['q1'].recent[4], false);
    });

    await h.test('appends to recent window', async (assert) => {
      const stats = {};
      gradeAnswers([Q], stats, () => 'gehe');
      assert(stats['q1'].recent, [true]);
      gradeAnswers([Q], stats, () => 'wrong');
      assert(stats['q1'].recent, [true, false]);
    });

    await h.test('non-target fragments are not graded', async (assert) => {
      const results = gradeAnswers([Q], {}, () => 'gehe');
      assert(results[0].answers.length, 1);
    });
  });

  await h.describe('computeStats', async h => {
    const QS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

    await h.test('empty questions returns zeros', async (assert) => {
      const result = computeStats([], {});
      assert(result.total, 0);
      assert(result.answered, 0);
      assert(result.needsWork, 0);
    });

    await h.test('total is question count', async (assert) => {
      assert(computeStats(QS, {}).total, 3);
    });

    await h.test('threshold is 1 when none attempted', async (assert) => {
      assert(computeStats(QS, {}).threshold, 1);
    });

    await h.test('threshold advances when all questions attempted equally', async (assert) => {
      const stats = {
        a: { attempts: 2, correct: 2, recent: [] },
        b: { attempts: 2, correct: 1, recent: [] },
        c: { attempts: 2, correct: 2, recent: [] },
      };
      assert(computeStats(QS, stats).threshold, 3);
    });

    await h.test('answered counts questions at or above threshold', async (assert) => {
      const stats = {
        a: { attempts: 1, correct: 1, recent: [] },
        b: { attempts: 0, correct: 0, recent: [] },
      };
      // min attempts = 0, threshold = 1; only 'a' qualifies
      assert(computeStats(QS, stats).answered, 1);
    });

    await h.test('needsWork counts questions below 75% correct', async (assert) => {
      const stats = {
        a: { attempts: 4, correct: 1, recent: [] },  // 25% — needs work
        b: { attempts: 4, correct: 3, recent: [] },  // 75% — ok
        c: { attempts: 4, correct: 4, recent: [] },  // 100% — ok
      };
      assert(computeStats(QS, stats).needsWork, 1);
    });

    await h.test('unattempted questions do not count as needsWork', async (assert) => {
      assert(computeStats(QS, {}).needsWork, 0);
    });
  });
}

