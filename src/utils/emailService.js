import apiService from '../services/api';

/**
 * Email Service
 * Handles email notifications for admin alerts
 */
class EmailService {
  constructor() {
    this.isEnabled = false;
    this.adminEmails = [];
    this.templates = {
      critical: {
        subject: '🚨 CRITICAL ALERT - Admin Notification',
        template: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🚨 CRITICAL ALERT</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd;">
              <h2>${data.message}</h2>
              <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>User:</strong> ${data.username}</p>
                <p><strong>Action:</strong> ${data.action}</p>
                <p><strong>Resource:</strong> ${data.resource}</p>
                <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                ${data.details ? `<p><strong>Details:</strong> ${JSON.stringify(data.details, null, 2)}</p>` : ''}
              </div>
              <p style="color: #666; font-size: 12px;">
                This is an automated notification from the Admin Notification System.
              </p>
            </div>
          </div>
        `,
      },
      important: {
        subject: '⚠️ IMPORTANT - Admin Notification',
        template: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fd7e14; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">⚠️ IMPORTANT</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd;">
              <h2>${data.message}</h2>
              <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>User:</strong> ${data.username}</p>
                <p><strong>Action:</strong> ${data.action}</p>
                <p><strong>Resource:</strong> ${data.resource}</p>
                <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                ${data.details ? `<p><strong>Details:</strong> ${JSON.stringify(data.details, null, 2)}</p>` : ''}
              </div>
              <p style="color: #666; font-size: 12px;">
                This is an automated notification from the Admin Notification System.
              </p>
            </div>
          </div>
        `,
      },
      regular: {
        subject: 'ℹ️ Admin Notification',
        template: (data) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">ℹ️ Notification</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd;">
              <h2>${data.message}</h2>
              <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
                <p><strong>User:</strong> ${data.username}</p>
                <p><strong>Action:</strong> ${data.action}</p>
                <p><strong>Resource:</strong> ${data.resource}</p>
                <p><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
                ${data.details ? `<p><strong>Details:</strong> ${JSON.stringify(data.details, null, 2)}</p>` : ''}
              </div>
              <p style="color: #666; font-size: 12px;">
                This is an automated notification from the Admin Notification System.
              </p>
            </div>
          </div>
        `,
      },
    };
  }

  /**
   * Initialize email service
   */
  async init() {
    try {
      // Load settings from localStorage
      this.loadSettings();

      // Check if email service is available
      await this.checkEmailService();

      console.log('Email service initialized');
    } catch (error) {
      console.error('Email service initialization failed:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const enabled = localStorage.getItem('emailNotificationsEnabled');
      const emails = localStorage.getItem('adminEmailAddresses');

      this.isEnabled = enabled === 'true';
      this.adminEmails = emails ? JSON.parse(emails) : [];
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(
        'emailNotificationsEnabled',
        this.isEnabled.toString(),
      );
      localStorage.setItem(
        'adminEmailAddresses',
        JSON.stringify(this.adminEmails),
      );
    } catch (error) {
      console.error('Error saving email settings:', error);
    }
  }

  /**
   * Check if email service is available
   */
  async checkEmailService() {
    try {
      // This would typically check with your backend email service
      // For now, we'll assume it's available if we have admin emails configured
      return this.adminEmails.length > 0;
    } catch (error) {
      console.error('Email service check failed:', error);
      return false;
    }
  }

  /**
   * Enable/disable email notifications
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    this.saveSettings();
  }

  /**
   * Add admin email address
   */
  addAdminEmail(email) {
    if (this.isValidEmail(email) && !this.adminEmails.includes(email)) {
      this.adminEmails.push(email);
      this.saveSettings();
      return true;
    }
    return false;
  }

  /**
   * Remove admin email address
   */
  removeAdminEmail(email) {
    this.adminEmails = this.adminEmails.filter((e) => e !== email);
    this.saveSettings();
  }

  /**
   * Get all admin email addresses
   */
  getAdminEmails() {
    return [...this.adminEmails];
  }

  /**
   * Validate email address
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Send email notification
   */
  async sendEmail(notification) {
    if (!this.isEnabled || this.adminEmails.length === 0) {
      return {
        success: false,
        error: 'Email notifications disabled or no admin emails configured',
      };
    }

    try {
      const template =
        this.templates[notification.priority.toLowerCase()] ||
        this.templates.regular;
      const emailData = {
        to: this.adminEmails,
        subject: template.subject,
        html: template.template(notification),
        priority: notification.priority,
        timestamp: notification.timestamp,
      };

      // Send email via API
      const response = await this.sendEmailViaAPI(emailData);

      if (response.success) {
        console.log('Email notification sent successfully');
        return { success: true, sentTo: this.adminEmails.length };
      } else {
        console.error('Email notification failed:', response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is properly authenticated
   */
  checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');

    if (!user || !token) {
      return { authenticated: false, reason: 'No user or token found' };
    }

    return { authenticated: true, user, token };
  }

  /**
   * Send email via API (real backend integration)
   */
  async sendEmailViaAPI(emailData) {
    try {
      // Check authentication status
      const authStatus = this.checkAuthentication();
      if (!authStatus.authenticated) {
        throw new Error(
          `Authentication failed: ${authStatus.reason}. Please log in again.`,
        );
      }

      let { token } = authStatus;

      // Always try to refresh token to ensure it's valid
      try {
        await apiService.refreshToken();
        token = localStorage.getItem('token'); // Get the refreshed token

        // Double-check that we have a valid token after refresh
        if (!token) {
          throw new Error('Token refresh failed - no token available');
        }
      } catch (refreshError) {
        console.error(
          'Email service: Token refresh failed, trying with current token',
          refreshError,
        );

        // If refresh failed, check if we still have a token
        token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No valid authentication token available');
        }

        // If we have a token but refresh failed, it might be expired
        // Try to use it anyway, but warn the user
        console.warn('Email service: Using potentially expired token');
      }

      // Prepare the request data
      const requestData = {
        notification: {
          message: emailData.text,
          username: emailData.notification?.username || 'System',
          action: emailData.notification?.action || 'NOTIFICATION',
          resource: emailData.notification?.resource || 'SYSTEM',
          priority: emailData.priority,
          timestamp:
            emailData.notification?.timestamp || new Date().toISOString(),
          details: emailData.notification?.details || {},
        },
        adminEmails: emailData.to,
      };

      console.log('Sending email via API:', requestData);

      // Make the API call to the backend
      const apiUrl =
        process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/admin/send-notification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();
      console.log('Email API response:', result);

      return result;
    } catch (error) {
      console.error('Email API error:', error);

      // If authentication failed, suggest re-login
      if (
        error.message.includes('authentication') ||
        error.message.includes('token')
      ) {
        console.warn(
          'Email service: Authentication issue detected. Please log in again.',
        );

        // Optionally redirect to login page
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            if (
              window.confirm(
                'Authentication failed. Would you like to log in again?',
              )
            ) {
              window.location.href = '/login';
            }
          }, 1000);
        }
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail() {
    try {
      // First check authentication
      const authStatus = this.checkAuthentication();
      if (!authStatus.authenticated) {
        console.error(
          'Email service: Authentication failed:',
          authStatus.reason,
        );
        console.log('Email service: Current localStorage state:');
        console.log('- User:', localStorage.getItem('user'));
        console.log('- Token exists:', !!localStorage.getItem('token'));

        // Try to refresh token before giving up
        try {
          console.log('Email service: Attempting token refresh...');
          await apiService.refreshToken();

          // Check authentication again after refresh
          const newAuthStatus = this.checkAuthentication();
          if (newAuthStatus.authenticated) {
            console.log(
              'Email service: Authentication successful after token refresh',
            );
          } else {
            return {
              success: false,
              error: `Cannot send test email: ${newAuthStatus.reason}. Please log in first.`,
              details: {
                userExists: !!localStorage.getItem('user'),
                tokenExists: !!localStorage.getItem('token'),
                suggestion: 'Please log in again to refresh your session',
              },
            };
          }
        } catch (refreshError) {
          console.error('Email service: Token refresh failed:', refreshError);
          return {
            success: false,
            error: `Cannot send test email: ${authStatus.reason}. Please log in first.`,
            details: {
              userExists: !!localStorage.getItem('user'),
              tokenExists: !!localStorage.getItem('token'),
              suggestion: 'Please log in again to refresh your session',
            },
          };
        }
      }

      console.log(
        'Email service: Authentication successful, sending test email...',
      );
      const currentAuthStatus = this.checkAuthentication();
      console.log('Email service: User:', currentAuthStatus.user.username);

      const testNotification = {
        message: 'This is a test email notification',
        username: currentAuthStatus.user.username || 'test-user',
        action: 'TEST_ACTION',
        resource: 'TEST_RESOURCE',
        priority: 'IMPORTANT',
        timestamp: new Date().toISOString(),
        details: { test: true },
      };

      return await this.sendEmail(testNotification);
    } catch (error) {
      console.error('Email service: Error in sendTestEmail:', error);
      return {
        success: false,
        error: `Email service error: ${error.message}`,
        details: {
          userExists: !!localStorage.getItem('user'),
          tokenExists: !!localStorage.getItem('token'),
          suggestion: 'Please check console for details',
        },
      };
    }
  }

  /**
   * Get email service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      adminEmails: this.adminEmails.length,
      configured: this.adminEmails.length > 0,
      ready: this.isEnabled && this.adminEmails.length > 0,
    };
  }

  /**
   * Get email templates
   */
  getTemplates() {
    return Object.keys(this.templates);
  }

  /**
   * Update email template
   */
  updateTemplate(priority, template) {
    if (this.templates[priority]) {
      this.templates[priority] = template;
      return true;
    }
    return false;
  }

  /**
   * Get email statistics
   */
  async getEmailStats() {
    // This would typically fetch from your backend
    // For now, return mock data
    return {
      totalSent: 0,
      successRate: 100,
      lastSent: null,
      adminEmails: this.adminEmails.length,
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

// Initialize on load
emailService.init();

export default emailService;
