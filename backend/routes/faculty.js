import express from "express";
import { protect, admin, faculty } from "../middleware/auth.js";
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} from "../controllers/facultyController.js";

const router = express.Router();

router.post("/", protect, admin, createFaculty);
router.put("/:id", protect, admin, updateFaculty);
router.delete("/:id", protect, admin, deleteFaculty);

router.get("/", protect, getAllFaculty);
router.get("/:id", protect, getFacultyById);

export default router;