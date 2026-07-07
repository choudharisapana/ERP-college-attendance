import express from 'express';
import {
  getNotes,
  addNote,
  deleteNote,
} from '../controllers/noteController.js';
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get('/', getNotes);

router.post('/', addNote);


router.delete('/:id', deleteNote);


export default router;