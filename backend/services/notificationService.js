const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

class NotificationService {
  // Send timetable-related notifications
  async sendTimetableNotification(timetable, action, recipients) {
    const messages = {
      created: 'New timetable has been created and requires your review',
      updated: 'Timetable has been updated',
      approved: 'Timetable has been approved and published',
      conflict: 'Conflict detected in timetable schedule'
    };

    for (const userId of recipients) {
      const notification = await Notification.create({
        user: userId,
        title: `Timetable ${action}`,
        message: `${timetable.title} - ${messages[action]}`,
        type: action === 'conflict' ? 'warning' : 'info',
        category: 'timetable',
        relatedEntity: {
          entityType: 'Timetable',
          entityId: timetable._id
        },
        actionUrl: `/timetables/${timetable._id}`
      });

      // Send email notification if user has email notifications enabled
      const user = await User.findById(userId);
      if (user.preferences.notifications.email) {
        await this.sendEmailNotification(user, notification);
      }
    }
  }

  // Send faculty-related notifications
  async sendFacultyNotification(faculty, action, additionalData = {}) {
    const recipients = await this.getAdminUsers();
    
    for (const user of recipients) {
      const notification = await Notification.create({
        user: user._id,
        title: `Faculty ${action}`,
        message: `${faculty.user.name} - ${this.getFacultyMessage(action, additionalData)}`,
        type: 'info',
        category: 'faculty',
        relatedEntity: {
          entityType: 'Faculty',
          entityId: faculty._id
        }
      });
    }
  }

  // Send system-wide notifications
  async sendSystemNotification(title, message, priority = 'medium') {
    const users = await User.find({ isActive: true });
    
    for (const user of users) {
      await Notification.create({
        user: user._id,
        title,
        message,
        type: 'system',
        category: 'system',
        priority,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }
  }

  // Get admin users for notifications
  async getAdminUsers() {
    return await User.find({ role: 'admin', isActive: true });
  }

  // Send email notification
  async sendEmailNotification(user, notification) {
    const emailTemplate = `
      <h2>${notification.title}</h2>
      <p>${notification.message}</p>
      ${notification.actionUrl ? `<p><a href="${process.env.CLIENT_URL}${notification.actionUrl}">View Details</a></p>` : ''}
      <hr>
      <p><small>This is an automated notification from EduScheduler.</small></p>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `EduScheduler Notification: ${notification.title}`,
      html: emailTemplate
    });
  }

  getFacultyMessage(action, data) {
    const messages = {
      assigned: `assigned to ${data.subject} for ${data.batch}`,
      workload: `workload updated to ${data.workload} hours`,
      unavailable: `marked unavailable for ${data.date}`
    };
    return messages[action] || 'Faculty record updated';
  }
}

module.exports = new NotificationService();