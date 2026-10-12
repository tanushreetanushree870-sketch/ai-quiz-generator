import { Router } from "express";
import { handleGenerateQuiz, handleSubmitQuiz, handleGetQuizHealth } from "../controllers/quizController.js";
import { quizGenerationLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/quiz/generate", quizGenerationLimiter, handleGenerateQuiz);
router.post("/quiz/submit", handleSubmitQuiz);
router.get("/quiz/health", handleGetQuizHealth);

export default router;
