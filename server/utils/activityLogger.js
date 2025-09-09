const ActivityLog = require('../models/ActivityLog');

/**
 * Log user activity to the database
 * @param {string} user - User identifier (e.g., "Admin", "User: Ali")
 * @param {string} role - User role ("admin", "user", "guest")
 * @param {string} action - Action description (e.g., "Added House A", "Deleted Member X")
 * @param {string} details - Additional details (optional)
 * @param {object} req - Express request object (optional, for IP and User-Agent)
 */
const logActivity = async (user, role, action, details = '', req = null) => {
  try {
    const activityData = {
      user: user || 'Unknown',
      role: role || 'guest',
      action: action || 'Unknown Action',
      details: details || '',
    };

    // Add IP address and User-Agent if request object is provided
    if (req) {
      activityData.ipAddress =
        req.ip || req.connection.remoteAddress || 'Unknown';
      activityData.userAgent = req.get('User-Agent') || 'Unknown';
    }

    const activityLog = new ActivityLog(activityData);
    await activityLog.save();

    console.log(`Activity logged: ${user} (${role}) - ${action}`);
    return activityLog;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent breaking the main operation
    return null;
  }
};

/**
 * Get recent activities with pagination
 * @param {number} limit - Number of activities to fetch
 * @param {number} skip - Number of activities to skip
 * @param {object} filters - Filter options (user, role, action)
 */
const getRecentActivities = async (limit = 50, skip = 0, filters = {}) => {
  try {
    const query = {};

    // Apply filters
    if (filters.user) {
      query.user = { $regex: filters.user, $options: 'i' };
    }
    if (filters.role) {
      query.role = filters.role;
    }
    if (filters.action) {
      query.action = { $regex: filters.action, $options: 'i' };
    }

    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await ActivityLog.countDocuments(query);

    return {
      activities,
      total,
      hasMore: skip + activities.length < total,
    };
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Get activity statistics
 */
const getActivityStats = async () => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          roleCounts: {
            $push: '$role',
          },
        },
      },
      {
        $project: {
          totalActivities: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          adminCount: {
            $size: {
              $filter: {
                input: '$roleCounts',
                cond: { $eq: ['$$this', 'admin'] },
              },
            },
          },
          userCount: {
            $size: {
              $filter: {
                input: '$roleCounts',
                cond: { $eq: ['$$this', 'user'] },
              },
            },
          },
          guestCount: {
            $size: {
              $filter: {
                input: '$roleCounts',
                cond: { $eq: ['$$this', 'guest'] },
              },
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalActivities: 0,
        uniqueUserCount: 0,
        adminCount: 0,
        userCount: 0,
        guestCount: 0,
      }
    );
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    throw error;
  }
};

/**
 * Clean up old activity logs (older than specified days)
 * @param {number} days - Number of days to keep
 */
const cleanupOldLogs = async (days = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(`Cleaned up ${result.deletedCount} old activity logs`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
    throw error;
  }
};

/**
 * Clear all activity logs
 * @returns {number} Number of deleted logs
 */
const clearAllLogs = async () => {
  try {
    const result = await ActivityLog.deleteMany({});

    console.log(`Cleared all ${result.deletedCount} activity logs`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing all logs:', error);
    throw error;
  }
};

/**
 * Clear logs by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of deleted logs
 */
const clearLogsByDateRange = async (startDate, endDate) => {
  try {
    const query = {};

    if (startDate && endDate) {
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.timestamp = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.timestamp = { $lte: new Date(endDate) };
    }

    const result = await ActivityLog.deleteMany(query);

    console.log(`Cleared ${result.deletedCount} logs by date range`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing logs by date range:', error);
    throw error;
  }
};

/**
 * Clear logs by user
 * @param {string} username - Username to clear logs for
 * @returns {number} Number of deleted logs
 */
const clearLogsByUser = async (username) => {
  try {
    const result = await ActivityLog.deleteMany({
      user: { $regex: username, $options: 'i' },
    });

    console.log(`Cleared ${result.deletedCount} logs for user: ${username}`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing logs by user:', error);
    throw error;
  }
};

/**
 * Clear logs by action type
 * @param {string} action - Action type to clear
 * @returns {number} Number of deleted logs
 */
const clearLogsByAction = async (action) => {
  try {
    const result = await ActivityLog.deleteMany({
      action: { $regex: action, $options: 'i' },
    });

    console.log(`Cleared ${result.deletedCount} logs for action: ${action}`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing logs by action:', error);
    throw error;
  }
};

/**
 * Clear logs by role
 * @param {string} role - Role to clear logs for
 * @returns {number} Number of deleted logs
 */
const clearLogsByRole = async (role) => {
  try {
    const result = await ActivityLog.deleteMany({ role });

    console.log(`Cleared ${result.deletedCount} logs for role: ${role}`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing logs by role:', error);
    throw error;
  }
};

/**
 * Clear failed actions only
 * @returns {number} Number of deleted logs
 */
const clearFailedActions = async () => {
  try {
    const result = await ActivityLog.deleteMany({
      success: false,
    });

    console.log(`Cleared ${result.deletedCount} failed action logs`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing failed actions:', error);
    throw error;
  }
};

/**
 * Clear logs older than specified days
 * @param {number} days - Number of days to keep
 * @returns {number} Number of deleted logs
 */
const clearLogsOlderThan = async (days) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(`Cleared ${result.deletedCount} logs older than ${days} days`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error clearing old logs:', error);
    throw error;
  }
};

module.exports = {
  logActivity,
  getRecentActivities,
  getActivityStats,
  cleanupOldLogs,
  clearAllLogs,
  clearLogsByDateRange,
  clearLogsByUser,
  clearLogsByAction,
  clearLogsByRole,
  clearFailedActions,
  clearLogsOlderThan,
};
