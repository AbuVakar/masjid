// API_BASE_URL is used in the constructor

class ApiService {
  constructor() {
    // Use environment variable or detect network for mobile access
    const apiUrl =
      process.env.REACT_APP_API_URL ||
      (window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : `http://${window.location.hostname}:5000/api`);
    this.baseURL = apiUrl;
    console.log('API Service initialized with URL:', this.baseURL);
    this.token = null; // No localStorage - token will be managed by server sessions
    this.csrfToken = null;
    this.isOnline = navigator.onLine;
    this.failedRequests = [];

    // Initialize CSRF token if not in development mode
    if (process.env.NODE_ENV !== 'development') {
      this.refreshCSRFToken();
    }

    // Setup network listeners
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.retryFailedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async retryFailedRequests() {
    if (this.failedRequests.length === 0) return;

    const requestsToRetry = [...this.failedRequests];
    this.failedRequests = [];

    for (const request of requestsToRetry) {
      try {
        await this.request(request.endpoint, request.options);
      } catch (error) {
        console.error(`❌ Retry failed for: ${request.endpoint}`, error);
        // Don't add back to failed requests to prevent infinite loops
      }
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  setCSRFToken(token) {
    this.csrfToken = token;
  }

  async refreshCSRFToken() {
    try {
      const response = await fetch(
        `${this.baseURL.replace('/api', '')}/api/csrf-token`,
      );
      const data = await response.json();
      if (data.success) {
        this.csrfToken = data.data.token;
        return this.csrfToken;
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
    }
    return null;
  }

  getToken() {
    if (!this.token) {
      // Try to load from localStorage
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        this.token = storedToken;
      }
    }
    return this.token;
  }

  async refreshToken() {
    try {
      const currentToken = this.getToken();
      if (!currentToken) {
        console.log('No token to refresh - user needs to login');
        return null;
      }

      console.log('Attempting to refresh token...');
      const response = await fetch(`${this.baseURL}/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token refresh failed:', response.status, errorData);

        // Clear invalid token
        this.removeToken();

        // For 401: clear token and let UI handle auth state (no hard redirect)

        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data.token) {
        this.setToken(data.data.token);
        console.log('Token refreshed successfully');
        return data.data.token;
      } else {
        throw new Error('Invalid response from token refresh');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid token
      this.removeToken();
      throw error;
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }

  // Generic request method with timeout and retry logic
  async request(endpoint, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    const timeout = options.timeout || 10000; // 10 seconds

    // Ensure CSRF token is available for non-GET requests in production
    if (
      process.env.NODE_ENV !== 'development' &&
      options.method &&
      options.method !== 'GET' &&
      !this.csrfToken
    ) {
      await this.refreshCSRFToken();
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
          headers: this.getHeaders(),
          ...options,
        };

        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle offline/network errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Check for offline error from service worker
          if (errorData.error?.code === 'OFFLINE_ERROR') {
            throw new Error(
              'You are currently offline. Please check your connection.',
            );
          }

          // Handle 401 errors specifically
          if (response.status === 401) {
            console.log('401 Unauthorized - Token may be expired');
            // Clear token on 401 error
            this.setToken(null);
            throw new Error('401 Unauthorized');
          }

          // Handle 429 errors specifically (Rate Limiting)
          if (response.status === 429) {
            console.log('429 Rate Limited - Too many requests');
            throw new Error(
              'Too many requests. Please wait a moment and try again.',
            );
          }

          throw new Error(
            errorData.error?.message ||
              `HTTP error! status: ${response.status}`,
          );
        }

        // Handle different response types
        const contentType = response.headers.get('content-type');

        if (options.responseType === 'blob') {
          return await response.blob();
        } else if (
          contentType?.includes('text/csv') ||
          contentType?.includes('text/plain')
        ) {
          return await response.text();
        } else if (contentType?.includes('application/pdf')) {
          return await response.blob();
        } else {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        // Don't retry on client errors (4xx)
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }

        // Handle 401 errors with token refresh
        if (
          (error.message.includes('Access token required') ||
            error.message.includes('401')) &&
          attempt === 1
        ) {
          try {
            console.log('Token expired, attempting to refresh...');
            await this.refreshToken();
            // Continue to retry with new token
            continue;
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw error; // Re-throw original error
          }
        }

        // Don't retry connection refused errors immediately
        if (
          error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_CONNECTION_REFUSED')
        ) {
          if (attempt === 1) {
            // Wait a bit longer for the first retry on connection issues
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (attempt === maxRetries) {
          console.error('API request failed after all retries:', error);

          // Store failed request for retry when online
          if (!this.isOnline && options.method !== 'GET') {
            this.failedRequests.push({ endpoint, options });
          }

          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
        console.warn(
          `API request failed, retrying (${attempt}/${maxRetries}):`,
          error.message,
        );
      }
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post(endpoint, data) {
    // Validate data before sending
    if (data && typeof data === 'object') {
      // Sanitize all string values in the data object
      const sanitizedData = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          sanitizedData[key] = value.trim();
        } else {
          sanitizedData[key] = value;
        }
      }

      // Add CSRF token to request body for POST requests
      if (this.csrfToken) {
        sanitizedData._csrf = this.csrfToken;
      }

      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(sanitizedData),
      });
    } else {
      // Handle non-object data (like null, undefined, etc.)
      const requestData = data || {};
      if (this.csrfToken) {
        requestData._csrf = this.csrfToken;
      }

      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    }
  }

  // PUT request
  async put(endpoint, data) {
    // Add CSRF token to request body for PUT requests
    const requestData = { ...data };
    if (this.csrfToken) {
      requestData._csrf = this.csrfToken;
    }

    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  }

  // DELETE request
  async delete(endpoint, data = null) {
    let requestConfig = { method: 'DELETE' };

    // If data is provided, add it to the request body
    if (data) {
      requestConfig.body = JSON.stringify(data);
    }

    // Add CSRF token to query parameters for DELETE requests
    const separator = endpoint.includes('?') ? '&' : '?';
    const csrfEndpoint = this.csrfToken
      ? `${endpoint}${separator}_csrf=${this.csrfToken}`
      : endpoint;

    return this.request(csrfEndpoint, requestConfig);
  }

  // PATCH request
  async patch(endpoint, data) {
    // Add CSRF token to request body for PATCH requests
    const requestData = { ...data };
    if (this.csrfToken) {
      requestData._csrf = this.csrfToken;
    }

    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(requestData),
    });
  }

  // House API methods
  async getHouses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/houses?${queryString}`);
  }

  async getHouse(id) {
    return this.get(`/houses/${id}`);
  }

  async createHouse(houseData) {
    return this.post('/houses', houseData);
  }

  async updateHouse(id, houseData) {
    const result = await this.put(`/houses/${id}`, houseData);
    return result;
  }

  async deleteHouse(id) {
    return this.delete(`/houses/${id}`);
  }

  // Member API methods
  async addMember(houseId, memberData) {
    return this.post(`/houses/${houseId}/members`, memberData);
  }

  async updateMember(houseId, memberId, memberData) {
    return this.put(`/houses/${houseId}/members/${memberId}`, memberData);
  }

  async deleteMember(houseId, memberId) {
    const result = await this.delete(`/houses/${houseId}/members/${memberId}`);
    return result;
  }

  async loadDemoData() {
    return this.post('/houses/load-demo');
  }

  async getHouseAnalytics() {
    return this.get('/houses/analytics/summary');
  }

  // Resource API methods
  async getResources(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/resources${queryString ? `?${queryString}` : ''}`);
  }

  async getResource(id) {
    return this.get(`/resources/${id}`);
  }

  async createResource(resourceData) {
    return this.post('/resources', resourceData);
  }

  async updateResource(id, resourceData) {
    return this.put(`/resources/${id}`, resourceData);
  }

  async deleteResource(id) {
    return this.delete(`/resources/${id}`);
  }

  async incrementResourceDownload(id) {
    return this.post(`/resources/${id}/download`);
  }

  async incrementDownloadCount(id) {
    return this.post(`/resources/${id}/download`);
  }

  async exportResources() {
    return this.get('/resources/export');
  }

  // User API methods
  async register(userData) {
    // Validate user data before sending
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data format');
    }

    if (!userData.username || !userData.password || !userData.email) {
      throw new Error('Username, password, and email are required');
    }

    // Sanitize user data
    const sanitizedUserData = {
      username: String(userData.username).trim(),
      password: String(userData.password),
      email: String(userData.email).trim().toLowerCase(),
      name: userData.name ? String(userData.name).trim() : '',
    };

    console.log(
      '🔍 Registration attempt with username:',
      sanitizedUserData.username,
    );

    const response = await this.post('/users/register', sanitizedUserData);
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
      // No localStorage - token managed by server sessions
    }
    return response;
  }

  async login(credentials) {
    // Validate credentials before sending
    if (!credentials) {
      throw new Error('Credentials are required');
    }

    if (typeof credentials !== 'object') {
      throw new Error('Credentials must be an object');
    }

    if (!credentials.username || !credentials.password) {
      throw new Error('Username and password are required');
    }

    // Sanitize credentials
    const sanitizedCredentials = {
      username: String(credentials.username).trim(),
      password: String(credentials.password),
    };

    const response = await this.post('/users/login', sanitizedCredentials);
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
      // No localStorage - token managed by server sessions
    }
    return response;
  }

  async logout() {
    this.removeToken();
    return { success: true, message: 'Logged out successfully' };
  }

  async getProfile() {
    return this.get('/users/profile');
  }

  async updateProfile(profileData) {
    console.log('=== API SERVICE DEBUG ===');
    console.log(
      'API Service - Current token:',
      this.getToken() ? 'EXISTS' : 'MISSING',
    );
    console.log('API Service - Token length:', this.getToken()?.length || 0);
    console.log(
      'API Service - Fajr timing sent:',
      profileData.prayerTiming?.Fajr,
    );
    console.log(
      'API Service - Dhuhr timing sent:',
      profileData.prayerTiming?.Dhuhr,
    );
    console.log(
      'API Service - Asr timing sent:',
      profileData.prayerTiming?.Asr,
    );
    console.log(
      'API Service - Maghrib timing sent:',
      profileData.prayerTiming?.Maghrib,
    );
    console.log(
      'API Service - Isha timing sent:',
      profileData.prayerTiming?.Isha,
    );
    const result = await this.put('/users/profile', profileData);
    console.log(
      'API Service - Result Fajr timing:',
      result.data?.preferences?.prayerTiming?.Fajr,
    );
    console.log(
      'API Service - Result Dhuhr timing:',
      result.data?.preferences?.prayerTiming?.Dhuhr,
    );
    console.log(
      'API Service - Result Asr timing:',
      result.data?.preferences?.prayerTiming?.Asr,
    );
    console.log(
      'API Service - Result Maghrib timing:',
      result.data?.preferences?.prayerTiming?.Maghrib,
    );
    console.log(
      'API Service - Result Isha timing:',
      result.data?.preferences?.prayerTiming?.Isha,
    );
    console.log('=== END API SERVICE DEBUG ===');
    return result;
  }

  async changePassword(passwordData) {
    return this.put('/users/change-password', passwordData);
  }

  async forgotPassword(email) {
    return this.post('/users/forgot-password', { email });
  }

  async resetPassword(token, newPassword) {
    return this.post('/users/reset-password', { token, newPassword });
  }

  async getUserActivity(days = 30) {
    return this.get(`/users/activity?days=${days}`);
  }

  // Admin API methods
  async getAllUsers() {
    return this.get('/users/admin/users');
  }

  async updateUserRole(userId, role) {
    return this.put(`/users/admin/users/${userId}/role`, { role });
  }

  // Activity Logs API methods
  async getActivityLogs(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.get(`/activity-logs?${queryParams}`);
  }

  async getActivityStats() {
    return this.get('/activity-logs/stats');
  }

  async getActivityLogsByUser(username, params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.get(`/activity-logs/user/${username}?${queryParams}`);
  }

  async getActivityLogsByRole(role, params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.get(`/activity-logs/role/${role}?${queryParams}`);
  }

  async exportActivityLogs(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.get(`/activity-logs/export?${queryParams}`);
  }

  async exportActivityLogsPDF(params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.get(`/activity-logs/export-pdf?${queryParams}`, {
      responseType: 'blob',
    });
  }

  async cleanupActivityLogs(days = 90) {
    return this.delete('/activity-logs/cleanup', { days });
  }

  async clearAllActivityLogs() {
    return this.delete('/activity-logs/clear-all');
  }

  async clearActivityLogsByDateRange(startDate, endDate) {
    return this.delete('/activity-logs/clear-by-date', { startDate, endDate });
  }

  async clearActivityLogsByUser(username) {
    return this.delete('/activity-logs/clear-by-user', { username });
  }

  async clearActivityLogsByAction(action) {
    return this.delete('/activity-logs/clear-by-action', { action });
  }

  async clearActivityLogsByRole(role) {
    return this.delete('/activity-logs/clear-by-role', { role });
  }

  async clearFailedActivityLogs() {
    return this.delete('/activity-logs/clear-failed');
  }

  async clearActivityLogsOlderThan(days) {
    return this.delete('/activity-logs/clear-older-than', { days });
  }

  // Info Data API methods
  async getInfoData() {
    return this.get('/info-data');
  }

  async getInfoDataByType(type) {
    try {
      return await this.get(`/info-data/${type}`);
    } catch (error) {
      // Don't retry 404 errors for info data - it's expected for missing data
      if (error.message.includes('Info data not found')) {
        throw error; // Re-throw without retry
      }
      return this.get(`/info-data/${type}`); // Retry for other errors
    }
  }

  async createOrUpdateInfoData(data) {
    return this.post('/info-data', data);
  }

  async updateInfoData(type, data) {
    return this.put(`/info-data/${type}`, data);
  }

  async deleteInfoData(type) {
    return this.delete(`/info-data/${type}`);
  }

  async getInfoDataHistory(type, params = {}) {
    const queryParams = new URLSearchParams(params);
    return this.get(`/info-data/${type}/history?${queryParams}`);
  }

  // Prayer Times API methods
  async getPrayerTimes() {
    return this.get('/prayer-times');
  }

  async updatePrayerTimes(times) {
    console.log('🔍 API Service - updatePrayerTimes called with:', times);
    console.log('🔍 API Service - Current token exists:', !!this.getToken());
    console.log('🔍 API Service - Token length:', this.getToken()?.length || 0);
    try {
      const result = await this.put('/prayer-times', times);
      console.log('✅ API Service - updatePrayerTimes success:', result);
      return result;
    } catch (error) {
      console.error('❌ API Service - updatePrayerTimes error:', error);
      throw error;
    }
  }

  async getPrayerTimesHistory() {
    return this.get('/prayer-times/history');
  }

  // Contact API methods
  async submitContactForm(contactData) {
    return this.post('/contact', contactData);
  }

  async getContactMessages(
    page = 1,
    limit = 20,
    category = null,
    status = null,
  ) {
    let url = `/contact?page=${page}&limit=${limit}`;
    if (category) url += `&category=${category}`;
    if (status) url += `&status=${status}`;
    return this.get(url);
  }

  async updateContactStatus(messageId, status) {
    return this.patch(`/contact/${messageId}/status`, { status });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(
        `${this.baseURL}/health`.replace('/api/health', '/api/health'),
      );
      return response.json();
    } catch (error) {
      throw new Error('Server is not responding');
    }
  }

  // Track activity
  async trackActivity(action, details = {}) {
    try {
      return this.post('/activity', { action, details });
    } catch (error) {
      console.error('Activity tracking failed:', error);
      return { success: false };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { apiService };
