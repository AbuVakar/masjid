import React from 'react';

import ErrorBoundary from '../components/ErrorBoundary';
import ErrorFallback from '../components/ErrorFallback';
import Resources from '../components/Resources';

import { useUser } from '../context/UserContext';
import { useResources } from '../context/ResourceContext';

const ResourcesPage = ({ onClose, onNavigate }) => {
  const { isAdmin } = useUser();
  const { loading, error } = useResources();

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>Loading Resources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='error-container'
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: '#dc2626', marginBottom: '12px' }}>
          Failed to Load Resources
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          {error ||
            'Something went wrong while loading resources. Please check your connection and try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback componentName='Resources' />}>
      <Resources isAdmin={isAdmin} onClose={onClose} onNavigate={onNavigate} />
    </ErrorBoundary>
  );
};

export default ResourcesPage;
