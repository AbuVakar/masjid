/**
 * Notification History Service
 * Manages notification history storage and retrieval using localStorage
 */
class NotificationHistoryService {
  constructor() {
    this.storageKey = 'adminNotificationHistory';
    this.maxHistorySize = 1000; // Maximum number of notifications to store
    this.history = this.loadHistory();
  }

  /**
   * Load history from localStorage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notification history:', error);
      return [];
    }
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('Error saving notification history:', error);
      // If storage is full, try to clear old entries
      this.clearOldEntries();
    }
  }

  /**
   * Add notification to history
   */
  addNotification(notification) {
    const historyEntry = {
      ...notification,
      id: notification.id || Date.now().toString(),
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false,
      archived: false,
      historyId: Date.now().toString(),
    };

    // Add to beginning of array (newest first)
    this.history.unshift(historyEntry);

    // Maintain maximum size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }

    this.saveHistory();
    return historyEntry;
  }

  /**
   * Mark notification as read
   */
  markAsRead(historyId) {
    const notification = this.history.find((n) => n.historyId === historyId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      this.saveHistory();
    }
  }

  /**
   * Mark notification as unread
   */
  markAsUnread(historyId) {
    const notification = this.history.find((n) => n.historyId === historyId);
    if (notification) {
      notification.read = false;
      delete notification.readAt;
      this.saveHistory();
    }
  }

  /**
   * Archive notification
   */
  archiveNotification(historyId) {
    const notification = this.history.find((n) => n.historyId === historyId);
    if (notification) {
      notification.archived = true;
      notification.archivedAt = new Date().toISOString();
      this.saveHistory();
    }
  }

  /**
   * Unarchive notification
   */
  unarchiveNotification(historyId) {
    const notification = this.history.find((n) => n.historyId === historyId);
    if (notification) {
      notification.archived = false;
      delete notification.archivedAt;
      this.saveHistory();
    }
  }

  /**
   * Delete notification from history
   */
  deleteNotification(historyId) {
    this.history = this.history.filter((n) => n.historyId !== historyId);
    this.saveHistory();
  }

  /**
   * Get all notifications with optional filters
   */
  getNotifications(filters = {}) {
    let filtered = [...this.history];

    // Apply filters
    if (filters.archived !== undefined) {
      filtered = filtered.filter((n) => n.archived === filters.archived);
    }

    if (filters.read !== undefined) {
      filtered = filtered.filter((n) => n.read === filters.read);
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((n) => filters.priority.includes(n.priority));
    }

    if (filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter((n) => filters.severity.includes(n.severity));
    }

    if (filters.users && filters.users.length > 0) {
      filtered = filtered.filter((n) => filters.users.includes(n.username));
    }

    if (filters.actions && filters.actions.length > 0) {
      filtered = filtered.filter((n) => filters.actions.includes(n.action));
    }

    if (filters.resources && filters.resources.length > 0) {
      filtered = filtered.filter((n) => filters.resources.includes(n.resource));
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        filtered = filtered.filter(
          (n) => new Date(n.timestamp) >= filters.dateRange.start,
        );
      }
      if (filters.dateRange.end) {
        filtered = filtered.filter(
          (n) => new Date(n.timestamp) <= filters.dateRange.end,
        );
      }
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return filtered;
  }

  /**
   * Get notification statistics
   */
  getStats() {
    const total = this.history.length;
    const read = this.history.filter((n) => n.read).length;
    const unread = total - read;
    const archived = this.history.filter((n) => n.archived).length;
    const active = total - archived;

    // Priority breakdown
    const priorityStats = {};
    this.history.forEach((n) => {
      priorityStats[n.priority] = (priorityStats[n.priority] || 0) + 1;
    });

    // Severity breakdown
    const severityStats = {};
    this.history.forEach((n) => {
      severityStats[n.severity] = (severityStats[n.severity] || 0) + 1;
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = this.history.filter(
      (n) => new Date(n.timestamp) >= sevenDaysAgo,
    ).length;

    return {
      total,
      read,
      unread,
      archived,
      active,
      recent,
      priorityStats,
      severityStats,
    };
  }

  /**
   * Clear old entries to free up space
   */
  clearOldEntries() {
    // Keep only the most recent 500 entries
    this.history = this.history.slice(0, 500);
    this.saveHistory();
  }

  /**
   * Clear all history
   */
  clearAll() {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Export history as JSON
   */
  exportHistory() {
    return {
      exportDate: new Date().toISOString(),
      totalCount: this.history.length,
      notifications: this.history,
    };
  }

  /**
   * Import history from JSON
   */
  importHistory(data) {
    try {
      if (data.notifications && Array.isArray(data.notifications)) {
        // Merge with existing history, avoiding duplicates
        const existingIds = new Set(this.history.map((n) => n.historyId));
        const newNotifications = data.notifications.filter(
          (n) => !existingIds.has(n.historyId),
        );

        this.history = [...newNotifications, ...this.history];

        // Maintain maximum size
        if (this.history.length > this.maxHistorySize) {
          this.history = this.history.slice(0, this.maxHistorySize);
        }

        this.saveHistory();
        return { success: true, imported: newNotifications.length };
      }
      return { success: false, error: 'Invalid data format' };
    } catch (error) {
      console.error('Error importing history:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search notifications
   */
  searchNotifications(query) {
    if (!query || query.trim() === '') {
      return this.history;
    }

    const searchTerm = query.toLowerCase();
    return this.history.filter((notification) => {
      return (
        notification.message?.toLowerCase().includes(searchTerm) ||
        notification.username?.toLowerCase().includes(searchTerm) ||
        notification.action?.toLowerCase().includes(searchTerm) ||
        notification.resource?.toLowerCase().includes(searchTerm) ||
        notification.priority?.toLowerCase().includes(searchTerm) ||
        notification.severity?.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * Get notifications by date range
   */
  getNotificationsByDateRange(startDate, endDate) {
    return this.history.filter((notification) => {
      const notificationDate = new Date(notification.timestamp);
      return notificationDate >= startDate && notificationDate <= endDate;
    });
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return this.history.filter((n) => !n.read && !n.archived).length;
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.history.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
      }
    });
    this.saveHistory();
  }

  /**
   * Mark all as unread
   */
  markAllAsUnread() {
    this.history.forEach((notification) => {
      notification.read = false;
      delete notification.readAt;
    });
    this.saveHistory();
  }
}

// Create singleton instance
const notificationHistoryService = new NotificationHistoryService();

export default notificationHistoryService;
