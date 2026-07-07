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

router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Notification routes are working!",
    timestamp: new Date().toISOString()
  });
});

router.use(protect);

router.get("/", getNotifications);
router.get("/stats", getNotificationStats);
router.get("/unread-count", getUnreadCount);
router.get("/type/:type", getNotificationsByType);
router.get("/:id", getNotificationById);

router.put("/read-all", markAllAsRead);
router.put("/read-multiple", markMultipleAsRead);
router.put("/:id/read", markAsRead);

router.delete("/delete-read", deleteAllReadNotifications);
router.delete("/:id", deleteNotification);

export default router;