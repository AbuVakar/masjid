import React, { useState, useEffect } from 'react';
import { useAdminNotifications } from '../hooks/useAdminNotifications';
import { useNotify } from '../context/NotificationContext';
import {
  FaBell,
  FaTimes,
  FaTrash,
  FaSync,
  FaWifi,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaHistory,
  FaVolumeUp,
  FaVolumeMute,
  FaEnvelope,
  FaFilter,
  FaCog,
  FaDownload,
  FaUpload,
  FaPlay,
  FaStop,
  FaUserCheck,
} from 'react-icons/fa';
import soundAlerts from '../utils/soundAlerts';
import notificationHistoryService from '../utils/notificationHistory';
import emailService from '../utils/emailService';
import apiService from '../services/api';
import CustomFilters from './CustomFilters';
import NotificationHistory from './NotificationHistory';
import './AdminNotificationPanel.css';

/**
 * Admin Notification Panel Component
 * Displays real-time notifications for admin users
 */
const AdminNotificationPanel = ({ isOpen, onClose }) => {
  const { notify } = useNotify();
  const {
    isConnected,
    notifications,
    connectionStats,
    getStats,
    clearNotifications,
    disconnect,
    connect,
  } = useAdminNotifications();

  const [activeTab, setActiveTab] = useState('notifications');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filteredNotifications, setFilteredNotifications] =
    useState(notifications);
  const [savedFilters, setSavedFilters] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [soundSettings, setSoundSettings] = useState(soundAlerts.getSettings());
  const [emailSettings, setEmailSettings] = useState(emailService.getStatus());
  const [adminEmails, setAdminEmails] = useState(emailService.getAdminEmails());
  const [newEmail, setNewEmail] = useState('');

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (isConnected) {
      getStats();
      const interval = setInterval(getStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, getStats]);

  // Update filtered notifications when notifications change
  useEffect(() => {
    setFilteredNotifications(notifications);
  }, [notifications]);

  // Add notifications to history
  useEffect(() => {
    notifications.forEach((notification) => {
      notificationHistoryService.addNotification(notification);
    });
  }, [notifications]);

  // Send email notifications for important alerts
  useEffect(() => {
    notifications.forEach(async (notification) => {
      if (
        notification.priority === 'CRITICAL' ||
        notification.priority === 'IMPORTANT'
      ) {
        await emailService.sendEmail(notification);
      }
    });
  }, [notifications]);

  // Ensure sound alerts are properly initialized
  useEffect(() => {
    const initializeSoundAlerts = async () => {
      try {
        // Check if sound alerts are initialized
        if (!soundAlerts.isInitialized()) {
          console.log('AdminNotificationPanel: Reinitializing sound alerts');
          await soundAlerts.init();
        }
        setSoundSettings(soundAlerts.getSettings());
      } catch (error) {
        console.error(
          'AdminNotificationPanel: Error initializing sound alerts',
          error,
        );
      }
    };

    initializeSoundAlerts();
  }, []);

  // Filter notifications based on priority
  const priorityFilteredNotifications = filteredNotifications.filter(
    (notification) => {
      if (filterPriority === 'all') return true;
      return notification.priority === filterPriority;
    },
  );

  // Get priority count
  const getPriorityCount = (priority) => {
    return filteredNotifications.filter((n) => n.priority === priority).length;
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <FaExclamationTriangle className='priority-icon critical' />;
      case 'IMPORTANT':
        return <FaInfoCircle className='priority-icon important' />;
      default:
        return <FaCheckCircle className='priority-icon regular' />;
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'priority-badge critical';
      case 'IMPORTANT':
        return 'priority-badge important';
      default:
        return 'priority-badge regular';
    }
  };

  // Format timestamp
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

  if (!isOpen) return null;

  return (
    <div className='admin-notification-panel'>
      <div className='panel-header'>
        <div className='header-left'>
          <FaBell className='header-icon' />
          <h3>Admin Notifications</h3>
          <div
            className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
          >
            {isConnected ? <FaWifi /> : <FaTimes />}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className='header-actions'>
          <button
            className='action-btn refresh-btn'
            onClick={getStats}
            title='Refresh stats'
          >
            <FaSync />
          </button>
          <button
            className='action-btn close-btn'
            onClick={onClose}
            title='Close panel'
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <div className='panel-tabs'>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications ({filteredNotifications.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            setIsHistoryOpen(true);
          }}
        >
          <FaHistory /> History
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <FaCog /> Settings
        </button>
      </div>

      <div className='panel-content'>
        {activeTab === 'notifications' && (
          <div className='notifications-tab'>
            <div className='notifications-header'>
              <div className='priority-filters'>
                <button
                  className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterPriority('all')}
                >
                  All ({filteredNotifications.length})
                </button>
                <button
                  className={`filter-btn ${filterPriority === 'CRITICAL' ? 'active' : ''}`}
                  onClick={() => setFilterPriority('CRITICAL')}
                >
                  Critical ({getPriorityCount('CRITICAL')})
                </button>
                <button
                  className={`filter-btn ${filterPriority === 'IMPORTANT' ? 'active' : ''}`}
                  onClick={() => setFilterPriority('IMPORTANT')}
                >
                  Important ({getPriorityCount('IMPORTANT')})
                </button>
                <button
                  className={`filter-btn advanced-filter-btn ${filteredNotifications.length !== notifications.length ? 'active' : ''}`}
                  onClick={() => {
                    // Toggle custom filters
                    const customFiltersElement = document.querySelector(
                      '.custom-filters-container',
                    );
                    if (customFiltersElement) {
                      const isVisible =
                        customFiltersElement.style.display !== 'none';
                      customFiltersElement.style.display = isVisible
                        ? 'none'
                        : 'block';
                      notify(
                        isVisible
                          ? 'Advanced filters hidden'
                          : 'Advanced filters shown',
                        { type: 'info' },
                      );
                    }
                  }}
                  title='Advanced Filters'
                >
                  <FaFilter /> Advanced
                  {filteredNotifications.length !== notifications.length && (
                    <span className='filter-badge'>
                      {notifications.length - filteredNotifications.length}
                    </span>
                  )}
                </button>
              </div>
              <button
                className='clear-btn'
                onClick={clearNotifications}
                disabled={filteredNotifications.length === 0}
              >
                <FaTrash />
                Clear All
              </button>
            </div>

            <div className='notifications-list'>
              {priorityFilteredNotifications.length === 0 ? (
                <div className='empty-state'>
                  <FaBell className='empty-icon' />
                  <p>No notifications to display</p>
                  {filterPriority !== 'all' && (
                    <button
                      className='reset-filter-btn'
                      onClick={() => setFilterPriority('all')}
                    >
                      Show all notifications
                    </button>
                  )}
                </div>
              ) : (
                priorityFilteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.priority.toLowerCase()}`}
                  >
                    <div className='notification-header'>
                      <div className='notification-priority'>
                        {getPriorityIcon(notification.priority)}
                        <span
                          className={getPriorityBadgeClass(
                            notification.priority,
                          )}
                        >
                          {notification.priority}
                        </span>
                      </div>
                      <div className='notification-time'>
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </div>

                    <div className='notification-message'>
                      {notification.message}
                    </div>

                    <div className='notification-details'>
                      <div className='detail-item'>
                        <span className='detail-label'>User:</span>
                        <span className='detail-value'>
                          {notification.username}
                        </span>
                      </div>
                      <div className='detail-item'>
                        <span className='detail-label'>Action:</span>
                        <span className='detail-value'>
                          {notification.action}
                        </span>
                      </div>
                      <div className='detail-item'>
                        <span className='detail-label'>Resource:</span>
                        <span className='detail-value'>
                          {notification.resource}
                        </span>
                      </div>
                      {notification.details &&
                        Object.keys(notification.details).length > 0 && (
                          <div className='detail-item'>
                            <span className='detail-label'>Details:</span>
                            <span className='detail-value'>
                              {JSON.stringify(notification.details, null, 2)}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className='stats-tab'>
            <div className='stats-header'>
              <h4>Connection Statistics</h4>
              <button className='refresh-stats-btn' onClick={getStats}>
                <FaSync /> Refresh
              </button>
            </div>
            <div className='stats-grid'>
              <div className='stat-card'>
                <div className='stat-value'>
                  {connectionStats.activeSubscribers}
                </div>
                <div className='stat-label'>Active Admins</div>
              </div>
              <div className='stat-card'>
                <div className='stat-value'>{connectionStats.queueLength}</div>
                <div className='stat-label'>Queue Length</div>
              </div>
              <div className='stat-card'>
                <div className='stat-value'>
                  {connectionStats.totalNotifications}
                </div>
                <div className='stat-label'>Total Notifications</div>
              </div>
              <div className='stat-card'>
                <div className='stat-value'>
                  {connectionStats.isProcessing ? 'Processing' : 'Idle'}
                </div>
                <div className='stat-label'>Queue Status</div>
              </div>
            </div>

            <div className='priority-stats'>
              <h4>Notifications by Priority</h4>
              <div className='priority-bars'>
                <div className='priority-bar'>
                  <div className='bar-label'>Critical</div>
                  <div className='bar-container'>
                    <div
                      className='bar-fill critical'
                      style={{
                        width: `${(getPriorityCount('CRITICAL') / Math.max(notifications.length, 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className='bar-value'>
                    {getPriorityCount('CRITICAL')}
                  </div>
                </div>
                <div className='priority-bar'>
                  <div className='bar-label'>Important</div>
                  <div className='bar-container'>
                    <div
                      className='bar-fill important'
                      style={{
                        width: `${(getPriorityCount('IMPORTANT') / Math.max(notifications.length, 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className='bar-value'>
                    {getPriorityCount('IMPORTANT')}
                  </div>
                </div>
                <div className='priority-bar'>
                  <div className='bar-label'>Regular</div>
                  <div className='bar-container'>
                    <div
                      className='bar-fill regular'
                      style={{
                        width: `${(getPriorityCount('REGULAR') / Math.max(notifications.length, 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className='bar-value'>{getPriorityCount('REGULAR')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className='history-tab'>
            <div className='history-header'>
              <h4>Notification History</h4>
              <button
                className='open-history-btn'
                onClick={() => setIsHistoryOpen(true)}
                title='Open full history with advanced features'
              >
                <FaHistory /> Open Full History
              </button>
            </div>
            <div className='history-summary'>
              <div className='summary-card'>
                <div className='summary-value'>
                  {notificationHistoryService.getNotifications().length}
                </div>
                <div className='summary-label'>Total Notifications</div>
              </div>
              <div className='summary-card'>
                <div className='summary-value'>
                  {
                    notificationHistoryService
                      .getNotifications()
                      .filter((n) => !n.read).length
                  }
                </div>
                <div className='summary-label'>Unread</div>
              </div>
              <div className='summary-card'>
                <div className='summary-value'>
                  {
                    notificationHistoryService
                      .getNotifications()
                      .filter((n) => n.priority === 'CRITICAL').length
                  }
                </div>
                <div className='summary-label'>Critical</div>
              </div>
            </div>
            <div className='recent-notifications'>
              <h5>Recent Notifications</h5>
              <div className='recent-list'>
                {notificationHistoryService
                  .getNotifications()
                  .slice(0, 5)
                  .map((notification, index) => (
                    <div key={index} className='recent-item'>
                      <div className='recent-priority'>
                        <span
                          className={`priority-dot ${notification.priority.toLowerCase()}`}
                        ></span>
                      </div>
                      <div className='recent-content'>
                        <div className='recent-message'>
                          {notification.message}
                        </div>
                        <div className='recent-time'>
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className='settings-tab'>
            <div className='connection-settings'>
              <h4>Connection Settings</h4>
              <div className='setting-item'>
                <span className='setting-label'>Status:</span>
                <span
                  className={`setting-value ${isConnected ? 'connected' : 'disconnected'}`}
                >
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className='connection-actions'>
                {isConnected ? (
                  <button
                    className='action-btn disconnect-btn'
                    onClick={disconnect}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button className='action-btn connect-btn' onClick={connect}>
                    Connect
                  </button>
                )}
              </div>
            </div>

            <div className='sound-settings'>
              <h4>Sound Alerts</h4>
              <div className='setting-item'>
                <span className='setting-label'>Sound Alerts:</span>
                <button
                  className={`toggle-btn ${soundSettings.enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => {
                    try {
                      soundAlerts.setEnabled(!soundSettings.enabled);
                      setSoundSettings(soundAlerts.getSettings());
                    } catch (error) {
                      console.error('Error toggling sound alerts:', error);
                      notify('Error updating sound settings.', {
                        type: 'error',
                      });
                    }
                  }}
                >
                  {soundSettings.enabled ? <FaVolumeUp /> : <FaVolumeMute />}
                  {soundSettings.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className='setting-item'>
                <span className='setting-label'>Volume:</span>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.1'
                  value={soundSettings.volume}
                  onChange={(e) => {
                    try {
                      soundAlerts.setVolume(parseFloat(e.target.value));
                      setSoundSettings(soundAlerts.getSettings());
                    } catch (error) {
                      console.error('Error setting sound volume:', error);
                      notify('Error updating sound volume.', { type: 'error' });
                    }
                  }}
                  disabled={!soundSettings.enabled}
                />
                <span className='volume-value'>
                  {Math.round(soundSettings.volume * 100)}%
                </span>
              </div>
              <button
                className='action-btn'
                onClick={() => {
                  try {
                    soundAlerts.testSounds();
                  } catch (error) {
                    console.error('Error testing sounds:', error);
                    notify(
                      'Error testing sounds. Please check console for details.',
                      { type: 'error' },
                    );
                  }
                }}
                disabled={!soundSettings.enabled}
              >
                <FaPlay /> Test Sounds
              </button>
              <button
                className='action-btn'
                onClick={async () => {
                  try {
                    const success = await soundAlerts.reinitialize();
                    if (success) {
                      setSoundSettings(soundAlerts.getSettings());
                      notify('Sound alerts reinitialized successfully', {
                        type: 'success',
                      });
                    } else {
                      notify('Failed to reinitialize sound alerts', {
                        type: 'error',
                      });
                    }
                  } catch (error) {
                    console.error('Error reinitializing sound alerts:', error);
                    notify('Error reinitializing sound alerts', {
                      type: 'error',
                    });
                  }
                }}
              >
                <FaSync /> Reinitialize
              </button>
            </div>

            <div className='email-settings'>
              <h4>Email Notifications</h4>
              <div className='setting-item'>
                <span className='setting-label'>Email Alerts:</span>
                <button
                  className={`toggle-btn ${emailSettings.enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => {
                    emailService.setEnabled(!emailSettings.enabled);
                    setEmailSettings(emailService.getStatus());
                  }}
                >
                  <FaEnvelope />
                  {emailSettings.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className='email-addresses'>
                <h5>Admin Email Addresses</h5>
                <div className='email-input'>
                  <input
                    type='email'
                    placeholder='Enter admin email'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <button
                    className='action-btn'
                    onClick={() => {
                      if (emailService.addAdminEmail(newEmail)) {
                        setAdminEmails(emailService.getAdminEmails());
                        setNewEmail('');
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className='email-list'>
                  {adminEmails.map((email, index) => (
                    <div key={index} className='email-item'>
                      <span>{email}</span>
                      <button
                        className='remove-btn'
                        onClick={() => {
                          emailService.removeAdminEmail(email);
                          setAdminEmails(emailService.getAdminEmails());
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className='action-btn'
                  onClick={async () => {
                    try {
                      const result = await emailService.sendTestEmail();
                      if (result.success) {
                        notify('Test email sent successfully!', {
                          type: 'success',
                        });
                      } else {
                        let errorMessage = `Failed to send test email: ${result.error}`;
                        if (result.details) {
                          errorMessage += `\n\nDetails: User exists: ${result.details.userExists}, Token exists: ${result.details.tokenExists}`;
                          if (result.details.suggestion) {
                            errorMessage += `\nSuggestion: ${result.details.suggestion}`;
                          }
                        }
                        notify(errorMessage, {
                          type: 'error',
                        });
                      }
                    } catch (error) {
                      console.error('Error sending test email:', error);
                      notify(
                        'Error sending test email. Please check console.',
                        { type: 'error' },
                      );
                    }
                  }}
                  disabled={!emailSettings.ready}
                >
                  <FaPlay /> Send Test Email
                </button>
                <button
                  className='action-btn secondary'
                  onClick={() => {
                    const user = localStorage.getItem('user');
                    const token = localStorage.getItem('token');
                    const message = `Auth Status:\nUser: ${user ? 'EXISTS' : 'MISSING'}\nToken: ${token ? 'EXISTS' : 'MISSING'}`;
                    notify(message, { type: 'info' });
                    console.log('Auth Status Check:', {
                      user: !!user,
                      token: !!token,
                    });
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  <FaInfoCircle /> Check Auth
                </button>
                <button
                  className='action-btn warning'
                  onClick={() => {
                    if (
                      window.confirm(
                        'This will clear your session and redirect to login. Continue?',
                      )
                    ) {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  <FaSync /> Fix Auth
                </button>
                <button
                  className='action-btn success'
                  onClick={async () => {
                    try {
                      console.log('Attempting to restore user session...');
                      const response = await apiService.get('/users/profile');
                      if (response.success && response.data) {
                        localStorage.setItem(
                          'user',
                          JSON.stringify(response.data),
                        );
                        console.log('User session restored successfully');
                        notify(
                          'User session restored! Please refresh the page.',
                          { type: 'success' },
                        );
                      } else {
                        notify(
                          'Failed to restore user session. Please log in again.',
                          { type: 'warning' },
                        );
                      }
                    } catch (error) {
                      console.error('Error restoring user session:', error);
                      notify(
                        'Error restoring user session. Please log in again.',
                        { type: 'error' },
                      );
                    }
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  <FaUserCheck /> Restore User
                </button>
                <button
                  className='action-btn info'
                  onClick={async () => {
                    try {
                      console.log('=== COMPREHENSIVE SYSTEM TEST ===');

                      // Test 1: Authentication Status
                      console.log('1. Testing Authentication...');
                      const user = localStorage.getItem('user');
                      const token = localStorage.getItem('token');
                      console.log('   User exists:', !!user);
                      console.log('   Token exists:', !!token);

                      // Test 2: Token Refresh
                      console.log('2. Testing Token Refresh...');
                      try {
                        const refreshedToken = await apiService.refreshToken();
                        console.log(
                          '   Token refresh result:',
                          !!refreshedToken,
                        );
                      } catch (error) {
                        console.log('   Token refresh failed:', error.message);
                      }

                      // Test 3: Sound Alerts
                      console.log('3. Testing Sound Alerts...');
                      console.log(
                        '   Sound alerts initialized:',
                        soundAlerts.isInitialized(),
                      );
                      console.log(
                        '   Sound alerts enabled:',
                        soundAlerts.getSettings().enabled,
                      );

                      // Test 4: Email Service
                      console.log('4. Testing Email Service...');
                      console.log(
                        '   Email service status:',
                        emailService.getStatus(),
                      );

                      // Test 5: WebSocket Connection
                      console.log('5. Testing WebSocket Connection...');
                      console.log('   WebSocket connected:', isConnected);

                      // Test 6: Fix User Session
                      console.log('6. Testing User Session Fix...');
                      if (!user && token) {
                        console.log('   Attempting to restore user session...');
                        try {
                          // Try to get user profile from API
                          const response =
                            await apiService.get('/users/profile');
                          if (response.success && response.data) {
                            localStorage.setItem(
                              'user',
                              JSON.stringify(response.data),
                            );
                            console.log(
                              '   User session restored successfully',
                            );
                            notify('User session restored!', {
                              type: 'success',
                            });
                          } else {
                            console.log('   Failed to restore user session');
                            notify(
                              'Failed to restore user session. Please log in again.',
                              { type: 'warning' },
                            );
                          }
                        } catch (error) {
                          console.log(
                            '   Error restoring user session:',
                            error.message,
                          );
                          notify(
                            'Error restoring user session. Please log in again.',
                            { type: 'error' },
                          );
                        }
                      }

                      notify(
                        'System test completed. Check console for details.',
                        { type: 'info' },
                      );
                    } catch (error) {
                      console.error('System test failed:', error);
                      notify('System test failed. Check console for details.', {
                        type: 'error',
                      });
                    }
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  <FaCog /> Test System
                </button>
              </div>
            </div>

            <div className='notification-settings'>
              <h4>Browser Notifications</h4>
              <div className='setting-item'>
                <span className='setting-label'>Browser Notifications:</span>
                <span className='setting-value'>
                  {'Notification' in window ? 'Supported' : 'Not Supported'}
                </span>
              </div>
              <div className='setting-item'>
                <span className='setting-label'>Permission:</span>
                <span className='setting-value'>
                  {Notification.permission === 'granted'
                    ? 'Granted'
                    : Notification.permission === 'denied'
                      ? 'Denied'
                      : 'Default'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Filters */}
      <div className='custom-filters-container' style={{ display: 'none' }}>
        <CustomFilters
          notifications={notifications}
          onFilterChange={setFilteredNotifications}
          onSaveFilter={(name, filter) => {
            setSavedFilters([...savedFilters, { name, filter }]);
            notify(`Filter "${name}" saved successfully!`, { type: 'success' });
          }}
          savedFilters={savedFilters}
          onLoadFilter={(filter) => {
            // Apply the loaded filter
            const filtered = notifications.filter((notification) => {
              // Apply filter logic here
              return true; // Placeholder
            });
            setFilteredNotifications(filtered);
            notify(`Filter "${filter.name}" loaded successfully!`, {
              type: 'info',
            });
          }}
        />
      </div>

      {/* Notification History Modal */}
      <NotificationHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};

export default AdminNotificationPanel;
