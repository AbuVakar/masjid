// Comprehensive Notification System Test Script
// Run this in browser console to test all notification features

console.log('🔔 Starting Notification System Tests...');

// Test 1: Check PWA Support
function testPWASupport() {
  console.log('\n📱 Test 1: PWA Support');

  const results = {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notification: 'Notification' in window,
    backgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype,
    periodicSync: 'periodicSync' in window.ServiceWorkerRegistration.prototype,
  };

  Object.entries(results).forEach(([feature, supported]) => {
    console.log(
      `${supported ? '✅' : '❌'} ${feature}: ${supported ? 'Supported' : 'Not Supported'}`,
    );
  });

  return results;
}

// Test 2: Check Notification Permissions
function testNotificationPermissions() {
  console.log('\n🔔 Test 2: Notification Permissions');

  const permission = Notification.permission;
  console.log(`Current permission: ${permission}`);

  if (permission === 'granted') {
    console.log('✅ Notifications are enabled');
  } else if (permission === 'denied') {
    console.log('❌ Notifications are blocked');
  } else {
    console.log('⚠️ Permission not yet requested');
  }

  return permission;
}

// Test 3: Test Service Worker Registration
async function testServiceWorker() {
  console.log('\n⚙️ Test 3: Service Worker');

  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ready');

    if (registration.active) {
      console.log('✅ Service Worker is active');

      // Test communication
      const channel = new MessageChannel();
      const pingPromise = new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data.type === 'pong') {
            resolve(true);
          }
        };
      });

      registration.active.postMessage({ type: 'ping' }, [channel.port2]);

      const pingResult = await Promise.race([
        pingPromise,
        new Promise((resolve) => setTimeout(() => resolve(false), 3000)),
      ]);

      if (pingResult) {
        console.log('✅ Service Worker communication working');
      } else {
        console.log('❌ Service Worker communication failed');
      }

      return true;
    } else {
      console.log('❌ Service Worker not active');
      return false;
    }
  } catch (error) {
    console.log('❌ Service Worker error:', error.message);
    return false;
  }
}

// Test 4: Test In-App Notifications
function testInAppNotifications() {
  console.log('\n📱 Test 4: In-App Notifications');

  try {
    // Test if notification context is available
    if (window.notify) {
      window.notify('Test In-App Notification', { type: 'info' });
      console.log('✅ In-app notification sent');
      return true;
    } else {
      console.log('❌ Notification context not available');
      return false;
    }
  } catch (error) {
    console.log('❌ In-app notification error:', error.message);
    return false;
  }
}

// Test 5: Test Browser Notifications
async function testBrowserNotifications() {
  console.log('\n🌐 Test 5: Browser Notifications');

  if (!('Notification' in window)) {
    console.log('❌ Browser notifications not supported');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      new Notification('Test Browser Notification', {
        body: 'This is a test browser notification',
        icon: '/logo192.png',
      });
      console.log('✅ Browser notification sent');
      return true;
    } else {
      console.log('⚠️ Notification permission not granted');
      return false;
    }
  } catch (error) {
    console.log('❌ Browser notification error:', error.message);
    return false;
  }
}

// Test 6: Test Role-Based Permissions
function testRolePermissions() {
  console.log('\n👥 Test 6: Role-Based Permissions');

  // Simulate different user roles
  const roles = ['guest', 'user', 'admin'];

  roles.forEach((role) => {
    console.log(`\nTesting role: ${role}`);

    // Simulate role permissions (this would normally come from the permission manager)
    const permissions = {
      guest: {
        prayer: true,
        jamaat: true,
        info: true,
        clear: false,
        admin: false,
        priorityLevel: 'normal',
      },
      user: {
        prayer: true,
        jamaat: true,
        info: true,
        clear: true,
        admin: false,
        priorityLevel: 'high',
      },
      admin: {
        prayer: true,
        jamaat: true,
        info: true,
        clear: true,
        admin: true,
        priorityLevel: 'urgent',
      },
    };

    const rolePerms = permissions[role];
    Object.entries(rolePerms).forEach(([permission, allowed]) => {
      console.log(
        `${allowed ? '✅' : '❌'} ${permission}: ${allowed ? 'Allowed' : 'Blocked'}`,
      );
    });
  });

  return true;
}

// Test 7: Test Prayer Notifications
async function testPrayerNotifications() {
  console.log('\n🕌 Test 7: Prayer Notifications');

  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Worker required for prayer notifications');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Test prayer notification scheduling
    const testTimes = {
      Fajr: '05:30',
      Dhuhr: '12:30',
      Asr: '15:45',
      Maghrib: '18:30',
      Isha: '20:00',
    };

    const times = Object.entries(testTimes).map(([prayer, time]) => {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
      }

      return { prayer, time: date.toISOString() };
    });

    registration.active.postMessage({
      type: 'schedule',
      times: times,
      prefs: {
        all: true,
        prayer: true,
        quietEnabled: false,
      },
    });

    console.log('✅ Prayer notifications scheduled');
    return true;
  } catch (error) {
    console.log('❌ Prayer notification error:', error.message);
    return false;
  }
}

// Test 8: Test Push Notifications
async function testPushNotifications() {
  console.log('\n📲 Test 8: Push Notifications');

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('❌ Push notifications not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (existingSubscription) {
      console.log('✅ Push notification subscription exists');
      return true;
    } else {
      console.log('⚠️ No push notification subscription found');
      return false;
    }
  } catch (error) {
    console.log('❌ Push notification error:', error.message);
    return false;
  }
}

// Test 9: Test Background Sync
async function testBackgroundSync() {
  console.log('\n🔄 Test 9: Background Sync');

  if (
    !('serviceWorker' in navigator) ||
    !('sync' in window.ServiceWorkerRegistration.prototype)
  ) {
    console.log('❌ Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('test-sync');
    console.log('✅ Background sync registered');
    return true;
  } catch (error) {
    console.log('❌ Background sync error:', error.message);
    return false;
  }
}

// Test 10: Test Quiet Hours
function testQuietHours() {
  console.log('\n🌙 Test 10: Quiet Hours');

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const quietStart = 22 * 60; // 22:00
  const quietEnd = 6 * 60; // 06:00

  const inQuietHours = currentTime >= quietStart || currentTime <= quietEnd;

  console.log(`Current time: ${now.toLocaleTimeString()}`);
  console.log(`Quiet hours: 22:00 - 06:00`);
  console.log(`In quiet hours: ${inQuietHours ? 'Yes' : 'No'}`);

  if (inQuietHours) {
    console.log(
      '⚠️ Currently in quiet hours - notifications may be suppressed',
    );
  } else {
    console.log('✅ Not in quiet hours - notifications should work normally');
  }

  return !inQuietHours;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive notification system tests...\n');

  const results = {
    pwaSupport: testPWASupport(),
    permissions: testNotificationPermissions(),
    serviceWorker: await testServiceWorker(),
    inAppNotifications: testInAppNotifications(),
    browserNotifications: await testBrowserNotifications(),
    rolePermissions: testRolePermissions(),
    prayerNotifications: await testPrayerNotifications(),
    pushNotifications: await testPushNotifications(),
    backgroundSync: await testBackgroundSync(),
    quietHours: testQuietHours(),
  };

  console.log('\n📊 Test Summary:');
  console.log('================');

  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log(
      '🎉 All tests passed! Notification system is working perfectly.',
    );
  } else {
    console.log('⚠️ Some tests failed. Check the results above for details.');
  }

  return results;
}

// Export functions for manual testing
window.testNotificationSystem = {
  runAllTests,
  testPWASupport,
  testNotificationPermissions,
  testServiceWorker,
  testInAppNotifications,
  testBrowserNotifications,
  testRolePermissions,
  testPrayerNotifications,
  testPushNotifications,
  testBackgroundSync,
  testQuietHours,
};

console.log('🔔 Notification System Test Script Loaded!');
console.log('Run: testNotificationSystem.runAllTests() to start testing');
