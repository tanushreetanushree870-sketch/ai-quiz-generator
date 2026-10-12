import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { ENV } from "./config/environment.js";
import { globalRateLimiter } from "./middleware/rateLimiter.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";

import healthRoutes from "./routes/healthRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

export function createApp() {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // Disable X-Powered-By
  app.disable("x-powered-by");

  // CORS Configuration
  const allowedOrigins = [ENV.CLIENT_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps or curl) or if origin is in allowed list
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Dev-friendly fallback for local testing
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"]
    })
  );

  // Body Parsing with safe limit
  app.use(express.json({ limit: "1mb" }));

  // Request ID and Diagnostics
  app.use(requestIdMiddleware);

  // Global Rate Limiter for API endpoints
  app.use("/api", globalRateLimiter);

  // API Endpoints
  app.use("/api", healthRoutes);
  app.use("/api", configRoutes);
  app.use("/api", quizRoutes);

  // Static files serving from project root & public directory
  app.use(express.static(rootDir, { index: false }));
  app.use("/public", express.static(path.join(rootDir, "public")));

  // Client-side routes fallback (send index.html for /, /quiz, /results)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(rootDir, "index.html"));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
