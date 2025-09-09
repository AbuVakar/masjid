// Notification Permission Manager with Role-Based Restrictions
// Handles user/guest/admin notification permissions

export class NotificationPermissionManager {
  constructor() {
    this.permissions = {
      guest: {
        prayer: false,
        jamaat: false,
        info: false,
        clear: false,
        admin: false,
        systemUpdates: false,
        emergencyAlerts: false,
        dataBackup: false,
        communityEvents: false,
        weeklyReports: false,
        monthlyReports: false,
        customReminders: false,
        priorityLevel: 'none', // No notifications for guests
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
        },
      },
      user: {
        prayer: true,
        jamaat: true,
        info: true,
        clear: true,
        admin: false,
        systemUpdates: true,
        emergencyAlerts: true,
        dataBackup: true,
        communityEvents: true,
        weeklyReports: true,
        monthlyReports: true,
        customReminders: true,
        priorityLevel: 'high',
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '06:00',
        },
      },
      admin: {
        prayer: true,
        jamaat: true,
        info: true,
        clear: true,
        admin: true,
        systemUpdates: true,
        emergencyAlerts: true,
        dataBackup: true,
        communityEvents: true,
        weeklyReports: true,
        monthlyReports: true,
        customReminders: true,
        priorityLevel: 'urgent',
        quietHours: {
          enabled: false, // Admins can receive notifications anytime
          start: '22:00',
          end: '06:00',
        },
      },
    };
  }

  // Get permissions for a specific role
  getPermissionsForRole(role = 'guest') {
    return this.permissions[role] || this.permissions.guest;
  }

  // Check if a notification type is allowed for a role
  isNotificationAllowed(role, notificationType, priority = 'normal') {
    const rolePermissions = this.getPermissionsForRole(role);

    // Check if notification type is enabled
    if (!rolePermissions[notificationType]) {
      return false;
    }

    // Check priority level
    const priorityLevel = rolePermissions.priorityLevel;

    // Guest mode has no notifications
    if (priorityLevel === 'none') {
      return false;
    }

    const priorityAllowed =
      priorityLevel === 'urgent' ||
      priorityLevel === priority ||
      (priorityLevel === 'high' &&
        ['low', 'normal', 'high'].includes(priority)) ||
      (priorityLevel === 'normal' && ['low', 'normal'].includes(priority)) ||
      (priorityLevel === 'low' && priority === 'low');

    if (!priorityAllowed) {
      return false;
    }

    // Check quiet hours (except for urgent notifications)
    if (rolePermissions.quietHours.enabled && priority !== 'urgent') {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = rolePermissions.quietHours.start
        .split(':')
        .map(Number);
      const [endHour, endMin] = rolePermissions.quietHours.end
        .split(':')
        .map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime >= startTime || currentTime <= endTime) {
        return false;
      }
    }

    return true;
  }

  // Get notification preferences for a role
  getNotificationPreferences(role, userPrefs = {}) {
    const rolePermissions = this.getPermissionsForRole(role);

    // Merge role permissions with user preferences
    const preferences = {
      all: rolePermissions.priorityLevel !== 'none', // No notifications for guests
      ...rolePermissions,
      ...userPrefs,
    };

    // Ensure role restrictions are enforced
    Object.keys(rolePermissions).forEach((key) => {
      if (rolePermissions[key] === false) {
        preferences[key] = false;
      }
    });

    // Guest mode: disable all notifications
    if (role === 'guest') {
      preferences.all = false;
      Object.keys(preferences).forEach((key) => {
        if (key !== 'priorityLevel' && key !== 'quietHours') {
          preferences[key] = false;
        }
      });
    }

    return preferences;
  }

  // Validate notification request
  validateNotification(role, notificationData) {
    const {
      type = 'general',
      category = 'general',
      priority = 'normal',
      title,
      body,
    } = notificationData;

    // Basic validation
    if (!title || !body) {
      return {
        allowed: false,
        reason: 'Missing title or body',
      };
    }

    // Check if notification is allowed for this role
    const isAllowed = this.isNotificationAllowed(role, category, priority);

    return {
      allowed: isAllowed,
      reason: isAllowed
        ? 'Allowed'
        : `Notification type '${category}' not allowed for role '${role}'`,
      priority: priority,
      category: category,
    };
  }

  // Get available notification types for a role
  getAvailableNotificationTypes(role) {
    const rolePermissions = this.getPermissionsForRole(role);
    const availableTypes = [];

    Object.keys(rolePermissions).forEach((key) => {
      if (
        rolePermissions[key] === true &&
        key !== 'priorityLevel' &&
        key !== 'quietHours'
      ) {
        availableTypes.push(key);
      }
    });

    return availableTypes;
  }

  // Get notification statistics for a role
  getNotificationStats(role) {
    const rolePermissions = this.getPermissionsForRole(role);
    const availableTypes = this.getAvailableNotificationTypes(role);

    return {
      role,
      totalTypes: Object.keys(rolePermissions).length - 2, // Exclude priorityLevel and quietHours
      availableTypes: availableTypes.length,
      priorityLevel: rolePermissions.priorityLevel,
      quietHoursEnabled: rolePermissions.quietHours.enabled,
      quietHours: rolePermissions.quietHours,
    };
  }
}

// Create singleton instance
const notificationPermissionManager = new NotificationPermissionManager();

export default notificationPermissionManager;
