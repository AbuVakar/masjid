/**
 * Comprehensive Data Validation Service
 * Provides input validation, sanitization, and security checks
 */

import { notify } from './notification';

// Constants for validation rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    MESSAGE:
      'Username must be 3-50 characters, letters, numbers, and underscores only',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    PATTERN: /^.{6,}$/,
    MESSAGE: 'Password must be at least 6 characters long',
  },
  MOBILE: {
    PATTERN: /^[6-9]\d{9}$/,
    MESSAGE: 'Mobile number must be 10 digits starting with 6-9',
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  AGE: {
    MIN: 0,
    MAX: 120,
    MESSAGE: 'Age must be between 0 and 120',
  },
  HOUSE_NUMBER: {
    PATTERN: /^[A-Za-z0-9/-]+$/,
    MESSAGE: 'House number can contain letters, numbers, /, and - only',
  },
  STREET_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[A-Za-z0-9\s\-.,]+$/,
    MESSAGE:
      'Street name can contain letters, numbers, spaces, hyphens, dots, and commas only',
  },
  TIME_HHMM: {
    PATTERN: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    MESSAGE: 'Please use a valid HH:MM time format.',
  },
};

/**
 * Validate time in HH:MM format
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateTime = (time) => {
  if (typeof time !== 'string') return false;
  return VALIDATION_RULES.TIME_HHMM.PATTERN.test(time);
};

/**
 * Sanitize input string to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';

  // Remove potentially dangerous characters while preserving valid content
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim(); // Only trim leading/trailing spaces, preserve internal spaces
};

/**
 * Validate and sanitize username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export const validateUsername = (username) => {
  const sanitized = sanitizeString(username);
  const errors = [];

  if (!sanitized) {
    errors.push('Username is required');
  } else if (sanitized.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
    errors.push(
      `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`,
    );
  } else if (sanitized.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
    errors.push(
      `Username must be less than ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters`,
    );
  } else if (!VALIDATION_RULES.USERNAME.PATTERN.test(sanitized)) {
    errors.push(VALIDATION_RULES.USERNAME.MESSAGE);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
};

/**
 * Validate and sanitize password
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
  } else if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
    );
  } else if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    errors.push(
      `Password must be less than ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters`,
    );
  } else if (!VALIDATION_RULES.PASSWORD.PATTERN.test(password)) {
    errors.push(VALIDATION_RULES.PASSWORD.MESSAGE);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate and sanitize mobile number
 * @param {string} mobile - Mobile number to validate
 * @returns {Object} Validation result
 */
export const validateMobile = (mobile) => {
  const errors = [];
  let sanitized = '';

  if (!mobile) {
    errors.push('Mobile number is required');
  } else {
    // International mobile number validation
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;
    if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
      errors.push('Please enter a valid mobile number');
    } else {
      sanitized = mobile.replace(/\s/g, '').trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
export const validateEmail = (email) => {
  const errors = [];
  let sanitized = '';

  if (!email) {
    errors.push('Email is required');
  } else {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please enter a valid email address');
    } else {
      sanitized = email.toLowerCase().trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
};

/**
 * Validate age
 * @param {number|string} age - Age to validate
 * @returns {Object} Validation result
 */
export const validateAge = (age) => {
  const errors = [];
  const numAge = parseInt(age);

  if (isNaN(numAge)) {
    errors.push('Age must be a valid number');
  } else if (
    numAge < VALIDATION_RULES.AGE.MIN ||
    numAge > VALIDATION_RULES.AGE.MAX
  ) {
    errors.push(VALIDATION_RULES.AGE.MESSAGE);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: errors.length === 0 ? numAge : null,
  };
};

/**
 * Validate house data
 * @param {Object} house - House object to validate
 * @returns {Object} Validation result
 */
export const validateHouse = (house) => {
  const errors = [];
  const sanitized = {};

  // Validate required fields
  if (!house.street || !sanitizeString(house.street)) {
    errors.push('Street name is required');
  } else {
    const streetValidation = validateStreetName(house.street);
    if (!streetValidation.isValid) {
      errors.push(...streetValidation.errors);
    } else {
      sanitized.street = streetValidation.sanitized;
    }
  }

  if (!house.houseNumber || !sanitizeString(house.houseNumber)) {
    errors.push('House number is required');
  } else {
    const houseNumberValidation = validateHouseNumber(house.houseNumber);
    if (!houseNumberValidation.isValid) {
      errors.push(...houseNumberValidation.errors);
    } else {
      sanitized.houseNumber = houseNumberValidation.sanitized;
    }
  }

  // Validate members array
  if (!house.members || !Array.isArray(house.members)) {
    errors.push('House must have members array');
  } else if (house.members.length === 0) {
    errors.push('House must have at least one member');
  } else {
    const memberErrors = [];
    house.members.forEach((member, index) => {
      const memberValidation = validateMember(member);
      if (!memberValidation.isValid) {
        memberErrors.push(
          `Member ${index + 1}: ${memberValidation.errors.join(', ')}`,
        );
      }
    });
    if (memberErrors.length > 0) {
      errors.push(...memberErrors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? { ...house, ...sanitized } : null,
  };
};

/**
 * Validate member data
 * @param {Object} member - Member object to validate
 * @returns {Object} Validation result
 */
export const validateMember = (member) => {
  const errors = [];
  const sanitized = {};

  // Validate required fields
  if (!member.name || !member.name.trim()) {
    errors.push('Member name is required');
  } else {
    // Preserve spaces in names, only sanitize for XSS
    sanitized.name = member.name.trim();
  }

  if (!member.age) {
    errors.push('Member age is required');
  } else {
    const ageValidation = validateAge(member.age);
    if (!ageValidation.isValid) {
      errors.push(...ageValidation.errors);
    } else {
      sanitized.age = ageValidation.value;
    }
  }

  if (!member.gender) {
    errors.push('Member gender is required');
  } else {
    const gender = sanitizeString(member.gender).toLowerCase();
    if (!['male', 'female', 'other'].includes(gender)) {
      errors.push('Gender must be male, female, or other');
    } else {
      sanitized.gender = gender;
    }
  }

  // Validate optional fields
  if (member.mobile) {
    const mobileValidation = validateMobile(member.mobile);
    if (!mobileValidation.isValid) {
      errors.push(...mobileValidation.errors);
    } else {
      sanitized.mobile = mobileValidation.sanitized;
    }
  }

  if (member.email) {
    const emailValidation = validateEmail(member.email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    } else {
      sanitized.email = emailValidation.sanitized;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? { ...member, ...sanitized } : null,
  };
};

/**
 * Validate street name
 * @param {string} street - Street name to validate
 * @returns {Object} Validation result
 */
export const validateStreetName = (street) => {
  const sanitized = street ? street.trim() : '';
  const errors = [];

  if (!sanitized) {
    errors.push('Street name is required');
  } else if (sanitized.length < VALIDATION_RULES.STREET_NAME.MIN_LENGTH) {
    errors.push(
      `Street name must be at least ${VALIDATION_RULES.STREET_NAME.MIN_LENGTH} characters`,
    );
  } else if (sanitized.length > VALIDATION_RULES.STREET_NAME.MAX_LENGTH) {
    errors.push(
      `Street name must be less than ${VALIDATION_RULES.STREET_NAME.MAX_LENGTH} characters`,
    );
  } else if (!VALIDATION_RULES.STREET_NAME.PATTERN.test(sanitized)) {
    errors.push(VALIDATION_RULES.STREET_NAME.MESSAGE);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
};

/**
 * Validate house number
 * @param {string} houseNumber - House number to validate
 * @returns {Object} Validation result
 */
export const validateHouseNumber = (houseNumber) => {
  const sanitized = sanitizeString(houseNumber);
  const errors = [];

  if (!sanitized) {
    errors.push('House number is required');
  } else if (!VALIDATION_RULES.HOUSE_NUMBER.PATTERN.test(sanitized)) {
    errors.push(VALIDATION_RULES.HOUSE_NUMBER.MESSAGE);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
};

/**
 * Validate login credentials
 * @param {Object} credentials - Login credentials
 * @returns {Object} Validation result
 */
export const validateLoginCredentials = (credentials) => {
  const errors = [];
  const sanitized = {};

  // Validate username
  const usernameValidation = validateUsername(credentials.username);
  if (!usernameValidation.isValid) {
    errors.push(...usernameValidation.errors);
  } else {
    sanitized.username = usernameValidation.sanitized;
  }

  // Validate password for all users
  const passwordValidation = validatePassword(credentials.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  sanitized.password = credentials.password;

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null,
  };
};

/**
 * Validate registration data
 * @param {Object} userData - User registration data
 * @returns {Object} Validation result
 */
export const validateRegistrationData = (userData) => {
  const errors = [];
  const sanitized = {};

  // Validate username
  const usernameValidation = validateUsername(userData.username);
  if (!usernameValidation.isValid) {
    errors.push(...usernameValidation.errors);
  } else {
    sanitized.username = usernameValidation.sanitized;
  }

  // Validate password
  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate confirm password
  if (userData.password !== userData.confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Validate mobile
  if (userData.mobile) {
    const mobileValidation = validateMobile(userData.mobile);
    if (!mobileValidation.isValid) {
      errors.push(...mobileValidation.errors);
    } else {
      sanitized.mobile = mobileValidation.sanitized;
    }
  }

  // Validate email (required)
  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  } else {
    sanitized.email = emailValidation.sanitized;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? { ...userData, ...sanitized } : null,
  };
};

/**
 * Display validation errors as toast messages
 * @param {Array} errors - Array of error messages
 */
export const displayValidationErrors = (errors) => {
  if (Array.isArray(errors) && errors.length > 0) {
    errors.forEach((error) => notify(error, { type: 'error' }));
  }
};

/**
 * Rate limiting for authentication attempts
 */
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];

    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);

    return true;
  }

  reset(identifier) {
    this.attempts.delete(identifier);
  }
}

export const authRateLimiter = new RateLimiter();
