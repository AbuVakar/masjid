import React, { useState, useEffect } from 'react';
import {
  FaHistory,
  FaSearch,
  FaDownload,
  FaUpload,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaArchive,
  FaInbox,
  FaCheck,
  FaTimes,
  FaFilter,
  FaCalendar,
  FaUser,
  FaCog,
} from 'react-icons/fa';
import notificationHistoryService from '../utils/notificationHistory';
import './NotificationHistory.css';

/**
 * Notification History Component
 * Displays and manages notification history with search and filtering
 */
const NotificationHistory = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    archived: false,
    read: undefined,
    priority: [],
    severity: [],
  });
  const [stats, setStats] = useState({});
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // all, unread, archived

  // Load notifications and stats
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadStats();
    }
  }, [isOpen, filters, viewMode]);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...notifications];

    // Apply view mode filter
    if (viewMode === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (viewMode === 'archived') {
      filtered = filtered.filter((n) => n.archived);
    } else if (viewMode === 'all') {
      filtered = filtered.filter((n) => !n.archived);
    }

    // Apply search
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter((notification) => {
        return (
          notification.message?.toLowerCase().includes(searchTerm) ||
          notification.username?.toLowerCase().includes(searchTerm) ||
          notification.action?.toLowerCase().includes(searchTerm) ||
          notification.resource?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply additional filters
    if (filters.read !== undefined) {
      filtered = filtered.filter((n) => n.read === filters.read);
    }

    if (filters.priority.length > 0) {
      filtered = filtered.filter((n) => filters.priority.includes(n.priority));
    }

    if (filters.severity.length > 0) {
      filtered = filtered.filter((n) => filters.severity.includes(n.severity));
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, filters, viewMode]);

  const loadNotifications = () => {
    const historyNotifications = notificationHistoryService.getNotifications();
    setNotifications(historyNotifications);
  };

  const loadStats = () => {
    const historyStats = notificationHistoryService.getStats();
    setStats(historyStats);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedNotifications([]);
  };

  const handleSelectNotification = (historyId) => {
    setSelectedNotifications((prev) => {
      if (prev.includes(historyId)) {
        return prev.filter((id) => id !== historyId);
      } else {
        return [...prev, historyId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.historyId));
    }
  };

  const handleMarkAsRead = (historyId) => {
    notificationHistoryService.markAsRead(historyId);
    loadNotifications();
    loadStats();
  };

  const handleMarkAsUnread = (historyId) => {
    notificationHistoryService.markAsUnread(historyId);
    loadNotifications();
    loadStats();
  };

  const handleArchive = (historyId) => {
    notificationHistoryService.archiveNotification(historyId);
    loadNotifications();
    loadStats();
  };

  const handleUnarchive = (historyId) => {
    notificationHistoryService.unarchiveNotification(historyId);
    loadNotifications();
    loadStats();
  };

  const handleDelete = (historyId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      notificationHistoryService.deleteNotification(historyId);
      loadNotifications();
      loadStats();
    }
  };

  const handleBulkAction = (action) => {
    if (selectedNotifications.length === 0) {
      alert('Please select notifications first');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to ${action} ${selectedNotifications.length} notification(s)?`,
      )
    ) {
      selectedNotifications.forEach((historyId) => {
        switch (action) {
          case 'read':
            notificationHistoryService.markAsRead(historyId);
            break;
          case 'unread':
            notificationHistoryService.markAsUnread(historyId);
            break;
          case 'archive':
            notificationHistoryService.archiveNotification(historyId);
            break;
          case 'unarchive':
            notificationHistoryService.unarchiveNotification(historyId);
            break;
          case 'delete':
            notificationHistoryService.deleteNotification(historyId);
            break;
        }
      });

      setSelectedNotifications([]);
      loadNotifications();
      loadStats();
    }
  };

  const handleExport = () => {
    const exportData = notificationHistoryService.exportHistory();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const result = notificationHistoryService.importHistory(data);
          if (result.success) {
            alert(`Successfully imported ${result.imported} notifications`);
            loadNotifications();
            loadStats();
          } else {
            alert(`Import failed: ${result.error}`);
          }
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all notification history? This action cannot be undone.',
      )
    ) {
      notificationHistoryService.clearAll();
      loadNotifications();
      loadStats();
      setSelectedNotifications([]);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'priority-critical';
      case 'IMPORTANT':
        return 'priority-important';
      default:
        return 'priority-regular';
    }
  };

  if (!isOpen) return null;

  return (
    <div className='notification-history-modal'>
      <div className='history-modal-content'>
        <div className='history-header'>
          <div className='header-left'>
            <FaHistory className='header-icon' />
            <h2>Notification History</h2>
            <div className='stats-summary'>
              <span className='stat-item'>
                <FaInbox /> {stats.total || 0} Total Notifications
              </span>
              <span className='stat-item'>
                <FaEyeSlash /> {stats.unread || 0} Unread
              </span>
              <span className='stat-item'>
                <FaArchive /> {stats.archived || 0} Archived
              </span>
            </div>
          </div>
          <button className='close-btn' onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className='history-toolbar'>
          {/* Search */}
          <div className='search-box'>
            <FaSearch className='search-icon' />
            <input
              type='text'
              placeholder='Search notifications...'
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* View Mode Tabs */}
          <div className='view-mode-tabs'>
            <button
              className={`tab-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('all')}
            >
              <FaInbox /> All
            </button>
            <button
              className={`tab-btn ${viewMode === 'unread' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('unread')}
            >
              <FaEyeSlash /> Unread
            </button>
            <button
              className={`tab-btn ${viewMode === 'archived' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('archived')}
            >
              <FaArchive /> Archived
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className='bulk-actions'>
              <span className='selected-count'>
                {selectedNotifications.length} selected
              </span>
              <button
                className='bulk-btn'
                onClick={() => handleBulkAction('read')}
                title='Mark as read'
              >
                <FaCheck />
              </button>
              <button
                className='bulk-btn'
                onClick={() => handleBulkAction('unread')}
                title='Mark as unread'
              >
                <FaEyeSlash />
              </button>
              <button
                className='bulk-btn'
                onClick={() => handleBulkAction('archive')}
                title='Archive'
              >
                <FaArchive />
              </button>
              <button
                className='bulk-btn delete'
                onClick={() => handleBulkAction('delete')}
                title='Delete'
              >
                <FaTrash />
              </button>
            </div>
          )}

          {/* Export/Import */}
          <div className='history-actions'>
            <button
              className='action-btn'
              onClick={handleExport}
              title='Export notification history as JSON file'
            >
              <FaDownload />
            </button>
            <label
              className='action-btn'
              title='Import notification history from exported JSON file'
            >
              <FaUpload />
              <input
                type='file'
                accept='.json'
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            <button
              className='action-btn delete'
              onClick={handleClearAll}
              title='Clear All'
            >
              <FaTrash />
            </button>
          </div>
        </div>

        <div className='history-content'>
          {filteredNotifications.length === 0 ? (
            <div className='empty-state'>
              <FaHistory className='empty-icon' />
              <p>No notifications found</p>
              {searchQuery && (
                <button
                  className='clear-search-btn'
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className='notifications-list'>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.historyId}
                  className={`history-item ${notification.read ? 'read' : 'unread'} ${notification.archived ? 'archived' : ''}`}
                >
                  <div className='item-checkbox'>
                    <input
                      type='checkbox'
                      checked={selectedNotifications.includes(
                        notification.historyId,
                      )}
                      onChange={() =>
                        handleSelectNotification(notification.historyId)
                      }
                    />
                  </div>

                  <div className='item-content'>
                    <div className='item-header'>
                      <div className='item-priority'>
                        <span
                          className={`priority-badge ${getPriorityClass(notification.priority)}`}
                        >
                          {notification.priority}
                        </span>
                      </div>
                      <div className='item-time'>
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </div>

                    <div className='item-message'>{notification.message}</div>

                    <div className='item-details'>
                      <span className='detail-item'>
                        <FaUser /> {notification.username}
                      </span>
                      <span className='detail-item'>
                        <FaCog /> {notification.action}
                      </span>
                      <span className='detail-item'>
                        <FaCog /> {notification.resource}
                      </span>
                    </div>
                  </div>

                  <div className='item-actions'>
                    {!notification.read ? (
                      <button
                        className='action-btn'
                        onClick={() => handleMarkAsRead(notification.historyId)}
                        title='Mark as read'
                      >
                        <FaCheck />
                      </button>
                    ) : (
                      <button
                        className='action-btn'
                        onClick={() =>
                          handleMarkAsUnread(notification.historyId)
                        }
                        title='Mark as unread'
                      >
                        <FaEyeSlash />
                      </button>
                    )}

                    {!notification.archived ? (
                      <button
                        className='action-btn'
                        onClick={() => handleArchive(notification.historyId)}
                        title='Archive'
                      >
                        <FaArchive />
                      </button>
                    ) : (
                      <button
                        className='action-btn'
                        onClick={() => handleUnarchive(notification.historyId)}
                        title='Unarchive'
                      >
                        <FaInbox />
                      </button>
                    )}

                    <button
                      className='action-btn delete'
                      onClick={() => handleDelete(notification.historyId)}
                      title='Delete'
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationHistory;
