import express from "express";
import {
  getDashboard,
  getDashboardStats,
  refreshDashboard
} from "../controllers/dashboardController.js";
const router = express.Router();

router.get('/', getDashboard);
router.get('/stats', getDashboardStats);
router.post('/refresh', refreshDashboard);

export default router;