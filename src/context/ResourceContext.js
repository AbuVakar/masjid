import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import { apiService } from '../services/api';
import { useNotify } from './NotificationContext';

const ResourceContext = createContext();

export const ResourceProvider = ({ children }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notify } = useNotify();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const data = await apiService.getResources();
      setResources(data.resources || []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      const errorMessage =
        err.message ||
        'Failed to load resources. Please check your connection.';
      setError(errorMessage);
      notify(`Failed to fetch resources: ${errorMessage}`, { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // Add a small delay to ensure server is ready
    const timer = setTimeout(() => {
      fetchData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [fetchData]);

  const saveResource = async (resourceData) => {
    try {
      setLoading(true);
      console.log('🔍 Saving resource:', resourceData);

      let result;
      if (resourceData.id) {
        console.log('📝 Updating existing resource:', resourceData.id);
        result = await apiService.updateResource(resourceData.id, resourceData);
      } else {
        console.log('➕ Creating new resource');
        result = await apiService.createResource(resourceData);
      }

      console.log('✅ Save result:', result);

      if (result.success) {
        // Update local state instead of refetching
        if (resourceData.id) {
          // Update existing resource; if not present locally, append it
          setResources((prevResources) => {
            const index = prevResources.findIndex(
              (r) => r._id === resourceData.id,
            );

            // Prefer server response data when available
            const updatedFromServer = result.data
              ? { ...result.data }
              : { _id: resourceData.id, ...resourceData };

            if (index !== -1) {
              return prevResources.map((r) =>
                r._id === resourceData.id ? { ...r, ...updatedFromServer } : r,
              );
            }

            // Avoid duplicates by id or by (fileUrl+title)
            const exists = prevResources.some(
              (r) =>
                r._id === updatedFromServer._id ||
                (r.fileUrl === updatedFromServer.fileUrl &&
                  r.title === updatedFromServer.title),
            );
            if (exists) {
              console.log('⚠️ Resource already in state, not adding duplicate');
              return prevResources;
            }
            return [...prevResources, updatedFromServer];
          });
        } else {
          // Add new resource - ensure no duplicates
          setResources((prevResources) => {
            // Check if resource already exists
            const exists = prevResources.some(
              (resource) =>
                resource._id === result.data._id ||
                (resource.fileUrl === result.data.fileUrl &&
                  resource.title === result.data.title),
            );

            if (exists) {
              console.log('⚠️ Resource already exists, not adding duplicate');
              return prevResources;
            }

            return [...prevResources, result.data];
          });
        }
        // Don't show notification here - let the upload component handle it

        // Notify admin dashboard to refresh stats
        window.dispatchEvent(new CustomEvent('resourceChanged'));
      }
      return result;
    } catch (err) {
      console.error('❌ Save resource error:', err);
      setError(err.message);
      notify(`Failed to save resource: ${err.message}`, { type: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (resourceId) => {
    try {
      setLoading(true);

      // Add a small delay to prevent rapid requests
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await apiService.deleteResource(resourceId);
      if (result.success) {
        // Update local state instead of refetching all data
        setResources((prevResources) =>
          prevResources.filter((resource) => resource._id !== resourceId),
        );
        notify('Resource deleted successfully!', { type: 'success' });

        // Notify admin dashboard to refresh stats
        window.dispatchEvent(new CustomEvent('resourceChanged'));
      }
      return result;
    } catch (err) {
      // Handle rate limiting specifically
      if (err.message.includes('429')) {
        notify('Too many requests. Please wait a moment and try again.', {
          type: 'warning',
        });
      } else {
        setError(err.message);
        notify(`Failed to delete resource: ${err.message}`, { type: 'error' });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const incrementDownloadCount = async (resourceId) => {
    try {
      // Add a small delay to prevent rapid requests
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await apiService.incrementDownloadCount(resourceId);
      if (result.success) {
        // Update local state instead of refetching all data
        setResources((prevResources) =>
          prevResources.map((resource) =>
            resource._id === resourceId
              ? { ...resource, downloads: (resource.downloads || 0) + 1 }
              : resource,
          ),
        );
      }
      return result;
    } catch (err) {
      // Handle rate limiting specifically
      if (err.message.includes('429')) {
        notify('Too many requests. Please wait a moment and try again.', {
          type: 'warning',
        });
      } else {
        console.error('Failed to increment download count:', err);
      }
      throw err;
    }
  };

  const exportResources = async () => {
    try {
      const result = await apiService.exportResources();
      return result;
    } catch (err) {
      console.error('Failed to export resources:', err);
      throw err;
    }
  };

  const getStats = () => {
    const totalResources = resources.length;
    const totalDownloads = resources.reduce(
      (sum, resource) => sum + (resource.downloadCount || 0),
      0,
    );
    const averageDownloads =
      totalResources > 0 ? Math.round(totalDownloads / totalResources) : 0;

    // Calculate categories
    const categories = {};
    resources.forEach((resource) => {
      const category = resource.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });

    // Calculate file types
    const fileTypes = {};
    resources.forEach((resource) => {
      const fileType = resource.fileType || 'Unknown';
      fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;
    });

    return {
      totalResources,
      totalDownloads,
      averageDownloads,
      categories,
      fileTypes,
    };
  };

  const value = {
    resources,
    loading,
    error,
    refreshResources: fetchData,
    saveResource,
    deleteResource,
    incrementDownloadCount,
    exportResources,
    getStats,
  };

  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResources = () => {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResources must be used within a ResourceProvider');
  }
  return context;
};
