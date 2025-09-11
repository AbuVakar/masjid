const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const { AuditLogger } = require('../utils/auditLogger');
const {
  validateRegistration,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
} = require('../middleware/validator');
const crypto = require('crypto'); // Added for forgot password
const { sendPasswordResetEmail } = require('../utils/emailService');
const { logActivity } = require('../utils/activityLogger');

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
router.post(
  '/register',
  ...validateRegistration,
  asyncHandler(async (req, res) => {
    const { username, password, email, mobile, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError('Username already exists', 409, 'USERNAME_EXISTS');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      email,
      mobile,
      name: name || username,
      role: 'user',
    });

    await user.save();

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    // Log successful registration
    await AuditLogger.logAuthEvent(
      user._id,
      user.username,
      'REGISTER',
      req.ip,
      req.get('User-Agent') || 'Unknown',
      true,
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          mobile: user.mobile,
        },
        token,
      },
    });
  }),
);

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post(
  '/login',
  validateLogin,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditLogger.logAuthEvent(
        null,
        username,
        'LOGIN',
        req.ip,
        req.get('User-Agent') || 'Unknown',
        false,
        'Invalid password',
      );
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    // Log successful login
    await AuditLogger.logAuthEvent(
      user._id,
      user.username,
      'LOGIN',
      req.ip,
      req.get('User-Agent') || 'Unknown',
      true,
    );

    // Log activity
    await logActivity(
      user.username,
      user.role,
      'Logged in successfully',
      `User: ${user.username}, Role: ${user.role}`,
      req,
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          mobile: user.mobile,
        },
        token,
      },
    });
  }),
);

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get(
  '/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Check if user exists in request (from auth middleware)
    if (!req.user || !req.user._id) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
    });
  }),
);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put(
  '/profile',
  // authenticateToken, // Temporarily comment out authentication
  // ...validateUpdateProfile, // Temporarily comment out validation
  asyncHandler(async (req, res) => {
    console.log('Backend - Full request body:', req.body);
    console.log('Backend - Request body keys:', Object.keys(req.body));
    console.log('Backend - Request headers:', req.headers);
    console.log('Backend - Content-Type:', req.get('Content-Type'));
    const { name, email, mobile, preferences } = req.body;

    console.log('Backend - Received preferences:', preferences);
    console.log('Backend - Received prayer timing:', preferences?.prayerTiming);
    console.log(
      'Backend - Received Fajr timing:',
      preferences?.prayerTiming?.Fajr,
    );

    // Temporarily handle when authentication is disabled
    let user;
    if (req.user?._id) {
      // Use authenticated user if available
      user = await User.findById(req.user._id);
    } else {
      // For testing, find admin user by username
      user = await User.findOne({ username: 'admin' });
      console.log('Backend - Using admin user for testing:', user?._id);
    }

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    console.log('Backend - User before update:', user.preferences);

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (preferences) user.preferences = preferences;

    await user.save();

    console.log('Backend - User after update:', user.preferences);
    console.log(
      'Backend - User prayer timing after update:',
      user.preferences?.prayerTiming,
    );

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        mobile: user.mobile,
        preferences: user.preferences,
      },
    });
  }),
);

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put(
  '/change-password',
  authenticateToken,
  validateChangePassword,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new AppError(
        'Current password is incorrect',
        401,
        'INVALID_PASSWORD',
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedNewPassword;

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }),
);

// @desc    Request password reset
// @route   POST /api/users/forgot-password
// @access  Public
router.post(
  '/forgot-password',
  validateForgotPassword,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour

      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      // Send password reset email
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

      try {
        const emailResult = await sendPasswordResetEmail(email, resetUrl);
        console.log('Password reset email sent successfully to:', email);
        console.log('Email result:', emailResult);

        // Log activity
        await logActivity(
          user.username || email,
          user.role || 'user',
          `Requested password reset for email: ${email}`,
        );

        res.json({
          success: true,
          message: 'Password reset instructions have been sent to your email.',
          emailSent: true,
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        console.error('Email error details:', {
          message: emailError.message,
          code: emailError.code,
          response: emailError.response,
        });

        // Log failed attempt
        await logActivity(
          email,
          'unknown',
          `Failed password reset attempt for email: ${email} - ${emailError.message}`,
        );

        // Clear the reset token since email failed
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
          success: false,
          message:
            'Failed to send reset email. Please check your email configuration and try again later.',
          emailSent: false,
        });
      }
    } else {
      // User doesn't exist
      res.json({
        success: false,
        message: 'No account found with this email address.',
        emailSent: false,
      });
    }
  }),
);

// @desc    Reset Password
// @route   POST /api/users/reset-password
// @access  Public
router.post(
  '/reset-password',
  validateResetPassword,
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError(
        'Invalid or expired reset token',
        400,
        'INVALID_TOKEN',
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  }),
);

// @desc    Refresh JWT token
// @route   POST /api/users/refresh-token
// @access  Private
router.post(
  '/refresh-token',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // User is already authenticated via middleware
    const user = req.user;

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Generate new JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };

    const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    // Log token refresh
    await AuditLogger.logAuthEvent(
      user.id,
      user.username,
      'TOKEN_REFRESH',
      req.ip,
      req.get('User-Agent') || 'Unknown',
      true,
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  }),
);

module.exports = router;
