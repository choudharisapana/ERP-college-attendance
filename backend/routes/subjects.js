// backend/routes/subjects.js
import express from "express";
import { protect, admin } from "../middleware/auth.js";
import {
  getSubjects,
  getSubjectById,
  getMySubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

const router = express.Router();

// ✅ Faculty - Only their subjects
router.get("/subjects", protect, getMySubjects);

// ✅ Admin - All subjects (CRUD)
router.get("/", protect, getSubjects);
router.get("/:id", protect,  getSubjectById);
router.post("/", protect, admin, createSubject);
router.put("/:id", protect, admin, updateSubject);
router.delete("/:id", protect, admin, deleteSubject);

export default router;