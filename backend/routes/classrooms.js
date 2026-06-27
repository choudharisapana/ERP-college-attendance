// // backend/routes/classrooms.js
// import express from "express";
// import { protect, admin } from "../middleware/auth.js";
// import {
//   getClassrooms,
//   getClassroomById,
//   createClassroom,
//   updateClassroom,
//   deleteClassroom,
// } from "../controllers/classroomController.js";

// const router = express.Router();

// // ✅ Admin - Full Access (CRUD)
// router.post("/", protect, admin, createClassroom);
// router.put("/:id", protect, admin, updateClassroom);
// router.delete("/:id", protect, admin, deleteClassroom);

// // ✅ Faculty & Admin - View Only
// router.get("/", protect, getClassrooms);
// router.get("/:id", protect, getClassroomById);

// export default router;


// backend/routes/classrooms.js
import express from "express";
import { protect, admin } from "../middleware/auth.js";
import {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from "../controllers/classroomController.js";

const router = express.Router();

// ✅ Admin - Full Access (CRUD)
router.post("/", protect, admin, createClassroom);
router.put("/:id", protect, admin, updateClassroom);
router.delete("/:id", protect, admin, deleteClassroom);

// ✅ Faculty & Admin - View Only
router.get("/", protect, getClassrooms);
router.get("/:id", protect, getClassroomById);

export default router;