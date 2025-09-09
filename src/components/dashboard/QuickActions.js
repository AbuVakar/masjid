import React from 'react';
import {
  FaCog,
  FaUsers,
  FaChartBar,
  FaDownload,
  FaShieldAlt,
} from 'react-icons/fa';

/**
 * A component to display quick action buttons for admin users with premium styling.
 * @param {object} props - The component props.
 * @param {function} props.onNavigate - The function to call for navigation.
 * @returns {JSX.Element} The rendered component.
 */
const QuickActions = ({ onNavigate }) => {
  const adminActions = [
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      description: 'System management and analytics',
      icon: FaCog,
      color: 'blue',
      action: () => onNavigate('admin-dashboard'),
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      icon: FaUsers,
      color: 'green',
      action: () => onNavigate('user-management'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Detailed reports and insights',
      icon: FaChartBar,
      color: 'purple',
      action: () => onNavigate('analytics'),
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      description: 'Data backup and system restore',
      icon: FaDownload,
      color: 'orange',
      action: () => onNavigate('backup'),
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Security and access controls',
      icon: FaShieldAlt,
      color: 'red',
      action: () => onNavigate('security'),
    },
  ];

  return (
    <div className='quick-actions-premium'>
      <div className='actions-content'>
        {/* Header Section */}
        <div className='actions-header'>
          <div className='header-content'>
            <div className='header-icon'>
              <div className='icon-circle'>
                <span className='icon-text'>⚡</span>
              </div>
            </div>
            <div className='header-text'>
              <h2 className='header-title'>Quick Actions</h2>
              <p className='header-subtitle'>
                Administrative tools and system management
              </p>
            </div>
          </div>

          <div className='admin-badge'>
            <div className='badge-content'>
              <div className='badge-icon'>
                <div className='admin-dot'></div>
              </div>
              <span className='badge-text'>Admin Access</span>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className='actions-grid'>
          {adminActions.map((action, index) => (
            <div key={action.id} className='action-card'>
              <div className='card-content'>
                <div className='action-icon'>
                  <div className={`icon-bg ${action.color}`}>
                    <action.icon className='action-icon-svg' />
                  </div>
                </div>

                <div className='action-info'>
                  <h3 className='action-title'>{action.title}</h3>
                  <p className='action-description'>{action.description}</p>
                </div>

                <div className='action-button'>
                  <button onClick={action.action} className='execute-button'>
                    <span className='button-text'>Execute</span>
                  </button>
                </div>
              </div>

              <div className='card-glow'></div>
            </div>
          ))}
        </div>

        {/* Footer Section */}
        <div className='actions-footer'>
          <div className='footer-content'>
            <div className='status-section'>
              <div className='status-item'>
                <div className='status-dot online'></div>
                <span className='status-text'>All Systems Operational</span>
              </div>
            </div>

            <div className='info-section'>
              <div className='info-item'>
                <span className='info-label'>Access Level:</span>
                <span className='info-value'>Administrator</span>
              </div>
              <div className='info-item'>
                <span className='info-label'>Permissions:</span>
                <span className='info-value'>Full Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium CSS Styles */}
      <style jsx>{`
        .quick-actions-premium {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .actions-content {
          padding: 30px;
        }

        .actions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 25px;
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          flex-shrink: 0;
        }

        .icon-circle {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(0, 212, 255, 0.3);
        }

        .icon-text {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .header-text {
          flex: 1;
        }

        .header-title {
          font-size: 2rem;
          font-weight: 900;
          color: #00d4ff;
          margin: 0 0 5px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header-subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.4;
        }

        .admin-badge {
          flex-shrink: 0;
        }

        .badge-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(0, 212, 255, 0.2);
          border: 1px solid rgba(0, 212, 255, 0.4);
          border-radius: 25px;
          backdrop-filter: blur(10px);
        }

        .badge-icon {
          flex-shrink: 0;
        }

        .admin-dot {
          width: 12px;
          height: 12px;
          background: #00ff88;
          border-radius: 50%;
          box-shadow: 0 0 20px #00ff88;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        .badge-text {
          color: #00d4ff;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .action-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 20px;
          padding: 25px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          border-color: rgba(0, 212, 255, 0.4);
        }

        .card-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .action-icon {
          flex-shrink: 0;
        }

        .icon-bg {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .icon-bg.blue {
          background: linear-gradient(135deg, #00d4ff, #0099cc);
        }

        .icon-bg.green {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
        }

        .icon-bg.purple {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
        }

        .icon-bg.orange {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .icon-bg.red {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .action-card:hover .icon-bg {
          transform: scale(1.1);
        }

        .action-icon-svg {
          color: white;
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .action-info {
          flex: 1;
        }

        .action-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #00d4ff;
          margin: 0 0 5px 0;
        }

        .action-description {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.4;
        }

        .action-button {
          flex-shrink: 0;
        }

        .execute-button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(0, 212, 255, 0.3);
        }

        .execute-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
          background: linear-gradient(135deg, #0099cc, #006699);
        }

        .button-text {
          font-weight: 700;
        }

        .card-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 212, 255, 0.1),
            rgba(0, 153, 204, 0.1)
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 20px;
        }

        .action-card:hover .card-glow {
          opacity: 1;
        }

        .actions-footer {
          background: rgba(0, 0, 0, 0.5);
          padding: 25px 30px;
          border-top: 1px solid rgba(0, 212, 255, 0.2);
          margin: 0 -30px -30px -30px;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .status-section {
          display: flex;
          align-items: center;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .status-dot.online {
          background: #00ff88;
          box-shadow: 0 0 20px #00ff88;
        }

        .status-text {
          color: #00ff88;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .info-section {
          display: flex;
          gap: 30px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .info-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .info-value {
          font-size: 0.95rem;
          color: #00d4ff;
          font-weight: 600;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .actions-content {
            padding: 20px;
          }

          .actions-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .header-content {
            flex-direction: column;
            gap: 15px;
          }

          .header-title {
            font-size: 1.5rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .footer-content {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .info-section {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .actions-content {
            padding: 15px;
          }

          .header-title {
            font-size: 1.3rem;
          }

          .action-card {
            padding: 20px;
          }

          .card-content {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .actions-footer {
            padding: 20px;
            margin: 0 -15px -15px -15px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickActions;
