import { useState, useCallback } from 'react';
import notificationPermissionManager from '../utils/notificationPermissions';

// Convert Base64URL to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useNotifications = () => {
  const [showNotificationGuide, setShowNotificationGuide] = useState(false);

  // Default notification preferences
  const defaultNotifyPrefs = {
    all: true,
    prayer: true,
    jamaat: true,
    info: true,
    clear: false,
    admin: false,
    prayerFajr: true,
    prayerDhuhr: true,
    prayerAsr: true,
    prayerMaghrib: true,
    prayerIsha: true,
    quietEnabled: false,
    quietStart: '22:00',
    quietEnd: '06:00',
    // Enhanced notification preferences
    dataBackup: true,
    systemUpdates: true,
    communityEvents: true,
    emergencyAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    customReminders: true,
    soundEnabled: true,
    vibrationEnabled: true,
    priorityLevel: 'normal', // low, normal, high, urgent
  };

  const [notifyPrefs, setNotifyPrefs] = useState(defaultNotifyPrefs);

  // Load preferences from user context with role-based restrictions
  const loadPreferences = useCallback((userPrefs, userRole = 'guest') => {
    // Guest mode: no notifications allowed
    if (userRole === 'guest') {
      const guestPrefs = {
        all: false,
        prayer: false,
        jamaat: false,
        info: false,
        clear: false,
        admin: false,
        prayerFajr: false,
        prayerDhuhr: false,
        prayerAsr: false,
        prayerMaghrib: false,
        prayerIsha: false,
        quietEnabled: false,
        quietStart: '22:00',
        quietEnd: '06:00',
        dataBackup: false,
        systemUpdates: false,
        communityEvents: false,
        emergencyAlerts: false,
        weeklyReports: false,
        monthlyReports: false,
        customReminders: false,
        soundEnabled: false,
        vibrationEnabled: false,
        priorityLevel: 'none',
      };
      setNotifyPrefs(guestPrefs);
      return;
    }

    if (userPrefs && userPrefs.notifications) {
      // Apply role-based restrictions
      const roleBasedPrefs =
        notificationPermissionManager.getNotificationPreferences(
          userRole,
          userPrefs.notifications,
        );
      setNotifyPrefs(roleBasedPrefs);
    } else {
      // Use default role-based preferences
      const defaultPrefs =
        notificationPermissionManager.getNotificationPreferences(userRole);
      setNotifyPrefs(defaultPrefs);
    }
  }, []);

  // Save preferences to user context
  const saveNotificationPreferences = useCallback(async (prefs) => {
    try {
      setNotifyPrefs(prefs);
      // This will be handled by useUser hook
      return true;
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      return false;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        console.error('Notifications not supported in this browser');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        console.error(
          'Notifications are blocked. Please enable them in browser settings.',
        );
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return true;
      } else {
        console.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      console.error('Failed to enable notifications');
      return false;
    }
  }, []);

  // Schedule prayer notifications
  const schedulePrayerNotifications = useCallback(
    async (times, prefs = notifyPrefs) => {
      try {
        if (
          !('serviceWorker' in navigator) ||
          !navigator.serviceWorker.controller
        ) {
          console.log('Service worker not available');
          return;
        }

        if (!prefs.prayer) {
          console.log('Prayer notifications disabled');
          return;
        }

        const registration = await navigator.serviceWorker.ready;

        // Transform times for Friday
        const entries = Object.entries(times)
          .filter(([prayer]) => {
            // Filter out non-prayer fields
            const validPrayers = [
              'Fajr',
              'Dhuhr',
              'Asr',
              'Maghrib',
              'Isha',
              'Juma',
            ];
            const isValidPrayer = validPrayers.includes(prayer);
            if (!isValidPrayer) {
              console.log(`Skipping non-prayer field: ${prayer}`);
            }
            return isValidPrayer;
          })
          .map(([prayer, time]) => {
            console.log(
              `Processing prayer: ${prayer}, time: ${time}, type: ${typeof time}`,
            );

            if (!time || typeof time !== 'string' || !time.includes(':')) {
              console.error(
                `Invalid time format for ${prayer}: ${time} (type: ${typeof time})`,
              );
              return null;
            }

            const [hours, minutes] = time.split(':').map(Number);
            console.log(
              `Parsed time for ${prayer}: hours=${hours}, minutes=${minutes}`,
            );

            // Validate hours and minutes
            if (
              isNaN(hours) ||
              isNaN(minutes) ||
              hours < 0 ||
              hours > 23 ||
              minutes < 0 ||
              minutes > 59
            ) {
              console.error(
                `Invalid time values for ${prayer}: hours=${hours}, minutes=${minutes}`,
              );
              return null;
            }

            const date = new Date();
            date.setHours(hours, minutes, 0, 0);

            // If time has passed today, schedule for tomorrow
            if (date <= new Date()) {
              date.setDate(date.getDate() + 1);
            }

            console.log(`Scheduled ${prayer} for: ${date.toISOString()}`);
            return { prayer, time: date.toISOString() };
          })
          .filter((entry) => entry !== null); // Remove invalid entries

        registration.active.postMessage({
          type: 'schedule',
          data: {
            times: entries,
            prefs,
          },
        });

        console.log('Prayer notifications scheduled');
      } catch (error) {
        console.error('Failed to schedule prayer notifications:', error);
      }
    },
    [notifyPrefs],
  );

  // Send notification via service worker
  const sendServiceWorkerNotification = useCallback(
    async (title, body, options = {}) => {
      try {
        if (!('serviceWorker' in navigator)) {
          console.log('Service Worker not supported');
          // Fallback to browser notification
          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(title, { body, ...options });
          }
          return;
        }

        const registration = await navigator.serviceWorker.ready;

        // Enhanced service worker communication
        if (registration.active) {
          // Use MessageChannel for reliable communication
          const channel = new MessageChannel();

          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Service Worker communication timeout'));
            }, 5000);

            channel.port1.onmessage = (event) => {
              clearTimeout(timeout);
              if (event.data.type === 'pong') {
                // Service worker is ready
                registration.active.postMessage(
                  {
                    type: 'showNow',
                    data: {
                      title,
                      body,
                      options,
                      prefs: notifyPrefs,
                    },
                  },
                  [channel.port2],
                );
                resolve();
              }
            };

            // Test connection first
            registration.active.postMessage({ type: 'ping' }, [channel.port2]);
          });
        } else {
          throw new Error('Service Worker not active');
        }
      } catch (error) {
        console.error('Failed to send service worker notification:', error);
        // Fallback to browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, ...options });
        }
      }
    },
    [notifyPrefs],
  );

  // Enhanced notification function with role-based validation
  const notify = useCallback(
    async (title, body, options = {}, userRole = 'guest') => {
      // Guest mode: no notifications allowed
      if (userRole === 'guest') {
        console.log('Notifications not allowed for guest mode');
        return;
      }

      try {
        const {
          type = 'info',
          priority = 'normal',
          category = 'general',
          vibration = true,
          icon = '/logo192.png',
          tag = undefined,
          requireInteraction = false,
          silent = false,
        } = options;

        // Validate notification with role-based restrictions
        const validation = notificationPermissionManager.validateNotification(
          userRole,
          {
            type,
            category,
            priority,
            title,
            body,
          },
        );

        if (!validation.allowed) {
          console.log(`Notification blocked: ${validation.reason}`);
          return;
        }

        // Check if notifications are enabled
        if (!notifyPrefs.all) {
          console.log('Notifications disabled');
          return;
        }

        // Check category-specific preferences
        const categoryEnabled =
          notifyPrefs[category] !== undefined ? notifyPrefs[category] : true;
        if (!categoryEnabled) {
          console.log(`Notifications for category '${category}' disabled`);
          return;
        }

        // Check priority level
        const priorityEnabled =
          notifyPrefs.priorityLevel === 'urgent' ||
          notifyPrefs.priorityLevel === priority ||
          (notifyPrefs.priorityLevel === 'high' && priority !== 'urgent') ||
          (notifyPrefs.priorityLevel === 'normal' &&
            ['low', 'normal'].includes(priority));

        if (!priorityEnabled) {
          console.log(`Notification priority '${priority}' not allowed`);
          return;
        }

        // Check quiet hours (except for urgent notifications)
        if (notifyPrefs.quietEnabled && priority !== 'urgent') {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const [startHour, startMin] = notifyPrefs.quietStart
            .split(':')
            .map(Number);
          const [endHour, endMin] = notifyPrefs.quietEnd.split(':').map(Number);
          const startTime = startHour * 60 + startMin;
          const endTime = endHour * 60 + endMin;

          if (currentTime >= startTime || currentTime <= endTime) {
            console.log('Quiet hours - notification suppressed');
            return;
          }
        }

        // Show notification guide if needed
        if (Notification.permission === 'default') {
          setShowNotificationGuide(true);
          return;
        }

        // Enhanced notification options
        const enhancedOptions = {
          icon,
          tag,
          requireInteraction: priority === 'urgent' || requireInteraction,
          silent: !notifyPrefs.soundEnabled || silent,
          vibrate:
            notifyPrefs.vibrationEnabled && vibration
              ? [200, 100, 200]
              : undefined,
          data: {
            type,
            priority,
            category,
            timestamp: new Date().toISOString(),
          },
        };

        // Send notification
        await sendServiceWorkerNotification(title, body, enhancedOptions);

        // Show fallback console log with priority styling
        const logType =
          priority === 'urgent'
            ? 'error'
            : priority === 'high'
              ? 'warn'
              : 'info';
        console[logType](`${title}: ${body}`);
      } catch (error) {
        console.error('Notification failed:', error);
        // Always show fallback console log
        console.info(`${title}: ${body}`);
      }
    },
    [notifyPrefs, sendServiceWorkerNotification],
  );

  // Specialized notification functions
  const notifyEmergency = useCallback(
    (title, body) => {
      return notify(title, body, {
        type: 'emergency',
        priority: 'urgent',
        category: 'emergencyAlerts',
        requireInteraction: true,
      });
    },
    [notify],
  );

  const notifyDataBackup = useCallback(
    (title, body) => {
      return notify(title, body, {
        type: 'backup',
        priority: 'normal',
        category: 'dataBackup',
      });
    },
    [notify],
  );

  const notifySystemUpdate = useCallback(
    (title, body) => {
      return notify(title, body, {
        type: 'system',
        priority: 'high',
        category: 'systemUpdates',
      });
    },
    [notify],
  );

  const notifyCommunityEvent = useCallback(
    (title, body) => {
      return notify(title, body, {
        type: 'event',
        priority: 'normal',
        category: 'communityEvents',
      });
    },
    [notify],
  );

  // PWA Push Notification Support
  const subscribeToPushNotifications = useCallback(async () => {
    try {
      console.log('=== PUSH NOTIFICATION SUBSCRIPTION START ===');

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker registration:', registration);
      console.log('Service Worker state:', registration.active?.state);

      // Check if already subscribed
      const existingSubscription =
        await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        return true;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Get VAPID key with multiple fallback strategies
      let vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.warn('VAPID key not found in environment, trying fallback...');
        // Fallback VAPID key (newly generated valid key)
        vapidPublicKey =
          'BPbCitTMIWl9mjwvSrh4yRL2WiYSkPQJyCInNdKY0RqL5b8DJbPUM1iwrXKkDEruKnnRyQY5iX5o1yikEOr0JC8';
        console.log('Using fallback VAPID key');
      }

      console.log('VAPID Key length:', vapidPublicKey?.length);
      console.log('VAPID Key type:', typeof vapidPublicKey);

      // Convert VAPID key from Base64URL to Uint8Array
      const vapidKeyArray = urlBase64ToUint8Array(vapidPublicKey);
      console.log('VAPID Key Array length:', vapidKeyArray.length);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyArray,
      });

      console.log('Push notification subscription created:', subscription);
      console.log('=== PUSH NOTIFICATION SUBSCRIPTION END ===');

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }, []);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }, []);

  // Background Sync Support
  const registerBackgroundSync = useCallback(
    async (tag = 'background-sync') => {
      try {
        if (
          !('serviceWorker' in navigator) ||
          !('sync' in window.ServiceWorkerRegistration.prototype)
        ) {
          console.log('Background sync not supported');
          return false;
        }

        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
        return true;
      } catch (error) {
        console.error('Failed to register background sync:', error);
        return false;
      }
    },
    [],
  );

  // Periodic Background Sync (if supported)
  const registerPeriodicSync = useCallback(
    async (tag = 'prayer-times-update', options = {}) => {
      try {
        if (
          !('serviceWorker' in navigator) ||
          !('periodicSync' in window.ServiceWorkerRegistration.prototype)
        ) {
          console.log('Periodic background sync not supported');
          return false;
        }

        const registration = await navigator.serviceWorker.ready;
        await registration.periodicSync.register(tag, {
          minInterval: options.minInterval || 24 * 60 * 60 * 1000, // 24 hours
          ...options,
        });
        console.log('Periodic background sync registered:', tag);
        return true;
      } catch (error) {
        console.error('Failed to register periodic sync:', error);
        return false;
      }
    },
    [],
  );

  return {
    notifyPrefs,
    notify,
    notifyEmergency,
    notifyDataBackup,
    notifySystemUpdate,
    notifyCommunityEvent,
    requestNotificationPermission,
    schedulePrayerNotifications,
    sendServiceWorkerNotification,
    saveNotificationPreferences,
    loadPreferences,
    showNotificationGuide,
    setShowNotificationGuide,
    // PWA Features
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    registerBackgroundSync,
    registerPeriodicSync,
  };
};
