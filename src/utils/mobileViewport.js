/**
 * Mobile Viewport Utilities
 * Handles mobile browser viewport issues, especially for OnePlus Nord CE 3 Lite 5G
 */

// Dynamic viewport height calculation for mobile browsers
export const getMobileViewportHeight = () => {
  // Get the visual viewport height (excludes browser UI)
  const visualViewport = window.visualViewport;
  if (visualViewport) {
    return visualViewport.height;
  }

  // Fallback to window inner height
  return window.innerHeight;
};

// Get safe area insets for mobile devices
export const getSafeAreaInsets = () => {
  const computedStyle = getComputedStyle(document.documentElement);

  return {
    top: parseInt(
      computedStyle.getPropertyValue('--safe-area-inset-top') || '0',
    ),
    right: parseInt(
      computedStyle.getPropertyValue('--safe-area-inset-right') || '0',
    ),
    bottom: parseInt(
      computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0',
    ),
    left: parseInt(
      computedStyle.getPropertyValue('--safe-area-inset-left') || '0',
    ),
  };
};

// Detect if device is OnePlus Nord CE 3 Lite 5G or similar
export const isOnePlusDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('oneplus') ||
    userAgent.includes('one plus') ||
    userAgent.includes('nord') ||
    userAgent.includes('ce 3 lite')
  );
};

// Detect mobile device characteristics
export const getMobileDeviceInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent,
    );
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isChrome = /chrome/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);

  return {
    isMobile,
    isAndroid,
    isIOS,
    isChrome,
    isSafari,
    isOnePlus: isOnePlusDevice(),
    userAgent,
  };
};

// Apply mobile-specific CSS custom properties
export const applyMobileViewportCSS = () => {
  const deviceInfo = getMobileDeviceInfo();
  const viewportHeight = getMobileViewportHeight();
  const safeAreaInsets = getSafeAreaInsets();

  // Set CSS custom properties for mobile viewport
  document.documentElement.style.setProperty(
    '--mobile-vh',
    `${viewportHeight}px`,
  );
  document.documentElement.style.setProperty(
    '--mobile-vh-100',
    `${viewportHeight}px`,
  );
  document.documentElement.style.setProperty(
    '--mobile-vh-90',
    `${viewportHeight * 0.9}px`,
  );
  document.documentElement.style.setProperty(
    '--mobile-vh-80',
    `${viewportHeight * 0.8}px`,
  );

  // Set safe area insets
  document.documentElement.style.setProperty(
    '--safe-area-inset-top',
    `${safeAreaInsets.top}px`,
  );
  document.documentElement.style.setProperty(
    '--safe-area-inset-right',
    `${safeAreaInsets.right}px`,
  );
  document.documentElement.style.setProperty(
    '--safe-area-inset-bottom',
    `${safeAreaInsets.bottom}px`,
  );
  document.documentElement.style.setProperty(
    '--safe-area-inset-left',
    `${safeAreaInsets.left}px`,
  );

  // Add device-specific classes
  document.documentElement.classList.toggle(
    'mobile-device',
    deviceInfo.isMobile,
  );
  document.documentElement.classList.toggle(
    'android-device',
    deviceInfo.isAndroid,
  );
  document.documentElement.classList.toggle('ios-device', deviceInfo.isIOS);
  document.documentElement.classList.toggle(
    'oneplus-device',
    deviceInfo.isOnePlus,
  );
  document.documentElement.classList.toggle(
    'chrome-mobile',
    deviceInfo.isChrome && deviceInfo.isMobile,
  );
  document.documentElement.classList.toggle(
    'safari-mobile',
    deviceInfo.isSafari && deviceInfo.isMobile,
  );

  console.log('📱 Mobile viewport CSS applied:', {
    viewportHeight,
    safeAreaInsets,
    deviceInfo,
  });
};

// Handle viewport changes (orientation, keyboard, etc.)
export const setupMobileViewportListener = () => {
  const updateViewport = () => {
    applyMobileViewportCSS();
  };

  // Listen for viewport changes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewport);
    window.visualViewport.addEventListener('scroll', updateViewport);
  }

  // Listen for orientation changes
  window.addEventListener('orientationchange', () => {
    // Delay to allow viewport to settle
    setTimeout(updateViewport, 100);
  });

  // Listen for window resize
  window.addEventListener('resize', updateViewport);

  // Initial setup
  updateViewport();

  console.log('📱 Mobile viewport listener setup complete');
};

// Prevent body scroll and handle touch events for modals
export const preventBodyScroll = () => {
  const originalStyle = {
    overflow: document.body.style.overflow,
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    height: document.body.style.height,
    touchAction: document.body.style.touchAction,
  };

  // Apply scroll prevention
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = '0';
  document.body.style.width = '100%';
  document.body.style.height = '100%';
  document.body.style.touchAction = 'none';

  return originalStyle;
};

// Restore body scroll
export const restoreBodyScroll = (originalStyle) => {
  Object.keys(originalStyle).forEach((key) => {
    document.body.style[key] = originalStyle[key];
  });
};

// Get optimal modal positioning for mobile devices
export const getMobileModalPosition = () => {
  const viewportHeight = getMobileViewportHeight();
  const safeAreaInsets = getSafeAreaInsets();

  // Calculate optimal positioning
  const topOffset = Math.max(safeAreaInsets.top, 0);
  const bottomOffset = Math.max(safeAreaInsets.bottom, 0);
  const availableHeight = viewportHeight - topOffset - bottomOffset;

  return {
    top: `${topOffset}px`,
    bottom: `${bottomOffset}px`,
    height: `${availableHeight}px`,
    maxHeight: `${availableHeight}px`,
    minHeight: `${Math.min(availableHeight, 400)}px`,
  };
};

// Export all utilities
const mobileViewportUtils = {
  getMobileViewportHeight,
  getSafeAreaInsets,
  isOnePlusDevice,
  getMobileDeviceInfo,
  applyMobileViewportCSS,
  setupMobileViewportListener,
  preventBodyScroll,
  restoreBodyScroll,
  getMobileModalPosition,
};

export default mobileViewportUtils;
