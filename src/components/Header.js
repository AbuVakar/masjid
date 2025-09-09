import React, { useState, useEffect, useRef } from 'react';
import {
  FaMosque,
  FaUserAlt,
  FaPhoneAlt,
  FaBook,
  FaBookOpen,
  FaUsers,
  FaBars,
  FaTimes,
  FaBell,
  FaSignOutAlt,
  FaUserCircle,
  FaShieldAlt,
} from 'react-icons/fa';
import Clock from './Clock';
import logo from '../assets/logo.png';
import ContactListModal from './ContactListModal';
import AdminNotificationPanel from './AdminNotificationPanel';

const Header = ({
  onNavClick,
  L,
  children,
  time,
  nextPrayer,
  prayerTimes,
  isAdmin,
  isGuest,
  onEnableNotifications,
  user,
  onShowProfile,
  onNotificationTestToggle,
  onLogout,
}) => {
  const translateRef = useRef(null);
  const mobileTranslateRef = useRef(null);

  // Load Google Translate widget dynamically (EN, HI, UR), isolate to a stable container
  useEffect(() => {
    const initFunctionName = 'googleTranslateElementInit';
    const existingScript = document.getElementById('google-translate-script');

    if (!window._gtInitialized && !window[initFunctionName]) {
      window[initFunctionName] = function () {
        try {
          const g = window.google;
          const TranslateElement = g?.translate?.TranslateElement;
          if (!TranslateElement || !translateRef.current) return;
          const opts = {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,ur',
            autoDisplay: false,
          };
          new TranslateElement(opts, translateRef.current);
          window._gtInitialized = true;

          setTimeout(() => {
            console.log('Google Translate widget initialized successfully');
            const style = document.createElement('style');
            style.textContent = `
              .goog-te-gadget { font-family: Arial, sans-serif !important; color: transparent !important; }
              .goog-te-gadget-simple { background-color: rgba(255, 255, 255, 0.1) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; border-radius: 6px !important; padding: 4px 8px !important; cursor: pointer !important; transition: all 0.2s ease !important; }
              .goog-te-gadget-simple:hover { background-color: rgba(255, 255, 255, 0.2) !important; }
              .goog-te-gadget-simple span { color: white !important; font-size: 14px !important; }
              .goog-te-menu-value span { display: none !important; }
              .goog-te-menu-value:before { content: 'G'; color: white; }
            `;
            document.head.appendChild(style);
          }, 100);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Google Translate initialization error:', e);
        }
      };
    }

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = `https://translate.google.com/translate_a/element.js?cb=${initFunctionName}`;
      script.async = true;
      document.body.appendChild(script);
    } else if (
      window.google &&
      window.google.translate &&
      window.google.translate.TranslateElement &&
      !window._gtInitialized
    ) {
      window[initFunctionName]();
    }
  }, []);

  // State for dropdown menus & mobile menu

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isContactListModalOpen, setIsContactListModalOpen] = useState(false);
  const [isAdminNotificationPanelOpen, setIsAdminNotificationPanelOpen] =
    useState(false);

  // Listen for contact list modal open event
  useEffect(() => {
    const handleOpenContactList = () => {
      setIsContactListModalOpen(true);
    };

    window.addEventListener('openContactListModal', handleOpenContactList);

    return () => {
      window.removeEventListener('openContactListModal', handleOpenContactList);
    };
  }, []);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug mobile menu state
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      console.log('Mobile menu opened:', { isMobile, isMobileMenuOpen });
      // Check for multiple mobile menus
      const mobileMenus = document.querySelectorAll('.mobile-nav-menu');
      console.log('Number of mobile menus found:', mobileMenus.length);
      mobileMenus.forEach((menu, index) => {
        console.log(`Mobile menu ${index + 1}:`, menu);
      });
    }
  }, [isMobile, isMobileMenuOpen]);

  // Debug profile menu state
  useEffect(() => {
    if (isMobile && isProfileMenuOpen) {
      console.log('Mobile profile menu opened:', {
        isMobile,
        isProfileMenuOpen,
      });

      // Initialize mobile translate widget if needed
      if (
        mobileTranslateRef.current &&
        window.google &&
        window.google.translate &&
        window.google.translate.TranslateElement
      ) {
        try {
          const opts = {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,ur',
            autoDisplay: false,
          };
          new window.google.translate.TranslateElement(
            opts,
            mobileTranslateRef.current,
          );
          console.log('Mobile translate widget initialized');

          // Wait a bit for the widget to be created, then check if it's visible
          setTimeout(() => {
            const mobileWidget = mobileTranslateRef.current.querySelector(
              '.goog-te-gadget-simple',
            );
            if (mobileWidget) {
              console.log('Mobile translate widget found and ready');
            } else {
              console.log('Mobile translate widget not found in container');
              // Show fallback text
              const fallback =
                mobileTranslateRef.current.parentElement.querySelector(
                  '.mobile-translate-fallback',
                );
              if (fallback) {
                fallback.style.display = 'block';
              }
            }
          }, 500);
        } catch (error) {
          console.log('Mobile translate widget initialization error:', error);
        }
      }

      // Check for Google Translate widget
      const translateWidget = document.querySelector('.goog-te-gadget-simple');
      console.log('Google Translate widget found:', !!translateWidget);
      if (translateWidget) {
        console.log('Translate widget details:', translateWidget);
      }
    }
  }, [isMobile, isProfileMenuOpen]);

  // Handle dropdown interactions

  // Close menus when clicking outside header
  useEffect(() => {
    const handleClickOutside = (event) => {
      const headerEl = event.target.closest('.header-container');
      if (!headerEl) {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isProfileMenuOpen) setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen, isProfileMenuOpen]);

  return (
    <div className='header-container'>
      <div className='header-top'>
        <div className='brand'>
          <img src={logo} alt='Logo' className='logo-img' />
          <div className='brand-text'>
            <h1 id='ui_title'>{L?.title || 'Silsila-ul-Ahwaal'}</h1>
            <div className='subtitle'>
              {L?.subtitle || 'Har Ghar Deen ka Markaz'}
            </div>
          </div>
        </div>

        {/* Mobile Controls */}
        {isMobile && (
          <div className='mobile-controls'>
            <button
              className='mobile-menu-btn navlink'
              aria-label='Toggle navigation menu'
              onClick={() => {
                setIsMobileMenuOpen((o) => !o);
                setIsProfileMenuOpen(false);
              }}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
            {!isGuest && (
              <button
                className='navlink notify-mobile'
                onClick={onEnableNotifications}
                title='Enable Notifications'
                aria-label='Enable Notifications'
              >
                <FaBell />
              </button>
            )}
            {!isGuest && (
              <button
                className='navlink profile-mobile'
                onClick={() => {
                  setIsProfileMenuOpen((o) => !o);
                  setIsMobileMenuOpen(false);
                }}
                title='User Profile'
                aria-label='User Profile'
              >
                <FaUserCircle />
              </button>
            )}
          </div>
        )}
        {!isMobile && (
          <nav className='nav-links'>
            <button
              className='navlink'
              onClick={() => onNavClick('timetable', { times: prayerTimes })}
              title='Prayer Timetable'
            >
              <FaMosque /> <span>Timetable</span>
            </button>

            {/* Jama'at Activities - Only for authenticated users */}
            {!isGuest && (
              <button
                className='navlink'
                onClick={() => onNavClick('info', 'running')}
                title="Jama'at Activities"
              >
                <FaUsers /> <span>Jama'at Activities</span>
              </button>
            )}
            {/* Resources - Only for authenticated users */}
            {!isGuest && (
              <button
                className='navlink'
                onClick={() => onNavClick('resources', {})}
                title='Resources & Documents'
              >
                <FaBook /> <span>Resources</span>
              </button>
            )}
            <button
              className='navlink'
              onClick={() => onNavClick('contact_admin', {})}
              title='Contact Us'
            >
              <FaPhoneAlt /> <span>Contact Us</span>
            </button>

            <button
              className='navlink'
              onClick={() => onNavClick('about', {})}
              title='About Us'
            >
              <FaBookOpen /> <span>About Us</span>
            </button>
          </nav>
        )}

        {/* Desktop Actions */}
        {!isMobile && (
          <div className='header-actions'>
            <div className='clock-display'>
              <Clock prayerTimes={prayerTimes} />
            </div>
            {!isGuest && (
              <button
                className='navlink notify-desktop'
                onClick={onEnableNotifications}
                title='Enable Notifications'
              >
                <FaBell />
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  className='navlink admin-notification-btn'
                  onClick={() => setIsAdminNotificationPanelOpen(true)}
                  title='Admin Notifications'
                >
                  <FaShieldAlt /> <span>Alerts</span>
                </button>
                <button
                  className='navlink admin-btn'
                  onClick={() => onNavClick('admin_dashboard', {})}
                  title='Admin Dashboard'
                >
                  👑 <span>Admin</span>
                </button>
              </>
            )}
            {!isGuest && (
              <button
                className='navlink user-profile-btn'
                onClick={onShowProfile}
                title={`Profile: ${user?.name || 'User'}`}
              >
                <FaUserAlt /> <span>{user?.name || 'User'}</span>
              </button>
            )}
            <div className='translate-wrap' title='Select Language'>
              <div id='google_translate_element' ref={translateRef}></div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu - Only Navlinks */}
        {isMobile && isMobileMenuOpen && (
          <div className='mobile-nav-menu' data-menu-type='new-mobile-nav'>
            <button
              type='button'
              className='mobile-nav-item'
              onClick={() => {
                onNavClick('timetable', { times: prayerTimes });
                setIsMobileMenuOpen(false);
              }}
            >
              <FaMosque /> <span>Timetable</span>
            </button>

            {!isGuest && (
              <button
                type='button'
                className='mobile-nav-item'
                onClick={() => {
                  onNavClick('info', 'running');
                  setIsMobileMenuOpen(false);
                }}
              >
                <FaUsers /> <span>Jama'at Activities</span>
              </button>
            )}
            {!isGuest && (
              <button
                type='button'
                className='mobile-nav-item'
                onClick={() => {
                  onNavClick('resources', {});
                  setIsMobileMenuOpen(false);
                }}
              >
                <FaBook /> <span>Resources</span>
              </button>
            )}
            <button
              type='button'
              className='mobile-nav-item'
              onClick={() => {
                onNavClick('contact_admin', {});
                setIsMobileMenuOpen(false);
              }}
            >
              <FaPhoneAlt /> <span>Contact Us</span>
            </button>

            <button
              type='button'
              className='mobile-nav-item'
              onClick={() => {
                onNavClick('about', {});
                setIsMobileMenuOpen(false);
              }}
            >
              <FaBookOpen /> <span>About Us</span>
            </button>
          </div>
        )}

        {/* Mobile Profile Menu - User Actions */}
        {isMobile && isProfileMenuOpen && (
          <div className='mobile-profile-menu'>
            <div className='mobile-clock-display'>
              <Clock prayerTimes={prayerTimes} />
            </div>
            <button
              type='button'
              className='mobile-menu-item'
              onClick={() => {
                onShowProfile();
                setIsProfileMenuOpen(false);
              }}
            >
              <FaUserAlt /> <span>Profile: {user?.name || 'User'}</span>
            </button>
            {isAdmin && (
              <>
                <button
                  type='button'
                  className='mobile-menu-item'
                  onClick={() => {
                    setIsAdminNotificationPanelOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                >
                  <FaShieldAlt /> <span>Admin Alerts</span>
                </button>
                <button
                  type='button'
                  className='mobile-menu-item'
                  onClick={() => {
                    onNavClick('admin_dashboard', {});
                    setIsProfileMenuOpen(false);
                  }}
                >
                  👑 <span>Admin Dashboard</span>
                </button>
              </>
            )}
            <div className='mobile-translate-wrap'>
              <div
                id='google_translate_element_mobile'
                ref={mobileTranslateRef}
              ></div>
              {/* Fallback text if widget doesn't load */}
              <div
                className='mobile-translate-fallback'
                style={{
                  display: 'none',
                  textAlign: 'center',
                  padding: '8px',
                  color: '#1e3a8a',
                  fontSize: '14px',
                }}
              >
                🌐 Language Toggle
              </div>
            </div>

            {/* Logout Button - At the bottom */}
            <div className='mobile-menu-divider'></div>
            <button
              type='button'
              className='mobile-menu-item logout-btn'
              onClick={() => {
                onLogout();
                setIsProfileMenuOpen(false);
              }}
            >
              <FaSignOutAlt /> <span>Logout</span>
            </button>
          </div>
        )}
      </div>
      {children}

      {/* Contact List Modal */}
      <ContactListModal
        isOpen={isContactListModalOpen}
        onClose={() => setIsContactListModalOpen(false)}
      />

      {/* Admin Notification Panel */}
      <AdminNotificationPanel
        isOpen={isAdminNotificationPanelOpen}
        onClose={() => setIsAdminNotificationPanelOpen(false)}
      />
    </div>
  );
};

export default React.memo(Header);
