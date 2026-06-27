// backend/routes/faculty.js
import express from "express";
import { protect, admin } from "../middleware/auth.js";
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} from "../controllers/facultyController.js";

const router = express.Router();

// ✅ Admin - Full Access (CRUD)
router.post("/", protect, admin, createFaculty);
router.put("/:id", protect, admin, updateFaculty);
router.delete("/:id", protect, admin, deleteFaculty);

// ✅ Faculty & Admin - View Only
router.get("/", protect, getAllFaculty);
router.get("/:id", protect, getFacultyById);

export default router;