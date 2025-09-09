import React from 'react';

/**
 * A component to display the summary statistics in a premium card format.
 * @param {object} props - The component props.
 * @param {Array} props.summaryStats - An array of summary stat objects to display.
 * @returns {JSX.Element} The rendered component.
 */
const SummaryStats = ({ summaryStats }) => {
  return (
    <div className='stats-premium'>
      {/* Header Section */}
      <div className='stats-header'>
        <div className='header-content'>
          <div className='header-icon'>
            <div className='icon-circle'>
              <span className='icon-text'>📊</span>
            </div>
          </div>
          <div className='header-text'>
            <h2 className='header-title'>Live Data Overview</h2>
            <p className='header-subtitle'>
              Real-time community statistics and insights
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='stats-grid'>
        {summaryStats.map((stat, index) => (
          <div key={index} className='stat-card'>
            <div className='card-content'>
              <div className='stat-header'>
                <div className='stat-icon'>
                  <div className={`icon-bg ${stat.color}`}>
                    <stat.icon className='stat-icon-svg' />
                  </div>
                </div>
                <div className='stat-info'>
                  <h3 className='stat-title'>{stat.title}</h3>
                  <p className='stat-category'>Community Metric</p>
                </div>
              </div>

              <div className='stat-value'>
                <span className='value-number'>
                  {stat.value.toLocaleString()}
                </span>
                <span className='value-label'>Total Count</span>
              </div>

              <div className='stat-footer'>
                <div className='status-indicator'>
                  <div className='status-dot'></div>
                  <span className='status-text'>Active</span>
                </div>
                <div className='data-source'>
                  <span className='source-text'>Live Data</span>
                </div>
              </div>
            </div>

            <div className='card-glow'></div>
          </div>
        ))}
      </div>

      {/* Additional Info Section */}
      <div className='stats-footer'>
        <div className='footer-content'>
          <div className='info-section'>
            <div className='info-item'>
              <div className='info-icon'>
                <div className='icon-dot blue'></div>
              </div>
              <div className='info-text'>
                <span className='info-label'>Data Source</span>
                <span className='info-value'>Community Database</span>
              </div>
            </div>
          </div>

          <div className='info-section'>
            <div className='info-item'>
              <div className='info-icon'>
                <div className='icon-dot green'></div>
              </div>
              <div className='info-text'>
                <span className='info-label'>Status</span>
                <span className='info-value'>All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium CSS Styles */}
      <style jsx>{`
        .stats-premium {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        .stats-header {
          background: linear-gradient(135deg, #00d4ff, #0099cc, #006699);
          padding: 30px;
          position: relative;
          overflow: hidden;
        }

        .stats-header::before {
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

        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .header-icon {
          flex-shrink: 0;
        }

        .icon-circle {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
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
          color: #ffffff;
          margin: 0 0 5px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .header-subtitle {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
          padding: 30px;
        }

        .stat-card {
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(0, 212, 255, 0.2);
          border-radius: 20px;
          padding: 25px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          border-color: rgba(0, 212, 255, 0.4);
        }

        .card-content {
          position: relative;
          z-index: 1;
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-icon {
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

        .icon-bg.cyan {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
        }

        .stat-card:hover .icon-bg {
          transform: scale(1.1);
        }

        .stat-icon-svg {
          color: #ffffff;
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .stat-info {
          flex: 1;
        }

        .stat-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #00d4ff;
          margin: 0 0 5px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .stat-category {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .stat-value {
          margin-bottom: 20px;
        }

        .value-number {
          display: block;
          font-size: 2.5rem;
          font-weight: 900;
          color: #00d4ff;
          line-height: 1;
          margin-bottom: 5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .value-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .stat-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          background: #00ff88;
          border-radius: 50%;
          box-shadow: 0 0 15px #00ff88;
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

        .status-text {
          font-size: 0.9rem;
          color: #00ff88;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .data-source {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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

        .stat-card:hover .card-glow {
          opacity: 1;
        }

        .stats-footer {
          background: rgba(0, 0, 0, 0.5);
          padding: 25px 30px;
          border-top: 2px solid rgba(0, 212, 255, 0.2);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .info-section {
          display: flex;
          align-items: center;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .info-icon {
          flex-shrink: 0;
        }

        .icon-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .icon-dot.blue {
          background: #00d4ff;
          box-shadow: 0 0 15px #00d4ff;
        }

        .icon-dot.green {
          background: #00ff88;
          box-shadow: 0 0 15px #00ff88;
        }

        .info-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .info-value {
          font-size: 0.9rem;
          color: #00d4ff;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .stats-header {
            padding: 20px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .header-title {
            font-size: 1.5rem;
          }

          .header-subtitle {
            font-size: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 20px;
          }

          .footer-content {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .stats-header {
            padding: 15px;
          }

          .header-title {
            font-size: 1.3rem;
          }

          .stats-grid {
            padding: 15px;
          }

          .stat-card {
            padding: 20px;
          }

          .value-number {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SummaryStats;
