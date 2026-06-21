import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationStats,
  markMultipleAsRead,
  deleteAllReadNotifications,
  getNotificationsByType
} from "../controllers/notificationController.js";

const router = express.Router();

// Test route to verify routes are working (no authentication needed)
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Notification routes are working!",
    timestamp: new Date().toISOString()
  });
});

// All notification routes require authentication
router.use(protect);

// Notification routes
router.get("/", getNotifications);
router.get("/stats", getNotificationStats);
router.get("/unread-count", getUnreadCount);
router.get("/type/:type", getNotificationsByType);
router.get("/:id", getNotificationById);

// Update routes
router.put("/read-all", markAllAsRead);
router.put("/read-multiple", markMultipleAsRead);
router.put("/:id/read", markAsRead);

// Delete routes
router.delete("/delete-read", deleteAllReadNotifications);
router.delete("/:id", deleteNotification);

export default router;