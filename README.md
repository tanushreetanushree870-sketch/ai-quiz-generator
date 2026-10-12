# AI QUIZ MASTER — Intelligent Learning & Quiz Generation Platform

> **"Learn Smarter. Practice Better. Master Every Chapter."**

AI QUIZ MASTER is a production-grade, educational assessment and quiz generation platform built for secondary, higher-secondary, and competitive examination students. It empowers learners to generate tailored, chapter-specific multiple-choice assessments in **Physics**, **Chemistry**, and **Mathematics** using **Google Gemini AI** (`@google/genai`), backed by a high-demand bounded cache and an offline **local verified question bank**.

---

## 🌟 Key Features

1. **Chapter-Level Customization**
   - Curated predefined syllabi for **Physics** (15 chapters), **Chemistry** (14 chapters), and **Mathematics** (18 chapters).
   - Support for custom user-specified topics with validation and AI synthesis.
2. **Pedagogically Calibrated Difficulties**
   - **Easy**: Tests definitions, foundational laws, and direct formula substitutions.
   - **Medium**: Tests conceptual reasoning, multi-step calculations, and interconnected principles.
   - **Hard**: Tests advanced problem-solving, multi-concept synthesis, and deep mathematical reasoning.
3. **Exact Question Count Enforcement**
   - Choose between **5**, **10**, or **20** questions. Strictly validated via Zod schemas.
4. **Dual-Mode Engine & High-Demand Fallback**
   - **Gemini AI Mode**: Generates fresh, curriculum-aligned questions with structured JSON output and automatic repair loops.
   - **Local Question Bank Mode**: Zero-downtime offline fallback seeded with original, verified questions for instant practice even when offline, unconfigured, or rate-limited.
5. **High-Demand Concurrency & Caching Controls**
   - In-flight request deduplication prevents redundant AI calls for identical concurrent requests.
   - Bounded in-memory response cache with configurable TTL (default 300s) and max entries.
   - Global AI concurrency semaphore limit (default max 3 simultaneous requests).
   - API rate limiting via `express-rate-limit`.
6. **Server-Side Answer Key Security**
   - Correct answers and educational explanations remain safely isolated on the server during the quiz attempt.
   - The browser never receives answer keys until `/api/quiz/submit` is processed, preventing client-side DOM inspection cheats.
7. **Instant Scoring & Step-by-Step Rationale**
   - Deterministic server-side evaluation calculates final score, percentage, correct/incorrect/unanswered breakdowns, and full educational solutions.
8. **Interactive, Accessible UI**
   - Pure Vanilla JS, HTML5, and custom responsive CSS.
   - Keyboard accessible, dark-modern glassmorphism aesthetics, glowing accent orbs, question navigation palette, and unanswered-questions modal warnings.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism, CSS Custom Properties), Vanilla JavaScript (ES Modules, Safe DOM textContent APIs).
- **Backend**: Node.js (v20+), Express.js (ES Modules).
- **AI Integration**: Official `@google/genai` SDK.
- **Validation**: Zod (runtime validation of requests, AI responses, and submissions).
- **Security**: Helmet, CORS, Express Rate Limiter, Safe Request ID logger.
- **Testing**: Native Node.js Test Runner (`node:test`, `node:assert/strict`), Supertest.

---

## 📁 Project Directory Structure

```text
quiz-generator/
│
├── index.html                   # Semantic landing page and multi-view shell
├── styles.css                   # Responsive design system & glassmorphism styling
├── app.js                       # Frontend state, navigation, and API controller
├── package.json                 # Scripts and dependencies
├── .env.example                 # Environment variables template
├── .gitignore                   # Excludes node_modules, .env, and logs
├── README.md                    # Project documentation
│
├── public/
│   ├── favicon.svg              # SVG application favicon
│   └── assets/
│       └── logo.svg             # Application brand mark SVG
│
├── src/
│   ├── server.js                # Server entrypoint and graceful shutdown
│   ├── app.js                   # Express application configuration
│   │
│   ├── config/
│   │   ├── subjects.js          # Centralized syllabus & chapter definitions
│   │   └── environment.js       # Safe environment parser and defaults
│   │
│   ├── routes/
│   │   ├── healthRoutes.js      # /api/health endpoint
│   │   ├── configRoutes.js      # /api/config and /api/chapters/:subject
│   │   └── quizRoutes.js        # /api/quiz/generate, /api/quiz/submit, /api/quiz/health
│   │
│   ├── controllers/
│   │   └── quizController.js    # Request handlers and response mapping
│   │
│   ├── services/
│   │   ├── geminiService.js     # @google/genai integration, concurrency, retries, repair
│   │   ├── quizService.js       # Cache lookup, fallback orchestrator, session store
│   │   ├── localQuestionService.js # Question bank filtering & random selection
│   │   ├── cacheService.js      # Bounded cache & in-flight deduplication
│   │   └── scoringService.js    # Deterministic answer evaluation & metrics
│   │
│   ├── schemas/
│   │   ├── quizRequestSchema.js    # Zod schema for quiz configuration
│   │   ├── quizResponseSchema.js   # Zod schema for generated questions
│   │   └── quizSubmissionSchema.js # Zod schema for quiz answer submissions
│   │
│   ├── data/
│   │   ├── physicsQuestions.json   # Seeded verified physics questions
│   │   ├── chemistryQuestions.json # Seeded verified chemistry questions
│   │   └── mathematicsQuestions.json # Seeded verified math questions
│   │
│   ├── middleware/
│   │   ├── rateLimiter.js       # Global and quiz-specific rate limiters
│   │   ├── errorHandler.js      # Centralized error handler (Zod, AppErrors)
│   │   └── requestId.js         # Request ID tagging and logging
│   │
│   └── utils/
│       ├── logger.js            # Safe logger masking sensitive keys
│       ├── normalizeInput.js    # String sanitization and trimming
│       └── httpErrors.js        # Standardized HTTP error definitions
│
├── database/
│   └── schema.sql               # Optional PostgreSQL schema for future persistent storage
│
└── tests/
    ├── quizValidation.test.js      # Unit tests for Zod schemas
    ├── localQuestionService.test.js# Question bank filtering & count tests
    ├── scoringService.test.js      # Deterministic scoring tests
    └── quizApi.test.js             # End-to-end API integration tests
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm**: v9.0.0 or higher.

### 2. Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a local `.env` file by copying `.env.example`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Open `.env` and configure your settings:
```ini
PORT=3000
NODE_ENV=development

# Google Gemini API Key
# Obtain your key from https://aistudio.google.com/
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
GEMINI_TIMEOUT_MS=30000
GEMINI_MAX_RETRIES=2
GEMINI_MAX_CONCURRENT_REQUESTS=3

# Response Caching
GEMINI_CACHE_TTL_SECONDS=300
GEMINI_CACHE_MAX_ENTRIES=100

# Rate Limiting
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX_REQUESTS=10

# Security and Origin
CLIENT_ORIGIN=http://localhost:3000
```

> **Note**: The application works completely without a Gemini API key out of the box by using the verified local question bank!

### 4. Running the Application
Start the production server:
```bash
npm start
```
Or start in development mode with hot-reloading:
```bash
npm run dev
```

Visit the application at: **`http://localhost:3000`**

### 5. Running Automated Tests
Run the comprehensive test suite:
```bash
npm test
```
All 30 automated tests run using Node's native test runner with zero mock dependencies required.

---

## 📡 API Reference

### 1. Health Check
`GET /api/health`
- **Response (200)**:
  ```json
  {
    "status": "ok",
    "service": "AI Quiz Master"
  }
  ```

### 2. Public Configuration
`GET /api/config`
- **Response (200)**:
  ```json
  {
    "subjects": ["Physics", "Chemistry", "Mathematics"],
    "difficulties": ["easy", "medium", "hard"],
    "questionCounts": [5, 10, 20],
    "aiConfigured": false
  }
  ```

### 3. Get Subject Chapters
`GET /api/chapters/:subject`
- **Example**: `GET /api/chapters/physics`
- **Response (200)**:
  ```json
  {
    "subject": "physics",
    "chapters": [
      {
        "id": "units-and-measurements",
        "name": "Units and Measurements",
        "description": "SI units, dimensions, significant figures..."
      }
    ]
  }
  ```

### 4. AI & Service Availability
`GET /api/quiz/health`
- **Response (200)**:
  ```json
  {
    "status": "available", // or "local_only" | "degraded"
    "aiConfigured": true,
    "localFallbackAvailable": true
  }
  ```

### 5. Generate Quiz
`POST /api/quiz/generate`
- **Rate Limit**: 10 requests per minute per IP.
- **Request Body**:
  ```json
  {
    "subject": "physics",
    "chapter": "Motion in a Straight Line",
    "difficulty": "medium",
    "count": 5
  }
  ```
- **Response (200)**:
  ```json
  {
    "quizId": "gemini-1734000000-abc123",
    "title": "Motion in a Straight Line Quiz",
    "subject": "physics",
    "chapter": "Motion in a Straight Line",
    "difficulty": "medium",
    "generationMode": "ai", // "ai" | "cache" | "local"
    "questions": [
      {
        "id": "q1",
        "question": "A particle moves with uniform acceleration...",
        "options": [
          { "id": "A", "text": "10 m/s" },
          { "id": "B", "text": "20 m/s" },
          { "id": "C", "text": "30 m/s" },
          { "id": "D", "text": "40 m/s" }
        ]
      }
    ]
  }
  ```
  *(Notice: correct answers and explanations are omitted on the server for security)*

### 6. Submit Quiz Answers
`POST /api/quiz/submit`
- **Request Body**:
  ```json
  {
    "quizId": "gemini-1734000000-abc123",
    "answers": [
      { "questionId": "q1", "selectedAnswer": "B" },
      { "questionId": "q2", "selectedAnswer": null }
    ]
  }
  ```
- **Response (200)**:
  ```json
  {
    "quizId": "gemini-1734000000-abc123",
    "totalQuestions": 5,
    "correctAnswers": 4,
    "incorrectAnswers": 1,
    "unanswered": 0,
    "percentage": 80,
    "results": [
      {
        "questionId": "q1",
        "question": "A particle moves with uniform acceleration...",
        "options": [...],
        "selectedAnswer": "B",
        "correctAnswer": "B",
        "isCorrect": true,
        "isUnanswered": false,
        "explanation": "Using v = u + at, substituting values yields 20 m/s."
      }
    ]
  }
  ```

---

## 🔒 Security Architecture

1. **Private API Key Isolation**: The Gemini API key is stored strictly server-side in environment variables and is never transmitted to the frontend or exposed in `/api/config`.
2. **Untrusted AI Output Handling**: All AI-generated content is sanitized and inserted into the DOM strictly via `textContent` or text nodes, eliminating Cross-Site Scripting (XSS) risks.
3. **Session Answer Integrity**: Answer keys are retained in a bounded in-memory session store on the server, expiring after 1 hour (`QUIZ_SESSION_TTL_SECONDS`).
4. **Input Sanitization**: User inputs are sanitized to strip non-printable control characters and capped at 100 characters to prevent prompt injection or buffer bloat.
5. **Rate Limiting & Concurrency**: Express rate limiting guards against brute-force attacks, while a global concurrency semaphore prevents exhausting Gemini quotas.

---

## 💡 Troubleshooting & Notes

- **Offline / No API Key**: If `GEMINI_API_KEY` is not provided in `.env`, the server automatically marks `aiConfigured: false` and seamlessly switches to the local question bank. A status badge on the top right shows `"Local Bank Active (Offline)"`.
- **Custom Chapters in Offline Mode**: Custom chapter generation requires an active Gemini API key. If attempting to generate a custom chapter in offline mode, the system returns a descriptive message suggesting selecting a predefined chapter or adding an API key.
- **Port Conflict**: If port 3000 is in use, modify `PORT=3001` in your `.env` file.
