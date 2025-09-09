import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { useNotify } from '../context/NotificationContext';
import { apiService } from '../services/api';
import ActivityLogs from './ActivityLogs';

const AdminDashboard = ({ onClose }) => {
  const { user } = useUser();
  const { notify } = useNotify();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        apiService.get('/admin/stats'),
        apiService.get('/admin/users'),
        apiService.get('/admin/audit-logs?limit=20'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAuditLogs(logsRes.data);
    } catch (error) {
      notify('Failed to load admin data', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, loadAdminData]);

  // Refresh stats when resources change
  useEffect(() => {
    const handleResourceChange = () => {
      if (user?.role === 'admin') {
        loadAdminData();
      }
    };

    // Listen for resource changes
    window.addEventListener('resourceChanged', handleResourceChange);

    return () => {
      window.removeEventListener('resourceChanged', handleResourceChange);
    };
  }, [user, loadAdminData]);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await apiService.put(`/admin/users/${userId}/role`, { role: newRole });
      notify('User role updated successfully', { type: 'success' });
      loadAdminData();
    } catch (error) {
      notify('Failed to update user role', { type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiService.delete(`/admin/users/${userId}`);
      notify('User deleted successfully', { type: 'success' });
      loadAdminData();
    } catch (error) {
      notify('Failed to delete user', { type: 'error' });
    }
  };

  const handleBackupData = async () => {
    try {
      const response = await apiService.get('/admin/backup');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `masjid-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify('Backup downloaded successfully', { type: 'success' });
    } catch (error) {
      notify('Failed to download backup', { type: 'error' });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className='admin-dashboard'>
        <div className='admin-header'>
          <h2>🔒 Admin Access Required</h2>
          <button onClick={onClose} className='close-btn'>
            ✕
          </button>
        </div>
        <div className='admin-content'>
          <p>You need admin privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='admin-dashboard'>
      <div className='admin-header'>
        <h2>👑 Admin Dashboard</h2>
        <button onClick={onClose} className='close-btn'>
          ✕
        </button>
      </div>

      <div className='admin-tabs'>
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={activeTab === 'audit' ? 'active' : ''}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Logs
        </button>
        <button
          className={activeTab === 'activities' ? 'active' : ''}
          onClick={() => setActiveTab('activities')}
        >
          📈 Activity Logs
        </button>
        <button
          className={activeTab === 'backup' ? 'active' : ''}
          onClick={() => setActiveTab('backup')}
        >
          💾 Backup
        </button>
      </div>

      <div className='admin-content'>
        {loading && <div className='loading'>Loading...</div>}

        {activeTab === 'overview' && stats && (
          <div className='overview-section'>
            <h3>System Statistics</h3>
            <div className='stats-grid'>
              <div className='stat-card'>
                <div className='stat-number'>{stats.users}</div>
                <div className='stat-label'>Total Users</div>
              </div>
              <div className='stat-card'>
                <div className='stat-number'>{stats.houses}</div>
                <div className='stat-label'>Total Houses</div>
              </div>
              <div className='stat-card'>
                <div className='stat-number'>{stats.members}</div>
                <div className='stat-label'>Total Members</div>
              </div>
              <div className='stat-card'>
                <div className='stat-number'>{stats.resources}</div>
                <div className='stat-label'>Total Resources</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className='users-section'>
            <h3>User Management</h3>
            <div className='users-table'>
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.name}</td>
                      <td>{user.email || 'N/A'}</td>
                      <td>
                        {user.username === 'admin' ? (
                          <span className='protected-admin'>
                            👑 Protected Admin
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleUpdateUserRole(user._id, e.target.value)
                            }
                            className='role-select'
                          >
                            <option value='user'>User</option>
                            <option value='admin'>Admin</option>
                          </select>
                        )}
                      </td>
                      <td>
                        {user.username === 'admin' ? (
                          <span className='protected-admin'>🔒 Protected</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className='delete-btn'
                            disabled={false}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className='audit-section'>
            <h3>Recent Audit Logs</h3>
            <div className='audit-logs'>
              {auditLogs.map((log) => (
                <div key={log._id} className='audit-log'>
                  <div className='log-header'>
                    <span className='log-action'>{log.action}</span>
                    <span className='log-time'>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className='log-details'>
                    <span>User: {log.username}</span>
                    <span className={log.success ? 'success' : 'error'}>
                      {log.success ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className='activities-section'>
            <ActivityLogs />
          </div>
        )}

        {activeTab === 'backup' && (
          <div className='backup-section'>
            <h3>System Backup</h3>
            <div className='backup-actions'>
              <button onClick={handleBackupData} className='backup-btn'>
                💾 Download Full Backup
              </button>
              <p className='backup-info'>
                This will download a complete backup of all system data
                including:
                <br />
                • Users (without passwords)
                <br />
                • Houses and Members
                <br />
                • Resources
                <br />• Prayer Times
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-dashboard {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 20px;
          color: white;
          width: 100%;
          height: 100%;
          overflow-y: auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .admin-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }

        .admin-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .admin-tabs button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .admin-tabs button.active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .admin-content {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 15px;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .stat-number {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.8;
        }

        .users-table table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        .users-table th,
        .users-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .users-table th {
          font-weight: bold;
          background: rgba(255, 255, 255, 0.1);
        }

        .role-select {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
        }

        .delete-btn {
          background: #ff4757;
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
        }

        .protected-admin {
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          color: #8b4513;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
          border: 1px solid #ffd700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .audit-logs {
          max-height: 400px;
          overflow-y: auto;
        }

        .audit-log {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 10px;
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .log-action {
          font-weight: bold;
        }

        .log-time {
          opacity: 0.7;
          font-size: 12px;
        }

        .log-details {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }

        .success {
          color: #2ed573;
        }

        .error {
          color: #ff4757;
        }

        .backup-actions {
          text-align: center;
        }

        .backup-btn {
          background: #2ed573;
          border: none;
          color: white;
          padding: 15px 30px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .backup-info {
          opacity: 0.8;
          line-height: 1.6;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        /* ===== MOBILE RESPONSIVENESS FIXES ===== */
        
        /* Tablet and Mobile Responsive Design */
        @media (max-width: 768px) {
          .admin-dashboard {
            padding: 16px;
            border-radius: 12px;
          }

          .admin-header {
            flex-direction: column;
            gap: 12px;
            text-align: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
          }

          .admin-header h2 {
            font-size: 20px;
          }

          .close-btn {
            padding: 6px 10px;
            font-size: 14px;
          }

          .admin-tabs {
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
          }

          .admin-tabs button {
            padding: 8px 16px;
            font-size: 14px;
            flex: 1;
            min-width: 120px;
          }

          .admin-content {
            padding: 16px;
            border-radius: 12px;
          }

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

          /* Users Table */
          .users-table {
            font-size: 12px;
          }

          .users-table th,
          .users-table td {
            padding: 6px 4px;
          }

          .users-table th {
            font-size: 11px;
          }

          /* Action Buttons */
          .edit-btn,
          .delete-btn {
            padding: 4px 8px;
            font-size: 11px;
          }

          /* Protected Admin Badge */
          .protected-admin {
            padding: 3px 8px;
            font-size: 10px;
          }

          /* Audit Logs */
          .audit-logs {
            max-height: 300px;
          }

          .audit-log {
            padding: 12px;
            margin-bottom: 8px;
          }

          .log-header {
            flex-direction: column;
            gap: 4px;
            margin-bottom: 8px;
          }

          .log-action {
            font-size: 13px;
          }

          .log-time {
            font-size: 11px;
          }

          .log-details {
            flex-direction: column;
            gap: 4px;
            font-size: 12px;
          }

          /* Backup Section */
          .backup-btn {
            padding: 12px 20px;
            font-size: 14px;
            margin-bottom: 16px;
          }

          .backup-info {
            font-size: 13px;
            line-height: 1.5;
          }

          .loading {
            padding: 20px;
            font-size: 16px;
          }
        }

        /* Small Mobile Optimizations */
        @media (max-width: 480px) {
          .admin-dashboard {
            padding: 12px;
            border-radius: 8px;
          }

          .admin-header {
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
          }

          .admin-header h2 {
            font-size: 18px;
          }

          .close-btn {
            padding: 4px 8px;
            font-size: 12px;
          }

          .admin-tabs {
            gap: 6px;
            margin-bottom: 12px;
          }

          .admin-tabs button {
            padding: 6px 12px;
            font-size: 12px;
            min-width: 100px;
          }

          .admin-content {
            padding: 12px;
            border-radius: 8px;
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

          /* Users Table */
          .users-table {
            font-size: 11px;
          }

          .users-table th,
          .users-table td {
            padding: 4px 2px;
          }

          .users-table th {
            font-size: 10px;
          }

          /* Action Buttons */
          .edit-btn,
          .delete-btn {
            padding: 3px 6px;
            font-size: 10px;
          }

          /* Protected Admin Badge */
          .protected-admin {
            padding: 2px 6px;
            font-size: 9px;
          }

          /* Audit Logs */
          .audit-log {
            padding: 8px;
            margin-bottom: 6px;
          }

          .log-action {
            font-size: 12px;
          }

          .log-time {
            font-size: 10px;
          }

          .log-details {
            font-size: 11px;
          }

          /* Backup Section */
          .backup-btn {
            padding: 10px 16px;
            font-size: 13px;
            margin-bottom: 12px;
          }

          .backup-info {
            font-size: 12px;
          }

          .loading {
            padding: 16px;
            font-size: 14px;
          }
        }

        /* ===== END MOBILE RESPONSIVENESS FIXES ===== */
      `}</style>
    </div>
  );
};

export default AdminDashboard;
