const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const {
  logActivity,
  getRecentActivities,
  getActivityStats,
  cleanupOldLogs,
  clearAllLogs,
  clearLogsByDateRange,
  clearLogsByUser,
  clearLogsByAction,
  clearLogsByRole,
  clearFailedActions,
  clearLogsOlderThan,
} = require('../utils/activityLogger');
const { authenticateToken } = require('../middleware/auth');

// Get recent activities with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0, user, role, action } = req.query;

    const filters = {};
    if (user) filters.user = user;
    if (role) filters.role = role;
    if (action) filters.action = action;

    const result = await getRecentActivities(
      parseInt(limit),
      parseInt(skip),
      filters,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message,
    });
  }
});

// Get activity statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getActivityStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message,
    });
  }
});

// Get activities by user
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const result = await getRecentActivities(parseInt(limit), parseInt(skip), {
      user: username,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activities',
      error: error.message,
    });
  }
});

// Get activities by role
router.get('/role/:role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const result = await getRecentActivities(parseInt(limit), parseInt(skip), {
      role,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching role activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role activities',
      error: error.message,
    });
  }
});

// Clean up old logs (Admin only)
router.delete('/cleanup', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { days = 90 } = req.body;
    const deletedCount = await cleanupOldLogs(days);

    // Log this cleanup action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleaned up ${deletedCount} old activity logs (older than ${days} days)`,
      `Cleanup performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} old activity logs`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up old logs',
      error: error.message,
    });
  }
});

// Clear all activity logs (Admin only)
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Get total count before deletion for logging
    const totalCount = await getRecentActivities(1, 0, {}).then(
      (result) => result.total,
    );

    // Clear all logs
    const deletedCount = await clearAllLogs();

    // Log this action (this will be the first log after clearing)
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleared all ${totalCount} activity logs`,
      `Clear all logs performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleared all ${deletedCount} activity logs`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing all logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all logs',
      error: error.message,
    });
  }
});

// Clear logs by date range (Admin only)
router.delete('/clear-by-date', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { startDate, endDate } = req.body;
    const deletedCount = await clearLogsByDateRange(startDate, endDate);

    // Log this action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleared ${deletedCount} logs by date range`,
      `Date range: ${startDate || 'start'} to ${endDate || 'end'}, performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} logs by date range`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing logs by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear logs by date range',
      error: error.message,
    });
  }
});

// Clear logs by user (Admin only)
router.delete('/clear-by-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    const deletedCount = await clearLogsByUser(username);

    // Log this action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleared ${deletedCount} logs for user: ${username}`,
      `Clear user logs performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} logs for user: ${username}`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing logs by user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear logs by user',
      error: error.message,
    });
  }
});

// Clear logs by action type (Admin only)
router.delete('/clear-by-action', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { action } = req.body;
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action type is required',
      });
    }

    const deletedCount = await clearLogsByAction(action);

    // Log this action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleared ${deletedCount} logs for action: ${action}`,
      `Clear action logs performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} logs for action: ${action}`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing logs by action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear logs by action',
      error: error.message,
    });
  }
});

// Clear logs by role (Admin only)
router.delete('/clear-by-role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
      });
    }

    const deletedCount = await clearLogsByRole(role);

    // Log this action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleared ${deletedCount} logs for role: ${role}`,
      `Clear role logs performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} logs for role: ${role}`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing logs by role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear logs by role',
      error: error.message,
    });
  }
});

// Clear failed actions only (Admin only)
router.delete('/clear-failed', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const deletedCount = await clearFailedActions();

    // Log this action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleared ${deletedCount} failed action logs`,
      `Clear failed actions performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} failed action logs`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing failed actions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear failed actions',
      error: error.message,
    });
  }
});

// Clear logs older than specified days (Admin only)
router.delete('/clear-older-than', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { days } = req.body;
    if (!days || days < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of days is required (minimum 1)',
      });
    }

    const deletedCount = await clearLogsOlderThan(days);

    // Log this action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Cleared ${deletedCount} logs older than ${days} days`,
      `Clear old logs performed by ${req.user.username}`,
      req,
    );

    res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} logs older than ${days} days`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear old logs',
      error: error.message,
    });
  }
});

// Export activities to CSV (Admin only)
router.get('/export', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { limit = 1000 } = req.query;
    const result = await getRecentActivities(parseInt(limit), 0, {});

    // Get additional statistics for the export
    const stats = await getActivityStats();

    // Create a more detailed and readable CSV format
    const exportDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // CSV Header with better formatting and statistics
    const csvHeader = [
      'Activity Logs Export Report',
      `Generated on: ${exportDate}`,
      `Exported by: ${req.user.username} (${req.user.role})`,
      '',
      'Summary Statistics:',
      `- Total Records in Export: ${result.activities.length}`,
      `- Total Activities in System: ${stats.totalActivities || 'N/A'}`,
      `- Unique Users in System: ${stats.uniqueUserCount || 'N/A'}`,
      `- Admin Actions: ${stats.adminCount || 'N/A'}`,
      `- User Actions: ${stats.userCount || 'N/A'}`,
      '',
      'Detailed Activity Log:',
      'Date & Time,User,Role,Action,Details',
      '',
    ].join('\n');

    // Convert activities to CSV format with better formatting
    const csvData = result.activities
      .map((activity) => {
        // Format timestamp in readable format with better spacing
        const timestamp = new Date(activity.timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        // Clean and escape CSV values
        const user = `"${activity.user || 'Unknown'}"`;
        const role = `"${activity.role || 'Unknown'}"`;
        const action = `"${activity.action || 'Unknown Action'}"`;

        // Enhanced details with more context
        let enhancedDetails = activity.details || '';
        if (activity.success === false) {
          enhancedDetails = `[FAILED] ${enhancedDetails}`;
        }
        const details = `"${enhancedDetails.replace(/"/g, '""')}"`;

        return `${timestamp},${user},${role},${action},${details}`;
      })
      .join('\n');

    // Add footer with additional information
    const csvFooter = [
      '',
      'Export Information:',
      `- Export completed at: ${new Date().toLocaleString('en-US')}`,
      `- File contains ${result.activities.length} activity records`,
      `- Date range: ${result.activities.length > 0 ? new Date(result.activities[result.activities.length - 1].timestamp).toLocaleDateString() : 'N/A'} to ${result.activities.length > 0 ? new Date(result.activities[0].timestamp).toLocaleDateString() : 'N/A'}`,
      `- Generated by: ${req.user.username}`,
      `- System: Masjid Dashboard Activity Logs`,
      '',
    ].join('\n');

    const csvContent = csvHeader + csvData + csvFooter;

    // Log the export action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Exported ${result.activities.length} activity logs to CSV`,
      `Export performed by ${req.user.username}`,
      req,
    );

    res.setHeader('Content-Type', 'text/csv');
    // Create a more descriptive filename
    const filename = `activity-logs-export-${new Date().toISOString().split('T')[0]}-${result.activities.length}-records.csv`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activities',
      error: error.message,
    });
  }
});

// Export activities to PDF (Admin only)
router.get('/export-pdf', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { limit = 1000 } = req.query;
    const result = await getRecentActivities(parseInt(limit), 0, {});

    // Get additional statistics for the export
    const stats = await getActivityStats();

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const filename = `activity-logs-export-${new Date().toISOString().split('T')[0]}-${result.activities.length}-records.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('Activity Logs Export Report', { align: 'center' })
      .moveDown(2);

    // Add export information
    const exportDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Generated on: ${exportDate}`)
      .text(`Exported by: ${req.user.username} (${req.user.role})`)
      .moveDown(2);

    // Add summary statistics
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Summary Statistics:')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`• Total Records in Export: ${result.activities.length}`)
      .text(`• Total Activities in System: ${stats.totalActivities || 'N/A'}`)
      .text(`• Unique Users in System: ${stats.uniqueUserCount || 'N/A'}`)
      .text(`• Admin Actions: ${stats.adminCount || 'N/A'}`)
      .text(`• User Actions: ${stats.userCount || 'N/A'}`)
      .moveDown(2);

    // Add detailed activity log
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Detailed Activity Log:')
      .moveDown(1);

    // Add table headers
    const headers = ['Date & Time', 'User', 'Role', 'Action', 'Details'];
    const columnWidths = [100, 80, 50, 140, 200];
    const startX = 50;
    let currentY = doc.y;

    // Draw header row
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#2c3e50');

    headers.forEach((header, index) => {
      doc.text(
        header,
        startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
        currentY,
        {
          width: columnWidths[index],
          align: 'left',
        },
      );
    });

    currentY += 20;

    // Add data rows
    doc.fontSize(8).font('Helvetica').fillColor('#34495e');

    result.activities.forEach((activity, index) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      // Format timestamp with better spacing
      const timestamp = new Date(activity.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Enhanced details
      let enhancedDetails = activity.details || '';
      if (activity.success === false) {
        enhancedDetails = `[FAILED] ${enhancedDetails}`;
      }

      const rowData = [
        timestamp,
        activity.user || 'Unknown',
        activity.role || 'Unknown',
        activity.action || 'Unknown Action',
        enhancedDetails,
      ];

      // Draw data row
      rowData.forEach((cell, cellIndex) => {
        doc.text(
          cell,
          startX + columnWidths.slice(0, cellIndex).reduce((a, b) => a + b, 0),
          currentY,
          {
            width: columnWidths[cellIndex],
            align: 'left',
          },
        );
      });

      currentY += 15;

      // Add separator line every 5 rows
      if ((index + 1) % 5 === 0) {
        doc
          .moveTo(50, currentY - 5)
          .lineTo(550, currentY - 5)
          .strokeColor('#bdc3c7')
          .lineWidth(0.5)
          .stroke();
        currentY += 5;
      }
    });

    // Add footer
    doc.addPage();
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#7f8c8d')
      .text('Export Information:', 50, 50)
      .moveDown(0.5);

    doc
      .fontSize(9)
      .text(`• Export completed at: ${new Date().toLocaleString('en-US')}`)
      .text(`• File contains ${result.activities.length} activity records`)
      .text(
        `• Date range: ${result.activities.length > 0 ? new Date(result.activities[result.activities.length - 1].timestamp).toLocaleDateString() : 'N/A'} to ${result.activities.length > 0 ? new Date(result.activities[0].timestamp).toLocaleDateString() : 'N/A'}`,
      )
      .text(`• Generated by: ${req.user.username}`)
      .text(`• System: Masjid Dashboard Activity Logs`);

    // Finalize PDF
    doc.end();

    // Log the export action
    await logActivity(
      req.user.username || 'Admin',
      'admin',
      `Exported ${result.activities.length} activity logs to PDF`,
      `PDF Export performed by ${req.user.username}`,
      req,
    );
  } catch (error) {
    console.error('Error exporting activities to PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activities to PDF',
      error: error.message,
    });
  }
});

module.exports = router;
