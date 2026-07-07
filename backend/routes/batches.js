import express from 'express';
import { protect } from "../middleware/auth.js";
import {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchStats,
  addSubjectsToSemester,
  removeSubjectFromSemester,
  getSemesterSubjects
} from '../controllers/batchController.js';

const router = express.Router();

router.get('/', protect, getAllBatches);
router.get('/stats', protect, getBatchStats);
router.get('/:id', protect, getBatchById);

router.post('/', protect, createBatch);
router.put('/:id', protect, updateBatch);
router.delete('/:id', protect, deleteBatch);

router.post(
  '/:id/semesters/:semesterNumber/subjects',
  protect,
  addSubjectsToSemester
);

router.delete(
  '/:id/semesters/:semesterNumber/subjects/:subjectId',
  protect,
  removeSubjectFromSemester
);

router.get(
  '/:id/semesters/:semesterNumber/subjects',
  protect,
  getSemesterSubjects
);
export default router;