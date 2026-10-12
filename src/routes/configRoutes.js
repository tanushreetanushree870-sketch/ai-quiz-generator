import { Router } from "express";
import { handleGetPublicConfig, handleGetChapters } from "../controllers/quizController.js";

const router = Router();

router.get("/config", handleGetPublicConfig);
router.get("/chapters/:subject", handleGetChapters);

export default router;
