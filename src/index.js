import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import { UserProvider } from './context/UserContext';
import { HouseProvider } from './context/HouseContext';
import { ResourceProvider } from './context/ResourceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <UserProvider>
        <HouseProvider>
          <ResourceProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ResourceProvider>
        </HouseProvider>
      </UserProvider>
    </NotificationProvider>
  </React.StrictMode>,
);

// Global last-resort handlers
window.addEventListener('unhandledrejection', (event) => {
  // Suppress browser extension errors
  if (
    event.reason &&
    typeof event.reason === 'string' &&
    (event.reason.includes('content-script') ||
      event.reason.includes('getThumbnail') ||
      event.reason.includes('chrome-extension') ||
      event.reason.includes('moz-extension'))
  ) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  // Suppress browser extension errors
  if (
    event.error &&
    typeof event.error === 'string' &&
    (event.error.includes('content-script') ||
      event.error.includes('getThumbnail') ||
      event.error.includes('chrome-extension') ||
      event.error.includes('moz-extension'))
  ) {
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', event.error || event.message);
  // Avoid double-toasting Errors already caught by ErrorBoundary
});

// Register service worker for both production and development
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
