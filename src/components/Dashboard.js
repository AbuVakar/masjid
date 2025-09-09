import React from 'react';
import useDashboardStats from '../hooks/useDashboardStats';
import { getDashboardCards, getSummaryStats } from './dashboard.config';
import DashboardHeader from './dashboard/DashboardHeader';
import SummaryStats from './dashboard/SummaryStats';
import DashboardSection from './dashboard/DashboardSection';
import QuickActions from './dashboard/QuickActions';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = ({
  houses = [],
  members = [],
  resources = [],
  onNavigate,
  isAdmin = false,
}) => {
  const stats = useDashboardStats(houses, members, resources);
  const dashboardCards = getDashboardCards(stats, onNavigate);
  const summaryStats = getSummaryStats(stats, houses, members);

  return (
    <ErrorBoundary>
      <div className='dashboard-premium'>
        {/* Premium Background with Particles */}
        <div className='dashboard-bg-premium'>
          <div className='particles-container'>
            <div className='particle particle-1'></div>
            <div className='particle particle-2'></div>
            <div className='particle particle-3'></div>
            <div className='particle particle-4'></div>
            <div className='particle particle-5'></div>
          </div>
        </div>

        {/* Main Dashboard Container */}
        <div className='dashboard-container'>
          {/* Header Section */}
          <header className='dashboard-header'>
            <ErrorBoundary>
              <DashboardHeader onNavigate={onNavigate} />
            </ErrorBoundary>
          </header>

          {/* Main Content Area */}
          <main className='dashboard-main'>
            {/* Stats Overview Section */}
            <section className='stats-overview'>
              <ErrorBoundary>
                <SummaryStats summaryStats={summaryStats} />
              </ErrorBoundary>
            </section>

            {/* Dashboard Cards Grid */}
            <section className='dashboard-cards-section'>
              <div className='cards-grid'>
                {dashboardCards.map((section, sectionIndex) => (
                  <ErrorBoundary key={sectionIndex}>
                    <div
                      className='card-wrapper animate-slideInUp-premium'
                      style={{ animationDelay: `${sectionIndex * 0.1}s` }}
                    >
                      <DashboardSection
                        section={section}
                        onNavigate={onNavigate}
                      />
                    </div>
                  </ErrorBoundary>
                ))}
              </div>
            </section>

            {/* Admin Quick Actions */}
            {isAdmin && (
              <section className='admin-actions-section'>
                <ErrorBoundary>
                  <QuickActions onNavigate={onNavigate} />
                </ErrorBoundary>
              </section>
            )}

            {/* Footer Section */}
            <footer className='dashboard-footer'>
              <div className='footer-content'>
                <div className='status-indicators'>
                  <div className='status-item'>
                    <div className='status-premium online'></div>
                    <span className='text-premium-secondary'>
                      System Online
                    </span>
                  </div>
                  <div className='status-item'>
                    <div className='status-premium active'></div>
                    <span className='text-premium-secondary'>
                      Real-time Data
                    </span>
                  </div>
                  <div className='status-item'>
                    <div className='status-premium warning'></div>
                    <span className='text-premium-secondary'>
                      Secure Connection
                    </span>
                  </div>
                </div>

                <div className='last-updated'>
                  <span className='text-premium-tertiary'>Last updated:</span>
                  <span className='text-premium-primary'>
                    {new Date().toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className='footer-actions'>
                  <button
                    onClick={() => onNavigate('main')}
                    className='btn-premium-primary'
                  >
                    <span className='button-icon'>←</span>
                    <span className='button-text'>Back to Main View</span>
                  </button>
                </div>
              </div>
            </footer>
          </main>
        </div>

        {/* Premium CSS Styles */}
        <style jsx>{`
          .dashboard-premium {
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
          }

          .dashboard-bg-premium {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              135deg,
              #0a0a0a 0%,
              #1a1a2e 25%,
              #16213e 50%,
              #0f3460 75%,
              #533483 100%
            );
            z-index: -1;
          }

          .particles-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .particle {
            position: absolute;
            border-radius: 50%;
            background: linear-gradient(45deg, #00d4ff, #0099cc);
            animation: float-particle 6s ease-in-out infinite;
          }

          .particle-1 {
            width: 80px;
            height: 80px;
            top: 10%;
            left: 10%;
            animation-delay: 0s;
          }

          .particle-2 {
            width: 120px;
            height: 120px;
            top: 60%;
            right: 10%;
            animation-delay: 2s;
          }

          .particle-3 {
            width: 60px;
            height: 60px;
            top: 30%;
            right: 30%;
            animation-delay: 4s;
          }

          .particle-4 {
            width: 100px;
            height: 100px;
            bottom: 20%;
            left: 20%;
            animation-delay: 1s;
          }

          .particle-5 {
            width: 40px;
            height: 40px;
            top: 80%;
            left: 60%;
            animation-delay: 3s;
          }

          @keyframes float-particle {
            0%,
            100% {
              transform: translateY(0px) rotate(0deg);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-20px) rotate(180deg);
              opacity: 0.6;
            }
          }

          .dashboard-container {
            position: relative;
            z-index: 1;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
          }

          .dashboard-header {
            margin-bottom: 30px;
          }

          .dashboard-main {
            display: flex;
            flex-direction: column;
            gap: 30px;
          }

          .stats-overview {
            margin-bottom: 20px;
          }

          .dashboard-cards-section {
            margin-bottom: 30px;
          }

          .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
          }

          .card-wrapper {
            opacity: 0;
            transform: translateY(30px);
          }

          .admin-actions-section {
            margin-bottom: 30px;
          }

          .dashboard-footer {
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(0, 212, 255, 0.3);
            border-radius: 20px;
            padding: 30px;
            margin-top: 20px;
          }

          .footer-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 25px;
          }

          .status-indicators {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .status-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 25px;
            backdrop-filter: blur(10px);
          }

          .status-premium {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }

          .status-premium.online {
            background: #00ff88;
            box-shadow: 0 0 20px #00ff88;
          }

          .status-premium.active {
            background: #00d4ff;
            box-shadow: 0 0 20px #00d4ff;
          }

          .status-premium.warning {
            background: #f59e0b;
            box-shadow: 0 0 20px #f59e0b;
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

          .text-premium-primary {
            color: #00d4ff;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }

          .text-premium-secondary {
            color: rgba(255, 255, 255, 0.9);
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }

          .text-premium-tertiary {
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }

          .last-updated {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
          }

          .footer-actions {
            margin-top: 10px;
          }

          .btn-premium-primary {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
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

          .btn-premium-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 212, 255, 0.4);
            background: linear-gradient(135deg, #0099cc, #006699);
          }

          .button-icon {
            font-size: 18px;
            animation: bounce 2s ease-in-out infinite;
          }

          @keyframes bounce {
            0%,
            100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(-3px);
            }
          }

          .button-text {
            font-weight: 700;
          }

          /* Responsive Design */
          @media (max-width: 768px) {
            .dashboard-container {
              padding: 15px;
            }

            .cards-grid {
              grid-template-columns: 1fr;
              gap: 20px;
            }

            .status-indicators {
              flex-direction: column;
              gap: 15px;
            }

            .footer-content {
              gap: 20px;
            }
          }

          @media (max-width: 480px) {
            .dashboard-container {
              padding: 10px;
            }

            .dashboard-footer {
              padding: 20px;
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(Dashboard);
