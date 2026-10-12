import test from "node:test";
import assert from "node:assert/strict";
import { filterLocalQuestions, getLocalQuiz, getAllLocalQuestionsCount } from "../src/services/localQuestionService.js";

test("localQuestionService", async (t) => {
  await t.test("successfully loads questions for Physics, Chemistry, and Mathematics", () => {
    const counts = getAllLocalQuestionsCount();
    assert.ok(counts.physics >= 5, `Expected physics >= 5, got ${counts.physics}`);
    assert.ok(counts.chemistry >= 5, `Expected chemistry >= 5, got ${counts.chemistry}`);
    assert.ok(counts.mathematics >= 5, `Expected mathematics >= 5, got ${counts.mathematics}`);
  });

  await t.test("filters questions by subject and chapter accurately", () => {
    const res = filterLocalQuestions("physics", "Motion in a Straight Line", "medium");
    assert.ok(res.chapterMatches.length > 0);
    assert.ok(res.diffMatches.length > 0);
  });

  await t.test("generates exact count of questions requested without duplicates", () => {
    const quiz = getLocalQuiz("physics", "Motion in a Straight Line", "easy", 5);
    assert.ok(quiz, "Expected local quiz to be generated");
    assert.equal(quiz.questions.length, 5);
    assert.equal(quiz.generationMode, "local");

    const ids = quiz.questions.map(q => q.id);
    assert.equal(new Set(ids).size, 5, "All 5 questions must have unique IDs");

    // Check that every question has 4 valid options and a correct answer
    quiz.questions.forEach(q => {
      assert.equal(q.options.length, 4);
      assert.ok(["A", "B", "C", "D"].includes(q.correctAnswer));
      assert.ok(q.explanation.length > 0);
    });
  });

  await t.test("returns null for non-existent custom chapter", () => {
    const quiz = getLocalQuiz("physics", "Completely Fake Nonexistent Topic XYZ", "easy", 5);
    assert.equal(quiz, null);
  });
});
