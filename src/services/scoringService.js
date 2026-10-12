/**
 * Deterministic scoring service for quiz submissions.
 */

export function evaluateQuizSubmission(storedQuestions, submittedAnswers) {
  // Map of questionId -> selectedAnswer
  const answerMap = new Map();
  for (const item of submittedAnswers) {
    if (item && item.questionId) {
      answerMap.set(item.questionId, item.selectedAnswer || null);
    }
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const results = storedQuestions.map((q) => {
    const selected = answerMap.get(q.id) || null;
    const isUnanswered = selected === null || selected === undefined || selected === "";
    const isCorrect = !isUnanswered && selected === q.correctAnswer;

    if (isUnanswered) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    return {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedAnswer: selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
      isUnanswered,
      explanation: q.explanation
    };
  });

  const totalQuestions = storedQuestions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    unanswered: unansweredCount,
    percentage,
    results
  };
}
