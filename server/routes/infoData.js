const express = require('express');
const router = express.Router();
const InfoData = require('../models/InfoData');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get all info data
// @route   GET /api/info-data
// @access  Private
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const infoData = await InfoData.find({ isActive: true }).sort({ type: 1 });

    res.json({
      success: true,
      data: infoData,
    });
  }),
);

// @desc    Get info data by type
// @route   GET /api/info-data/:type
// @access  Private
router.get(
  '/:type',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { type } = req.params;

    const infoData = await InfoData.findOne({ type, isActive: true });

    if (!infoData) {
      throw new AppError('Info data not found', 404, 'INFO_DATA_NOT_FOUND');
    }

    res.json({
      success: true,
      data: infoData,
    });
  }),
);

// @desc    Create or update info data
// @route   POST /api/info-data
// @access  Private
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { type, title, items, sections } = req.body;

    console.log('📥 Received info data request:', {
      type,
      title,
      itemsCount: items?.length || 0,
      sectionsCount: sections?.length || 0,
      items: items?.slice(0, 2), // Log first 2 items for debugging
    });

    // Validate required fields
    if (!type || !title) {
      throw new AppError(
        'Type and title are required',
        400,
        'MISSING_REQUIRED_FIELDS',
      );
    }

    // Check if info data already exists
    let infoData = await InfoData.findOne({ type });

    if (infoData) {
      // Update existing
      infoData.title = title;
      infoData.items = items || [];
      infoData.sections = sections || [];
      infoData.updatedBy = req.user.id;
      infoData.version += 1;

      try {
        await infoData.save();
      } catch (error) {
        console.error('❌ Validation error during update:', error.message);
        console.error('❌ Validation details:', error.errors);
        throw new AppError(
          `Validation failed: ${error.message}`,
          400,
          'VALIDATION_ERROR',
        );
      }

      // Log activity
      await logActivity(
        req.user.username || 'Admin',
        req.user.role || 'admin',
        `Updated ${type} information`,
        `Updated ${type} with ${items?.length || sections?.length || 0} items`,
        req,
      );

      res.json({
        success: true,
        message: 'Info data updated successfully',
        data: infoData,
      });
    } else {
      // Create new
      infoData = new InfoData({
        type,
        title,
        items: items || [],
        sections: sections || [],
        updatedBy: req.user.id,
      });

      try {
        await infoData.save();
      } catch (error) {
        console.error('❌ Validation error during create:', error.message);
        console.error('❌ Validation details:', error.errors);
        throw new AppError(
          `Validation failed: ${error.message}`,
          400,
          'VALIDATION_ERROR',
        );
      }

      // Log activity
      await logActivity(
        req.user.username || 'Admin',
        req.user.role || 'admin',
        `Created ${type} information`,
        `Created ${type} with ${items?.length || sections?.length || 0} items`,
        req,
      );

      res.status(201).json({
        success: true,
        message: 'Info data created successfully',
        data: infoData,
      });
    }
  }),
);

// @desc    Update info data
// @route   PUT /api/info-data/:type
// @access  Private
router.put(
  '/:type',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { title, items, sections } = req.body;

    const infoData = await InfoData.findOne({ type, isActive: true });

    if (!infoData) {
      throw new AppError('Info data not found', 404, 'INFO_DATA_NOT_FOUND');
    }

    // Update fields
    if (title) infoData.title = title;
    if (items) infoData.items = items;
    if (sections) infoData.sections = sections;
    infoData.updatedBy = req.user.id;
    infoData.version += 1;

    await infoData.save();

    // Log activity
    await logActivity(
      req.user.username || 'Admin',
      req.user.role || 'admin',
      `Updated ${type} information`,
      `Updated ${type} with ${items?.length || sections?.length || 0} items`,
      req,
    );

    res.json({
      success: true,
      message: 'Info data updated successfully',
      data: infoData,
    });
  }),
);

// @desc    Delete info data
// @route   DELETE /api/info-data/:type
// @access  Private
router.delete(
  '/:type',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { type } = req.params;

    const infoData = await InfoData.findOne({ type, isActive: true });

    if (!infoData) {
      throw new AppError('Info data not found', 404, 'INFO_DATA_NOT_FOUND');
    }

    // Soft delete
    infoData.isActive = false;
    await infoData.save();

    // Log activity
    await logActivity(
      req.user.username || 'Admin',
      req.user.role || 'admin',
      `Deleted ${type} information`,
      `Soft deleted ${type} information`,
      req,
    );

    res.json({
      success: true,
      message: 'Info data deleted successfully',
    });
  }),
);

// @desc    Get info data history
// @route   GET /api/info-data/:type/history
// @access  Private
router.get(
  '/:type/history',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const history = await InfoData.find({ type })
      .populate('updatedBy', 'username name')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({
      success: true,
      data: history,
    });
  }),
);

module.exports = router;
