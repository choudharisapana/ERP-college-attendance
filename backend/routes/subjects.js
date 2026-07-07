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
router.use((req, res, next) => {
  console.log("SUBJECT ROUTE HIT:", req.method, req.originalUrl);
  next();
});
router.get("/test", (req, res) => {
  res.json({ message: "Subject route working" });
});

router.get("/", protect, getSubjects);
router.get("/:id", protect, getSubjectById);

router.post("/", protect, admin, createSubject);
router.put("/:id", protect, admin, updateSubject);
router.delete("/:id", protect, admin, deleteSubject);

export default router;