import "dotenv/config";
import { createApp } from "./app.js";
import { ENV, isAiConfigured } from "./config/environment.js";
import { logger } from "./utils/logger.js";
import { getAllLocalQuestionsCount } from "./services/localQuestionService.js";

const app = createApp();

const server = app.listen(ENV.PORT, () => {
  const counts = getAllLocalQuestionsCount();
  logger.info(`========================================================`);
  logger.info(` AI QUIZ MASTER - Intelligent Learning Platform`);
  logger.info(` Server active on: http://localhost:${ENV.PORT}`);
  logger.info(` Environment: ${ENV.NODE_ENV}`);
  logger.info(` Gemini AI Configured: ${isAiConfigured() ? "YES (" + ENV.GEMINI_MODEL + ")" : "NO (Operating in Local Question Bank fallback mode)"}`);
  logger.info(` Local Question Bank Loaded: Physics (${counts.physics}), Chemistry (${counts.chemistry}), Mathematics (${counts.mathematics})`);
  logger.info(`========================================================`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received. Closing HTTP server...");
  server.close(() => {
    logger.info("HTTP server closed successfully.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received. Closing HTTP server...");
  server.close(() => {
    logger.info("HTTP server closed successfully.");
    process.exit(0);
  });
});