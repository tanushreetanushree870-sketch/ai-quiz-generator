import { ENV } from "../config/environment.js";
import { logger } from "../utils/logger.js";

class BoundedCache {
  constructor(maxEntries = 100, ttlSeconds = 300) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlSeconds * 1000;
    this.store = new Map();
    this.inFlightRequests = new Map();
  }

  generateKey(subject, chapter, difficulty, count) {
    const s = (subject || "").trim().toLowerCase();
    const c = (chapter || "").trim().toLowerCase();
    const d = (difficulty || "").trim().toLowerCase();
    return `quiz:${s}:${c}:${d}:${count}`;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, entry);

    return JSON.parse(JSON.stringify(entry.data));
  }

  set(key, data) {
    if (!key || !data) return;

    // Evict oldest if capacity exceeded
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      data: JSON.parse(JSON.stringify(data)),
      expiresAt: Date.now() + this.ttlMs
    });
  }

  /**
   * In-flight deduplication: wraps a generator function so concurrent callers
   * for the exact same parameters share a single promise.
   */
  async deduplicate(key, generatorFn) {
    if (this.inFlightRequests.has(key)) {
      logger.info(`In-flight deduplication matched for key: ${key}`);
      return this.inFlightRequests.get(key);
    }

    const promise = (async () => {
      try {
        return await generatorFn();
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.store.clear();
    this.inFlightRequests.clear();
  }

  size() {
    return this.store.size;
  }
}

export const quizCache = new BoundedCache(
  ENV.GEMINI_CACHE_TTL_SECONDS ? ENV.GEMINI_CACHE_MAX_ENTRIES : 100,
  ENV.GEMINI_CACHE_TTL_SECONDS || 300
);
