import { isAiConfigured } from "../config/environment.js";
import { SUBJECTS, ALLOWED_DIFFICULTIES, ALLOWED_QUESTION_COUNTS, getSubjectChapters, isValidSubject } from "../config/subjects.js";
import { quizRequestSchema } from "../schemas/quizRequestSchema.js";
import { quizSubmissionSchema } from "../schemas/quizSubmissionSchema.js";
import { createQuiz, submitQuizAnswers } from "../services/quizService.js";
import { getActiveGeminiRequests } from "../services/geminiService.js";
import { createValidationError } from "../utils/httpErrors.js";

export async function handleGenerateQuiz(req, res, next) {
  try {
    const validatedBody = quizRequestSchema.parse(req.body);
    const quiz = await createQuiz(validatedBody);
    return res.status(200).json(quiz);
  } catch (err) {
    console.error('[Quiz Generation Error]:', err);
    next(err);
  }
}

export async function handleSubmitQuiz(req, res, next) {
  try {
    const validatedBody = quizSubmissionSchema.parse(req.body);
    const result = submitQuizAnswers(validatedBody);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export function handleGetChapters(req, res, next) {
  try {
    const subjectParam = (req.params.subject || "").toLowerCase().trim();
    if (!isValidSubject(subjectParam)) {
      throw createValidationError(`Unsupported subject: '${req.params.subject}'. Allowed subjects: ${Object.keys(SUBJECTS).join(", ")}`);
    }

    const chapters = getSubjectChapters(subjectParam);
    return res.status(200).json({
      subject: subjectParam,
      chapters
    });
  } catch (err) {
    next(err);
  }
}

export function handleGetPublicConfig(req, res) {
  return res.status(200).json({
    subjects: ["Physics", "Chemistry", "Mathematics"],
    difficulties: ALLOWED_DIFFICULTIES,
    questionCounts: ALLOWED_QUESTION_COUNTS,
    aiConfigured: isAiConfigured()
  });
}

export function handleGetQuizHealth(req, res) {
  const aiReady = isAiConfigured();
  const activeReqs = getActiveGeminiRequests();

  let status = "available";
  if (!aiReady) {
    status = "local_only";
  } else if (activeReqs > 0) {
    status = "degraded";
  }

  return res.status(200).json({
    status,
    aiConfigured: aiReady,
    localFallbackAvailable: true
  });
}
