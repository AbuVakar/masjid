import React from 'react';
import {
  FaChartBar,
  FaTimes,
  FaSignal,
  FaShieldAlt,
  FaRocket,
} from 'react-icons/fa';

/**
 * The header component for the dashboard.
 * @param {object} props - The component props.
 * @param {function} props.onNavigate - The function to call for navigation.
 * @returns {JSX.Element} The rendered component.
 */
const DashboardHeader = ({ onNavigate }) => {
  return (
    <div className='header-premium'>
      <div className='header-container'>
        <div className='header-content'>
          {/* Left Section - Title and Description */}
          <div className='header-left'>
            <div className='title-section'>
              <div className='icon-container'>
                <div className='icon-wrapper'>
                  <FaChartBar className='header-icon' />
                </div>
                <div className='icon-glow'></div>
              </div>

              <div className='title-content'>
                <h1 className='main-title'>Dashboard</h1>
                <p className='title-description'>
                  Comprehensive overview of community statistics and activities
                  with real-time insights
                </p>
                <div className='title-badges'>
                  <div className='badge'>
                    <FaRocket className='badge-icon' />
                    <span>Powered by AI</span>
                  </div>
                  <div className='badge'>
                    <FaShieldAlt className='badge-icon' />
                    <span>Secure & Private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Status Indicators and Close Button */}
          <div className='header-right'>
            <div className='status-section'>
              <div className='status-card'>
                <div className='status-indicator online'></div>
                <span className='status-label'>Live Data</span>
              </div>

              <div className='status-card'>
                <FaSignal className='status-icon' />
                <span className='status-label'>Real-time</span>
              </div>

              <div className='status-card'>
                <div className='status-indicator active'></div>
                <span className='status-label'>Active</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('main')}
              className='close-button'
              title='Close Dashboard'
            >
              <FaTimes className='close-icon' />
            </button>
          </div>
        </div>
      </div>

      {/* Premium CSS Styles */}
      <style jsx>{`
        .header-premium {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 25px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }

        .header-premium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 212, 255, 0.1) 0%,
            rgba(0, 0, 0, 0.2) 100%
          );
          border-radius: 25px;
          z-index: -1;
        }

        .header-container {
          position: relative;
          z-index: 1;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 30px;
        }

        .header-left {
          flex: 1;
        }

        .title-section {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .icon-container {
          position: relative;
        }

        .icon-wrapper {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #00d4ff, #0099cc, #006699);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 15px 35px rgba(0, 212, 255, 0.4);
          transition: all 0.3s ease;
        }

        .icon-wrapper:hover {
          transform: scale(1.05) rotate(5deg);
          box-shadow: 0 20px 45px rgba(0, 212, 255, 0.5);
        }

        .header-icon {
          color: #ffffff;
          font-size: 32px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .icon-glow {
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          border-radius: 25px;
          opacity: 0.3;
          filter: blur(20px);
          animation: glow-pulse 3s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }

        .title-content {
          flex: 1;
        }

        .main-title {
          font-size: 3.5rem;
          font-weight: 900;
          color: #00d4ff;
          margin: 0 0 10px 0;
          line-height: 1.1;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 1;
          letter-spacing: 1px;
        }

        .title-description {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 20px 0;
          line-height: 1.5;
          max-width: 500px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .title-badges {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(0, 212, 255, 0.2);
          border: 1px solid rgba(0, 212, 255, 0.4);
          border-radius: 20px;
          color: #00d4ff;
          font-size: 0.9rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .badge-icon {
          color: #00d4ff;
          font-size: 14px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .status-section {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .status-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          border-color: rgba(0, 212, 255, 0.5);
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: status-pulse 2s ease-in-out infinite;
        }

        .status-indicator.online {
          background: #00ff88;
          box-shadow: 0 0 20px #00ff88;
        }

        .status-indicator.active {
          background: #00d4ff;
          box-shadow: 0 0 20px #00d4ff;
        }

        @keyframes status-pulse {
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

        .status-icon {
          color: #00d4ff;
          font-size: 16px;
        }

        .status-label {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          font-size: 0.9rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .close-button {
          width: 50px;
          height: 50px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 107, 107, 0.4);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .close-button:hover {
          transform: scale(1.1);
          background: rgba(255, 107, 107, 0.2);
          border-color: rgba(255, 107, 107, 0.6);
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .close-icon {
          color: #ff6b6b;
          font-size: 20px;
          transition: all 0.3s ease;
        }

        .close-button:hover .close-icon {
          color: #ff5252;
          transform: rotate(90deg);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .header-content {
            flex-direction: column;
            gap: 25px;
            text-align: center;
          }

          .title-section {
            flex-direction: column;
            gap: 20px;
          }

          .main-title {
            font-size: 2.5rem;
          }

          .title-description {
            font-size: 1rem;
          }
        }

        @media (max-width: 768px) {
          .header-premium {
            padding: 20px;
          }

          .main-title {
            font-size: 2rem;
          }

          .title-badges {
            justify-content: center;
          }

          .status-section {
            justify-content: center;
          }

          .header-right {
            flex-direction: column;
            gap: 15px;
          }
        }

        @media (max-width: 480px) {
          .header-premium {
            padding: 15px;
          }

          .main-title {
            font-size: 1.8rem;
          }

          .title-description {
            font-size: 0.9rem;
          }

          .status-card {
            padding: 8px 12px;
          }

          .close-button {
            width: 45px;
            height: 45px;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardHeader;
