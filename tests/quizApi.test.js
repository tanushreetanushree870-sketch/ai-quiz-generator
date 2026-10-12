import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ENV } from "../src/config/environment.js";

// Ensure API test runs deterministically against local fallback without external network dependency
const savedKey = ENV.GEMINI_API_KEY;
ENV.GEMINI_API_KEY = "";

const app = createApp();

test("API Endpoint Testing", async (t) => {
  t.after(() => {
    ENV.GEMINI_API_KEY = savedKey;
  });
  await t.test("GET /api/health returns 200 with service name", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.equal(res.body.service, "AI Quiz Master");
  });

  await t.test("GET /api/config returns public configuration", async () => {
    const res = await request(app).get("/api/config");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.subjects));
    assert.ok(Array.isArray(res.body.difficulties));
    assert.ok(Array.isArray(res.body.questionCounts));
    assert.equal(typeof res.body.aiConfigured, "boolean");
    // Ensure secrets are NOT leaked
    assert.equal(res.body.GEMINI_API_KEY, undefined);
  });

  await t.test("GET /api/chapters/:subject returns chapters", async () => {
    const res = await request(app).get("/api/chapters/physics");
    assert.equal(res.status, 200);
    assert.equal(res.body.subject, "physics");
    assert.ok(res.body.chapters.length >= 10);
  });

  await t.test("GET /api/chapters/:subject rejects unsupported subject with 400", async () => {
    const res = await request(app).get("/api/chapters/astronomy");
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  await t.test("GET /api/quiz/health returns high-level status", async () => {
    const res = await request(app).get("/api/quiz/health");
    assert.equal(res.status, 200);
    assert.ok(["available", "degraded", "local_only"].includes(res.body.status));
    assert.equal(res.body.localFallbackAvailable, true);
  });

  let generatedQuizId = "";

  await t.test("POST /api/quiz/generate creates a quiz via local bank fallback", async () => {
    const res = await request(app)
      .post("/api/quiz/generate")
      .send({
        subject: "physics",
        chapter: "Motion in a Straight Line",
        difficulty: "easy",
        count: 5
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.quizId);
    assert.equal(res.body.subject, "physics");
    assert.equal(res.body.questions.length, 5);
    // Security check: answer keys must NOT be sent to client before submission!
    assert.equal(res.body.questions[0].correctAnswer, undefined);
    assert.equal(res.body.questions[0].explanation, undefined);

    generatedQuizId = res.body.quizId;
  });

  await t.test("POST /api/quiz/submit evaluates submitted answers", async () => {
    assert.ok(generatedQuizId, "Must have generated quiz ID from previous test");

    const res = await request(app)
      .post("/api/quiz/submit")
      .send({
        quizId: generatedQuizId,
        answers: [
          { questionId: "phy-mot-e1", selectedAnswer: "B" }
        ]
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.quizId, generatedQuizId);
    assert.equal(typeof res.body.totalQuestions, "number");
    assert.equal(typeof res.body.percentage, "number");
    assert.ok(Array.isArray(res.body.results));
    // Check that results now contain answers and explanations
    assert.ok(res.body.results[0].correctAnswer);
    assert.ok(res.body.results[0].explanation);
  });

  await t.test("POST /api/quiz/generate rejects invalid requests with 400", async () => {
    const res = await request(app)
      .post("/api/quiz/generate")
      .send({
        subject: "physics",
        chapter: "",
        difficulty: "impossible",
        count: 3
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });
});
