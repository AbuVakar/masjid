const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateResource } = require('../middleware/validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    let query = { status: 'active' };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Tags filter
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const resources = await Resource.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    // Get total count
    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  }),
);

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Increment view count
    await resource.incrementView();

    res.json(resource);
  }),
);

// @desc    Create resource
// @route   POST /api/resources
// @access  Private
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  upload.single('file'), // Handle file upload
  validateResource,
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      category,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      tags,
      isPublic,
      uploadedBy,
    } = req.body;

    // Handle file upload
    let finalFileUrl = fileUrl;
    let finalFileName = fileName;
    let finalFileSize = fileSize;
    let finalFileType = fileType;

    if (req.file) {
      // File was uploaded
      finalFileUrl = `/uploads/${req.file.filename}`;
      finalFileName = req.file.originalname;
      finalFileSize = req.file.size;
      finalFileType = req.file.mimetype;

      console.log('📁 File uploaded successfully:', {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
      });
    } else if (!fileUrl) {
      throw new AppError(
        'Either file upload or file URL is required',
        400,
        'FILE_REQUIRED',
      );
    }

    const resource = new Resource({
      title,
      description,
      category,
      fileUrl: finalFileUrl,
      fileName: finalFileName,
      fileSize: parseInt(finalFileSize) || 0,
      fileType: finalFileType,
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      uploadedBy: uploadedBy || 'admin',
    });

    const savedResource = await resource.save();
    res.status(201).json({
      success: true,
      data: savedResource,
      message: 'Resource created successfully',
    });
  }),
);

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateResource,
  asyncHandler(async (req, res) => {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
    }

    res.json({
      success: true,
      data: resource,
      message: 'Resource updated successfully',
    });
  }),
);

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully',
      data: null,
    });
  }),
);

// @desc    Increment download count
// @route   POST /api/resources/:id/download
// @access  Public
router.post(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      throw new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await resource.incrementDownload();
    res.json({
      success: true,
      message: 'Download count incremented',
      data: null,
    });
  }),
);

// @desc    Get resource statistics
// @route   GET /api/resources/stats/overview
// @access  Public
router.get(
  '/stats/overview',
  asyncHandler(async (req, res) => {
    const stats = await Resource.aggregate([
      {
        $group: {
          _id: null,
          totalResources: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          totalViews: { $sum: '$viewCount' },
          categories: { $addToSet: '$category' },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    // Get category-wise counts
    const categoryStats = await Resource.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      overview: stats[0] || {
        totalResources: 0,
        totalDownloads: 0,
        totalViews: 0,
        categories: [],
        totalSize: 0,
      },
      categoryStats,
    });
  }),
);

// @desc    Get popular resources
// @route   GET /api/resources/popular
// @access  Public
router.get(
  '/popular',
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const resources = await Resource.find({ status: 'active' })
      .sort({ downloadCount: -1, viewCount: -1 })
      .limit(parseInt(limit));

    res.json(resources);
  }),
);

// @desc    Export resources
// @route   GET /api/resources/export
// @access  Public
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const resources = await Resource.find({ status: 'active' })
      .select(
        'title description category fileName fileType downloadCount viewCount createdAt',
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Resources exported successfully',
      data: resources,
    });
  }),
);

module.exports = router;
