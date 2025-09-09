import React, { useState } from 'react';
import {
  FaTrash,
  FaCalendar,
  FaUser,
  FaCog,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';
import { apiService } from '../services/api';
import { useNotify } from '../context/NotificationContext';

const AdvancedLogClearing = ({ isOpen, onClose, onSuccess }) => {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('date');

  // Form states
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [username, setUsername] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [days, setDays] = useState(30);

  const handleClearByDateRange = async () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      notify('Please select at least one date', { type: 'error' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear logs from ${dateRange.startDate || 'start'} to ${dateRange.endDate || 'end'}?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await apiService.clearActivityLogsByDateRange(
        dateRange.startDate,
        dateRange.endDate,
      );

      if (response.success) {
        notify(
          `Successfully cleared ${response.deletedCount} logs by date range`,
          { type: 'success' },
        );
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error clearing logs by date range:', error);
      notify('Failed to clear logs by date range', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearByUser = async () => {
    if (!username.trim()) {
      notify('Please enter a username', { type: 'error' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all logs for user "${username}"?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await apiService.clearActivityLogsByUser(username);

      if (response.success) {
        notify(
          `Successfully cleared ${response.deletedCount} logs for user: ${username}`,
          { type: 'success' },
        );
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error clearing logs by user:', error);
      notify('Failed to clear logs by user', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearByAction = async () => {
    if (!action.trim()) {
      notify('Please enter an action type', { type: 'error' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all logs for action "${action}"?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await apiService.clearActivityLogsByAction(action);

      if (response.success) {
        notify(
          `Successfully cleared ${response.deletedCount} logs for action: ${action}`,
          { type: 'success' },
        );
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error clearing logs by action:', error);
      notify('Failed to clear logs by action', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearByRole = async () => {
    if (!role) {
      notify('Please select a role', { type: 'error' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all logs for role "${role}"?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await apiService.clearActivityLogsByRole(role);

      if (response.success) {
        notify(
          `Successfully cleared ${response.deletedCount} logs for role: ${role}`,
          { type: 'success' },
        );
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error clearing logs by role:', error);
      notify('Failed to clear logs by role', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFailedActions = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all failed action logs?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await apiService.clearFailedActivityLogs();

      if (response.success) {
        notify(
          `Successfully cleared ${response.deletedCount} failed action logs`,
          { type: 'success' },
        );
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error clearing failed actions:', error);
      notify('Failed to clear failed actions', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearOlderThan = async () => {
    if (!days || days < 1) {
      notify('Please enter a valid number of days (minimum 1)', {
        type: 'error',
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all logs older than ${days} days?`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await apiService.clearActivityLogsOlderThan(days);

      if (response.success) {
        notify(
          `Successfully cleared ${response.deletedCount} logs older than ${days} days`,
          { type: 'success' },
        );
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error clearing old logs:', error);
      notify('Failed to clear old logs', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='modal-overlay'>
      <div className='modal-content advanced-clearing-modal'>
        <div className='modal-header'>
          <h2 className='modal-title'>
            <FaTrash className='mr-2' />
            Advanced Log Clearing
          </h2>
          <button onClick={onClose} className='close-btn'>
            <FaTimes />
          </button>
        </div>

        <div className='modal-body'>
          <div className='warning-banner'>
            <FaExclamationTriangle className='warning-icon' />
            <span>
              ⚠️ These actions are irreversible. Please use with caution.
            </span>
          </div>

          <div className='tabs'>
            <button
              className={`tab ${activeTab === 'date' ? 'active' : ''}`}
              onClick={() => setActiveTab('date')}
            >
              <FaCalendar />
              Date Range
            </button>
            <button
              className={`tab ${activeTab === 'user' ? 'active' : ''}`}
              onClick={() => setActiveTab('user')}
            >
              <FaUser />
              User
            </button>
            <button
              className={`tab ${activeTab === 'action' ? 'active' : ''}`}
              onClick={() => setActiveTab('action')}
            >
              <FaCog />
              Action
            </button>
            <button
              className={`tab ${activeTab === 'role' ? 'active' : ''}`}
              onClick={() => setActiveTab('role')}
            >
              <FaUser />
              Role
            </button>
            <button
              className={`tab ${activeTab === 'failed' ? 'active' : ''}`}
              onClick={() => setActiveTab('failed')}
            >
              <FaExclamationTriangle />
              Failed
            </button>
            <button
              className={`tab ${activeTab === 'old' ? 'active' : ''}`}
              onClick={() => setActiveTab('old')}
            >
              <FaCalendar />
              Old Logs
            </button>
          </div>

          <div className='tab-content'>
            {/* Date Range Tab */}
            {activeTab === 'date' && (
              <div className='tab-panel'>
                <h3>Clear Logs by Date Range</h3>
                <p>Clear logs within a specific date range.</p>

                <div className='form-group'>
                  <label>Start Date:</label>
                  <input
                    type='date'
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className='form-input'
                  />
                </div>

                <div className='form-group'>
                  <label>End Date:</label>
                  <input
                    type='date'
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className='form-input'
                  />
                </div>

                <button
                  onClick={handleClearByDateRange}
                  disabled={loading}
                  className='clear-btn'
                >
                  {loading ? 'Clearing...' : 'Clear by Date Range'}
                </button>
              </div>
            )}

            {/* User Tab */}
            {activeTab === 'user' && (
              <div className='tab-panel'>
                <h3>Clear Logs by User</h3>
                <p>Clear all logs for a specific user.</p>

                <div className='form-group'>
                  <label>Username:</label>
                  <input
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='Enter username'
                    className='form-input'
                  />
                </div>

                <button
                  onClick={handleClearByUser}
                  disabled={loading}
                  className='clear-btn'
                >
                  {loading ? 'Clearing...' : 'Clear by User'}
                </button>
              </div>
            )}

            {/* Action Tab */}
            {activeTab === 'action' && (
              <div className='tab-panel'>
                <h3>Clear Logs by Action</h3>
                <p>Clear all logs for a specific action type.</p>

                <div className='form-group'>
                  <label>Action Type:</label>
                  <input
                    type='text'
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    placeholder='e.g., LOGIN, DELETE, UPDATE'
                    className='form-input'
                  />
                </div>

                <button
                  onClick={handleClearByAction}
                  disabled={loading}
                  className='clear-btn'
                >
                  {loading ? 'Clearing...' : 'Clear by Action'}
                </button>
              </div>
            )}

            {/* Role Tab */}
            {activeTab === 'role' && (
              <div className='tab-panel'>
                <h3>Clear Logs by Role</h3>
                <p>Clear all logs for a specific user role.</p>

                <div className='form-group'>
                  <label>Role:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className='form-select'
                  >
                    <option value=''>Select a role</option>
                    <option value='admin'>Admin</option>
                    <option value='user'>User</option>
                    <option value='guest'>Guest</option>
                  </select>
                </div>

                <button
                  onClick={handleClearByRole}
                  disabled={loading}
                  className='clear-btn'
                >
                  {loading ? 'Clearing...' : 'Clear by Role'}
                </button>
              </div>
            )}

            {/* Failed Actions Tab */}
            {activeTab === 'failed' && (
              <div className='tab-panel'>
                <h3>Clear Failed Actions</h3>
                <p>Clear all logs for failed actions only.</p>

                <div className='info-box'>
                  <p>
                    This will clear all logs where the action was unsuccessful.
                  </p>
                </div>

                <button
                  onClick={handleClearFailedActions}
                  disabled={loading}
                  className='clear-btn'
                >
                  {loading ? 'Clearing...' : 'Clear Failed Actions'}
                </button>
              </div>
            )}

            {/* Old Logs Tab */}
            {activeTab === 'old' && (
              <div className='tab-panel'>
                <h3>Clear Old Logs</h3>
                <p>Clear logs older than a specified number of days.</p>

                <div className='form-group'>
                  <label>Days to Keep:</label>
                  <input
                    type='number'
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                    min='1'
                    max='3650'
                    className='form-input'
                  />
                  <small>Logs older than this many days will be deleted.</small>
                </div>

                <button
                  onClick={handleClearOlderThan}
                  disabled={loading}
                  className='clear-btn'
                >
                  {loading ? 'Clearing...' : 'Clear Old Logs'}
                </button>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .advanced-clearing-modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            background: #f9fafb;
          }

          .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
            display: flex;
            align-items: center;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 20px;
            color: #6b7280;
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
          }

          .close-btn:hover {
            background: #e5e7eb;
            color: #374151;
          }

          .modal-body {
            padding: 20px;
            max-height: 60vh;
            overflow-y: auto;
          }

          .warning-banner {
            display: flex;
            align-items: center;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
            color: #92400e;
          }

          .warning-icon {
            margin-right: 8px;
            color: #f59e0b;
          }

          .tabs {
            display: flex;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
            overflow-x: auto;
          }

          .tab {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            border: none;
            background: none;
            color: #6b7280;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            white-space: nowrap;
            font-size: 14px;
          }

          .tab:hover {
            color: #374151;
            background: #f9fafb;
          }

          .tab.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
            background: #eff6ff;
          }

          .tab-panel {
            padding: 20px 0;
          }

          .tab-panel h3 {
            margin: 0 0 8px 0;
            color: #1f2937;
            font-size: 16px;
          }

          .tab-panel p {
            margin: 0 0 20px 0;
            color: #6b7280;
            font-size: 14px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #374151;
          }

          .form-input,
          .form-select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            color: #374151;
            background: white;
          }

          .form-input:focus,
          .form-select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-group small {
            display: block;
            margin-top: 4px;
            color: #6b7280;
            font-size: 12px;
          }

          .info-box {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
          }

          .info-box p {
            margin: 0;
            color: #374151;
            font-size: 14px;
          }

          .clear-btn {
            background: #dc2626;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
            width: 100%;
          }

          .clear-btn:hover:not(:disabled) {
            background: #b91c1c;
          }

          .clear-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .mr-2 {
            margin-right: 8px;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdvancedLogClearing;
