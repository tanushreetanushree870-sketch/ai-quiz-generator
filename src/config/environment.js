import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  GEMINI_TIMEOUT_MS: parseInt(process.env.GEMINI_TIMEOUT_MS || "30000", 10),
  GEMINI_MAX_RETRIES: parseInt(process.env.GEMINI_MAX_RETRIES || "2", 10),
  GEMINI_MAX_CONCURRENT_REQUESTS: parseInt(process.env.GEMINI_MAX_CONCURRENT_REQUESTS || "3", 10),

  // Caching
  GEMINI_CACHE_TTL_SECONDS: parseInt(process.env.GEMINI_CACHE_TTL_SECONDS || "300", 10),
  GEMINI_CACHE_MAX_ENTRIES: parseInt(process.env.GEMINI_CACHE_MAX_ENTRIES || "100", 10),

  // Rate Limiting
  AI_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || "60000", 10),
  AI_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || "10", 10),

  // CORS
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:3000",

  // Quiz Sessions
  QUIZ_SESSION_TTL_SECONDS: parseInt(process.env.QUIZ_SESSION_TTL_SECONDS || "3600", 10),
  QUIZ_SESSION_MAX_ENTRIES: parseInt(process.env.QUIZ_SESSION_MAX_ENTRIES || "1000"),

  // Supabase
  SUPABASE_URL: (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim(),
  SUPABASE_ANON_KEY: (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim(),
  SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
};

export const isAiConfigured = () => Boolean(
  ENV.GEMINI_API_KEY &&
  ENV.GEMINI_API_KEY.length > 10 &&
  !ENV.GEMINI_API_KEY.includes("PASTE_YOUR_GEMINI_API_KEY_HERE") &&
  !ENV.GEMINI_API_KEY.includes("your_gemini_api_key_here")
);
