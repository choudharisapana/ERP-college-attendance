import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['Info', 'Warning', 'Success', 'Error', 'Schedule Change', 'System', 'suggestion'],
    default: 'Info'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date
  }],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['Timetable', 'Classroom', 'Faculty', 'Subject', 'Batch', 'Report', 'Suggestion']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  actionUrl: String,
  expiresAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional fields for suggestion system
  category: {
    type: String,
    default: 'general'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
    default: null
  },
  relatedModel: {
    type: String,
    enum: ['Suggestion', 'User', 'Course', 'Assignment', null],
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ 'recipients.user': 1, 'recipients.read': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ createdAt: -1 });

// Helper method to mark notification as read for a specific user
notificationSchema.methods.markAsReadForUser = async function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient && !recipient.read) {
    recipient.read = true;
    recipient.readAt = new Date();
    await this.save();
  }
  return this;
};

// Static method to get unread notifications for a user
notificationSchema.statics.getUnreadForUser = async function(userId) {
  return this.find({
    'recipients.user': userId,
    'recipients.read': false,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to get all notifications for a user (with pagination)
notificationSchema.statics.getForUser = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const notifications = await this.find({
    'recipients.user': userId,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'name email')
  .populate('relatedId');
  
  const total = await this.countDocuments({
    'recipients.user': userId,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
  
  const unreadCount = await this.countDocuments({
    'recipients.user': userId,
    'recipients.read': false,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
  
  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      unreadCount
    }
  };
};

// Static method to create a suggestion notification for admins
notificationSchema.statics.createForAdmins = async function(suggestionData, adminUsers, senderId) {
  if (!adminUsers || adminUsers.length === 0) return [];
  
  const notifications = adminUsers.map(admin => ({
    title: 'New Suggestion Submitted',
    message: `${suggestionData.isAnonymous ? 'Anonymous user' : suggestionData.name} submitted a new ${suggestionData.category?.toLowerCase() || 'suggestion'}: "${suggestionData.suggestion.substring(0, 100)}${suggestionData.suggestion.length > 100 ? '...' : ''}"`,
    type: 'suggestion',
    priority: suggestionData.priority || 'Medium',
    recipients: [{
      user: admin._id,
      read: false
    }],
    sender: senderId,
    relatedEntity: {
      type: 'Suggestion',
      id: suggestionData.suggestionId
    },
    category: suggestionData.category || 'Feature Request',
    relatedId: suggestionData.suggestionId,
    relatedModel: 'Suggestion',
    isActive: true
  }));
  
  return this.insertMany(notifications);
};

// Static method to create a status update notification for user
notificationSchema.statics.createForUser = async function(userId, suggestion, status, adminResponse, senderId) {
  if (!userId) return null;
  
  let statusMessage = "";
  switch (status) {
    case "Under Review":
      statusMessage = "is now under review";
      break;
    case "Implemented":
      statusMessage = "has been implemented! 🎉";
      break;
    case "Pending":
      statusMessage = "is pending review";
      break;
    default:
      statusMessage = `has been marked as ${status}`;
  }

  const notificationMessage = `Your suggestion "${suggestion.suggestion.substring(0, 100)}${suggestion.suggestion.length > 100 ? '...' : ''}" ${statusMessage}${adminResponse ? `\n\nAdmin response: ${adminResponse}` : ''}`;
  
  const notification = new this({
    title: `Suggestion ${status.toUpperCase()}`,
    message: notificationMessage,
    type: 'suggestion',
    priority: 'Medium',
    recipients: [{
      user: userId,
      read: false
    }],
    sender: senderId,
    relatedEntity: {
      type: 'Suggestion',
      id: suggestion._id
    },
    category: suggestion.category,
    relatedId: suggestion._id,
    relatedModel: 'Suggestion',
    isActive: true
  });
  
  return notification.save();
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsReadForUser = async function(userId) {
  return this.updateMany(
    {
      'recipients.user': userId,
      'recipients.read': false
    },
    {
      $set: {
        'recipients.$.read': true,
        'recipients.$.readAt': new Date()
      }
    }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    'recipients.read': true
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;