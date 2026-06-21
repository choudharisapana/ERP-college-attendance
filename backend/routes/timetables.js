import express from 'express';
const router = express.Router();
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

// All timetables routes
router.get('/', getAllTimetables);
router.get('/:id', getTimetableById);
router.post('/check-conflicts', checkConflicts);
router.post('/generate', generateTimetable);
router.post('/', createTimetable);
router.put('/:id', updateTimetable);
router.delete('/:id', deleteTimetable);
router.put('/:id/publish', publishTimetable);

// Break management routes
router.post('/:id/breaks', addBreak);
router.delete('/:id/breaks/:breakId', removeBreak);

export default router;