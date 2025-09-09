const { enhancedLogger } = require('./logger');
const User = require('../models/User');

/**
 * Admin Notification Service
 * Handles real-time notifications for admin users when important user actions occur
 */
class AdminNotificationService {
  constructor() {
    this.adminSubscribers = new Map(); // Store admin connections
    this.notificationQueue = []; // Queue for notifications
    this.isProcessing = false;
  }

  /**
   * Define which actions are important enough to notify admins
   */
  static getImportantActions() {
    return {
      // High Priority - Critical actions
      CRITICAL: [
        'SECURITY_VIOLATION',
        'ADMIN_LOGIN',
        'ADMIN_LOGOUT',
        'USER_DELETE',
        'HOUSE_DELETE',
        'MEMBER_DELETE',
        'DATA_EXPORT',
        'DATA_IMPORT',
        'SYSTEM_ERROR',
        'BACKUP_CREATE',
        'BACKUP_RESTORE',
      ],

      // Medium Priority - Important actions
      IMPORTANT: [
        'USER_REGISTER',
        'USER_LOGIN',
        'USER_LOGOUT',
        'HOUSE_CREATE',
        'HOUSE_UPDATE',
        'MEMBER_ADD',
        'MEMBER_UPDATE',
        'RESOURCE_UPLOAD',
        'RESOURCE_DELETE',
        'PASSWORD_CHANGE',
        'PROFILE_UPDATE',
        'PRAYER_TIMES_UPDATE',
      ],

      // Low Priority - Regular actions
      REGULAR: ['LOGIN', 'LOGOUT', 'REGISTER', 'PROFILE_UPDATE'],
    };
  }

  /**
   * Check if an action is important enough to notify admins
   */
  static isImportantAction(action, severity = 'LOW') {
    const importantActions = this.getImportantActions();

    // Check critical actions first
    if (importantActions.CRITICAL.includes(action)) {
      return { important: true, priority: 'CRITICAL', level: 'HIGH' };
    }

    // Check important actions
    if (importantActions.IMPORTANT.includes(action)) {
      return { important: true, priority: 'IMPORTANT', level: 'MEDIUM' };
    }

    // Check if severity is high or critical
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      return { important: true, priority: 'SEVERITY_BASED', level: severity };
    }

    return { important: false, priority: 'LOW', level: 'LOW' };
  }

  /**
   * Generate notification message based on action and details
   */
  static generateNotificationMessage(action, details, username, resource) {
    const messages = {
      // Critical Actions
      SECURITY_VIOLATION: `🚨 SECURITY ALERT: ${username} attempted unauthorized action`,
      ADMIN_LOGIN: `👑 Admin ${username} logged in`,
      ADMIN_LOGOUT: `👑 Admin ${username} logged out`,
      USER_DELETE: `🗑️ User account deleted by ${username}`,
      HOUSE_DELETE: `🏠 House deleted by ${username}`,
      MEMBER_DELETE: `👤 Member deleted by ${username}`,
      DATA_EXPORT: `📊 Data exported by ${username}`,
      DATA_IMPORT: `📥 Data imported by ${username}`,
      SYSTEM_ERROR: `❌ System error occurred`,
      BACKUP_CREATE: `💾 Backup created by ${username}`,
      BACKUP_RESTORE: `🔄 Backup restored by ${username}`,

      // Important Actions
      USER_REGISTER: `📝 New user registered: ${details?.username || 'Unknown'}`,
      USER_LOGIN: `🔐 User ${username} logged in`,
      USER_LOGOUT: `🔓 User ${username} logged out`,
      HOUSE_CREATE: `🏠 New house created by ${username}`,
      HOUSE_UPDATE: `✏️ House updated by ${username}`,
      MEMBER_ADD: `➕ Member added by ${username}`,
      MEMBER_UPDATE: `✏️ Member updated by ${username}`,
      RESOURCE_UPLOAD: `📁 Resource uploaded by ${username}`,
      RESOURCE_DELETE: `🗑️ Resource deleted by ${username}`,
      PASSWORD_CHANGE: `🔑 Password changed by ${username}`,
      PROFILE_UPDATE: `👤 Profile updated by ${username}`,
      PRAYER_TIMES_UPDATE: `🕌 Prayer times updated by ${username}`,

      // Default
      DEFAULT: `📋 Action performed by ${username}: ${action}`,
    };

    return messages[action] || messages['DEFAULT'];
  }

  /**
   * Add admin subscriber for real-time notifications
   */
  addAdminSubscriber(adminId, connection) {
    this.adminSubscribers.set(adminId, {
      connection,
      lastSeen: new Date(),
      notifications: [],
    });

    enhancedLogger.info(`Admin ${adminId} subscribed to notifications`);
  }

  /**
   * Remove admin subscriber
   */
  removeAdminSubscriber(adminId) {
    this.adminSubscribers.delete(adminId);
    enhancedLogger.info(`Admin ${adminId} unsubscribed from notifications`);
  }

  /**
   * Send notification to all admin users
   */
  async sendAdminNotification(notification) {
    try {
      // Get all admin users
      const adminUsers = await User.find({ role: 'admin', isActive: true });

      if (adminUsers.length === 0) {
        enhancedLogger.warn('No admin users found for notification');
        return;
      }

      // Add to queue for processing
      this.notificationQueue.push({
        ...notification,
        timestamp: new Date(),
        adminUsers: adminUsers.map((admin) => admin._id.toString()),
      });

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processNotificationQueue();
      }

      enhancedLogger.info(`Admin notification queued: ${notification.message}`);
    } catch (error) {
      enhancedLogger.error('Failed to send admin notification', {
        error: error.message,
        notification,
      });
    }
  }

  /**
   * Process notification queue
   */
  async processNotificationQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();

        // Send to all admin subscribers
        for (const [adminId, subscriber] of this.adminSubscribers) {
          try {
            if (
              subscriber.connection &&
              subscriber.connection.readyState === 1
            ) {
              subscriber.connection.send(
                JSON.stringify({
                  type: 'ADMIN_NOTIFICATION',
                  data: notification,
                }),
              );

              // Update last seen
              subscriber.lastSeen = new Date();
              subscriber.notifications.push(notification);

              // Keep only last 100 notifications
              if (subscriber.notifications.length > 100) {
                subscriber.notifications = subscriber.notifications.slice(-100);
              }
            }
          } catch (error) {
            enhancedLogger.error(
              `Failed to send notification to admin ${adminId}`,
              {
                error: error.message,
              },
            );

            // Remove disconnected subscriber
            this.removeAdminSubscriber(adminId);
          }
        }

        // Small delay to prevent overwhelming
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      enhancedLogger.error('Error processing notification queue', {
        error: error.message,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get admin notification statistics
   */
  getNotificationStats() {
    return {
      activeSubscribers: this.adminSubscribers.size,
      queueLength: this.notificationQueue.length,
      isProcessing: this.isProcessing,
      totalNotifications:
        this.notificationQueue.length +
        Array.from(this.adminSubscribers.values()).reduce(
          (total, sub) => total + sub.notifications.length,
          0,
        ),
    };
  }

  /**
   * Clear old notifications (keep last 24 hours)
   */
  clearOldNotifications() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [adminId, subscriber] of this.adminSubscribers) {
      subscriber.notifications = subscriber.notifications.filter(
        (notification) => new Date(notification.timestamp) > cutoffTime,
      );
    }

    enhancedLogger.info('Old notifications cleared');
  }
}

// Create singleton instance
const adminNotificationService = new AdminNotificationService();

// Clear old notifications every hour
setInterval(
  () => {
    adminNotificationService.clearOldNotifications();
  },
  60 * 60 * 1000,
);

module.exports = {
  AdminNotificationService,
  adminNotificationService,
};
