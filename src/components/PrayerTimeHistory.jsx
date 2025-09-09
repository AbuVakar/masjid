import React, { useState, useEffect, useCallback } from 'react';
import { FaUser, FaCalendar, FaArrowLeft } from 'react-icons/fa';
import { useNotify } from '../context/NotificationContext';
import { sanitizeInput } from '../utils/sanitization';
import apiService from '../services/api';

const PrayerTimeHistory = ({ onBack }) => {
  console.log('🔄 PrayerTimeHistory component rendered');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notify } = useNotify();

  const loadHistory = useCallback(async () => {
    console.log('🔄 Loading prayer time history...');
    try {
      setLoading(true);
      setError(null);

      // Use the apiService instead of direct fetch
      const response = await apiService.getPrayerTimesHistory();
      console.log('🔄 Prayer time history response:', response);

      if (response.success) {
        setHistory(response.data || []);
        console.log('🔄 History data set:', response.data);
      } else {
        throw new Error(
          response.message || 'Failed to load prayer time history',
        );
      }
    } catch (err) {
      console.error('Error loading prayer time history:', err);
      setError(err.message || 'Failed to load prayer time history');
      notify('Failed to load prayer time history', { type: 'error' });
    } finally {
      setLoading(false);
      console.log('🔄 Loading finished');
    }
  }, [notify]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        {isActive ? '🟢 Active' : '⚪ Inactive'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className='modal-backdrop'>
        <div className='modal history-modal'>
          <div className='history-container'>
            <div className='history-header'>
              <h2>📜 Prayer Time History</h2>
              <p>Loading prayer time history...</p>
            </div>
            <div className='loading-spinner'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='modal-backdrop'>
        <div className='modal history-modal'>
          <div className='history-container'>
            <div className='history-header'>
              <h2>📜 Prayer Time History</h2>
              <p className='error-message'>{error}</p>
            </div>
            <button className='retry-btn' onClick={loadHistory}>
              🔄 Retry
            </button>
            <button className='back-btn' onClick={onBack}>
              <FaArrowLeft /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className='modal-backdrop'
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 999999,
      }}
    >
      <div className='modal history-modal'>
        <div className='history-container'>
          <div className='history-header'>
            <h2>📜 Prayer Time History</h2>
            <p>View all prayer time changes made by administrators</p>
          </div>

          <div className='history-content'>
            {history.length === 0 ? (
              <div className='empty-state'>
                <div className='empty-icon'>📜</div>
                <h3>No History Available</h3>
                <p>No prayer time changes have been made yet.</p>
              </div>
            ) : (
              <div className='history-list'>
                {history.map((entry, index) => (
                  <div key={entry.id || index} className='history-item'>
                    <div className='history-item-header'>
                      <div className='history-meta'>
                        <span className='history-date'>
                          <FaCalendar /> {formatDate(entry.updatedAt)}
                        </span>
                        <span className='history-user'>
                          <FaUser /> {sanitizeInput(entry.updatedBy)}
                        </span>
                        {getStatusBadge(entry.isActive)}
                      </div>
                    </div>

                    <div className='prayer-times-grid'>
                      <div className='prayer-time-item'>
                        <span className='prayer-name'>Fajr</span>
                        <span className='prayer-time'>{entry.Fajr}</span>
                      </div>
                      <div className='prayer-time-item'>
                        <span className='prayer-name'>Dhuhr</span>
                        <span className='prayer-time'>{entry.Dhuhr}</span>
                      </div>
                      <div className='prayer-time-item'>
                        <span className='prayer-name'>Asr</span>
                        <span className='prayer-time'>{entry.Asr}</span>
                      </div>
                      <div className='prayer-time-item'>
                        <span className='prayer-name'>Maghrib</span>
                        <span className='prayer-time'>{entry.Maghrib}</span>
                      </div>
                      <div className='prayer-time-item'>
                        <span className='prayer-name'>Isha</span>
                        <span className='prayer-time'>{entry.Isha}</span>
                      </div>
                    </div>

                    {index < history.length - 1 && (
                      <div className='history-divider'></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='history-actions'>
            <button className='refresh-btn' onClick={loadHistory}>
              🔄 Refresh History
            </button>
            <button className='back-btn' onClick={onBack}>
              <FaArrowLeft /> Back to Timetable
            </button>
          </div>
        </div>

        {/* Premium CSS Styles */}
        <style>{`
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            backdrop-filter: blur(5px);
          }

          .modal {
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(25px);
            border: 2px solid rgba(0, 212, 255, 0.3);
            border-radius: 20px;
            max-width: 700px;
            width: 85%;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            position: relative;
            z-index: 100000;
          }

          .history-modal {
            padding: 0;
          }

          .history-container {
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(25px);
            border-radius: 20px;
            overflow: hidden;
            max-width: 100%;
            width: 100%;
            margin: 0;
          }

          .history-header {
            background: linear-gradient(135deg, #00d4ff, #0099cc, #006699);
            color: white;
            padding: 20px;
            text-align: center;
            position: relative;
          }

          .history-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              135deg,
              rgba(0, 0, 0, 0.2) 0%,
              rgba(0, 0, 0, 0.1) 100%
            );
          }

          .history-header h2 {
            margin: 0 0 5px 0;
            font-size: 1.5rem;
            font-weight: 900;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            position: relative;
            z-index: 1;
          }

          .history-header p {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.9;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 1;
          }

          .history-content {
            padding: 20px;
            max-height: 50vh;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
          }

          .empty-state {
            text-align: center;
            padding: 30px 15px;
          }

          .empty-icon {
            font-size: 36px;
            margin-bottom: 12px;
          }

          .empty-state h3 {
            margin: 0 0 6px 0;
            color: #00d4ff;
            font-size: 1.2rem;
            font-weight: 700;
          }

          .empty-state p {
            margin: 0;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
          }

          .history-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .history-item {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(0, 212, 255, 0.2);
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
          }

          .history-item-header {
            margin-bottom: 15px;
          }

          .history-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.8);
          }

          .history-date,
          .history-user {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #00d4ff;
            font-weight: 600;
          }

          .status-badge {
            padding: 4px 8px;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          .status-badge.active {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
            border: 1px solid rgba(0, 255, 136, 0.4);
          }

          .status-badge.inactive {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .prayer-times-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
          }

          .prayer-time-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            background: rgba(0, 212, 255, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(0, 212, 255, 0.2);
            backdrop-filter: blur(10px);
          }

          .prayer-name {
            font-size: 0.7rem;
            font-weight: 600;
            color: #00d4ff;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 4px;
          }

          .prayer-time {
            font-size: 1rem;
            font-weight: 700;
            color: #ffffff;
            font-family: 'Courier New', monospace;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }

          .history-divider {
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(0, 212, 255, 0.3),
              transparent
            );
            margin: 15px 0;
          }

          .history-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            padding: 18px 20px;
            border-top: 1px solid rgba(0, 212, 255, 0.2);
            background: rgba(0, 0, 0, 0.5);
          }

          .refresh-btn,
          .back-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border: none;
            border-radius: 10px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .refresh-btn {
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: #000000;
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
          }

          .refresh-btn:hover {
            background: linear-gradient(135deg, #00cc6a, #00994d);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 255, 136, 0.4);
          }

          .back-btn {
            background: rgba(0, 212, 255, 0.2);
            color: #00d4ff;
            border: 1px solid rgba(0, 212, 255, 0.4);
            backdrop-filter: blur(10px);
          }

          .back-btn:hover {
            background: rgba(0, 212, 255, 0.3);
            border-color: rgba(0, 212, 255, 0.6);
            transform: translateY(-2px);
          }

          .error-message {
            color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
            padding: 12px;
            border-radius: 8px;
            margin: 15px 0;
            font-size: 0.9rem;
          }

          .retry-btn {
            background: linear-gradient(135deg, #ff6b6b, #ff5252);
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 10px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            margin: 15px 8px;
            transition: all 0.3s ease;
          }

          .retry-btn:hover {
            background: linear-gradient(135deg, #ff5252, #ff3838);
            transform: translateY(-2px);
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 212, 255, 0.2);
            border-top: 3px solid #00d4ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .modal {
              width: 90%;
              max-height: 85vh;
            }

            .history-header {
              padding: 15px;
            }

            .history-header h2 {
              font-size: 1.3rem;
            }

            .history-content {
              padding: 15px;
              max-height: 45vh;
            }

            .prayer-times-grid {
              grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
              gap: 8px;
            }

            .history-actions {
              flex-direction: column;
              gap: 8px;
              padding: 15px;
            }
          }

          @media (max-width: 480px) {
            .modal {
              width: 95%;
              border-radius: 15px;
              max-height: 90vh;
            }

            .history-header {
              padding: 12px;
            }

            .history-header h2 {
              font-size: 1.1rem;
            }

            .history-content {
              padding: 12px;
              max-height: 50vh;
            }

            .history-item {
              padding: 12px;
            }

            .history-meta {
              flex-direction: column;
              gap: 6px;
              align-items: flex-start;
            }

            .history-date,
            .history-user {
              font-size: 0.8rem;
            }

            .prayer-times-grid {
              grid-template-columns: 1fr;
              gap: 6px;
            }

            .prayer-time-item {
              padding: 6px;
              font-size: 0.85rem;
            }

            .history-actions {
              flex-direction: column;
              gap: 6px;
              padding: 12px;
            }

            .refresh-btn,
            .back-btn {
              padding: 8px 12px;
              font-size: 0.8rem;
            }
          }

          /* Ultra-small mobile optimizations */
          @media (max-width: 360px) {
            .modal {
              width: 98%;
              max-height: 95vh;
            }

            .history-header h2 {
              font-size: 1rem;
            }

            .history-content {
              max-height: 55vh;
            }

            .history-item {
              padding: 10px;
            }

            .prayer-times-grid {
              gap: 4px;
            }

            .prayer-time-item {
              padding: 4px;
              font-size: 0.8rem;
            }

            .history-actions {
              padding: 10px;
            }

            .refresh-btn,
            .back-btn {
              padding: 6px 10px;
              font-size: 0.75rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PrayerTimeHistory;
