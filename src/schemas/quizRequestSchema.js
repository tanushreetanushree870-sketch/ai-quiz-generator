import { z } from "zod";
import { ALLOWED_SUBJECTS, ALLOWED_DIFFICULTIES, ALLOWED_QUESTION_COUNTS } from "../config/subjects.js";
import { sanitizeString } from "../utils/normalizeInput.js";

export const quizRequestSchema = z.object({
  subject: z
    .string({ required_error: "Subject is required" })
    .trim()
    .toLowerCase()
    .refine((val) => ALLOWED_SUBJECTS.includes(val), {
      message: `Subject must be one of: ${ALLOWED_SUBJECTS.join(", ")}`
    }),
  chapter: z
    .string({ required_error: "Chapter is required" })
    .trim()
    .transform((val) => sanitizeString(val, 100))
    .refine((val) => val.length >= 2, {
      message: "Chapter name must contain at least 2 valid characters"
    })
    .refine((val) => val.length <= 100, {
      message: "Chapter name cannot exceed 100 characters"
    }),
  difficulty: z
    .string({ required_error: "Difficulty is required" })
    .trim()
    .toLowerCase()
    .refine((val) => ALLOWED_DIFFICULTIES.includes(val), {
      message: `Difficulty must be one of: ${ALLOWED_DIFFICULTIES.join(", ")}`
    }),
  count: z
    .coerce
    .number({ required_error: "Question count is required" })
    .refine((val) => ALLOWED_QUESTION_COUNTS.includes(val), {
      message: `Question count must be one of: ${ALLOWED_QUESTION_COUNTS.join(", ")}`
    })
}).strict();
