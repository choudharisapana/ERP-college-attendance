import express from 'express';
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

router.get('/', getAllBatches);
router.get('/stats', getBatchStats);
router.get('/:id', getBatchById);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);
router.post('/:id/semesters/:semesterNumber/subjects', addSubjectsToSemester);
router.delete('/:id/semesters/:semesterNumber/subjects/:subjectId', removeSubjectFromSemester);
router.get('/:id/semesters/:semesterNumber/subjects', getSemesterSubjects);

export default router;