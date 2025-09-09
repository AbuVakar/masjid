import React, { useState, useEffect, useCallback } from 'react';
import {
  FaHistory,
  FaFilter,
  FaDownload,
  FaTrash,
  FaUser,
  FaClock,
  FaEye,
  FaSearch,
  FaCog,
  FaFilePdf,
} from 'react-icons/fa';
import { apiService } from '../services/api';
import { useNotify } from '../context/NotificationContext';
import AdvancedLogClearing from './AdvancedLogClearing';

const ActivityLogs = () => {
  console.log('🔄 ActivityLogs component rendered');
  const { notify } = useNotify();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    user: '',
    role: '',
    action: '',
    limit: 50,
    skip: 0,
  });
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [showAdvancedClearing, setShowAdvancedClearing] = useState(false);

  // Fetch activities
  const fetchActivities = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        console.log('🔄 ActivityLogs - Fetching activities...');

        const queryParams = new URLSearchParams();

        if (filters.user) queryParams.append('user', filters.user);
        if (filters.role) queryParams.append('role', filters.role);
        if (filters.action) queryParams.append('action', filters.action);
        queryParams.append('limit', filters.limit);
        queryParams.append('skip', reset ? 0 : filters.skip);

        console.log(
          '🔄 ActivityLogs - API call:',
          `/activity-logs?${queryParams}`,
        );
        const response = await apiService.get(`/activity-logs?${queryParams}`);
        console.log('🔄 ActivityLogs - API response:', response);

        if (response.success) {
          if (reset) {
            setActivities(response.data.activities);
          } else {
            setActivities((prev) => [...prev, ...response.data.activities]);
          }
          setHasMore(response.data.hasMore);
          setTotal(response.data.total);
          console.log(
            '🔄 ActivityLogs - Activities loaded:',
            response.data.activities?.length || 0,
          );
        } else {
          console.error('🔄 ActivityLogs - API returned success: false');
          setError(
            'Failed to fetch activities: ' +
              (response.message || 'Unknown error'),
          );
        }
      } catch (err) {
        console.error('🔄 ActivityLogs - Error fetching activities:', err);
        setError('Failed to fetch activities: ' + err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters.user, filters.role, filters.action, filters.limit, filters.skip],
  );

  // Fetch statistics
  const fetchStats = async () => {
    try {
      console.log('🔄 ActivityLogs - Fetching stats...');
      const response = await apiService.get('/activity-logs/stats');
      console.log('🔄 ActivityLogs - Stats response:', response);

      if (response.success) {
        setStats(response.data);
        console.log('🔄 ActivityLogs - Stats loaded:', response.data);
      } else {
        console.error('🔄 ActivityLogs - Stats API returned success: false');
      }
    } catch (err) {
      console.error('🔄 ActivityLogs - Error fetching stats:', err);
    }
  };

  useEffect(() => {
    console.log('🔄 ActivityLogs - useEffect triggered');
    fetchActivities(true);
    fetchStats();
  }, [fetchActivities]);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 ActivityLogs - State update:', {
      activities: activities.length,
      loading,
      error,
      stats: !!stats,
      total,
    });
  }, [activities, loading, error, stats, total]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      skip: 0, // Reset pagination when filters change
    }));
  };

  // Load more activities
  const loadMore = () => {
    if (!loading && hasMore) {
      setFilters((prev) => ({
        ...prev,
        skip: prev.skip + prev.limit,
      }));
    }
  };

  // Export activities to CSV
  const exportActivities = async () => {
    try {
      setLoading(true);

      // Check if apiService is available
      if (!apiService) {
        notify('API service not available', { type: 'error' });
        return;
      }

      const response = await apiService.exportActivityLogs();

      if (!response) {
        notify('No data received from server', { type: 'error' });
        return;
      }

      // Create blob from the CSV text
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notify('Activity logs exported to CSV successfully!', {
        type: 'success',
      });
    } catch (err) {
      console.error('Error exporting activities:', err);
      notify('Failed to export activity logs: ' + err.message, {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Export activities to PDF
  const exportActivitiesPDF = async () => {
    try {
      setLoading(true);

      // Check if apiService is available
      if (!apiService) {
        notify('API service not available', { type: 'error' });
        return;
      }

      const response = await apiService.exportActivityLogsPDF();

      if (!response) {
        notify('No data received from server', { type: 'error' });
        return;
      }

      // Create blob from the PDF data
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-logs-export-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notify('Activity logs exported to PDF successfully!', {
        type: 'success',
      });
    } catch (err) {
      console.error('Error exporting activities to PDF:', err);
      notify('Failed to export activity logs to PDF: ' + err.message, {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Clean up old logs
  const cleanupOldLogs = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete logs older than 90 days?',
      )
    ) {
      return;
    }

    try {
      const response = await apiService.cleanupActivityLogs(90);

      if (response.success) {
        notify(`Successfully cleaned up ${response.deletedCount} old logs`, {
          type: 'success',
        });
        fetchActivities(true);
        fetchStats();
      }
    } catch (err) {
      console.error('Error cleaning up logs:', err);
      notify('Failed to clean up logs', { type: 'error' });
    }
  };

  // Clear all logs
  const clearAllLogs = async () => {
    // First confirmation
    const firstConfirm = window.confirm(
      '⚠️ WARNING: This will delete ALL activity logs permanently!\n\n' +
        'This action cannot be undone and will remove all audit trail data.\n\n' +
        'Are you absolutely sure you want to continue?',
    );

    if (!firstConfirm) {
      return;
    }

    // Second confirmation with different message
    const secondConfirm = window.confirm(
      '🚨 FINAL WARNING 🚨\n\n' +
        'You are about to permanently delete ALL activity logs.\n' +
        'This will remove the complete audit trail and cannot be recovered.\n\n' +
        'Type "DELETE" to confirm (case sensitive):',
    );

    if (!secondConfirm) {
      return;
    }

    // Third confirmation requiring specific text
    const userInput = window.prompt(
      'To confirm deletion of ALL activity logs, please type "DELETE" (exactly as shown):',
    );

    if (userInput !== 'DELETE') {
      notify('Deletion cancelled. Activity logs remain unchanged.', {
        type: 'info',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.clearAllActivityLogs();

      if (response.success) {
        notify(
          `Successfully cleared all ${response.deletedCount} activity logs`,
          { type: 'success' },
        );
        setActivities([]);
        setTotal(0);
        setHasMore(false);
        fetchStats();
      }
    } catch (err) {
      console.error('Error clearing all logs:', err);
      notify('Failed to clear logs. Please try again.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'guest':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format timestamp with better spacing
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  console.log('ActivityLogs component rendering...');
  return (
    <div className='activity-logs-container'>
      {/* Header */}
      <div className='activity-logs-header'>
        <div className='header-content'>
          <div className='header-icon'>
            <FaHistory className='text-2xl text-blue-600' />
          </div>
          <div className='header-text'>
            <h2 className='header-title'>Activity Logs</h2>
            <p className='header-subtitle'>
              Monitor all user and admin actions
            </p>
          </div>
        </div>

        <div className='header-actions'>
          <button
            onClick={exportActivities}
            className='export-btn'
            title='Export to CSV'
            disabled={loading}
          >
            <FaDownload className='mr-2' />
            {loading ? 'Exporting...' : 'CSV'}
          </button>
          <button
            onClick={exportActivitiesPDF}
            className='export-pdf-btn'
            title='Export to PDF'
            disabled={loading}
          >
            <FaFilePdf className='mr-2' />
            {loading ? 'Exporting...' : 'PDF'}
          </button>
          <button
            onClick={cleanupOldLogs}
            className='cleanup-btn'
            title='Clean up old logs'
          >
            <FaTrash className='mr-2' />
            Cleanup
          </button>
          <button
            onClick={() => setShowAdvancedClearing(true)}
            className='advanced-btn'
            title='Advanced clearing options'
          >
            <FaCog className='mr-2' />
            Advanced
          </button>
          <button
            onClick={clearAllLogs}
            className='clear-all-btn'
            title='Clear all logs'
            disabled={loading}
          >
            <FaTrash className='mr-2' />
            Clear All
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className='stats-grid'>
          <div className='stat-card'>
            <div className='stat-icon'>
              <FaHistory />
            </div>
            <div className='stat-content'>
              <div className='stat-value'>{stats.totalActivities}</div>
              <div className='stat-label'>Total Activities</div>
            </div>
          </div>

          <div className='stat-card'>
            <div className='stat-icon'>
              <FaUser />
            </div>
            <div className='stat-content'>
              <div className='stat-value'>{stats.uniqueUserCount}</div>
              <div className='stat-label'>Unique Users</div>
            </div>
          </div>

          <div className='stat-card'>
            <div className='stat-icon'>
              <FaUser />
            </div>
            <div className='stat-content'>
              <div className='stat-value'>{stats.adminCount}</div>
              <div className='stat-label'>Admin Actions</div>
            </div>
          </div>

          <div className='stat-card'>
            <div className='stat-icon'>
              <FaUser />
            </div>
            <div className='stat-content'>
              <div className='stat-value'>{stats.userCount}</div>
              <div className='stat-label'>User Actions</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='filters-section'>
        <div className='filters-header'>
          <FaFilter className='text-gray-600 mr-2' />
          <span className='font-medium text-gray-700'>Filters</span>
        </div>

        <div className='filters-grid'>
          <div className='filter-group'>
            <label className='filter-label'>User</label>
            <div className='filter-input-wrapper'>
              <FaSearch className='filter-input-icon' />
              <input
                type='text'
                placeholder='Search by username...'
                value={filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                className='filter-input'
              />
            </div>
          </div>

          <div className='filter-group'>
            <label className='filter-label'>Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className='filter-select'
            >
              <option value=''>All Roles</option>
              <option value='admin'>Admin</option>
              <option value='user'>User</option>
              <option value='guest'>Guest</option>
            </select>
          </div>

          <div className='filter-group'>
            <label className='filter-label'>Action</label>
            <div className='filter-input-wrapper'>
              <FaSearch className='filter-input-icon' />
              <input
                type='text'
                placeholder='Search by action...'
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className='filter-input'
              />
            </div>
          </div>

          <div className='filter-group'>
            <label className='filter-label'>Limit</label>
            <select
              value={filters.limit}
              onChange={(e) =>
                handleFilterChange('limit', parseInt(e.target.value))
              }
              className='filter-select'
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className='activities-section'>
        <div className='activities-header'>
          <h3 className='activities-title'>
            Recent Activities ({total} total)
          </h3>
        </div>

        {loading && activities.length === 0 ? (
          <div className='loading-state'>
            <div className='loading-spinner'></div>
            <p>Loading activities...</p>
          </div>
        ) : error ? (
          <div className='error-state'>
            <p className='error-message'>{error}</p>
            <button onClick={() => fetchActivities(true)} className='retry-btn'>
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className='empty-state'>
            <FaHistory className='text-4xl text-gray-400 mb-4' />
            <p className='empty-message'>No activities found</p>
          </div>
        ) : (
          <div className='activities-list'>
            {activities.map((activity, index) => (
              <div key={activity._id || index} className='activity-item'>
                <div className='activity-icon'>
                  <FaEye className='text-blue-600' />
                </div>

                <div className='activity-content'>
                  <div className='activity-header'>
                    <div className='activity-user'>
                      <span className='user-name'>{activity.user}</span>
                      <span
                        className={`role-badge ${getRoleBadgeColor(activity.role)}`}
                      >
                        {activity.role}
                      </span>
                    </div>
                    <div className='activity-time'>
                      <FaClock className='text-gray-400 mr-1' />
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>

                  <div className='activity-action'>{activity.action}</div>

                  {activity.details && (
                    <div className='activity-details'>{activity.details}</div>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className='load-more-section'>
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className='load-more-btn'
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Log Clearing Modal */}
      <AdvancedLogClearing
        isOpen={showAdvancedClearing}
        onClose={() => setShowAdvancedClearing(false)}
        onSuccess={() => {
          fetchActivities(true);
          fetchStats();
        }}
      />

      <style>{`
        .activity-logs-container {
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .activity-logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-content {
          display: flex;
          align-items: center;
        }

        .header-icon {
          margin-right: 16px;
        }

        .header-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .header-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .export-btn,
        .export-pdf-btn,
        .cleanup-btn,
        .advanced-btn,
        .clear-all-btn {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .export-btn {
          background: #10b981;
          color: white;
        }

        .export-btn:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }

        .export-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .export-pdf-btn {
          background: #dc2626;
          color: white;
        }

        .export-pdf-btn:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .export-pdf-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .cleanup-btn {
          background: #ef4444;
          color: white;
        }

        .cleanup-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        .clear-all-btn {
          background: #dc2626;
          color: white;
        }

        .clear-all-btn:hover:not(:disabled) {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .clear-all-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .advanced-btn {
          background: #8b5cf6;
          color: white;
        }

        .advanced-btn:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }

        .stat-icon {
          margin-right: 16px;
          font-size: 24px;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .stat-label {
          font-size: 14px;
          color: #ffffff;
          margin-top: 4px;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .filters-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .filters-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          font-size: 16px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .filter-input-wrapper {
          position: relative;
        }

        .filter-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 14px;
        }

        .filter-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
          background: white;
          transition: border-color 0.2s;
        }

        .filter-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          color: #374151;
          cursor: pointer;
        }

        .filter-select option {
          color: #374151;
          background: white;
        }

        .activities-section {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .activities-header {
          margin-bottom: 20px;
        }

        .activities-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .loading-state,
        .error-state,
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .error-message {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .retry-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        .empty-message {
          color: #6b7280;
          font-size: 16px;
        }

        .activities-list {
          space-y: 12px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          background: white;
          transition: all 0.2s;
        }

        .activity-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .activity-icon {
          margin-right: 16px;
          margin-top: 4px;
        }

        .activity-content {
          flex: 1;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .activity-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        .role-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
        }

        .activity-time {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #6b7280;
        }

        .activity-action {
          font-size: 14px;
          color: #374151;
          margin-bottom: 4px;
        }

        .activity-details {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .activity-meta {
          display: flex;
          gap: 16px;
        }

        .meta-item {
          font-size: 12px;
          color: #9ca3af;
        }

        .load-more-section {
          text-align: center;
          margin-top: 20px;
        }

        .load-more-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .load-more-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .load-more-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* ===== MOBILE RESPONSIVENESS FIXES ===== */

        /* Tablet and Mobile Responsive Design */
        @media (max-width: 768px) {
          .activity-logs-container {
            padding: 16px;
          }

          .activity-logs-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
            text-align: center;
          }

          .header-content {
            flex-direction: column;
            gap: 8px;
          }

          .header-icon {
            margin-right: 0;
            margin-bottom: 8px;
          }

          .header-title {
            font-size: 20px;
          }

          .header-subtitle {
            font-size: 13px;
          }

          .header-actions {
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
            padding: 10px 16px;
            font-size: 14px;
          }

          /* Stats Grid */
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 12px;
          }

          .stat-value {
            font-size: 18px;
          }

          .stat-label {
            font-size: 12px;
          }

          /* Filters Section */
          .filters-section {
            padding: 12px;
          }

          .filters-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .filter-group {
            margin-bottom: 0;
          }

          .filter-input,
          .filter-select {
            padding: 8px 10px;
            font-size: 14px;
          }

          /* Activities Section */
          .activities-section {
            padding: 16px;
          }

          .activities-header {
            margin-bottom: 16px;
          }

          .activities-title {
            font-size: 16px;
          }

          /* Activity Items */
          .activity-item {
            padding: 12px;
            margin-bottom: 8px;
          }

          .activity-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .activity-user {
            flex-wrap: wrap;
            gap: 6px;
          }

          .user-name {
            font-size: 14px;
          }

          .role-badge {
            font-size: 11px;
            padding: 1px 6px;
          }

          .activity-time {
            font-size: 11px;
          }

          .activity-action {
            font-size: 13px;
          }

          .activity-details {
            font-size: 12px;
          }

          /* Load More Button */
          .load-more-btn {
            width: 100%;
            padding: 10px 16px;
            font-size: 14px;
          }
        }

        /* Small Mobile Optimizations */
        @media (max-width: 480px) {
          .activity-logs-container {
            padding: 12px;
          }

          .activity-logs-header {
            padding: 12px;
            gap: 12px;
          }

          .header-title {
            font-size: 18px;
          }

          .header-subtitle {
            font-size: 12px;
          }

          /* Stats Grid - Single Column */
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .stat-card {
            padding: 10px;
          }

          .stat-value {
            font-size: 16px;
          }

          .stat-label {
            font-size: 11px;
          }

          /* Filters */
          .filters-section {
            padding: 10px;
          }

          .filter-input,
          .filter-select {
            padding: 6px 8px;
            font-size: 13px;
          }

          /* Activities */
          .activities-section {
            padding: 12px;
          }

          .activities-title {
            font-size: 15px;
          }

          /* Activity Items */
          .activity-item {
            padding: 10px;
            margin-bottom: 6px;
          }

          .activity-icon {
            margin-right: 12px;
            margin-top: 2px;
          }

          .activity-header {
            gap: 6px;
          }

          .activity-user {
            gap: 4px;
          }

          .user-name {
            font-size: 13px;
          }

          .role-badge {
            font-size: 10px;
            padding: 1px 4px;
          }

          .activity-time {
            font-size: 10px;
          }

          .activity-action {
            font-size: 12px;
            margin-bottom: 2px;
          }

          .activity-details {
            font-size: 11px;
            margin-bottom: 2px;
          }

          /* Load More */
          .load-more-btn {
            padding: 8px 12px;
            font-size: 13px;
          }

          /* Loading States */
          .loading-state,
          .error-state,
          .empty-state {
            padding: 20px 12px;
          }

          .loading-spinner {
            width: 32px;
            height: 32px;
            border-width: 3px;
          }

          .empty-message {
            font-size: 14px;
          }

          .error-message {
            font-size: 13px;
          }

          .retry-btn {
            padding: 8px 16px;
            font-size: 13px;
          }
        }

        /* ===== END MOBILE RESPONSIVENESS FIXES ===== */
      `}</style>
    </div>
  );
};

export default ActivityLogs;
