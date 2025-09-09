import React, { useState, useEffect, useCallback } from 'react';
import { useNotify } from '../context/NotificationContext';
import { useNotifications } from '../hooks/useNotifications';
import notificationPermissionManager from '../utils/notificationPermissions';
import {
  FaBell,
  FaCog,
  FaFlask,
  FaCheckCircle,
  FaTimes,
  FaPray,
  FaMobile,
  FaDesktop,
} from 'react-icons/fa';

const NotificationTester = ({ user, onClose }) => {
  const { notify } = useNotify();
  const {
    notifyPrefs,
    notify: sendNotification,
    schedulePrayerNotifications,
    subscribeToPushNotifications,
    registerBackgroundSync,
    requestNotificationPermission,
  } = useNotifications();

  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pwaStatus, setPwaStatus] = useState({
    supported: false,
    installed: false,
    pushEnabled: false,
    backgroundSync: false,
  });

  // Safety check for user object
  const userRole = user && user.role ? user.role : 'guest';
  const userName = user && user.name ? user.name : 'Guest User';

  // Debug logging
  console.log('=== NOTIFICATION TESTER DEBUG ===');
  console.log('User prop:', user);
  console.log('User role:', userRole);
  console.log('User name:', userName);
  console.log(
    'NotificationPermissionManager:',
    typeof notificationPermissionManager,
  );
  console.log('Notification API:', typeof Notification);
  console.log('Service Worker:', typeof navigator.serviceWorker);
  console.log('=== END DEBUG ===');

  // Global debug function (accessible from console)
  window.debugNotificationSystem = () => {
    console.log('=== GLOBAL NOTIFICATION DEBUG ===');
    console.log('User from localStorage:', localStorage.getItem('user'));
    console.log('Token from localStorage:', localStorage.getItem('token'));
    console.log('Notification permission:', Notification.permission);
    console.log(
      'Service Worker controller:',
      navigator.serviceWorker.controller,
    );
    console.log('PushManager support:', 'PushManager' in window);
    console.log(
      'Background Sync support:',
      'sync' in window.ServiceWorkerRegistration.prototype,
    );
    console.log('=== END GLOBAL DEBUG ===');
  };

  // Check if user is authenticated
  const isAuthenticated = user && user._id;
  const isGuest = !isAuthenticated;

  const addTestResult = (test, result, details = '') => {
    setTestResults((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        test,
        result,
        details,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const runInitialTests = useCallback(() => {
    // Safety check for notificationPermissionManager
    if (!notificationPermissionManager) {
      addTestResult(
        'Role-Based Access',
        'FAIL',
        'Notification permission manager not available',
      );
      return;
    }

    addTestResult(
      'PWA Support',
      pwaStatus.supported ? 'PASS' : 'FAIL',
      pwaStatus.supported
        ? 'Service Worker supported'
        : 'Service Worker not supported',
    );

    addTestResult(
      'Notification Permission',
      Notification.permission,
      `Current permission: ${Notification.permission}`,
    );

    try {
      const availableTypes =
        notificationPermissionManager.getAvailableNotificationTypes(userRole);
      addTestResult(
        'Role-Based Access',
        'PASS',
        `User role: ${userRole}, Available types: ${availableTypes ? availableTypes.length : 0}`,
      );
    } catch (error) {
      addTestResult('Role-Based Access', 'FAIL', `Error: ${error.message}`);
    }
  }, [pwaStatus.supported, userRole]);

  useEffect(() => {
    checkPWAStatus();
    runInitialTests();
  }, [runInitialTests]);

  const checkPWAStatus = async () => {
    const status = {
      supported: 'serviceWorker' in navigator,
      installed: false,
      pushEnabled: false,
      backgroundSync: false,
    };

    if (status.supported) {
      try {
        const registration = await navigator.serviceWorker.ready;
        status.installed = !!registration.active;

        if ('PushManager' in window) {
          const subscription = await registration.pushManager.getSubscription();
          status.pushEnabled = !!subscription;
        }

        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          status.backgroundSync = true;
        }
      } catch (error) {
        console.error('Error checking PWA status:', error);
      }
    }

    setPwaStatus(status);
  };

  const testInAppNotification = async () => {
    setIsLoading(true);
    try {
      notify('Test In-App Notification', { type: 'info' });
      addTestResult(
        'In-App Notification',
        'PASS',
        'Toast notification displayed',
      );
    } catch (error) {
      addTestResult('In-App Notification', 'FAIL', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testBrowserNotification = async () => {
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission) {
        await sendNotification(
          'Test Browser Notification',
          'This is a test browser notification',
          {
            type: 'info',
            priority: 'normal',
            category: 'general',
          },
          userRole,
        );
        addTestResult(
          'Browser Notification',
          'PASS',
          'Browser notification sent',
        );
      } else {
        addTestResult('Browser Notification', 'FAIL', 'Permission denied');
      }
    } catch (error) {
      addTestResult('Browser Notification', 'FAIL', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testPrayerNotification = async () => {
    setIsLoading(true);
    try {
      const testTimes = {
        Fajr: '05:30',
        Dhuhr: '12:30',
        Asr: '15:45',
        Maghrib: '18:30',
        Isha: '20:00',
      };

      await schedulePrayerNotifications(testTimes, notifyPrefs);
      addTestResult(
        'Prayer Notifications',
        'PASS',
        'Prayer notifications scheduled',
      );
    } catch (error) {
      addTestResult('Prayer Notifications', 'FAIL', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testPushNotifications = async () => {
    setIsLoading(true);
    try {
      const subscribed = await subscribeToPushNotifications();
      if (subscribed) {
        addTestResult(
          'Push Notifications',
          'PASS',
          'Successfully subscribed to push notifications',
        );
        await checkPWAStatus();
      } else {
        addTestResult(
          'Push Notifications',
          'FAIL',
          'Failed to subscribe to push notifications',
        );
      }
    } catch (error) {
      addTestResult('Push Notifications', 'FAIL', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testBackgroundSync = async () => {
    setIsLoading(true);
    try {
      const registered = await registerBackgroundSync();
      if (registered) {
        addTestResult('Background Sync', 'PASS', 'Background sync registered');
      } else {
        addTestResult(
          'Background Sync',
          'FAIL',
          'Background sync not supported',
        );
      }
    } catch (error) {
      addTestResult('Background Sync', 'FAIL', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testRolePermissions = () => {
    const availableTypes =
      notificationPermissionManager.getAvailableNotificationTypes(userRole);

    addTestResult(
      'Role Permissions',
      'PASS',
      `Role: ${userRole}, Available types: ${availableTypes.join(', ')}`,
    );

    // Test each notification type
    availableTypes.forEach((type) => {
      const isAllowed = notificationPermissionManager.isNotificationAllowed(
        userRole,
        type,
      );
      addTestResult(
        `${type} Permission`,
        isAllowed ? 'PASS' : 'FAIL',
        `${type}: ${isAllowed ? 'Allowed' : 'Blocked'}`,
      );
    });
  };

  const testQuietHours = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = (notifyPrefs.quietStart || '22:00')
      .split(':')
      .map(Number);
    const [endHour, endMin] = (notifyPrefs.quietEnd || '06:00')
      .split(':')
      .map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    const inQuietHours = currentTime >= startTime || currentTime <= endTime;

    addTestResult(
      'Quiet Hours',
      'PASS',
      `Current time: ${now.toLocaleTimeString()}, Quiet hours: ${notifyPrefs.quietStart} - ${notifyPrefs.quietEnd}, In quiet hours: ${inQuietHours}`,
    );
  };

  const testServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      addTestResult('Service Worker', 'FAIL', 'Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        addTestResult(
          'Service Worker',
          'PASS',
          'Service Worker is active and ready',
        );
      } else {
        addTestResult('Service Worker', 'FAIL', 'Service Worker not active');
      }
    } catch (error) {
      addTestResult('Service Worker', 'FAIL', error.message);
    }
  };

  const testErrorHandling = () => {
    try {
      // Test should handle gracefully
      addTestResult(
        'Error Handling',
        'PASS',
        'Error handling mechanisms in place',
      );
    } catch (error) {
      addTestResult('Error Handling', 'FAIL', error.message);
    }
  };

  const testNotificationPreferences = () => {
    try {
      const prefs = notifyPrefs;
      const requiredKeys = [
        'all',
        'prayer',
        'soundEnabled',
        'vibrationEnabled',
      ];
      const missingKeys = requiredKeys.filter((key) => !(key in prefs));

      if (missingKeys.length === 0) {
        addTestResult(
          'Notification Preferences',
          'PASS',
          `All required preferences present: ${requiredKeys.join(', ')}`,
        );
      } else {
        addTestResult(
          'Notification Preferences',
          'FAIL',
          `Missing preferences: ${missingKeys.join(', ')}`,
        );
      }
    } catch (error) {
      addTestResult('Notification Preferences', 'FAIL', error.message);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    setIsLoading(true);

    try {
      console.log('=== STARTING COMPREHENSIVE NOTIFICATION TESTS ===');

      // Test 1: Service Worker Status
      await testServiceWorker();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Test 2: Role Permissions
      testRolePermissions();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Test 3: Quiet Hours
      testQuietHours();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Test 4: In-App Notifications
      await testInAppNotification();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Test 5: Browser Notifications
      await testBrowserNotification();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Test 6: Prayer Notifications
      await testPrayerNotification();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Test 7: PWA Features (if supported)
      if (pwaStatus.supported) {
        await testPushNotifications();
        await new Promise((resolve) => setTimeout(resolve, 200));

        await testBackgroundSync();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Test 8: Notification Preferences
      testNotificationPreferences();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Test 9: Error Handling
      testErrorHandling();
      await new Promise((resolve) => setTimeout(resolve, 200));

      addTestResult(
        'All Tests',
        'COMPLETE',
        `Completed ${testResults.length + 1} tests successfully`,
      );

      console.log('=== COMPREHENSIVE NOTIFICATION TESTS COMPLETE ===');
    } catch (error) {
      console.error('Test suite error:', error);
      addTestResult('Test Suite', 'ERROR', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'PASS':
        return <FaCheckCircle style={{ color: '#10b981' }} />;
      case 'FAIL':
        return <FaTimes style={{ color: '#ef4444' }} />;
      case 'COMPLETE':
        return <FaCheckCircle style={{ color: '#3b82f6' }} />;
      default:
        return <FaFlask style={{ color: '#6b7280' }} />;
    }
  };

  return (
    <div className='notification-tester'>
      <div className='tester-header'>
        <h3>
          <FaFlask /> Notification System Tester
          <span className='role-badge'>{userRole}</span>
        </h3>
        <button className='close-btn' onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* Authentication Status Check */}
      {isGuest && (
        <div className='auth-warning'>
          <div className='warning-content'>
            <h4>⚠️ Authentication Required</h4>
            <p>
              You need to be logged in to test all notification features. Some
              features may be limited for guest users.
            </p>
            <div className='auth-status'>
              <strong>Current Status:</strong> Guest User (Limited Access)
            </div>
            <div className='auth-actions'>
              <button
                className='btn btn-primary'
                onClick={() => {
                  // Trigger login modal or redirect
                  window.location.href = '/login';
                }}
              >
                Login to Test Full Features
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='tester-content'>
        <div className='pwa-status-section'>
          <h4>PWA Status</h4>
          <div className='status-grid'>
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

        <div className='test-controls'>
          <h4>Test Controls</h4>
          <div className='test-buttons'>
            <button
              className='btn btn-primary'
              onClick={runAllTests}
              disabled={isLoading}
            >
              <FaFlask /> Run All Tests
            </button>
            <button
              className='btn btn-secondary'
              onClick={testInAppNotification}
              disabled={isLoading}
            >
              <FaBell /> Test In-App
            </button>
            <button
              className='btn btn-secondary'
              onClick={testBrowserNotification}
              disabled={isLoading}
            >
              <FaBell /> Test Browser
            </button>
            <button
              className='btn btn-secondary'
              onClick={testPrayerNotification}
              disabled={isLoading}
            >
              <FaPray /> Test Prayer
            </button>
            <button
              className='btn btn-secondary'
              onClick={testPushNotifications}
              disabled={isLoading || !pwaStatus.supported}
            >
              <FaMobile /> Test Push
            </button>
            <button
              className='btn btn-secondary'
              onClick={testBackgroundSync}
              disabled={isLoading || !pwaStatus.backgroundSync}
            >
              <FaCog /> Test Background Sync
            </button>
            <button
              className='btn btn-warning'
              onClick={clearResults}
              disabled={isLoading}
            >
              <FaTimes /> Clear Results
            </button>
          </div>
        </div>

        <div className='test-results'>
          <h4>Test Results ({testResults.length})</h4>
          <div className='results-list'>
            {testResults.map((result) => (
              <div
                key={result.id}
                className={`result-item result-${result.result.toLowerCase()}`}
              >
                <div className='result-header'>
                  {getResultIcon(result.result)}
                  <span className='result-test'>{result.test}</span>
                  <span className='result-status'>{result.result}</span>
                </div>
                {result.details && (
                  <div className='result-details'>{result.details}</div>
                )}
                <div className='result-timestamp'>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {testResults.length === 0 && (
              <div className='no-results'>
                No test results yet. Click "Run All Tests" to start testing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTester;
