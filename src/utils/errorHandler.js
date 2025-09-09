/**
 * Enhanced Error Handling and Performance Monitoring Service
 * Provides comprehensive error handling, performance tracking, and recovery mechanisms
 */

import { notify } from './notification';

// --- Sanitization Logic ---
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'auth',
  'cookie',
];

/**
 * Recursively sanitizes an object by redacting sensitive keys.
 * @param {*} data - The data to sanitize (object, array, or primitive).
 * @returns {*} The sanitized data.
 */
function sanitizeObject(data) {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (
        SENSITIVE_KEYS.some((sensitiveKey) =>
          key.toLowerCase().includes(sensitiveKey),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(data[key]);
      }
    }
  }
  return sanitized;
}

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  SLOW_OPERATION: 1000, // 1 second
  VERY_SLOW_OPERATION: 5000, // 5 seconds
  MEMORY_WARNING: 50 * 1024 * 1024, // 50MB
};

/**
 * Enhanced error logger with severity and context
 * @param {Error} error - Error object
 * @param {string} context - Error context (component, function, etc.)
 * @param {string} severity - Error severity level
 * @param {Object} additionalData - Additional error data
 */
export const logError = (
  error,
  context = 'Unknown',
  severity = ERROR_SEVERITY.MEDIUM,
  additionalData = {},
) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: sanitizeObject({
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      name: error?.name,
      // Include other potential error properties
      ...error,
    }),
    context,
    severity,
    additionalData: sanitizeObject(additionalData),
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getSessionId(),
  };

  // Console logging based on severity
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      console.error('🚨 CRITICAL ERROR:', errorLog);
      break;
    case ERROR_SEVERITY.HIGH:
      console.error('⚠️ HIGH SEVERITY ERROR:', errorLog);
      break;
    case ERROR_SEVERITY.MEDIUM:
      console.warn('⚠️ MEDIUM SEVERITY ERROR:', errorLog);
      break;
    case ERROR_SEVERITY.LOW:
      console.info('ℹ️ LOW SEVERITY ERROR:', errorLog);
      break;
    default:
      console.warn('⚠️ UNKNOWN SEVERITY ERROR:', errorLog);
      break;
  }

  // Log error to console for debugging (no localStorage)
  console.error('Error logged:', errorLog);

  // Send to error reporting service in production
  if (process.env.NODE_ENV === 'production') {
    sendErrorToService(errorLog);
  }
};

/**
 * Performance monitoring wrapper
 * @param {string} operationName - Name of the operation being monitored
 * @param {Function} operation - Function to monitor
 * @param {Object} options - Monitoring options
 * @returns {Promise<any>} Result of the operation
 */
export const measurePerformance = async (
  operationName,
  operation,
  options = {},
) => {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize || 0;

  try {
    const result = await operation();

    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize || 0;
    const duration = endTime - startTime;
    const memoryUsed = endMemory - startMemory;

    // Log performance metrics
    logPerformance(operationName, duration, memoryUsed, 'success');

    // Warn if operation is slow
    if (duration > PERFORMANCE_THRESHOLDS.VERY_SLOW_OPERATION) {
      console.warn(
        `🐌 VERY SLOW OPERATION: ${operationName} took ${duration.toFixed(2)}ms`,
      );
      notify(`${operationName} is taking longer than expected`, {
        type: 'warning',
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.SLOW_OPERATION) {
      console.warn(
        `🐌 SLOW OPERATION: ${operationName} took ${duration.toFixed(2)}ms`,
      );
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    logPerformance(operationName, duration, 0, 'error');
    logError(error, operationName, ERROR_SEVERITY.HIGH);

    throw error;
  }
};

/**
 * Log performance metrics
 * @param {string} operationName - Name of the operation
 * @param {number} duration - Duration in milliseconds
 * @param {number} memoryUsed - Memory used in bytes
 * @param {string} status - Operation status
 */
const logPerformance = (operationName, duration, memoryUsed, status) => {
  const performanceLog = {
    timestamp: new Date().toISOString(),
    operation: operationName,
    duration: Math.round(duration),
    memoryUsed: Math.round(memoryUsed),
    status,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Performance logging removed - using MongoDB for persistence

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `📊 Performance: ${operationName} - ${duration.toFixed(2)}ms - ${status}`,
    );
  }
};

/**
 * Enhanced async error handler with retry mechanism
 * @param {Function} asyncFunction - Async function to execute
 * @param {Object} options - Error handling options
 * @returns {Promise<any>} Result of the function
 */
export const handleAsyncError = async (asyncFunction, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    context = 'Async Operation',
    severity = ERROR_SEVERITY.MEDIUM,
    onError = null,
    fallbackValue = null,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFunction();
    } catch (error) {
      lastError = error;

      logError(
        error,
        `${context} (Attempt ${attempt}/${maxRetries})`,
        severity,
      );

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
        console.log(
          `🔄 Retrying ${context} (Attempt ${attempt + 1}/${maxRetries})`,
        );
      }
    }
  }

  // All retries failed
  if (onError) {
    onError(lastError);
  }

  if (fallbackValue !== null) {
    return fallbackValue;
  }

  throw lastError;
};

/**
 * Create error recovery wrapper for operations
 * @param {Function} operation - Operation to wrap
 * @param {Object} options - Recovery options
 * @returns {Function} Wrapped operation with error recovery
 */
export const createErrorRecovery = (operation, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    context = 'Operation',
    severity = ERROR_SEVERITY.MEDIUM,
    onError = null,
    fallbackValue = null,
  } = options;

  return async (...args) => {
    return handleAsyncError(() => operation(...args), {
      maxRetries,
      retryDelay,
      context,
      severity,
      onError,
      fallbackValue,
    });
  };
};

/**
 * Safe JSON parsing with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed JSON or fallback value
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError(error, 'JSON Parse', ERROR_SEVERITY.LOW);
    return fallback;
  }
};

// localStorage functions removed - using MongoDB for persistence

/**
 * Enhanced WebSocket error suppression
 * @param {Event} event - WebSocket error event
 * @returns {boolean} Whether to suppress the error
 */
export const suppressWebSocketErrors = (event) => {
  const errorMessage = event.error?.message || event.message || '';

  // Suppress browser extension errors
  const suppressPatterns = [
    'content-script',
    'extension',
    'getThumbnail',
    'chrome-extension',
    'moz-extension',
    'ms-browser-extension',
  ];

  const shouldSuppress = suppressPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase()),
  );

  if (shouldSuppress) {
    console.debug('Suppressed WebSocket error:', errorMessage);
    return true;
  }

  return false;
};

/**
 * Initialize global error handlers
 */
export const initializeErrorHandling = () => {
  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    // Suppress browser extension errors
    if (
      error &&
      typeof error === 'string' &&
      (error.includes('content-script') || error.includes('getThumbnail'))
    ) {
      return;
    }

    logError(error, 'Unhandled Promise Rejection', ERROR_SEVERITY.HIGH);
    notify('An unexpected error occurred. Please try again.', {
      type: 'error',
    });
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    const error = event.error || event.message;

    // Suppress browser extension errors
    if (
      error &&
      typeof error === 'string' &&
      (error.includes('content-script') || error.includes('getThumbnail'))
    ) {
      return;
    }

    logError(error, 'Global Error', ERROR_SEVERITY.HIGH);
  });

  // WebSocket error suppression
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    const ws = new originalWebSocket(url, protocols);

    ws.addEventListener('error', (event) => {
      if (!suppressWebSocketErrors(event)) {
        logError(
          event.error || new Error('WebSocket error'),
          'WebSocket',
          ERROR_SEVERITY.MEDIUM,
        );
      }
    });

    return ws;
  };

  // Enhanced error monitoring
  setupErrorMonitoring();

  console.log('✅ Error handling initialized');
};

/**
 * Setup comprehensive error monitoring
 */
export const setupErrorMonitoring = () => {
  // Monitor for memory leaks
  if (performance.memory) {
    setInterval(() => {
      const memoryUsage = performance.memory;
      if (memoryUsage.usedJSHeapSize > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
        logError(
          new Error('High memory usage detected'),
          'Memory Monitor',
          ERROR_SEVERITY.MEDIUM,
          {
            usedJSHeapSize: memoryUsage.usedJSHeapSize,
            totalJSHeapSize: memoryUsage.totalJSHeapSize,
            jsHeapSizeLimit: memoryUsage.jsHeapSizeLimit,
          },
        );
      }
    }, 30000); // Check every 30 seconds
  }

  // Monitor for long-running tasks
  let observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > PERFORMANCE_THRESHOLDS.SLOW_OPERATION) {
        logError(
          new Error(`Long task detected: ${entry.duration}ms`),
          'Performance Monitor',
          ERROR_SEVERITY.LOW,
          {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          },
        );
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.warn('PerformanceObserver not supported');
  }
};

/**
 * Get unique session ID
 * @returns {string} Session ID
 */
const getSessionId = () => {
  // Generate session ID without sessionStorage
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Error logging removed - using MongoDB for persistence

// Performance logging removed - using MongoDB for persistence

// Log clearing removed - using MongoDB for persistence

/**
 * Send error to external service (placeholder for production)
 * @param {Object} errorLog - Error log object
 */
const sendErrorToService = async (errorLog) => {
  try {
    // In production, send to error reporting service like Sentry, LogRocket, etc.
    // For now, just log to console
    console.log('📤 Sending error to service:', errorLog);

    // Example: Send to your error reporting service
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog)
    // });
  } catch (error) {
    console.error('Failed to send error to service:', error);
  }
};

/**
 * Get error statistics
 * @returns {Object} Error statistics
 */
export const getErrorStats = () => {
  // Error stats removed - using MongoDB for persistence
  return {
    totalErrors: 0,
    errorCounts: {},
    totalPerformanceLogs: 0,
    averagePerformance: 0,
    lastError: null,
  };
};

/**
 * Clear all error and performance logs
 */
export const clearAllLogs = () => {
  // Log clearing removed - using MongoDB for persistence
  console.log('✅ All logs cleared (MongoDB managed)');
};

/**
 * Handle authentication errors with proper messaging
 * @param {Error} error - The error object
 * @param {string} action - The action being performed (login, register, etc.)
 * @param {Function} notify - Notification function
 * @returns {string} User-friendly error message
 */
export const handleAuthError = (error, action, notify) => {
  let userMessage = '';

  // Handle specific error types
  if (error.message) {
    if (error.message.includes('Invalid credentials')) {
      userMessage = 'Invalid username or password. Please try again.';
    } else if (error.message.includes('User not found')) {
      userMessage = 'User not found. Please check your username.';
    } else if (error.message.includes('Password')) {
      userMessage = 'Password is incorrect. Please try again.';
    } else if (error.message.includes('Username already exists')) {
      userMessage = 'Username already exists. Please choose a different one.';
    } else if (
      error.message.includes('Network') ||
      error.message.includes('fetch')
    ) {
      userMessage =
        'Network error. Please check your connection and try again.';
    } else if (error.message.includes('Server')) {
      userMessage = 'Server error. Please try again later.';
    } else {
      userMessage = `${action} failed. Please try again.`;
    }
  } else {
    userMessage = `${action} failed. Please try again.`;
  }

  // Log the error for debugging
  console.error(`${action} error:`, error);

  // Show notification only if notify function is provided
  if (notify) {
    notify(userMessage, { type: 'error' });
  }

  return userMessage;
};

/**
 * Handle success messages for authentication
 * @param {string} action - The action performed (login, register, etc.)
 * @param {string} username - The username
 * @param {Function} notify - Notification function
 */
export const handleAuthSuccess = (action, username, notify) => {
  let message = '';

  switch (action) {
    case 'login':
      message = `Welcome back, ${username}!`;
      break;
    case 'register':
      message = `Welcome, ${username}!`;
      break;
    case 'logout':
      message = 'Logged out successfully.';
      break;
    default:
      message = `${action} successful!`;
  }

  if (notify) {
    notify(message, { type: 'success' });
  }

  return message;
};
