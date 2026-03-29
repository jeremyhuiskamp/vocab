export function flattenUnit(unitData) {
  const list = [];
  (unitData.entries || []).forEach((entry, ei) => {
    (entry.sentences || []).forEach((sent, si) => {
      const targetFragments = sent.fragments.filter(f => f.is_target);
      if (targetFragments.length === 0) return;
      list.push({
        id: `${ei}-${si}`,
        entryIndex: ei,
        sentenceIndex: si,
        english: sent.english,
        fragments: sent.fragments,
        targetFragments
      });
    });
  });
  return list;
}

/**
 * Priority for choosing the next questions. Higher = more likely to be picked.
 * Tweak this single function to change ranking behaviour.
 */
export function getQuestionPriority(question, stats) {
  const s = stats[question.id] || { attempts: 0, correct: 0, recent: [] };
  const FUZZ = 5;
  const fuzz = Math.random() * FUZZ;

  if (s.attempts === 0) {
    return 1000 + fuzz;
  }
  const recentWrong = s.recent.filter(r => !r).length;
  const recentCorrectRate = s.recent.length > 0 ? (s.recent.length - recentWrong) / s.recent.length : 0;
  const lowScoreBonus = (1 - recentCorrectRate) * 100;
  const fewAttemptsBonus = 10 / (s.attempts + 1);
  return lowScoreBonus + fewAttemptsBonus + fuzz;
}

export function selectNextQuestions(questions, stats, count) {
  if (questions.length === 0) return [];
  const withPriority = questions.map(q => ({ q, p: getQuestionPriority(q, stats) }));
  withPriority.sort((a, b) => b.p - a.p);
  return withPriority.slice(0, Math.min(count, questions.length)).map(x => x.q);
}

/**
 * Compute summary stats for the stats bar.
 * Returns { total, threshold, answered, needsWork }.
 * threshold is minAttempts + 1 across all questions.
 */
export function computeStats(questions, sessionStats) {
  const total = questions.length;
  if (total === 0) return { total: 0, threshold: 1, answered: 0, needsWork: 0 };

  const minAttempts = Math.min(...questions.map(q => sessionStats[q.id]?.attempts || 0));
  const threshold = minAttempts + 1;

  let answered = 0;
  let needsWork = 0;
  questions.forEach(q => {
    const s = sessionStats[q.id];
    if ((s?.attempts || 0) >= threshold) answered++;
    if (s && s.attempts > 0 && s.correct / s.attempts < 0.75) needsWork++;
  });

  return { total, threshold, answered, needsWork };
}

/**
 * Grade a set of questions. Mutates sessionStats in place.
 * getInputValue(questionId, fragIndex) should return the trimmed user answer for that fragment.
 * Returns an array of { q, answers, allCorrect }.
 */
export function gradeAnswers(questions, sessionStats, getInputValue) {
  return questions.map(q => {
    const answers = [];
    let allCorrect = true;
    q.fragments.forEach((frag, fi) => {
      if (!frag.is_target) return;
      const value = getInputValue(q.id, fi);
      const correct = value === frag.text.trim();
      if (!correct) allCorrect = false;
      answers.push({ value, correct, expected: frag.text });
    });
    const stat = sessionStats[q.id] || { attempts: 0, correct: 0, recent: [] };
    stat.attempts += 1;
    if (allCorrect) stat.correct += 1;
    stat.recent.push(allCorrect);
    if (stat.recent.length > 5) stat.recent.shift();
    sessionStats[q.id] = stat;
    return { q, answers, allCorrect };
  });
}
