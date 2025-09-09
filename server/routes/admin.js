const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const House = require('../models/House');
const Resource = require('../models/Resource');
const PrayerTime = require('../models/PrayerTime');
const { AuditLogger } = require('../utils/auditLogger');
const { logActivity } = require('../utils/activityLogger');
const { sendAdminNotificationEmail } = require('../utils/emailService');

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Admin
router.get(
  '/users',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');

    res.json({
      success: true,
      data: users,
    });
  }),
);

// @desc    Get audit logs (admin only)
// @route   GET /api/admin/audit-logs
// @access  Admin
router.get(
  '/audit-logs',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, userId, action, success } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (success !== undefined) filter.success = success === 'true';

    const auditLogs = await AuditLogger.getAuditLogs(
      filter,
      parseInt(page),
      parseInt(limit),
    );

    res.json({
      success: true,
      data: auditLogs.logs,
      pagination: {
        page: auditLogs.page,
        totalPages: auditLogs.totalPages,
        total: auditLogs.total,
      },
    });
  }),
);

// @desc    Get system statistics (admin only)
// @route   GET /api/admin/stats
// @access  Admin
router.get(
  '/stats',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      totalHouses,
      totalMembers,
      totalResources,
      totalPrayerTimes,
    ] = await Promise.all([
      User.countDocuments(),
      House.countDocuments(),
      House.aggregate([
        {
          $group: {
            _id: null,
            totalMembers: { $sum: { $size: '$members' } },
          },
        },
      ]),
      Resource.countDocuments(),
      PrayerTime.countDocuments(),
    ]);

    const memberCount = totalMembers[0]?.totalMembers || 0;

    res.json({
      success: true,
      data: {
        users: totalUsers,
        houses: totalHouses,
        members: memberCount,
        resources: totalResources,
        prayerTimes: totalPrayerTimes,
      },
    });
  }),
);

// @desc    Get all houses with full access (admin only)
// @route   GET /api/admin/houses
// @access  Admin
router.get(
  '/houses',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const houses = await House.find({}).sort({ number: 1 });

    res.json({
      success: true,
      data: houses,
    });
  }),
);

// @desc    Get all resources with full access (admin only)
// @route   GET /api/admin/resources
// @access  Admin
router.get(
  '/resources',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const resources = await Resource.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: resources,
    });
  }),
);

// @desc    Update user role (admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Admin
router.put(
  '/users/:id/role',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    const { id } = req.params;

    if (!['user', 'admin'].includes(role)) {
      throw new AppError('Invalid role', 400, 'INVALID_ROLE');
    }

    // Check if user exists and get their current data
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Protect main admin user (username: 'admin')
    if (existingUser.username === 'admin') {
      throw new AppError(
        'Cannot modify the main administrator account',
        403,
        'PROTECTED_ADMIN',
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    ).select('-password');

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  }),
);

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Admin
router.delete(
  '/users/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists before deleting
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Protect main admin user (username: 'admin')
    if (existingUser.username === 'admin') {
      throw new AppError(
        'Cannot delete the main administrator account',
        403,
        'PROTECTED_ADMIN',
      );
    }

    const user = await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: null,
    });
  }),
);

// @desc    Get system backup data (admin only)
// @route   GET /api/admin/backup
// @access  Admin
router.get(
  '/backup',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [users, houses, resources, prayerTimes] = await Promise.all([
      User.find({}).select('-password'),
      House.find({}),
      Resource.find({}),
      PrayerTime.find({}),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        users,
        houses,
        resources,
        prayerTimes,
      },
    };

    res.json({
      success: true,
      data: backupData,
    });
  }),
);

// @desc    Send admin notification email (admin only)
// @route   POST /api/admin/send-notification-email
// @access  Admin
router.post(
  '/send-notification-email',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { notification, adminEmails } = req.body;

    if (
      !notification ||
      !adminEmails ||
      !Array.isArray(adminEmails) ||
      adminEmails.length === 0
    ) {
      throw new AppError(
        'Invalid request: notification and adminEmails array required',
        400,
        'INVALID_REQUEST',
      );
    }

    try {
      const emailResult = await sendAdminNotificationEmail(
        notification,
        adminEmails,
      );

      res.json({
        success: true,
        message: 'Admin notification email sent successfully',
        data: emailResult,
      });
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
      throw new AppError(
        'Failed to send email notification',
        500,
        'EMAIL_SEND_FAILED',
      );
    }
  }),
);

module.exports = router;
