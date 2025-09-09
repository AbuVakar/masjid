const mongoose = require('mongoose');
const { enhancedLogger } = require('./logger');
const {
  adminNotificationService,
  AdminNotificationService,
} = require('./adminNotificationService');

/**
 * Audit Log Schema
 */
const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allow anonymous actions
    },
    username: {
      type: String,
      required: false,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'REGISTER',
        'PASSWORD_CHANGE',
        'PROFILE_UPDATE',
        'HOUSE_CREATE',
        'HOUSE_UPDATE',
        'HOUSE_DELETE',
        'MEMBER_ADD',
        'MEMBER_UPDATE',
        'MEMBER_DELETE',
        'RESOURCE_UPLOAD',
        'RESOURCE_DELETE',
        'DATA_EXPORT',
        'DATA_IMPORT',
        'ADMIN_ACTION',
        'SECURITY_VIOLATION',
        'SYSTEM_ERROR',
      ],
    },
    resource: {
      type: String,
      required: true,
      enum: ['USER', 'HOUSE', 'MEMBER', 'RESOURCE', 'SYSTEM', 'AUTH'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    errorMessage: {
      type: String,
      required: false,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
  },
  {
    timestamps: true,
  },
);

// Index for better query performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Audit Logger Class
 */
class AuditLogger {
  /**
   * Log an audit event
   * @param {Object} options - Audit log options
   */
  static async log(options) {
    try {
      const {
        userId,
        username,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        success = true,
        errorMessage,
        severity = 'LOW',
      } = options;

      const auditEntry = new AuditLog({
        userId,
        username,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        success,
        errorMessage,
        severity,
      });

      await auditEntry.save();

      // Check if this action should trigger admin notification
      const importanceCheck = AdminNotificationService.isImportantAction(
        action,
        severity,
      );

      if (importanceCheck.important) {
        try {
          const notificationMessage =
            AdminNotificationService.generateNotificationMessage(
              action,
              details,
              username || 'anonymous',
              resource,
            );

          await adminNotificationService.sendAdminNotification({
            id: auditEntry._id.toString(),
            action,
            resource,
            username: username || 'anonymous',
            message: notificationMessage,
            details,
            severity,
            priority: importanceCheck.priority,
            level: importanceCheck.level,
            timestamp: auditEntry.timestamp,
            success,
          });
        } catch (notificationError) {
          enhancedLogger.error('Failed to send admin notification', {
            error: notificationError.message,
            auditEntry: auditEntry._id,
          });
        }
      }

      // Also log to console for development
      if (process.env.NODE_ENV === 'development') {
        const logMessage = `AUDIT: ${action} on ${resource} by ${username || 'anonymous'} - ${success ? 'SUCCESS' : 'FAILED'}`;
        if (success) {
          enhancedLogger.info(logMessage, { auditEntry });
        } else {
          enhancedLogger.error(logMessage, { auditEntry, errorMessage });
        }
      }

      return auditEntry;
    } catch (error) {
      enhancedLogger.error('Audit logging failed', {
        error: error.message,
        options,
      });
      // Don't throw error to prevent breaking the main application flow
    }
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    userId,
    username,
    action,
    ipAddress,
    userAgent,
    success = true,
    errorMessage = null,
  ) {
    return this.log({
      userId,
      username,
      action,
      resource: 'AUTH',
      ipAddress,
      userAgent,
      success,
      errorMessage,
      severity: success ? 'LOW' : 'HIGH',
    });
  }

  /**
   * Log house operations
   */
  static async logHouseEvent(
    userId,
    username,
    action,
    houseId,
    details,
    ipAddress,
    userAgent,
    success = true,
    errorMessage = null,
  ) {
    return this.log({
      userId,
      username,
      action,
      resource: 'HOUSE',
      resourceId: houseId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      severity: action.includes('DELETE') ? 'HIGH' : 'MEDIUM',
    });
  }

  /**
   * Log member operations
   */
  static async logMemberEvent(
    userId,
    username,
    action,
    memberId,
    houseId,
    details,
    ipAddress,
    userAgent,
    success = true,
    errorMessage = null,
  ) {
    return this.log({
      userId,
      username,
      action,
      resource: 'MEMBER',
      resourceId: memberId,
      details: { ...details, houseId },
      ipAddress,
      userAgent,
      success,
      errorMessage,
      severity: action.includes('DELETE') ? 'HIGH' : 'MEDIUM',
    });
  }

  /**
   * Log security violations
   */
  static async logSecurityViolation(
    username,
    action,
    details,
    ipAddress,
    userAgent,
    errorMessage,
  ) {
    return this.log({
      username,
      action: 'SECURITY_VIOLATION',
      resource: 'SYSTEM',
      details,
      ipAddress,
      userAgent,
      success: false,
      errorMessage,
      severity: 'CRITICAL',
    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const query = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.action) query.action = filters.action;
      if (filters.resource) query.resource = filters.resource;
      if (filters.severity) query.severity = filters.severity;
      if (filters.success !== undefined) query.success = filters.success;
      if (filters.startDate)
        query.timestamp = { $gte: new Date(filters.startDate) };
      if (filters.endDate) {
        if (query.timestamp) {
          query.timestamp.$lte = new Date(filters.endDate);
        } else {
          query.timestamp = { $lte: new Date(filters.endDate) };
        }
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'username name email')
          .lean(),
        AuditLog.countDocuments(query),
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      enhancedLogger.error('Failed to get audit logs', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Clean up old audit logs (keep last 90 days)
   */
  static async cleanupOldLogs() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      enhancedLogger.info(`Cleaned up ${result.deletedCount} old audit logs`);
      return result.deletedCount;
    } catch (error) {
      enhancedLogger.error('Failed to cleanup old audit logs', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = {
  AuditLog,
  AuditLogger,
};
