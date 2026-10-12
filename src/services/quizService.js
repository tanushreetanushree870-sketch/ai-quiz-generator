import { ENV, isAiConfigured } from "../config/environment.js";
import { quizCache } from "./cacheService.js";
import { generateQuizWithGemini } from "./geminiService.js";
import { getLocalQuiz } from "./localQuestionService.js";
import { evaluateQuizSubmission } from "./scoringService.js";
import { createConflictError, createNotFoundError, createServiceUnavailableError } from "../utils/httpErrors.js";
import { logger } from "../utils/logger.js";

// Bounded in-memory store for active quiz sessions
class QuizSessionStore {
  constructor(maxEntries = 1000, ttlSeconds = 3600) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlSeconds * 1000;
    this.sessions = new Map();
  }

  set(quizId, data) {
    if (this.sessions.size >= this.maxEntries) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) this.sessions.delete(oldestKey);
    }
    this.sessions.set(quizId, {
      ...data,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  get(quizId) {
    const entry = this.sessions.get(quizId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.sessions.delete(quizId);
      return null;
    }
    return entry;
  }

  delete(quizId) {
    this.sessions.delete(quizId);
  }
}

export const sessionStore = new QuizSessionStore(
  ENV.QUIZ_SESSION_MAX_ENTRIES,
  ENV.QUIZ_SESSION_TTL_SECONDS
);

/**
 * Handles the complete quiz generation workflow:
 * Caching -> AI generation -> Local question bank fallback.
 */
export async function createQuiz({ subject, chapter, difficulty, count }) {
  const cacheKey = quizCache.generateKey(subject, chapter, difficulty, count);

  // 1. Check existing cached quiz
  const cached = quizCache.get(cacheKey);
  if (cached) {
    logger.info(`Serving quiz from bounded response cache: ${cacheKey}`);
    const quizId = `cache-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Store in active sessions for secure server-side evaluation
    sessionStore.set(quizId, {
      storedQuestions: cached.questions,
      createdAt: Date.now(),
      isSubmitted: false
    });

    return {
      quizId,
      title: cached.title,
      subject: cached.subject,
      chapter: cached.chapter,
      difficulty: cached.difficulty,
      generationMode: "cache",
      questions: cached.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }))
    };
  }

  // 2. In-flight deduplication wrapper
  const fullQuiz = await quizCache.deduplicate(cacheKey, async () => {
    let result = null;

    // Check if AI generation is configured
    if (isAiConfigured()) {
      try {
        result = await generateQuizWithGemini(subject, chapter, difficulty, count);
        logger.info(`Generated quiz via Gemini AI for "${chapter}"`);
      } catch (aiErr) {
        logger.warn(`AI generation unavailable or failed: ${aiErr.message}. Attempting local fallback.`);
      }
    } else {
      logger.info(`Gemini API key not configured. Using local question bank.`);
    }

    // 3. Fallback to local question bank if AI was skipped or failed
    if (!result) {
      const localResult = getLocalQuiz(subject, chapter, difficulty, count);
      if (localResult) {
        result = localResult;
        logger.info(`Successfully generated quiz from local question bank for "${chapter}"`);
      }
    }

    // If still no result, either custom chapter has no questions or local bank insufficient
    if (!result) {
      const msg = isAiConfigured()
        ? `The AI service is temporarily unavailable, and the local question bank does not have enough verified questions for "${chapter}" (${difficulty}, ${count} questions). Please try selecting a predefined chapter.`
        : `Gemini AI is not configured, and no local fallback questions exist for custom chapter "${chapter}". Please select a predefined chapter or configure your GEMINI_API_KEY.`;
      throw createServiceUnavailableError(msg);
    }

    // Save in cache (full quiz with answers and explanations)
    quizCache.set(cacheKey, result);
    return result;
  });

  // Assign a distinct session quizId
  const sessionQuizId = fullQuiz.quizId || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  sessionStore.set(sessionQuizId, {
    storedQuestions: fullQuiz.questions,
    createdAt: Date.now(),
    isSubmitted: false
  });

  // Return to client WITHOUT correct answers and explanations for quiz integrity
  return {
    quizId: sessionQuizId,
    title: fullQuiz.title,
    subject: fullQuiz.subject,
    chapter: fullQuiz.chapter,
    difficulty: fullQuiz.difficulty,
    generationMode: fullQuiz.generationMode,
    questions: fullQuiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }))
  };
}

/**
 * Handles quiz submission and scoring.
 */
export function submitQuizAnswers({ quizId, answers }) {
  const session = sessionStore.get(quizId);

  if (!session) {
    throw createNotFoundError("Quiz session not found or has expired. Please create a new quiz.");
  }

  if (session.isSubmitted && session.submissionResult) {
    logger.info(`Duplicate submission for quizId: ${quizId}. Returning recorded results.`);
    return {
      quizId,
      ...session.submissionResult
    };
  }

  const evaluation = evaluateQuizSubmission(session.storedQuestions, answers);

  // Mark session as completed
  session.isSubmitted = true;
  session.submissionResult = evaluation;

  return {
    quizId,
    ...evaluation
  };
}
