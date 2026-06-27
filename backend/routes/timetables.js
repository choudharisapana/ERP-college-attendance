// backend/routes/timetables.js
import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  generateTimetable,
  createTimetable,
  getAllTimetables,
  getTimetableById,
  updateTimetable,
  deleteTimetable,
  checkConflicts,
  publishTimetable,
  addBreak,
  removeBreak
} from '../controllers/timetableController.js';

const router = express.Router();

// ✅ Faculty & Admin - View Only
router.get('/', protect, getAllTimetables);
router.get('/:id', protect, getTimetableById);

// ✅ All authenticated users - Check conflicts (for viewing)
router.post('/check-conflicts', protect, checkConflicts);

// ✅ Admin Only - Create/Update/Delete
router.post('/generate', protect, admin, generateTimetable);
router.post('/', protect, admin, createTimetable);
router.put('/:id', protect, admin, updateTimetable);
router.delete('/:id', protect, admin, deleteTimetable);
router.put('/:id/publish', protect, admin, publishTimetable);

// ✅ Admin Only - Break management
router.post('/:id/breaks', protect, admin, addBreak);
router.delete('/:id/breaks/:breakId', protect, admin, removeBreak);

export default router;