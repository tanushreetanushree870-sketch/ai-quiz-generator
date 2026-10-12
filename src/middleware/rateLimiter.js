import rateLimit from "express-rate-limit";
import { ENV } from "../config/environment.js";

// Global API rate limiter
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many general requests from this IP. Please try again later."
    }
  }
});

// Stricter rate limiter specifically for Quiz Generation
export const quizGenerationLimiter = rateLimit({
  windowMs: ENV.AI_RATE_LIMIT_WINDOW_MS,
  max: ENV.AI_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Quiz generation rate limit exceeded. Please wait a moment before requesting another quiz."
    }
  }
});
