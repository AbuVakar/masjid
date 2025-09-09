const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // Replace with actual admin password
};

// Test user credentials
const TEST_USER = {
  username: 'testuser',
  password: 'test123',
  name: 'Test User',
  email: 'test@example.com',
};

let adminToken = null;
let testUserToken = null;

/**
 * Login as admin
 */
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
      username: ADMIN_CREDENTIALS.username,
      password: ADMIN_CREDENTIALS.password,
    });

    adminToken = response.data.token;
    console.log('✅ Admin login successful');
    return adminToken;
  } catch (error) {
    console.error(
      '❌ Admin login failed:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Login as test user
 */
async function loginAsTestUser() {
  try {
    console.log('🔐 Logging in as test user...');
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password,
    });

    testUserToken = response.data.token;
    console.log('✅ Test user login successful');
    return testUserToken;
  } catch (error) {
    console.error(
      '❌ Test user login failed:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Create a test house (should trigger admin notification)
 */
async function createTestHouse() {
  try {
    console.log('🏠 Creating test house...');
    const response = await axios.post(
      `${API_BASE_URL}/houses`,
      {
        houseNumber: 'TEST-001',
        address: 'Test Address',
        ownerName: 'Test Owner',
        contactNumber: '1234567890',
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ Test house created successfully');
    return response.data.house._id;
  } catch (error) {
    console.error(
      '❌ Failed to create test house:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Update test house (should trigger admin notification)
 */
async function updateTestHouse(houseId) {
  try {
    console.log('✏️ Updating test house...');
    const response = await axios.put(
      `${API_BASE_URL}/houses/${houseId}`,
      {
        houseNumber: 'TEST-001-UPDATED',
        address: 'Updated Test Address',
        ownerName: 'Updated Test Owner',
        contactNumber: '0987654321',
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ Test house updated successfully');
  } catch (error) {
    console.error(
      '❌ Failed to update test house:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Add test member (should trigger admin notification)
 */
async function addTestMember(houseId) {
  try {
    console.log('👤 Adding test member...');
    const response = await axios.post(
      `${API_BASE_URL}/houses/${houseId}/members`,
      {
        name: 'Test Member',
        age: 25,
        gender: 'Male',
        contactNumber: '5555555555',
        relationship: 'Son',
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ Test member added successfully');
    return response.data.member._id;
  } catch (error) {
    console.error(
      '❌ Failed to add test member:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Update test member (should trigger admin notification)
 */
async function updateTestMember(houseId, memberId) {
  try {
    console.log('✏️ Updating test member...');
    const response = await axios.put(
      `${API_BASE_URL}/houses/${houseId}/members/${memberId}`,
      {
        name: 'Updated Test Member',
        age: 26,
        gender: 'Male',
        contactNumber: '6666666666',
        relationship: 'Son',
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ Test member updated successfully');
  } catch (error) {
    console.error(
      '❌ Failed to update test member:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Update prayer times (should trigger admin notification)
 */
async function updatePrayerTimes() {
  try {
    console.log('🕌 Updating prayer times...');
    const response = await axios.put(
      `${API_BASE_URL}/prayer-times`,
      {
        times: {
          fajr: '05:30',
          dhuhr: '12:30',
          asr: '15:45',
          maghrib: '18:30',
          isha: '20:00',
        },
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ Prayer times updated successfully');
  } catch (error) {
    console.error(
      '❌ Failed to update prayer times:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Upload test resource (should trigger admin notification)
 */
async function uploadTestResource() {
  try {
    console.log('📁 Uploading test resource...');
    const response = await axios.post(
      `${API_BASE_URL}/resources`,
      {
        title: 'Test Resource',
        description: 'This is a test resource for admin notifications',
        type: 'document',
        url: 'https://example.com/test-resource.pdf',
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ Test resource uploaded successfully');
    return response.data.resource._id;
  } catch (error) {
    console.error(
      '❌ Failed to upload test resource:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Delete test resource (should trigger admin notification)
 */
async function deleteTestResource(resourceId) {
  try {
    console.log('🗑️ Deleting test resource...');
    const response = await axios.delete(
      `${API_BASE_URL}/resources/${resourceId}`,
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ Test resource deleted successfully');
  } catch (error) {
    console.error(
      '❌ Failed to delete test resource:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Update user profile (should trigger admin notification)
 */
async function updateUserProfile() {
  try {
    console.log('👤 Updating user profile...');
    const response = await axios.put(
      `${API_BASE_URL}/users/profile`,
      {
        name: 'Updated Test User',
        email: 'updated.test@example.com',
        mobile: '7777777777',
      },
      {
        headers: { Authorization: `Bearer ${testUserToken}` },
      },
    );

    console.log('✅ User profile updated successfully');
  } catch (error) {
    console.error(
      '❌ Failed to update user profile:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Export data (should trigger admin notification)
 */
async function exportData() {
  try {
    console.log('📊 Exporting data...');
    const response = await axios.get(`${API_BASE_URL}/houses/export`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
      responseType: 'blob',
    });

    console.log('✅ Data exported successfully');
  } catch (error) {
    console.error(
      '❌ Failed to export data:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

/**
 * Main test function
 */
async function runAdminNotificationTests() {
  console.log('🚀 Starting Admin Notification Tests...\n');

  try {
    // Step 1: Login as admin
    await loginAsAdmin();

    // Step 2: Login as test user
    await loginAsTestUser();

    // Step 3: Perform various actions that should trigger admin notifications
    console.log('\n📋 Performing actions to trigger admin notifications...\n');

    // Create house
    const houseId = await createTestHouse();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

    // Update house
    await updateTestHouse(houseId);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Add member
    const memberId = await addTestMember(houseId);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update member
    await updateTestMember(houseId, memberId);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update prayer times
    await updatePrayerTimes();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Upload resource
    const resourceId = await uploadTestResource();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Delete resource
    await deleteTestResource(resourceId);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update user profile
    await updateUserProfile();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Export data
    await exportData();

    console.log('\n✅ All admin notification tests completed successfully!');
    console.log('\n📱 Now check the admin notification panel in the browser:');
    console.log('   1. Login as admin in the browser');
    console.log('   2. Click the "Alerts" button (shield icon) in the header');
    console.log(
      '   3. You should see notifications for all the actions performed above',
    );
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the tests
runAdminNotificationTests();
