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
    let selected = answerMap.get(q.id);
    if (selected === undefined) {
      selected = answerMap.get(String(q.id));
    }
    if (selected === undefined) {
      selected = null;
    }

    const isUnanswered = selected === null || selected === undefined || selected === "";
    let isCorrect = false;

    if (!isUnanswered) {
      if (selected === q.correctAnswer) {
        isCorrect = true;
      } else if (typeof q.correctAnswer === "number") {
        const letters = ["A", "B", "C", "D"];
        if (letters[q.correctAnswer] === selected || String(q.correctAnswer) === String(selected)) {
          isCorrect = true;
        }
      } else if (typeof q.correctAnswer === "string") {
        const letterMap = { A: 0, B: 1, C: 2, D: 3 };
        const upper = q.correctAnswer.trim().toUpperCase();
        if (letterMap[upper] === selected || String(letterMap[upper]) === String(selected)) {
          isCorrect = true;
        }
      }
    }

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
