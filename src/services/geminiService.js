import { GoogleGenAI } from "@google/genai";
import { ENV, isAiConfigured } from "../config/environment.js";
import { validateGeneratedQuiz } from "../schemas/quizResponseSchema.js";
import { logger } from "../utils/logger.js";

export function getGeminiClient() {
  if (isAiConfigured()) {
    return new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  }
  return null;
}

export const geminiClient = getGeminiClient();

let activeGeminiRequests = 0;

export function getActiveGeminiRequests() {
  return activeGeminiRequests;
}

const SYSTEM_INSTRUCTION = `You are an expert educational assessment designer specializing in Physics, Chemistry, and Mathematics.

Your task is to generate accurate, original, chapter-specific multiple-choice questions for students.
You must follow the requested subject, chapter, difficulty level, and exact question count.
Every question must test a meaningful educational concept.
Every question must contain exactly four answer options identified by A, B, C, and D.
Exactly one option must be correct.
The correct answer must match the question and all calculations must be checked before returning the result.
Every question must include a clear explanation of why the correct answer is correct.
Avoid ambiguous questions, duplicate questions, unsupported assumptions, misleading answer options, and incorrect scientific or mathematical statements.

Respect the requested difficulty:
- Easy: tests definitions, fundamental concepts, and direct formulas.
- Medium: tests conceptual understanding, application of formulas, and multi-step calculations.
- Hard: tests advanced conceptual reasoning, deep problem-solving, and synthesis of multiple related concepts.

For Physics, use correct physical units and scientifically valid equations.
For Chemistry, use correct chemical symbols, formulas, reactions, and terminology.
For Mathematics, verify calculations, algebraic transformations, mathematical expressions, and final answers.

Do not create questions unrelated to the requested chapter.
Do not invent facts to fill the requested question count.
Return only valid JSON matching the requested structure.
Do not include Markdown fences or text outside the JSON object.`;

function buildPrompt(subject, chapter, difficulty, count) {
  return `Generate an educational multiple-choice quiz.

Subject: ${subject}
Chapter: ${chapter}
Difficulty: ${difficulty}
Number of questions: ${count}

Requirements:
1. Generate exactly ${count} questions.
2. Keep every question relevant to the specified chapter: "${chapter}".
3. Provide exactly four answer options per question with ids "A", "B", "C", and "D".
4. Identify the correct answer using A, B, C, or D.
5. Provide a rigorous educational explanation for every answer.
6. Avoid duplicate or near-duplicate questions.
7. Verify all calculations and answers before output.
8. Match the requested difficulty: "${difficulty}".
9. Use standard scientific notation and SI units where applicable.
10. Return a JSON object with this exact shape:
{
  "title": "${chapter} Quiz",
  "subject": "${subject}",
  "chapter": "${chapter}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "options": [
        { "id": "A", "text": "Option A" },
        { "id": "B", "text": "Option B" },
        { "id": "C", "text": "Option C" },
        { "id": "D", "text": "Option D" }
      ],
      "correctAnswer": "A",
      "explanation": "Explanation here"
    }
  ]
}`;
}

function buildRepairPrompt(rawBadResponse, subject, chapter, difficulty, count, errorMsg) {
  return `The previous response did not satisfy the required quiz JSON schema. Error: ${errorMsg}

Correct the response so that it:
- Contains valid JSON.
- Contains exactly ${count} questions.
- Contains exactly four options per question with IDs A, B, C, and D.
- Has one correct answer per question (A, B, C, or D).
- Includes a valid explanation for each question.
- Matches the requested subject: "${subject}", chapter: "${chapter}", and difficulty: "${difficulty}".
- Contains no Markdown fences or commentary outside the JSON.

Previous output:
${rawBadResponse.slice(0, 2000)}

Return only the corrected JSON object.`;
}

function cleanJsonString(raw) {
  if (!raw) return "";
  let clean = raw.trim();
  // Strip Markdown ```json and ``` fences if model wraps output
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return clean.trim();
}

async function callWithTimeout(promise, timeoutMs) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generates quiz questions from Gemini API.
 */
export async function generateQuizWithGemini(subject, chapter, difficulty, count) {
  const client = getGeminiClient();
  if (!isAiConfigured() || !client) {
    throw new Error("Gemini API key is not configured");
  }

  // Check concurrency limit
  if (activeGeminiRequests >= ENV.GEMINI_MAX_CONCURRENT_REQUESTS) {
    const err = new Error("Gemini AI concurrency limit reached");
    err.code = "CONCURRENCY_LIMIT";
    throw err;
  }

  activeGeminiRequests++;
  const startTime = Date.now();

  try {
    const prompt = buildPrompt(subject, chapter, difficulty, count);
    const modelName = ENV.GEMINI_MODEL;

    let responseText = "";
    let attempts = 0;
    const maxAttempts = 1 + ENV.GEMINI_MAX_RETRIES;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        logger.info(`Sending request to Gemini (model: ${modelName}, attempt: ${attempts})`);
        
        const apiCall = client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.7
          }
        });

        const result = await callWithTimeout(apiCall, ENV.GEMINI_TIMEOUT_MS);
        responseText = result.text || "";
        break; // Success
      } catch (err) {
        logger.warn(`Gemini API call failed on attempt ${attempts}: ${err.message}`);

        // If rate limited (429), do not retry repeatedly
        if (err.status === 429 || err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
          const rateErr = new Error("Gemini rate limit exceeded");
          rateErr.code = "RATE_LIMITED";
          rateErr.status = 429;
          throw rateErr;
        }

        if (attempts >= maxAttempts) {
          throw err;
        }

        // Exponential backoff with jitter
        const backoffMs = Math.pow(2, attempts) * 500 + Math.random() * 200;
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    // Parse and validate JSON
    let parsedData = null;
    const cleaned = cleanJsonString(responseText);

    try {
      parsedData = JSON.parse(cleaned);
      validateGeneratedQuiz(parsedData, count);
    } catch (parseOrValError) {
      logger.warn(`Initial AI response malformed or invalid: ${parseOrValError.message}. Attempting repair prompt.`);
      // Attempt repair once
      try {
        const repairPrompt = buildRepairPrompt(cleaned, subject, chapter, difficulty, count, parseOrValError.message);
        const repairCall = client.models.generateContent({
          model: modelName,
          contents: repairPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });
        const repairResult = await callWithTimeout(repairCall, ENV.GEMINI_TIMEOUT_MS);
        const repairedCleaned = cleanJsonString(repairResult.text || "");
        parsedData = JSON.parse(repairedCleaned);
        validateGeneratedQuiz(parsedData, count);
        logger.info("Successfully repaired malformed Gemini quiz response");
      } catch (repairErr) {
        logger.error(`Repair attempt failed: ${repairErr.message}`);
        const malformedErr = new Error("Failed to generate valid quiz structure from AI");
        malformedErr.code = "AI_MALFORMED";
        throw malformedErr;
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`Gemini quiz generation completed in ${duration}ms`);

    // Assign unique IDs if needed
    const validatedQuestions = parsedData.questions.map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));

    return {
      quizId: `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: parsedData.title || `${chapter} Quiz`,
      subject: parsedData.subject || subject,
      chapter: parsedData.chapter || chapter,
      difficulty: parsedData.difficulty || difficulty,
      generationMode: "ai",
      questions: validatedQuestions
    };
  } finally {
    activeGeminiRequests = Math.max(0, activeGeminiRequests - 1);
  }
}
