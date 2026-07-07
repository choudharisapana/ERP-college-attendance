import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getSuggestions,
  getSuggestionById,
  createSuggestion,
  upvoteSuggestion,
  updateSuggestionStatus,
  getSuggestionStats,
  getAdminSuggestionNotifications,
  getUserSuggestionNotifications
} from "../controllers/suggestionController.js";

const router = express.Router();
router.get("/", getSuggestions);
router.get("/stats/overview", getSuggestionStats);
router.get("/:id", getSuggestionById);
router.post("/", createSuggestion);
router.post("/:id/upvote", protect, upvoteSuggestion);
router.put("/:id/status", protect, updateSuggestionStatus);
router.get("/admin/notifications", protect, getAdminSuggestionNotifications);
router.get("/my-notifications", protect, getUserSuggestionNotifications);

export default router;