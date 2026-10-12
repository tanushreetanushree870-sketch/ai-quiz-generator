import { ENV, isAiConfigured } from "../config/environment.js";
import { quizCache } from "./cacheService.js";
import { generateQuizWithGemini } from "./geminiService.js";
import { getLocalQuiz, getFallbackQuizFromSubject } from "./localQuestionService.js";
import { evaluateQuizSubmission } from "./scoringService.js";
import { createConflictError, createNotFoundError, createServiceUnavailableError } from "../utils/httpErrors.js";
import { logger } from "../utils/logger.js";

function capitalizeWord(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatQuestionToSchema(q, index) {
  // Format options as array of strings
  let options = [];
  if (Array.isArray(q.options)) {
    options = q.options.map(o => (typeof o === "object" && o !== null && o.text !== undefined ? o.text : String(o)));
  }

  // Determine 0-based integer index for correctAnswer
  let correctAnswer = 0;
  if (typeof q.correctAnswer === "number") {
    correctAnswer = q.correctAnswer;
  } else if (typeof q.correctAnswer === "string") {
    const letter = q.correctAnswer.trim().toUpperCase();
    const map = { A: 0, B: 1, C: 2, D: 3 };
    if (map[letter] !== undefined) {
      correctAnswer = map[letter];
    } else {
      const foundIdx = options.indexOf(q.correctAnswer);
      correctAnswer = foundIdx >= 0 ? foundIdx : 0;
    }
  }

  return {
    id: q.id !== undefined ? q.id : index + 1,
    question: q.question,
    options,
    correctAnswer,
    explanation: q.explanation || ""
  };
}

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
export async function createQuiz({ subject, chapter, topic, difficulty, count }) {
  const targetChapter = chapter || topic;
  const cacheKey = quizCache.generateKey(subject, targetChapter, difficulty, count);

  // 1. Check existing cached quiz
  const cached = quizCache.get(cacheKey);
  if (cached) {
    logger.info(`Serving quiz from bounded response cache: ${cacheKey}`);
    const quizId = `cache-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const formattedQuestions = cached.questions.map((q, idx) => formatQuestionToSchema(q, idx));

    // Store in active sessions for secure evaluation
    sessionStore.set(quizId, {
      storedQuestions: formattedQuestions,
      createdAt: Date.now(),
      isSubmitted: false
    });

    const topicName = cached.topic || cached.chapter || targetChapter;
    return {
      quizId,
      subject: capitalizeWord(cached.subject || subject),
      topic: topicName,
      chapter: topicName,
      difficulty: capitalizeWord(cached.difficulty || difficulty),
      title: cached.title || `${topicName} Quiz`,
      generationMode: "cache",
      questions: formattedQuestions
    };
  }

  // 2. In-flight deduplication wrapper
  const fullQuiz = await quizCache.deduplicate(cacheKey, async () => {
    let result = null;

    // Check if AI generation is configured
    if (isAiConfigured()) {
      try {
        result = await generateQuizWithGemini(subject, targetChapter, difficulty, count);
        logger.info(`Generated quiz via Gemini AI for "${targetChapter}"`);
      } catch (aiErr) {
        console.error('[Quiz Generation Error]:', aiErr);
        logger.warn(`AI generation unavailable or failed: ${aiErr.message}. Automatically falling back to offline local question bank.`);
      }
    } else {
      logger.info(`Gemini API key not configured. Using local question bank.`);
    }

    // 3. Fallback to local question bank if AI was skipped or failed
    if (!result) {
      const localResult = getLocalQuiz(subject, targetChapter, difficulty, count);
      if (localResult) {
        result = localResult;
        logger.info(`Successfully generated quiz from local question bank for "${targetChapter}"`);
      } else {
        result = getFallbackQuizFromSubject(subject, targetChapter, difficulty, count);
        if (result) {
          logger.info(`Successfully generated fallback quiz from subject "${subject}" for "${targetChapter}"`);
        }
      }
    }

    // Safety check: ensure result exists
    if (!result) {
      result = getFallbackQuizFromSubject(subject, targetChapter, difficulty, count);
    }

    // Save in cache (full quiz with answers and explanations)
    quizCache.set(cacheKey, result);
    return result;
  });

  // Assign a distinct session quizId
  const sessionQuizId = fullQuiz.quizId || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const formattedQuestions = fullQuiz.questions.map((q, idx) => formatQuestionToSchema(q, idx));

  sessionStore.set(sessionQuizId, {
    storedQuestions: formattedQuestions,
    createdAt: Date.now(),
    isSubmitted: false
  });

  const topicName = fullQuiz.topic || fullQuiz.chapter || targetChapter;

  return {
    quizId: sessionQuizId,
    subject: fullQuiz.subject || subject,
    topic: topicName,
    chapter: topicName,
    difficulty: fullQuiz.difficulty || difficulty,
    title: fullQuiz.title || `${topicName} Quiz`,
    generationMode: fullQuiz.generationMode || "local",
    questions: formattedQuestions
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
