import { z } from "zod";

export const answerSubmissionItemSchema = z.object({
  questionId: z.string().trim().min(1, "questionId is required"),
  selectedAnswer: z.enum(["A", "B", "C", "D"]).nullable().optional()
});

export const quizSubmissionSchema = z.object({
  quizId: z.string().trim().min(1, "quizId is required"),
  answers: z.array(answerSubmissionItemSchema).min(1, "At least one answer entry is required")
}).refine((data) => {
  const ids = data.answers.map(a => a.questionId);
  return new Set(ids).size === ids.length;
}, {
  message: "Submitted answers cannot contain duplicate question IDs"
});
