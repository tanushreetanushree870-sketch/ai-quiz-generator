import test from "node:test";
import assert from "node:assert/strict";
import { evaluateQuizSubmission } from "../src/services/scoringService.js";

test("scoringService evaluation", async (t) => {
  const sampleQuestions = [
    {
      id: "q1",
      question: "Q1 text",
      options: [
        { id: "A", text: "Opt A" },
        { id: "B", text: "Opt B" },
        { id: "C", text: "Opt C" },
        { id: "D", text: "Opt D" }
      ],
      correctAnswer: "A",
      explanation: "Exp 1"
    },
    {
      id: "q2",
      question: "Q2 text",
      options: [
        { id: "A", text: "Opt A" },
        { id: "B", text: "Opt B" },
        { id: "C", text: "Opt C" },
        { id: "D", text: "Opt D" }
      ],
      correctAnswer: "B",
      explanation: "Exp 2"
    },
    {
      id: "q3",
      question: "Q3 text",
      options: [
        { id: "A", text: "Opt A" },
        { id: "B", text: "Opt B" },
        { id: "C", text: "Opt C" },
        { id: "D", text: "Opt D" }
      ],
      correctAnswer: "C",
      explanation: "Exp 3"
    }
  ];

  await t.test("calculates perfect 100% score correctly", () => {
    const answers = [
      { questionId: "q1", selectedAnswer: "A" },
      { questionId: "q2", selectedAnswer: "B" },
      { questionId: "q3", selectedAnswer: "C" }
    ];
    const res = evaluateQuizSubmission(sampleQuestions, answers);
    assert.equal(res.totalQuestions, 3);
    assert.equal(res.correctAnswers, 3);
    assert.equal(res.incorrectAnswers, 0);
    assert.equal(res.unanswered, 0);
    assert.equal(res.percentage, 100);
  });

  await t.test("evaluates mixed correct, incorrect, and unanswered questions", () => {
    const answers = [
      { questionId: "q1", selectedAnswer: "A" }, // Correct
      { questionId: "q2", selectedAnswer: "D" }, // Incorrect
      { questionId: "q3", selectedAnswer: null } // Unanswered
    ];
    const res = evaluateQuizSubmission(sampleQuestions, answers);
    assert.equal(res.totalQuestions, 3);
    assert.equal(res.correctAnswers, 1);
    assert.equal(res.incorrectAnswers, 1);
    assert.equal(res.unanswered, 1);
    // 1/3 * 100 = 33.33... rounded to whole number = 33%
    assert.equal(res.percentage, 33);

    assert.equal(res.results[0].isCorrect, true);
    assert.equal(res.results[1].isCorrect, false);
    assert.equal(res.results[2].isUnanswered, true);
  });
});
