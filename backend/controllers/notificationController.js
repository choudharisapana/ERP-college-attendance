import Notification from "../models/Notification.js";

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read = null, type = null } = req.query;

    const query = {
      "recipients.user": req.user._id,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    };

    if (read !== null) {
      query["recipients.read"] = read === "true";
    }

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name email")
      .populate("relatedId");

    const total = await Notification.countDocuments(query);

    const unreadCount = await Notification.countDocuments({
      "recipients.user": req.user._id,
      "recipients.read": false,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// @desc    Get single notification by ID
// @route   GET /api/notifications/:id
// @access  Private
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate("sender", "name email")
      .populate("relatedId");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const isRecipient = notification.recipients.some(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (!isRecipient) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this notification",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification",
    });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.markAsReadForUser(req.user._id);

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.markAllAsReadForUser(req.user._id);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

// @desc    Mark multiple notifications as read
// @route   PUT /api/notifications/read-multiple
// @access  Private
export const markMultipleAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Please provide notification IDs array",
      });
    }

    const notifications = await Notification.find({
      _id: { $in: notificationIds },
    });

    for (const notification of notifications) {
      await notification.markAsReadForUser(req.user._id);
    }

    res.json({
      success: true,
      message: `${notifications.length} notifications marked as read`,
    });
  } catch (error) {
    console.error("Error marking multiple notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const isRecipient = notification.recipients.some(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (!isRecipient) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this notification",
      });
    }

    if (notification.recipients.length === 1) {
      await notification.deleteOne();
    } else {
      notification.recipients = notification.recipients.filter(
        (r) => r.user.toString() !== req.user._id.toString(),
      );
      await notification.save();
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/delete-read
// @access  Private
export const deleteAllReadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      "recipients.user": req.user._id,
      "recipients.read": true,
    });

    for (const notification of notifications) {
      if (notification.recipients.length === 1) {
        await notification.deleteOne();
      } else {
        notification.recipients = notification.recipients.filter(
          (r) => r.user.toString() !== req.user._id.toString(),
        );
        await notification.save();
      }
    }

    res.json({
      success: true,
      message: `${notifications.length} read notifications deleted`,
    });
  } catch (error) {
    console.error("Error deleting read notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete read notifications",
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      "recipients.user": req.user._id,
      "recipients.read": false,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStats = async (req, res) => {
  try {
    const total = await Notification.countDocuments({
      "recipients.user": req.user._id,
      isActive: true,
    });

    const unread = await Notification.countDocuments({
      "recipients.user": req.user._id,
      "recipients.read": false,
      isActive: true,
    });

    const read = total - unread;

    const byType = await Notification.aggregate([
      {
        $match: {
          "recipients.user": req.user._id,
          isActive: true,
        },
      },
      { $unwind: "$recipients" },
      { $match: { "recipients.user": req.user._id } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        unread,
        read,
        byType,
      },
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification statistics",
    });
  }
};

// @desc    Get notifications by type
// @route   GET /api/notifications/type/:type
// @access  Private
export const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = {
      "recipients.user": req.user._id,
      type: type,
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name email")
      .populate("relatedId");

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications by type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};