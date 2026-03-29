import './practise-card.js';

export const name = 'practise-card';

const Q = {
  id: '0-0',
  english: 'I go.',
  fragments: [
    { text: 'Ich',  is_target: false },
    { text: 'gehe', is_target: true  },
    { text: '.',    is_target: false },
  ]
};

async function makeCard(h, props) {
  const el = document.createElement('practice-card');
  h.getContainer().appendChild(el);
  Object.assign(el, props);
  await el.updateComplete;
  return el;
}

export async function run(h) {

  await h.describe('question mode', async h => {
    await h.test('renders english text', async (assert) => {
      const el = await makeCard(h, { question: Q });
      assert(el.querySelector('.english').textContent, 'I go.');
    });

    await h.test('renders input for target fragment', async (assert) => {
      const el = await makeCard(h, { question: Q });
      assert(el.querySelectorAll('input.gap').length, 1);
    });

    await h.test('input carries data attributes', async (assert) => {
      const el = await makeCard(h, { question: Q });
      const input = el.querySelector('input.gap');
      assert(input.dataset.questionId, '0-0');
      assert(input.dataset.fragIndex, '1');
    });

    await h.test('renders spans for non-target fragments', async (assert) => {
      const el = await makeCard(h, { question: Q });
      const spans = el.querySelectorAll('.foreign .text');
      assert(Array.from(spans).map(s => s.textContent), ['Ich', '.']);
    });

    await h.test('no stats element when stat is absent', async (assert) => {
      const el = await makeCard(h, { question: Q });
      assert(el.querySelector('.question-stats'), null);
    });

    await h.test('no stats element when attempts is 0', async (assert) => {
      const el = await makeCard(h, { question: Q, stat: { attempts: 0, correct: 0 } });
      assert(el.querySelector('.question-stats'), null);
    });

    await h.test('shows stats when attempts > 0', async (assert) => {
      const el = await makeCard(h, { question: Q, stat: { attempts: 3, correct: 2 } });
      assert(el.querySelector('.question-stats').textContent.trim(), '2 / 3');
    });
  });

  await h.describe('result mode', async h => {
    const correctAnswers  = [{ value: 'gehe', correct: true,  expected: 'gehe' }];
    const incorrectAnswers = [{ value: 'geht', correct: false, expected: 'gehe' }];

    await h.test('correct answer gets correct class', async (assert) => {
      const el = await makeCard(h, { question: Q, mode: 'result', answers: correctAnswers, stat: { attempts: 1, correct: 1 } });
      assert(el.querySelector('.result-feedback').classList.contains('correct'), true);
    });

    await h.test('incorrect answer gets incorrect class', async (assert) => {
      const el = await makeCard(h, { question: Q, mode: 'result', answers: incorrectAnswers, stat: { attempts: 1, correct: 0 } });
      assert(el.querySelector('.result-feedback').classList.contains('incorrect'), true);
    });

    await h.test('incorrect answer shows expected value', async (assert) => {
      const el = await makeCard(h, { question: Q, mode: 'result', answers: incorrectAnswers, stat: { attempts: 1, correct: 0 } });
      assert(el.querySelector('.expected').textContent, ' → gehe');
    });

    await h.test('correct answer has no expected element', async (assert) => {
      const el = await makeCard(h, { question: Q, mode: 'result', answers: correctAnswers, stat: { attempts: 1, correct: 1 } });
      assert(el.querySelector('.expected'), null);
    });

    await h.test('card has incorrect class when any answer wrong', async (assert) => {
      const el = await makeCard(h, { question: Q, mode: 'result', answers: incorrectAnswers, stat: { attempts: 1, correct: 0 } });
      assert(el.classList.contains('incorrect'), true);
    });

    await h.test('card has no incorrect class when all correct', async (assert) => {
      const el = await makeCard(h, { question: Q, mode: 'result', answers: correctAnswers, stat: { attempts: 1, correct: 1 } });
      assert(el.classList.contains('incorrect'), false);
    });

    await h.test('empty answer shows (empty) placeholder', async (assert) => {
      const el = await makeCard(h, { question: Q, mode: 'result', answers: [{ value: '', correct: false, expected: 'gehe' }], stat: { attempts: 1, correct: 0 } });
      const feedback = el.querySelector('.result-feedback');
      const valueText = feedback.textContent.replace(feedback.querySelector('.expected')?.textContent ?? '', '').trim();
      assert(valueText, '(empty)');
    });
  });
}
