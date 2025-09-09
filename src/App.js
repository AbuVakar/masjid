import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorFallback from './components/ErrorFallback.js';
import './App.css';

// Components
import Header from './components/Header';
import Modal from './components/Modal';
import UserAuth from './components/UserAuth';
import Footer from './components/Footer';
// import NotificationTester from './components/NotificationTester';
import BackToTop from './components/BackToTop';
import './components/NotificationTester.css';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ResourcesPage from './pages/ResourcesPage';

// Hooks
import { useUser } from './context/UserContext';
import { useNotify } from './context/NotificationContext';
import { useHouses } from './context/HouseContext';

// Utilities
import {
  initializeErrorHandling,
  measurePerformance,
  logError,
  ERROR_SEVERITY,
} from './utils/errorHandler';
import { apiService } from './services/api';

// Initialize error handling on app start
initializeErrorHandling();

function App() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState(null);
  const [currentView, setCurrentView] = useState('main');
  const [prayerTimes, setPrayerTimes] = useState({
    Fajr: '05:15',
    Dhuhr: '14:15',
    Asr: '17:30',
    Maghrib: '19:10',
    Isha: '20:45',
  });

  const {
    user,
    login,
    logout: logoutUser,
    register,
    enableGuestMode,
    updateUser,
    isAuthenticated,
    isAdmin,
    isGuest,
    loading: userLoading,
  } = useUser();

  const { notify } = useNotify();
  const { saveHouse, saveMember } = useHouses();

  const handleUserLogin = useCallback(
    async (credentials) => {
      try {
        await login(credentials);
        notify(`Welcome back, ${credentials.username}!`, { type: 'success' });
      } catch (error) {
        logError(error, 'User Login', ERROR_SEVERITY.HIGH);
        // Don't show duplicate error message - let UserAuth handle it
        throw error;
      }
    },
    [login, notify],
  );

  const handleUserRegister = useCallback(
    async (userData) => {
      try {
        await register(userData);
        notify(`Welcome, ${userData.username}!`, { type: 'success' });
      } catch (error) {
        logError(error, 'User Registration', ERROR_SEVERITY.HIGH);
        // Don't show duplicate error message - let UserAuth handle it
        throw error;
      }
    },
    [register, notify],
  );

  const handleGuestMode = useCallback(() => {
    enableGuestMode();
    notify(
      'Entering guest mode with limited access. You can only view houses, prayer times, and contact information.',
      { type: 'info' },
    );
  }, [enableGuestMode, notify]);

  const openModal = useCallback((type, data = null) => {
    setModalType(type);
    setModalData(data);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setModalType('');
    setModalData(null);
  }, []);

  const handleLogout = useCallback(() => {
    logoutUser();
    closeModal();
    notify('Logged out successfully.', { type: 'success' });
  }, [logoutUser, closeModal, notify]);

  // Add notification tester function to window
  useEffect(() => {
    window.openNotificationTester = () => {
      openModal('notification_tester', { user });
    };

    // Cleanup
    return () => {
      delete window.openNotificationTester;
    };
  }, [openModal, user]);

  const handleModalSave = useCallback(
    async (payload, type) => {
      console.log(
        '🔧 handleModalSave called - type:',
        type,
        'payload:',
        payload,
      );
      try {
        // Handle different modal types
        switch (type) {
          case 'house':
            // Handle house save
            await saveHouse(payload);
            closeModal();
            break;
          case 'member':
            // Handle member save
            await saveMember(payload.houseId, payload);
            closeModal();
            break;
          case 'timetable':
            // Handle timetable save
            try {
              // Check if user is admin
              if (!isAdmin) {
                notify('Only admins can update the timetable.', {
                  type: 'error',
                });
                break;
              }

              // Check if user is authenticated
              if (!isAuthenticated) {
                notify('Please log in to update timetable.', {
                  type: 'error',
                });
                break;
              }

              const result = await apiService.updatePrayerTimes(payload.times);
              if (result.success) {
                // Update local prayer times state
                setPrayerTimes(result.data);
                notify('Timetable updated successfully!', { type: 'success' });
                closeModal();
              } else {
                throw new Error('Failed to update timetable');
              }
            } catch (error) {
              console.error('Timetable update error:', error);
              const message =
                error.response?.data?.message ||
                error.message ||
                'Failed to update timetable. Please try again.';
              logError(error, 'Timetable Update', ERROR_SEVERITY.HIGH);
              notify(message, {
                type: 'error',
              });
              // Don't close modal on error so user can retry
            }
            break;
          case 'notify_prefs':
            // Handle notification preferences save
            notify('Notification preferences saved!', { type: 'success' });
            closeModal();
            break;
          case 'user_profile':
            // Handle user profile preferences save
            try {
              console.log('=== APP.JS SEND DEBUG ===');
              console.log(
                'App.js - Sending Fajr timing:',
                payload.prayerTiming?.Fajr,
              );
              console.log(
                'App.js - Sending Dhuhr timing:',
                payload.prayerTiming?.Dhuhr,
              );
              console.log(
                'App.js - Sending Asr timing:',
                payload.prayerTiming?.Asr,
              );
              console.log(
                'App.js - Sending Maghrib timing:',
                payload.prayerTiming?.Maghrib,
              );
              console.log(
                'App.js - Sending Isha timing:',
                payload.prayerTiming?.Isha,
              );
              console.log(
                'App.js - Full prayer timing object being sent:',
                payload.prayerTiming,
              );
              console.log('App.js - Full payload being sent:', payload);
              console.log(
                'App.js - Payload JSON:',
                JSON.stringify(payload, null, 2),
              );
              console.log('=== END APP.JS SEND DEBUG ===');
              const result = await apiService.updateProfile(payload);
              if (result.success) {
                console.log('=== APP.JS RESULT DEBUG ===');
                console.log(
                  'App.js - Result Fajr timing:',
                  result.data?.preferences?.prayerTiming?.Fajr,
                );
                console.log(
                  'App.js - Result Dhuhr timing:',
                  result.data?.preferences?.prayerTiming?.Dhuhr,
                );
                console.log(
                  'App.js - Result Asr timing:',
                  result.data?.preferences?.prayerTiming?.Asr,
                );
                console.log(
                  'App.js - Result Maghrib timing:',
                  result.data?.preferences?.prayerTiming?.Maghrib,
                );
                console.log(
                  'App.js - Result Isha timing:',
                  result.data?.preferences?.prayerTiming?.Isha,
                );
                console.log(
                  'App.js - Full prayer timing object received:',
                  result.data?.preferences?.prayerTiming,
                );
                console.log('=== END APP.JS RESULT DEBUG ===');
                // Update local user state with new preferences
                console.log('App.js - Calling updateUser with:', result.data);
                updateUser(result.data);
                console.log('App.js - updateUser called successfully');
                notify('Profile preferences saved successfully!', {
                  type: 'success',
                });
                closeModal();
              } else {
                throw new Error('Failed to update profile preferences');
              }
            } catch (error) {
              const message =
                error.response?.data?.message ||
                error.message ||
                'Failed to save profile preferences. Please try again.';
              logError(
                error,
                'Profile Preferences Update',
                ERROR_SEVERITY.HIGH,
              );
              notify(message, { type: 'error' });
              // Don't close modal on error so user can retry
            }
            break;
          case 'contact_admin':
            // Handle contact admin form
            try {
              const result = await apiService.submitContactForm(payload);
              if (result.success) {
                // Show success message with WhatsApp info
                const successMessage = result.data?.whatsappNotification
                  ? `Message sent successfully! Admin will be notified on WhatsApp (${result.data.adminNumber}).`
                  : result.message ||
                    'Message sent successfully! We will get back to you soon.';

                notify(successMessage, { type: 'success' });

                // If WhatsApp notification was prepared, show additional info
                if (result.data?.whatsappNotification) {
                }

                closeModal();
              } else {
                throw new Error(result.message || 'Failed to send message');
              }
            } catch (error) {
              const message =
                error.response?.data?.message ||
                error.message ||
                'Failed to send message. Please try again.';
              logError(error, 'Contact Form Submission', ERROR_SEVERITY.HIGH);
              notify(message, { type: 'error' });
              // Don't close modal on error so user can retry
            }
            break;
          case 'info':
            // Handle info modal saves (Aumoor, Jama'at Activities, etc.)
            // Data is now saved directly in InfoModal component via API
            notify(`${payload.type} updated successfully!`, {
              type: 'success',
            });
            closeModal();
            break;
          default:
            closeModal();
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'An unexpected error occurred during save.';
        logError(error, 'Modal Save', ERROR_SEVERITY.HIGH, { payload, type });
        notify(message, { type: 'error' });
      }
    },
    [closeModal, notify, saveHouse, saveMember, updateUser],
  );

  const handleNavigation = useCallback(
    (view, data = {}) => {
      if (['main', 'dashboard', 'resources'].includes(view)) {
        setCurrentView(view);
      } else {
        openModal(view, data);
      }
    },
    [openModal],
  );

  useEffect(() => {
    measurePerformance('App Component Mount', () => {});
  }, []);

  // Load prayer times
  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        const result = await apiService.getPrayerTimes();
        if (result.success && result.data) {
          setPrayerTimes(result.data);
        }
      } catch (error) {
        console.error('Failed to load prayer times:', error);
      }
    };

    if (isAuthenticated || isGuest) {
      loadPrayerTimes();
    }
  }, [isAuthenticated, isGuest]);

  if (userLoading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>Loading Masjid Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return (
      <div className='app'>
        <UserAuth
          onLogin={handleUserLogin}
          onRegister={handleUserRegister}
          onGuestMode={handleGuestMode}
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigation} />;
      case 'resources':
        return (
          <ResourcesPage
            onClose={() => setCurrentView('main')}
            onNavigate={(view) => setCurrentView(view)}
          />
        );
      case 'main':
      default:
        return <HomePage openModal={openModal} />;
    }
  };

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className='app'>
        <ErrorBoundary>
          <Header
            user={user}
            onLogout={handleLogout}
            isAdmin={isAdmin}
            isGuest={isGuest}
            onNavClick={handleNavigation}
            onShowProfile={() => openModal('user_profile', { user })}
            onEnableNotifications={
              isGuest ? null : () => openModal('notify_prefs', { user })
            }
            prayerTimes={prayerTimes}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <main className='main-content'>{renderContent()}</main>
        </ErrorBoundary>

        <ErrorBoundary>
          <Footer />
        </ErrorBoundary>

        {/* Back to Top Button */}
        <BackToTop />

        {showModal && (
          <ErrorBoundary>
            <Modal
              type={modalType}
              data={modalData}
              onClose={closeModal}
              onSave={handleModalSave}
              onLogout={handleLogout}
              L={{}}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
