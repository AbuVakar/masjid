import React, { useState, useEffect } from 'react';
import mobileViewport from '../utils/mobileViewport';

const MobileModalTest = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [viewportInfo, setViewportInfo] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    // Get device and viewport information
    const info = mobileViewport.getMobileDeviceInfo();
    const viewport = {
      height: mobileViewport.getMobileViewportHeight(),
      safeAreaInsets: mobileViewport.getSafeAreaInsets(),
      modalPosition: mobileViewport.getMobileModalPosition(),
    };
    
    setDeviceInfo(info);
    setViewportInfo(viewport);
    
    console.log('📱 Mobile Device Info:', info);
    console.log('📱 Viewport Info:', viewport);
  }, []);

  const TestModal = () => {
    if (!showTestModal) return null;

    const mobilePosition = mobileViewport.getMobileModalPosition();
    const deviceInfo = mobileViewport.getMobileDeviceInfo();

    return (
      <div className='modal-backdrop'>
        <div
          className='modal timetable-modal'
          style={{
            position: 'fixed',
            top: mobilePosition.top,
            left: 0,
            width: '100vw',
            height: mobilePosition.height,
            maxHeight: mobilePosition.maxHeight,
            margin: 0,
            padding: 0,
            borderRadius: 0,
            background: '#000000',
            zIndex: 999999,
            overflow: 'hidden',
            ...(deviceInfo.isOnePlus && {
              transform: 'translateZ(0)',
              WebkitTransform: 'translateZ(0)',
              willChange: 'transform',
            }),
          }}
        >
          <div
            className='timetable-container'
            style={{
              height: `calc(${mobilePosition.height} - 80px)`,
              maxHeight: `calc(${mobilePosition.maxHeight} - 80px)`,
              overflowY: 'auto',
              padding: '20px',
              paddingBottom: '0px',
              margin: 0,
              background: '#111111',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              ...(deviceInfo.isOnePlus && {
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
              }),
            }}
          >
            <div style={{ color: 'white', padding: '20px' }}>
              <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>
                📱 Mobile Modal Test
              </h2>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#00ff88' }}>Device Information:</h3>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.5)', 
                  padding: '10px', 
                  borderRadius: '5px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(deviceInfo, null, 2)}
                </pre>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#00ff88' }}>Viewport Information:</h3>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.5)', 
                  padding: '10px', 
                  borderRadius: '5px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(viewportInfo, null, 2)}
                </pre>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#00ff88' }}>Modal Position:</h3>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.5)', 
                  padding: '10px', 
                  borderRadius: '5px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(mobilePosition, null, 2)}
                </pre>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#00ff88' }}>Test Instructions:</h3>
                <ul style={{ color: 'white', fontSize: '14px' }}>
                  <li>Scroll down to see if content is scrollable</li>
                  <li>Check if footer buttons are visible at the bottom</li>
                  <li>Test on OnePlus Nord CE 3 Lite 5G if available</li>
                  <li>Try rotating device to test orientation changes</li>
                  <li>Check if buttons are accessible and clickable</li>
                </ul>
              </div>

              {/* Add some content to make it scrollable */}
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} style={{ 
                  padding: '10px', 
                  margin: '5px 0', 
                  background: 'rgba(0,212,255,0.1)',
                  borderRadius: '5px',
                  border: '1px solid rgba(0,212,255,0.3)'
                }}>
                  <strong>Test Item {i + 1}</strong>
                  <p style={{ margin: '5px 0', fontSize: '12px' }}>
                    This is test content to make the modal scrollable. 
                    Scroll down to test if the footer buttons remain visible.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className='timetable-actions'
            style={{
              position: 'fixed',
              bottom: mobilePosition.bottom,
              left: 0,
              right: 0,
              width: '100vw',
              height: '80px',
              padding: '12px',
              background: '#000000',
              borderTop: '3px solid #00d4ff',
              zIndex: 9999999,
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.9)',
              visibility: 'visible',
              opacity: 1,
              ...(deviceInfo.isOnePlus && {
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                willChange: 'transform',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }),
            }}
          >
            <button
              type='button'
              className='action-btn ghost'
              onClick={() => setShowTestModal(false)}
              style={{
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                minHeight: '45px',
                minWidth: '70px',
                borderRadius: '8px',
                border: '2px solid #ffffff',
                background: '#0000ff',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                maxWidth: '100px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.8)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                visibility: 'visible',
                opacity: 1,
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              CLOSE
            </button>
            <button
              type='button'
              className='action-btn primary'
              onClick={() => {
                alert('Test button clicked! Modal footer is working correctly.');
              }}
              style={{
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                minHeight: '45px',
                minWidth: '70px',
                borderRadius: '8px',
                border: '2px solid #00d4ff',
                background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1.3,
                maxWidth: '120px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 6px 12px rgba(0,212,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                visibility: 'visible',
                opacity: 1,
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              TEST
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>📱 Mobile Modal Test Component</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Device Information:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(deviceInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Viewport Information:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(viewportInfo, null, 2)}
        </pre>
      </div>

      <button
        onClick={() => setShowTestModal(true)}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,212,255,0.3)',
        }}
      >
        🧪 Open Test Modal
      </button>

      <div style={{ marginTop: '20px' }}>
        <h3>Test Instructions:</h3>
        <ol>
          <li>Click "Open Test Modal" to test the mobile modal</li>
          <li>Scroll through the content to test scrolling</li>
          <li>Check if the footer buttons are visible and clickable</li>
          <li>Test on OnePlus Nord CE 3 Lite 5G if available</li>
          <li>Try different orientations (portrait/landscape)</li>
          <li>Test on different mobile browsers (Chrome, Safari, etc.)</li>
        </ol>
      </div>

      <TestModal />
    </div>
  );
};

export default MobileModalTest;