-- AI QUIZ MASTER
-- Optional PostgreSQL Schema for Production Persistence
-- Note: The initial version runs purely in-memory with local question banks.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    subject TEXT NOT NULL
        CHECK (subject IN ('physics', 'chemistry', 'mathematics')),

    chapter_id TEXT NOT NULL,
    chapter_name TEXT NOT NULL,

    difficulty TEXT NOT NULL
        CHECK (difficulty IN ('easy', 'medium', 'hard')),

    question_text TEXT NOT NULL,

    options JSONB NOT NULL
        CHECK (jsonb_typeof(options) = 'array'),

    correct_answer TEXT NOT NULL
        CHECK (correct_answer IN ('A', 'B', 'C', 'D')),

    explanation TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT question_bank_options_count
        CHECK (jsonb_array_length(options) = 4)
);

CREATE INDEX IF NOT EXISTS idx_question_bank_lookup
    ON question_bank (subject, chapter_id, difficulty);

CREATE INDEX IF NOT EXISTS idx_question_bank_created_at
    ON question_bank (created_at DESC);

-- Optional Quiz History Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id TEXT NOT NULL,

    subject TEXT NOT NULL
        CHECK (subject IN ('physics', 'chemistry', 'mathematics')),

    chapter_name TEXT NOT NULL,

    difficulty TEXT NOT NULL
        CHECK (difficulty IN ('easy', 'medium', 'hard')),

    total_questions INTEGER NOT NULL
        CHECK (total_questions IN (5, 10, 20)),

    correct_answers INTEGER NOT NULL DEFAULT 0
        CHECK (correct_answers >= 0),

    score_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (score_percentage >= 0 AND score_percentage <= 100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session
    ON quiz_attempts (session_id, created_at DESC);
