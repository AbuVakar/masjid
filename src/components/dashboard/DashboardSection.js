import React from 'react';
import { FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa';

/**
 * A component to display dashboard sections with premium styling.
 * @param {object} props - The component props.
 * @param {object} props.section - The section data to display.
 * @param {function} props.onNavigate - The function to call for navigation.
 * @returns {JSX.Element} The rendered component.
 */
const DashboardSection = ({ section, onNavigate }) => {
  return (
    <div className='section-premium'>
      <div className='section-content'>
        {/* Section Header */}
        <div className='section-header'>
          <div className='header-left'>
            <div className='section-icon'>
              <div
                className={`icon-container ${section.color.replace('bg-', '')}`}
              >
                <section.icon className='section-icon-svg' />
              </div>
            </div>
            <div className='section-info'>
              <h3 className='section-title'>{section.title}</h3>
              <p className='section-description'>{section.description}</p>
            </div>
          </div>

          <div className='header-right'>
            <div className='section-badge'>
              <span className='badge-text'>{section.count}</span>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className='section-body'>
          <div className='content-grid'>
            {section.items?.map((item, index) => (
              <div key={index} className='content-item'>
                <div className='item-icon'>
                  <div className='item-icon-bg'>
                    <span className='item-icon-text'>{item.icon}</span>
                  </div>
                </div>
                <div className='item-content'>
                  <h4 className='item-title'>{item.title}</h4>
                  <p className='item-description'>{item.description}</p>
                </div>
                <div className='item-action'>
                  <button
                    onClick={() => onNavigate(item.action)}
                    className='action-button'
                  >
                    <FaArrowRight className='action-icon' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Footer */}
        <div className='section-footer'>
          <div className='footer-actions'>
            <button
              onClick={() => onNavigate(section.primaryAction)}
              className='primary-action-btn'
            >
              <span className='btn-text'>View All {section.title}</span>
              <FaExternalLinkAlt className='btn-icon' />
            </button>
          </div>

          <div className='footer-stats'>
            <div className='stat-item'>
              <span className='stat-label'>Total</span>
              <span className='stat-value'>{section.count}</span>
            </div>
            <div className='stat-item'>
              <span className='stat-label'>Active</span>
              <span className='stat-value active'>
                {section.activeCount || section.count}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium CSS Styles */}
      <style jsx>{`
        .section-premium {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
        }

        .section-premium:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
          border-color: rgba(0, 212, 255, 0.5);
        }

        .section-content {
          padding: 25px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .section-icon {
          flex-shrink: 0;
        }

        .icon-container {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .icon-container.blue {
          background: linear-gradient(135deg, #00d4ff, #0099cc);
        }

        .icon-container.green {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
        }

        .icon-container.purple {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
        }

        .icon-container.orange {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .icon-container.red {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .icon-container.cyan {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
        }

        .section-premium:hover .icon-container {
          transform: scale(1.1);
        }

        .section-icon-svg {
          color: white;
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .section-info {
          flex: 1;
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #00d4ff;
          margin: 0 0 5px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .section-description {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.4;
        }

        .header-right {
          flex-shrink: 0;
        }

        .section-badge {
          background: rgba(0, 212, 255, 0.2);
          border: 1px solid rgba(0, 212, 255, 0.4);
          border-radius: 20px;
          padding: 8px 16px;
          backdrop-filter: blur(10px);
        }

        .badge-text {
          color: #00d4ff;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .section-body {
          margin-bottom: 25px;
        }

        .content-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .content-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 15px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .content-item:hover {
          background: rgba(0, 0, 0, 0.4);
          border-color: rgba(0, 212, 255, 0.4);
          transform: translateX(5px);
        }

        .item-icon {
          flex-shrink: 0;
        }

        .item-icon-bg {
          width: 40px;
          height: 40px;
          background: rgba(0, 212, 255, 0.2);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-icon-text {
          font-size: 16px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }

        .item-content {
          flex: 1;
        }

        .item-title {
          font-size: 1rem;
          font-weight: 600;
          color: #00d4ff;
          margin: 0 0 3px 0;
        }

        .item-description {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.3;
        }

        .item-action {
          flex-shrink: 0;
        }

        .action-button {
          width: 35px;
          height: 35px;
          background: rgba(0, 212, 255, 0.2);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .action-button:hover {
          background: rgba(0, 212, 255, 0.3);
          border-color: rgba(0, 212, 255, 0.5);
          transform: scale(1.1);
        }

        .action-icon {
          color: #00d4ff;
          font-size: 12px;
        }

        .section-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid rgba(0, 212, 255, 0.2);
        }

        .footer-actions {
          flex: 1;
        }

        .primary-action-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(0, 212, 255, 0.3);
        }

        .primary-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
          background: linear-gradient(135deg, #0099cc, #006699);
        }

        .btn-text {
          font-weight: 700;
        }

        .btn-icon {
          font-size: 12px;
        }

        .footer-stats {
          display: flex;
          gap: 20px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .stat-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #00d4ff;
        }

        .stat-value.active {
          color: #00ff88;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .section-content {
            padding: 20px;
          }

          .section-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .header-left {
            flex-direction: column;
            gap: 10px;
          }

          .section-footer {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .footer-stats {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .section-content {
            padding: 15px;
          }

          .section-title {
            font-size: 1.2rem;
          }

          .content-item {
            padding: 12px;
          }

          .primary-action-btn {
            padding: 10px 16px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardSection;
