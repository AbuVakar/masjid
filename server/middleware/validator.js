const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Basic email validation regex (kept for reference, but express-validator's is better)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A new middleware to handle the validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors to be consistent with the old error format
    const formattedErrors = errors.array().reduce((acc, error) => {
      acc[error.path] = error.msg;
      return acc;
    }, {});
    throw new AppError(
      'Invalid input data',
      400,
      'VALIDATION_ERROR',
      formattedErrors,
    );
  }
  next();
};

const validate = (schema) => (req, res, next) => {
  const errors = {};
  for (const key in schema) {
    const rule = schema[key];
    const value = req.body[key];
    const result = rule(value);
    if (result !== true) {
      errors[key] = result;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Invalid input data', 400, 'VALIDATION_ERROR', errors);
  }

  next();
};

/**
 * Validate pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    throw new AppError(
      'Invalid page number. Must be a positive integer.',
      400,
      'INVALID_PAGE',
    );
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    throw new AppError(
      'Invalid limit. Must be between 1 and 100.',
      400,
      'INVALID_LIMIT',
    );
  }

  next();
};

/**
 * Validate search parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSearch = (req, res, next) => {
  const { search } = req.query;

  if (search && (typeof search !== 'string' || search.length > 100)) {
    throw new AppError(
      'Search query too long. Maximum 100 characters allowed.',
      400,
      'INVALID_SEARCH',
    );
  }

  next();
};

// --- New express-validator chains ---

const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long.')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers.')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
    ),
  body('name').optional().trim().escape(),
  body('mobile')
    .optional()
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid mobile number.'),
  handleValidationErrors,
];

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters.')
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('mobile')
    .optional()
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid mobile number.'),
  // Assuming preferences is an object, we can't easily validate it here without more info.
  // If it's a JSON string, we could use .isJSON()
  body('preferences').optional(),
  handleValidationErrors,
];

// --- Keeping old validation logic for things not yet refactored ---

const rules = {
  username: (value) => {
    if (!value || typeof value !== 'string' || value.trim().length < 3) {
      return 'Username is required and must be at least 3 characters long.';
    }
    return true;
  },
  password: (value) => {
    if (!value || typeof value !== 'string' || value.length < 6) {
      return 'Password is required and must be at least 6 characters long.';
    }
    return true;
  },
  passwordComplex: (value) => {
    if (!value || typeof value !== 'string' || value.length < 6) {
      return 'Password is required and must be at least 6 characters long.';
    }
    return true;
  },
  token: (value) => {
    if (!value || typeof value !== 'string') {
      return 'Token is required.';
    }
    return true;
  },
};

const validateLogin = validate({
  username: rules.username,
  password: rules.password,
});

const validateChangePassword = validate({
  currentPassword: rules.password,
  newPassword: rules.passwordComplex,
});

const validateForgotPassword = validate({
  email: (value) => {
    if (!value || typeof value !== 'string' || !emailRegex.test(value)) {
      return 'A valid email is required.';
    }
    return true;
  },
});

const validateResetPassword = validate({
  token: rules.token,
  newPassword: rules.passwordComplex,
});

const validateHouse = validate({
  number: (value) => {
    if (value == null || value === '') {
      return 'House number is required.';
    }
    return true;
  },
  street: (value) => {
    if (value && (typeof value !== 'string' || value.trim().length === 0)) {
      return 'Street must be a non-empty string.';
    }
    return true;
  },
});

const validateMember = validate({
  name: (value) => {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return 'Member name is required.';
    }
    return true;
  },
  age: (value) => {
    const ageNum = typeof value === 'string' ? Number(value) : value;
    if (
      ageNum != null &&
      (typeof ageNum !== 'number' ||
        isNaN(ageNum) ||
        ageNum < 0 ||
        ageNum > 150)
    ) {
      return 'Age must be a valid number between 0 and 150.';
    }
    return true;
  },
  gender: (value) => {
    if (value && !['Male', 'Female'].includes(value)) {
      return 'Gender must be Male or Female.';
    }
    return true;
  },
  role: (value) => {
    if (value && !['Head', 'Member'].includes(value)) {
      return 'Role must be Head or Member.';
    }
    return true;
  },
});

const validateResource = (req, res, next) => {
  // A bit more complex due to file upload, so we do it manually for now
  const { title, description, category } = req.body;
  const errors = {};

  if (!title || title.trim().length < 3) {
    errors.title = 'Title is required and must be at least 3 characters long.';
  }

  if (!description || description.trim().length < 10) {
    errors.description =
      'Description is required and must be at least 10 characters long.';
  }

  if (!category || category.trim().length === 0) {
    errors.category = 'Category is required.';
  }

  // File validation
  if (req.file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      errors.file = 'File size too large. Maximum 10MB allowed.';
    }

    const allowedTypes = [
      'pdf',
      'doc',
      'docx',
      'jpg',
      'jpeg',
      'png',
      'mp4',
      'mp3',
    ];
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      errors.file =
        'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, MP4, MP3';
    }
  }

  if (!req.file && !req.body.fileUrl) {
    // Only require file or fileUrl on create, not update
    if (req.method === 'POST') {
      errors.file = 'A file or fileUrl is required to create a resource.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Invalid input data', 400, 'VALIDATION_ERROR', errors);
  }

  next();
};

module.exports = {
  validateRegistration, // New
  validateUpdateProfile, // New
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateHouse,
  validateMember,
  validateResource,
  validatePagination,
  validateSearch,
};
