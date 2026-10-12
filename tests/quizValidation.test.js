import test from "node:test";
import assert from "node:assert/strict";
import { quizRequestSchema } from "../src/schemas/quizRequestSchema.js";
import { validateGeneratedQuiz, quizGeneratedPayloadSchema } from "../src/schemas/quizResponseSchema.js";
import { quizSubmissionSchema } from "../src/schemas/quizSubmissionSchema.js";

test("quizRequestSchema validation", async (t) => {
  await t.test("accepts valid request parameters", () => {
    const valid = {
      subject: "physics",
      chapter: "Motion in a Straight Line",
      difficulty: "medium",
      count: 5
    };
    const parsed = quizRequestSchema.parse(valid);
    assert.equal(parsed.subject, "physics");
    assert.equal(parsed.chapter, "Motion in a Straight Line");
    assert.equal(parsed.difficulty, "medium");
    assert.equal(parsed.count, 5);
  });

  await t.test("rejects invalid subject", () => {
    assert.throws(() => {
      quizRequestSchema.parse({
        subject: "astrology",
        chapter: "Planets",
        difficulty: "easy",
        count: 5
      });
    }, /Subject must be one of/);
  });

  await t.test("rejects empty or very short chapter", () => {
    assert.throws(() => {
      quizRequestSchema.parse({
        subject: "chemistry",
        chapter: "a",
        difficulty: "hard",
        count: 10
      });
    }, /at least 2 valid characters/);
  });

  await t.test("rejects invalid question count", () => {
    assert.throws(() => {
      quizRequestSchema.parse({
        subject: "mathematics",
        chapter: "Trigonometry",
        difficulty: "medium",
        count: 7
      });
    }, /Question count must be one of/);
  });
});

test("quizResponseSchema validation", async (t) => {
  const sampleQuiz = {
    title: "Kinematics Quiz",
    subject: "physics",
    chapter: "Motion in a Straight Line",
    difficulty: "medium",
    questions: [
      {
        id: "q1",
        question: "What is acceleration?",
        options: [
          { id: "A", text: "Rate of change of velocity" },
          { id: "B", text: "Rate of change of displacement" },
          { id: "C", text: "Total distance traveled" },
          { id: "D", text: "Mass times velocity" }
        ],
        correctAnswer: "A",
        explanation: "Acceleration is defined as dv/dt."
      }
    ]
  };

  await t.test("accepts valid quiz structure", () => {
    const validated = validateGeneratedQuiz(sampleQuiz, 1);
    assert.equal(validated.questions.length, 1);
    assert.equal(validated.questions[0].correctAnswer, "A");
  });

  await t.test("enforces exact question count", () => {
    assert.throws(() => {
      validateGeneratedQuiz(sampleQuiz, 5);
    }, /Expected exactly 5 questions/);
  });

  await t.test("rejects duplicate option IDs", () => {
    const invalidQuiz = JSON.parse(JSON.stringify(sampleQuiz));
    invalidQuiz.questions[0].options[3].id = "A"; // Duplicate A instead of D
    assert.throws(() => {
      quizGeneratedPayloadSchema.parse(invalidQuiz);
    });
  });

  await t.test("rejects duplicate question IDs within a quiz", () => {
    const dupQuiz = {
      ...sampleQuiz,
      questions: [
        sampleQuiz.questions[0],
        { ...sampleQuiz.questions[0] } // Duplicate q1
      ]
    };
    assert.throws(() => {
      quizGeneratedPayloadSchema.parse(dupQuiz);
    }, /All question IDs within a quiz must be unique/);
  });
});

test("quizSubmissionSchema validation", async (t) => {
  await t.test("accepts valid submission payload", () => {
    const submission = {
      quizId: "quiz-12345",
      answers: [
        { questionId: "q1", selectedAnswer: "A" },
        { questionId: "q2", selectedAnswer: null }
      ]
    };
    const parsed = quizSubmissionSchema.parse(submission);
    assert.equal(parsed.quizId, "quiz-12345");
    assert.equal(parsed.answers.length, 2);
  });

  await t.test("rejects duplicate question IDs in submission", () => {
    assert.throws(() => {
      quizSubmissionSchema.parse({
        quizId: "quiz-12345",
        answers: [
          { questionId: "q1", selectedAnswer: "A" },
          { questionId: "q1", selectedAnswer: "B" }
        ]
      });
    }, /cannot contain duplicate question IDs/);
  });
});
