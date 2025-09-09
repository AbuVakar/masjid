import React, { useState, useEffect } from 'react';
import { useNotify } from '../context/NotificationContext';
import { useNotifications } from '../hooks/useNotifications';
import notificationPermissionManager from '../utils/notificationPermissions';
import {
  FaBell,
  FaBellSlash,
  FaCog,
  FaMobile,
  FaDesktop,
  FaShieldAlt,
  FaClock,
  FaVolumeUp,
  FaVolumeMute,
  FaWifi,
  FaPray,
  FaUsers,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaFlask,
} from 'react-icons/fa';

const AdvancedNotificationSettings = ({ user, onClose, onSave }) => {
  const { notify } = useNotify();
  const {
    notifyPrefs,
    saveNotificationPreferences,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    registerBackgroundSync,
    registerPeriodicSync,
    requestNotificationPermission,
  } = useNotifications();

  const [localPrefs, setLocalPrefs] = useState(notifyPrefs);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [pwaStatus, setPwaStatus] = useState({
    supported: false,
    installed: false,
    pushEnabled: false,
    backgroundSync: false,
    periodicSync: false,
  });

  const userRole = user?.role || 'guest';
  const isGuest = userRole === 'guest';
  const isAdmin = userRole === 'admin';

  // Get role-based permissions
  const rolePermissions =
    notificationPermissionManager.getPermissionsForRole(userRole);
  const availableTypes =
    notificationPermissionManager.getAvailableNotificationTypes(userRole);
  const notificationStats =
    notificationPermissionManager.getNotificationStats(userRole);

  useEffect(() => {
    checkPWAStatus();
  }, []);

  const checkPWAStatus = async () => {
    console.log('=== PWA STATUS CHECK ===');
    console.log('ServiceWorker in navigator:', 'serviceWorker' in navigator);
    console.log('PushManager in window:', 'PushManager' in window);

    const status = {
      supported: 'serviceWorker' in navigator,
      installed: false,
      pushEnabled: false,
      backgroundSync: false,
      periodicSync: false,
    };

    if (status.supported) {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('Service Worker registration:', registration);
        console.log('Service Worker active:', registration.active);
        console.log('Service Worker state:', registration.active?.state);

        status.installed = !!registration.active;

        if ('PushManager' in window) {
          const subscription = await registration.pushManager.getSubscription();
          console.log('Push subscription:', subscription);
          status.pushEnabled = !!subscription;
        }

        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          status.backgroundSync = true;
        }

        if ('periodicSync' in window.ServiceWorkerRegistration.prototype) {
          status.periodicSync = true;
        }
      } catch (error) {
        console.error('Error checking PWA status:', error);
      }
    }

    console.log('Final PWA status:', status);
    console.log('=== END PWA STATUS CHECK ===');
    setPwaStatus(status);
  };

  const handleToggle = (key) => {
    // Check if user has permission to change this setting
    if (rolePermissions[key] === false) {
      notify(`This setting is restricted for ${userRole} users`, {
        type: 'warning',
      });
      return;
    }

    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await saveNotificationPreferences(localPrefs);
      if (success) {
        notify('Notification preferences saved successfully!', {
          type: 'success',
        });
        onSave && onSave(localPrefs);
      } else {
        notify('Failed to save preferences', { type: 'error' });
      }
    } catch (error) {
      notify('Error saving preferences', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    setIsLoading(true);
    try {
      const permissionGranted = await requestNotificationPermission();
      if (permissionGranted) {
        const subscribed = await subscribeToPushNotifications();
        if (subscribed) {
          notify('Push notifications enabled!', { type: 'success' });
          await checkPWAStatus();
        } else {
          notify('Failed to enable push notifications', { type: 'error' });
        }
      } else {
        notify('Notification permission denied', { type: 'warning' });
      }
    } catch (error) {
      notify('Error enabling push notifications', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setIsLoading(true);
    try {
      const unsubscribed = await unsubscribeFromPushNotifications();
      if (unsubscribed) {
        notify('Push notifications disabled', { type: 'info' });
        await checkPWAStatus();
      }
    } catch (error) {
      notify('Error disabling push notifications', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableBackgroundSync = async () => {
    setIsLoading(true);
    try {
      const registered = await registerBackgroundSync();
      if (registered) {
        notify('Background sync enabled!', { type: 'success' });
        await checkPWAStatus();
      } else {
        notify('Background sync not supported', { type: 'warning' });
      }
    } catch (error) {
      notify('Error enabling background sync', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FaCog },
    { id: 'prayer', label: 'Prayer Times', icon: FaPray },
    { id: 'categories', label: 'Categories', icon: FaBell },
    { id: 'pwa', label: 'PWA Features', icon: FaMobile },
    { id: 'advanced', label: 'Advanced', icon: FaShieldAlt },
  ];

  const renderGeneralTab = () => (
    <div className='settings-tab'>
      <div className='settings-section'>
        <h4>Basic Settings</h4>
        <div className='setting-item'>
          <label>
            <input
              type='checkbox'
              checked={!!localPrefs.all}
              onChange={() => handleToggle('all')}
              disabled={isGuest}
            />
            Enable all notifications
            {isGuest && (
              <span className='restriction-badge'>Guest Restricted</span>
            )}
          </label>
        </div>

        <div className='setting-item'>
          <label>
            <input
              type='checkbox'
              checked={!!localPrefs.soundEnabled}
              onChange={() => handleToggle('soundEnabled')}
            />
            <FaVolumeUp /> Sound notifications
          </label>
        </div>

        <div className='setting-item'>
          <label>
            <input
              type='checkbox'
              checked={!!localPrefs.vibrationEnabled}
              onChange={() => handleToggle('vibrationEnabled')}
            />
            <FaWifi /> Vibration
          </label>
        </div>
      </div>

      <div className='settings-section'>
        <h4>Priority Level</h4>
        <div className='priority-selector'>
          <select
            value={localPrefs.priorityLevel || 'normal'}
            onChange={(e) =>
              setLocalPrefs((prev) => ({
                ...prev,
                priorityLevel: e.target.value,
              }))
            }
            disabled={!isAdmin}
          >
            <option value='low'>Low Priority</option>
            <option value='normal'>Normal Priority</option>
            <option value='high'>High Priority</option>
            <option value='urgent'>Urgent (Admin Only)</option>
          </select>
          {!isAdmin && <span className='restriction-badge'>Admin Only</span>}
        </div>
      </div>

      <div className='settings-section'>
        <h4>Quiet Hours</h4>
        <div className='setting-item'>
          <label>
            <input
              type='checkbox'
              checked={!!localPrefs.quietEnabled}
              onChange={() => handleToggle('quietEnabled')}
              disabled={isAdmin}
            />
            <FaClock /> Enable quiet hours
            {isAdmin && (
              <span className='restriction-badge'>Disabled for Admin</span>
            )}
          </label>
        </div>

        {localPrefs.quietEnabled && (
          <div className='quiet-hours'>
            <input
              type='time'
              value={localPrefs.quietStart || '22:00'}
              onChange={(e) =>
                setLocalPrefs((prev) => ({
                  ...prev,
                  quietStart: e.target.value,
                }))
              }
            />
            <span>to</span>
            <input
              type='time'
              value={localPrefs.quietEnd || '06:00'}
              onChange={(e) =>
                setLocalPrefs((prev) => ({ ...prev, quietEnd: e.target.value }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderPrayerTab = () => (
    <div className='settings-tab'>
      <div className='settings-section'>
        <h4>Prayer Time Notifications</h4>
        <div className='setting-item'>
          <label>
            <input
              type='checkbox'
              checked={!!localPrefs.prayer}
              onChange={() => handleToggle('prayer')}
            />
            <FaPray /> Prayer time alerts
          </label>
        </div>

        {localPrefs.prayer && (
          <div className='prayer-times-grid'>
            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
              const key = `prayer${prayer}`;
              return (
                <div key={prayer} className='setting-item'>
                  <label>
                    <input
                      type='checkbox'
                      checked={!!localPrefs[key]}
                      onChange={() => handleToggle(key)}
                    />
                    {prayer}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className='settings-tab'>
      <div className='settings-section'>
        <h4>Notification Categories</h4>
        <div className='categories-grid'>
          {availableTypes.map((category) => (
            <div key={category} className='setting-item'>
              <label>
                <input
                  type='checkbox'
                  checked={!!localPrefs[category]}
                  onChange={() => handleToggle(category)}
                />
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className='settings-section'>
        <h4>Role Restrictions</h4>
        <div className='role-info'>
          <p>
            <strong>Current Role:</strong> {userRole}
          </p>
          <p>
            <strong>Available Categories:</strong> {availableTypes.length}
          </p>
          <p>
            <strong>Priority Level:</strong> {rolePermissions.priorityLevel}
          </p>
        </div>
      </div>
    </div>
  );

  const renderPWATab = () => (
    <div className='settings-tab'>
      <div className='settings-section'>
        <h4>PWA Features</h4>

        <div className='pwa-status'>
          <div className='status-item'>
            <FaDesktop />
            <span>
              Service Worker:{' '}
              {pwaStatus.supported ? 'Supported' : 'Not Supported'}
            </span>
            {pwaStatus.supported && <FaCheckCircle className='status-ok' />}
          </div>

          <div className='status-item'>
            <FaMobile />
            <span>PWA Installed: {pwaStatus.installed ? 'Yes' : 'No'}</span>
            {pwaStatus.installed && <FaCheckCircle className='status-ok' />}
          </div>

          <div className='status-item'>
            <FaBell />
            <span>
              Push Notifications:{' '}
              {pwaStatus.pushEnabled ? 'Enabled' : 'Disabled'}
            </span>
            {pwaStatus.pushEnabled && <FaCheckCircle className='status-ok' />}
          </div>

          <div className='status-item'>
            <FaCog />
            <span>
              Background Sync:{' '}
              {pwaStatus.backgroundSync ? 'Available' : 'Not Available'}
            </span>
            {pwaStatus.backgroundSync && (
              <FaCheckCircle className='status-ok' />
            )}
          </div>
        </div>
      </div>

      <div className='settings-section'>
        <h4>Push Notifications</h4>
        {pwaStatus.pushEnabled ? (
          <button
            className='btn btn-warning'
            onClick={handleDisablePushNotifications}
            disabled={isLoading}
          >
            <FaBellSlash /> Disable Push Notifications
          </button>
        ) : (
          <button
            className='btn btn-primary'
            onClick={handleEnablePushNotifications}
            disabled={isLoading || !pwaStatus.supported}
          >
            <FaBell /> Enable Push Notifications
          </button>
        )}
      </div>

      <div className='settings-section'>
        <h4>Background Sync</h4>
        {pwaStatus.backgroundSync && (
          <button
            className='btn btn-secondary'
            onClick={handleEnableBackgroundSync}
            disabled={isLoading}
          >
            <FaCog /> Enable Background Sync
          </button>
        )}
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className='settings-tab'>
      <div className='settings-section'>
        <h4>Advanced Settings</h4>

        <div className='setting-item'>
          <label>
            <input
              type='checkbox'
              checked={!!localPrefs.requireInteraction}
              onChange={() => handleToggle('requireInteraction')}
            />
            Require user interaction for notifications
          </label>
        </div>

        <div className='setting-item'>
          <label>
            <input
              type='checkbox'
              checked={!!localPrefs.silent}
              onChange={() => handleToggle('silent')}
            />
            Silent notifications (no sound)
          </label>
        </div>
      </div>

      <div className='settings-section'>
        <h4>Notification Statistics</h4>
        <div className='stats-grid'>
          <div className='stat-item'>
            <span className='stat-label'>Role:</span>
            <span className='stat-value'>{notificationStats.role}</span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>Available Types:</span>
            <span className='stat-value'>
              {notificationStats.availableTypes}
            </span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>Priority Level:</span>
            <span className='stat-value'>
              {notificationStats.priorityLevel}
            </span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>Quiet Hours:</span>
            <span className='stat-value'>
              {notificationStats.quietHoursEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const getCategoryIcon = (category) => {
    const icons = {
      prayer: FaPray,
      jamaat: FaUsers,
      info: FaInfoCircle,
      clear: FaTimes,
      admin: FaShieldAlt,
      systemUpdates: FaCog,
      emergencyAlerts: FaExclamationTriangle,
      dataBackup: FaCheckCircle,
      communityEvents: FaUsers,
    };
    const Icon = icons[category] || FaBell;
    return <Icon />;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      prayer: 'Prayer Times',
      jamaat: 'Jamaat Activities',
      info: 'Information Updates',
      clear: 'Clear All Notices',
      admin: 'Admin Reminders',
      systemUpdates: 'System Updates',
      emergencyAlerts: 'Emergency Alerts',
      dataBackup: 'Data Backup',
      communityEvents: 'Community Events',
    };
    return labels[category] || category;
  };

  return (
    <div className='advanced-notification-settings'>
      <div className='settings-header'>
        <h3>
          <FaCog /> Advanced Notification Settings
          {isGuest && <span className='role-badge'>Guest Mode</span>}
        </h3>
        <button className='close-btn' onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <div className='settings-tabs'>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className='settings-content'>
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'prayer' && renderPrayerTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'pwa' && renderPWATab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
      </div>

      <div className='settings-actions'>
        <button className='btn btn-secondary' onClick={onClose}>
          Cancel
        </button>
        <button
          className='btn btn-warning'
          onClick={() => {
            onClose();
            // Open notification tester modal
            if (window.openNotificationTester) {
              window.openNotificationTester();
            }
          }}
        >
          <FaFlask /> Test Notifications
        </button>
        <button
          className='btn btn-primary'
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdvancedNotificationSettings;
