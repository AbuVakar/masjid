const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Contact = require('../models/Contact');
const { logError } = require('../utils/logger');
const whatsappService = require('../utils/whatsappService');

// Submit contact form
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { category, name, mobile, message } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Validate mobile number if provided
    if (mobile && !/^\+?\d{7,15}$/.test(String(mobile))) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid mobile number',
      });
    }

    try {
      // Create new contact message
      const contactMessage = new Contact({
        category: category || 'General',
        name: name.trim(),
        mobile: mobile ? mobile.trim() : null,
        message: message.trim(),
        submittedBy: req.user._id,
        userEmail: req.user.email || null,
        userRole: req.user.role || 'user',
      });

      await contactMessage.save();

      // Send WhatsApp notification to admin
      const whatsappResult = await whatsappService.sendWhatsAppNotification({
        category: contactMessage.category,
        name: contactMessage.name,
        mobile: contactMessage.mobile,
        message: contactMessage.message,
      });

      // Log the contact submission
      console.log(
        `📧 Contact form submitted by ${name} (${req.user.username || 'guest'}) - Category: ${category}`,
      );

      if (whatsappResult.success) {
        console.log(
          `📱 WhatsApp notification prepared for admin: ${whatsappResult.adminNumber}`,
        );
      } else {
        console.log(
          `⚠️ WhatsApp notification failed: ${whatsappResult.message}`,
        );
      }

      res.status(201).json({
        success: true,
        message: 'Message sent successfully! We will get back to you soon.',
        data: {
          id: contactMessage._id,
          category: contactMessage.category,
          submittedAt: contactMessage.createdAt,
          whatsappNotification: whatsappResult.success,
          adminNumber: whatsappService.getAdminNumber(),
        },
      });
    } catch (error) {
      logError(error, 'Contact Form Submission', 'HIGH', {
        category,
        name,
        hasMobile: !!mobile,
        userId: req.user._id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again later.',
      });
    }
  }),
);

// Get contact messages (admin only)
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    try {
      const { page = 1, limit = 20, category, status } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (category) filter.category = category;
      if (status) filter.status = status;

      const messages = await Contact.find(filter)
        .populate('submittedBy', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Contact.countDocuments(filter);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logError(error, 'Get Contact Messages', 'HIGH', { userId: req.user._id });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact messages',
      });
    }
  }),
);

// Update message status (admin only)
router.patch(
  '/:id/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid status. Must be: pending, in-progress, resolved, or closed',
      });
    }

    try {
      const message = await Contact.findByIdAndUpdate(
        id,
        {
          status,
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Contact message not found',
        });
      }

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: message,
      });
    } catch (error) {
      logError(error, 'Update Contact Status', 'HIGH', {
        messageId: id,
        status,
        userId: req.user._id,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update status',
      });
    }
  }),
);

module.exports = router;
