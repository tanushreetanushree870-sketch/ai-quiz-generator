import { z } from "zod";

export const optionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"], {
    errorMap: () => ({ message: "Option ID must be A, B, C, or D" })
  }),
  text: z.string().trim().min(1, "Option text cannot be empty").max(500, "Option text too long")
});

export const questionSchema = z.object({
  id: z.string().trim().min(1, "Question ID is required"),
  question: z.string().trim().min(5, "Question text must be at least 5 characters").max(1000, "Question text too long"),
  options: z.array(optionSchema).length(4, "Each question must contain exactly 4 options").refine((options) => {
    const ids = options.map(o => o.id);
    return ids.includes("A") && ids.includes("B") && ids.includes("C") && ids.includes("D") && new Set(ids).size === 4;
  }, {
    message: "Options must contain each identifier A, B, C, and D exactly once"
  }),
  correctAnswer: z.enum(["A", "B", "C", "D"], {
    errorMap: () => ({ message: "Correct answer must be A, B, C, or D" })
  }),
  explanation: z.string().trim().min(5, "Explanation must be at least 5 characters").max(1500, "Explanation too long")
});

export const quizGeneratedPayloadSchema = z.object({
  title: z.string().trim().min(3).max(200),
  subject: z.enum(["physics", "chemistry", "mathematics"]),
  chapter: z.string().trim().min(1).max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questions: z.array(questionSchema)
}).refine((data) => {
  const ids = data.questions.map(q => q.id);
  return new Set(ids).size === ids.length;
}, {
  message: "All question IDs within a quiz must be unique"
});

/**
 * Validates generated quiz payload and enforces requested question count.
 */
export function validateGeneratedQuiz(data, expectedCount) {
  const parsed = quizGeneratedPayloadSchema.parse(data);
  if (expectedCount && parsed.questions.length !== expectedCount) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["questions"],
        message: `Expected exactly ${expectedCount} questions, but received ${parsed.questions.length}`
      }
    ]);
  }
  return parsed;
}
