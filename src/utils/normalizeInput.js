/**
 * Sanitizes and normalizes incoming user inputs.
 */

export function sanitizeString(input, maxLength = 100) {
  if (typeof input !== "string") return "";
  // Strip control characters, keep standard unicode letters, numbers, punctuation, spaces
  const cleaned = input.replace(/[\x00-\x1F\x7F]/g, "").trim();
  return cleaned.slice(0, maxLength);
}

export function normalizeSubject(subject) {
  if (typeof subject !== "string") return "";
  return subject.trim().toLowerCase();
}

export function normalizeDifficulty(diff) {
  if (typeof diff !== "string") return "";
  return diff.trim().toLowerCase();
}

export function normalizeChapter(chapter) {
  return sanitizeString(chapter, 100);
}
