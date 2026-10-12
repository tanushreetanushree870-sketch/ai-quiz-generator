import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeSubject, normalizeChapter, normalizeDifficulty } from "../utils/normalizeInput.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read question datasets once
const DATA_DIR = path.resolve(__dirname, "../data");

function loadJson(fileName) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, fileName), "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${fileName}:`, err);
    return [];
  }
}

const QUESTION_BANK = {
  physics: loadJson("physicsQuestions.json"),
  chemistry: loadJson("chemistryQuestions.json"),
  mathematics: loadJson("mathematicsQuestions.json")
};

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeStr(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Filters the local question bank by subject, chapter, and difficulty.
 */
export function filterLocalQuestions(subject, chapter, difficulty) {
  const normSub = normalizeSubject(subject);
  const normChap = normalizeStr(chapter);
  const normDiff = normalizeDifficulty(difficulty);

  const pool = QUESTION_BANK[normSub] || [];

  // Match chapter strictly or by normalized slug/string
  const chapterMatches = pool.filter(q => {
    const qChapNorm = normalizeStr(q.chapter);
    return qChapNorm.includes(normChap) || normChap.includes(qChapNorm);
  });

  if (chapterMatches.length === 0) {
    return [];
  }

  // Filter by difficulty first
  const diffMatches = chapterMatches.filter(q => normalizeDifficulty(q.difficulty) === normDiff);

  return {
    diffMatches,
    chapterMatches
  };
}

/**
 * Checks if sufficient local questions exist for given parameters.
 */
export function hasLocalQuestionsAvailable(subject, chapter, difficulty, count) {
  const res = filterLocalQuestions(subject, chapter, difficulty);
  if (!res || !res.chapterMatches) return false;
  // If exact difficulty has enough, or the chapter pool has enough
  return res.diffMatches.length >= count || res.chapterMatches.length >= count;
}

/**
 * Generates a quiz from the local question bank.
 */
export function getLocalQuiz(subject, chapter, difficulty, count) {
  const normSub = normalizeSubject(subject);
  const normChap = normalizeChapter(chapter);
  const normDiff = normalizeDifficulty(difficulty);

  const res = filterLocalQuestions(subject, chapter, difficulty);

  if (!res || !res.chapterMatches || res.chapterMatches.length === 0) {
    return null; // Custom chapter or no questions in local bank
  }

  let selected = [];
  const primaryMatches = shuffle(res.diffMatches);

  if (primaryMatches.length >= count) {
    selected = primaryMatches.slice(0, count);
  } else {
    // Fill remaining with other difficulties in the same chapter to satisfy requested count
    const remainingNeeded = count - primaryMatches.length;
    const primaryIds = new Set(primaryMatches.map(q => q.id));
    const secondaryMatches = shuffle(res.chapterMatches.filter(q => !primaryIds.has(q.id)));

    if (primaryMatches.length + secondaryMatches.length < count) {
      // Not enough questions in this chapter
      return null;
    }

    selected = [...primaryMatches, ...secondaryMatches.slice(0, remainingNeeded)];
  }

  // Ensure unique IDs and exact requested count
  const finalQuestions = shuffle(selected).slice(0, count).map(q => ({
    id: q.id,
    question: q.question,
    options: q.options.map(o => ({ id: o.id, text: o.text })),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation
  }));

  if (finalQuestions.length !== count) {
    return null;
  }

  return {
    quizId: `local-${normSub}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title: `${normChap} Quiz`,
    subject: normSub,
    chapter: normChap,
    difficulty: normDiff,
    generationMode: "local",
    questions: finalQuestions
  };
}

export function getAllLocalQuestionsCount() {
  return {
    physics: QUESTION_BANK.physics.length,
    chemistry: QUESTION_BANK.chemistry.length,
    mathematics: QUESTION_BANK.mathematics.length
  };
}

/**
 * Guaranteed fallback if specific chapter or difficulty doesn't have enough questions.
 * Pulls questions from the subject pool so quiz generation never hangs or fails.
 */
export function getFallbackQuizFromSubject(subject, chapter, difficulty, count = 5) {
  const normSub = normalizeSubject(subject);
  const normChap = normalizeChapter(chapter) || "General";
  const normDiff = normalizeDifficulty(difficulty) || "medium";

  const pool = QUESTION_BANK[normSub] || QUESTION_BANK.physics || [];
  if (pool.length === 0) return null;

  const shuffled = shuffle(pool);
  const selected = [];
  while (selected.length < count) {
    for (const q of shuffled) {
      if (selected.length < count) {
        selected.push(q);
      }
    }
  }

  const finalQuestions = selected.map((q, idx) => ({
    id: q.id ? `${q.id}-${idx}` : `q-${idx + 1}`,
    question: q.question,
    options: q.options.map(o => ({ id: o.id, text: o.text })),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation
  }));

  return {
    quizId: `local-${normSub}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title: `${normChap} Quiz`,
    subject: normSub,
    chapter: normChap,
    difficulty: normDiff,
    generationMode: "local",
    questions: finalQuestions
  };
}

