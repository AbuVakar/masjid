import React, { useState, useEffect } from 'react';
import { useNotify } from '../context/NotificationContext';
import {
  FaUpload,
  FaTimes,
  FaDownload,
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaFileWord,
  FaImage,
  FaVideo,
  FaLink,
  FaMusic,
  FaFileAlt,
  FaImages,
  FaEllipsisH,
  FaUsers,
  FaQuran,
} from 'react-icons/fa';
import { useResources } from '../context/ResourceContext';
import ResourcesUpload from './ResourcesUpload';
import { apiService } from '../services/api';

const Resources = ({ isAdmin = false, onClose, onNavigate }) => {
  const {
    resources,
    loading,
    error,
    saveResource,
    deleteResource,
    incrementDownloadCount,
  } = useResources();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('learning');
  const [infoData, setInfoData] = useState({});
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editableInfoItems, setEditableInfoItems] = useState([]);
  const [deletingResources, setDeletingResources] = useState(new Set());
  const [downloadingResources, setDownloadingResources] = useState(new Set());
  const { notify } = useNotify();

  // File type configurations
  const fileTypes = {
    PDF: { icon: FaFilePdf, color: '#ef4444' },
    Document: { icon: FaFileWord, color: '#3b82f6' },
    Image: { icon: FaImage, color: '#10b981' },
    Video: { icon: FaVideo, color: '#8b5cf6' },
    Audio: { icon: FaMusic, color: '#f59e0b' },
    Link: { icon: FaLink, color: '#06b6d4' },
    Other: { icon: FaFileAlt, color: '#6b7280' },
  };

  // Tab configurations
  const tabs = [
    {
      id: 'learning',
      name: 'Learning Resources',
      icon: FaImages,
      description: 'Upload and manage files, documents, and links',
    },
    {
      id: 'islamic',
      name: 'Important Islamic Resources',
      icon: FaQuran,
      description: 'Quran, Hadith, and Islamic literature references',
      type: 'resources_imp',
    },
    {
      id: 'dawah',
      name: 'Dawah Guidelines',
      icon: FaUsers,
      description: 'Methodology and best practices for Dawah work',
      type: 'resources_dawah',
    },
    {
      id: 'gallery',
      name: 'Gallery',
      icon: FaImages,
      description: 'Event photos and community activities',
      type: 'resources_gallery',
    },
    {
      id: 'misc',
      name: 'Miscellaneous',
      icon: FaEllipsisH,
      description: 'FAQs and other community resources',
      type: 'resources_misc',
    },
  ];

  // Load info data for tabs
  useEffect(() => {
    const loadInfoData = async () => {
      try {
        const infoTypes = [
          'resources_imp',
          'resources_dawah',
          'resources_gallery',
          'resources_misc',
        ];
        const data = {};

        for (const type of infoTypes) {
          try {
            const response = await apiService.getInfoDataByType(type);
            if (response.success) {
              data[type] = response.data;
            }
          } catch (error) {
            // Don't log 404 errors for missing info data - it's expected
            if (!error.message.includes('Info data not found')) {
              console.log(`No data found for ${type}`);
            }
            data[type] = { items: [] };
          }
        }

        setInfoData(data);
      } catch (error) {
        console.error('Failed to load info data:', error);
      }
    };

    loadInfoData();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsEditingInfo(false);
    setEditingResource(null);
    setShowUploadForm(false);
  };

  const handleInfoEdit = () => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);
    if (currentTab && currentTab.type && infoData[currentTab.type]) {
      setEditableInfoItems([...infoData[currentTab.type].items]);
      setIsEditingInfo(true);
    }
  };

  const handleInfoSave = async () => {
    try {
      const currentTab = tabs.find((tab) => tab.id === activeTab);
      if (!currentTab || !currentTab.type) return;

      const payload = {
        type: currentTab.type,
        title: currentTab.name,
        items: editableInfoItems.map((item) => ({
          name: item.name || '',
          note: item.note || '',
        })),
      };

      const response = await apiService.createOrUpdateInfoData(payload);
      if (response.success) {
        setInfoData((prev) => ({
          ...prev,
          [currentTab.type]: response.data,
        }));
        setIsEditingInfo(false);
        notify('✅ Information updated successfully!', { type: 'success' });
      }
    } catch (error) {
      console.error('Failed to save info data:', error);
      notify('❌ Failed to save information', { type: 'error' });
    }
  };

  const handleInfoCancel = () => {
    setIsEditingInfo(false);
    const currentTab = tabs.find((tab) => tab.id === activeTab);
    if (currentTab && currentTab.type && infoData[currentTab.type]) {
      setEditableInfoItems([...infoData[currentTab.type].items]);
    }
  };

  const handleInfoItemChange = (index, field, value) => {
    const updated = [...editableInfoItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditableInfoItems(updated);
  };

  const handleAddInfoItem = () => {
    setEditableInfoItems([...editableInfoItems, { name: '', note: '' }]);
  };

  const handleRemoveInfoItem = (index) => {
    const updated = [...editableInfoItems];
    updated.splice(index, 1);
    setEditableInfoItems(updated);
  };

  const handleDeleteResource = async (resourceId) => {
    // Prevent multiple rapid deletions
    if (deletingResources.has(resourceId)) {
      return;
    }

    try {
      setDeletingResources((prev) => new Set(prev).add(resourceId));
      await deleteResource(resourceId);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingResources((prev) => {
        const newSet = new Set(prev);
        newSet.delete(resourceId);
        return newSet;
      });
    }
  };

  const handleDownloadResource = async (resource) => {
    // Prevent multiple rapid downloads
    if (downloadingResources.has(resource._id)) {
      return;
    }

    try {
      setDownloadingResources((prev) => new Set(prev).add(resource._id));
      console.log('📥 Downloading resource:', resource);
      console.log('📁 File URL:', resource.fileUrl);
      console.log('📄 File type:', resource.fileType);
      console.log('📝 File name:', resource.fileName);

      // First increment download count
      await incrementDownloadCount(resource._id);

      // Then handle the actual download
      if (resource.fileUrl) {
        let downloadUrl = resource.fileUrl;

        // Handle relative URLs - Fix for PDF files
        if (!downloadUrl.startsWith('http') && !downloadUrl.startsWith('//')) {
          // For all files, try to construct proper URL
          // Try different URL patterns based on common server setups
          const possibleUrls = [
            `http://localhost:5000${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`,
            `http://localhost:5000/uploads/${downloadUrl.replace(/^\//, '')}`,
            `http://localhost:5000/files/${downloadUrl.replace(/^\//, '')}`,
            `http://localhost:5000/resources/${downloadUrl.replace(/^\//, '')}`,
            `http://localhost:5000/static/${downloadUrl.replace(/^\//, '')}`,
            // Fallback to frontend origin
            `${window.location.origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`,
            `${window.location.origin}/uploads/${downloadUrl.replace(/^\//, '')}`,
          ];

          console.log('🔍 Trying possible URLs:', possibleUrls);

          // Test each URL
          for (const testUrl of possibleUrls) {
            try {
              console.log('🧪 Testing URL:', testUrl);
              const response = await fetch(testUrl, { method: 'HEAD' });
              if (response.ok) {
                downloadUrl = testUrl;
                console.log('✅ Found working URL:', downloadUrl);
                break;
              }
            } catch (error) {
              console.log('❌ URL failed:', testUrl);
            }
          }
          console.log('🔗 Final download URL:', downloadUrl);
        }

        // For different file types, handle differently
        if (
          resource.category === 'Link' ||
          resource.fileType === 'Link' ||
          (downloadUrl.startsWith('http') &&
            !downloadUrl.includes(window.location.hostname))
        ) {
          // For external links, open in new tab
          window.open(downloadUrl, '_blank', 'noopener,noreferrer');
          notify(`Opening ${resource.title} in new tab...`, {
            type: 'success',
          });
        } else {
          // For actual files, try to download
          try {
            // Method 1: Fetch and download (most reliable for PDFs)
            console.log('🔄 Fetching file from:', downloadUrl);
            const response = await fetch(downloadUrl, {
              method: 'GET',
              headers: {
                Accept: '*/*',
                'Cache-Control': 'no-cache',
              },
            });

            console.log('📡 Fetch response:', response);
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers);
            console.log(
              '📡 Content-Type:',
              response.headers.get('content-type'),
            );
            console.log(
              '📡 Content-Length:',
              response.headers.get('content-length'),
            );

            // Check if response is HTML/error instead of file
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              console.error('❌ Server returned HTML instead of file!');
              console.error(
                '❌ This means the file URL is incorrect or file does not exist',
              );
              throw new Error(
                'Server returned HTML instead of file - URL may be incorrect',
              );
            }

            // Check if response is JSON error
            if (contentType && contentType.includes('application/json')) {
              console.error('❌ Server returned JSON error instead of file!');
              throw new Error(
                'Server returned JSON error instead of file - URL may be incorrect',
              );
            }

            if (response.ok) {
              const blob = await response.blob();
              console.log('📦 Blob size:', blob.size, 'bytes');
              console.log('📦 Blob type:', blob.type);

              // Check if blob is valid
              if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
              }

              // Check file size (if we have original file size)
              if (resource.fileSize && blob.size < resource.fileSize * 0.9) {
                console.warn(
                  `⚠️ Warning: Downloaded file size (${blob.size} bytes) is much smaller than original (${resource.fileSize} bytes)`,
                );
                // Don't show warning notification, just log it
              }

              // Check if content type is correct for PDF
              const contentType = response.headers.get('content-type');
              if (
                resource.fileType === 'PDF' &&
                contentType &&
                !contentType.includes('pdf')
              ) {
                console.warn(
                  '⚠️ Warning: Content-Type does not match PDF:',
                  contentType,
                );
              }

              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;

              // Fix filename with proper extension
              let filename =
                resource.fileName ||
                resource.originalFileName ||
                resource.title;

              // Ensure proper file extension
              if (!filename.includes('.')) {
                const extension = resource.fileType?.toLowerCase() || 'pdf';
                filename = `${filename}.${extension}`;
              }

              // Clean filename (replace spaces with underscores, keep other characters)
              filename = filename
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9._-]/g, '');

              link.download = filename;
              link.style.display = 'none';

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);

              notify(`Downloading ${filename}...`, { type: 'success' });
            } else {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }
          } catch (fetchError) {
            console.error('❌ Fetch download failed:', fetchError);

            // Method 2: Retry with different approach
            try {
              console.log('🔄 Retrying download with different method...');
              const retryResponse = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                  Accept: '*/*',
                  'Cache-Control': 'no-cache',
                },
                mode: 'cors',
              });

              if (retryResponse.ok) {
                const retryBlob = await retryResponse.blob();
                console.log('📦 Retry blob size:', retryBlob.size, 'bytes');

                if (retryBlob.size > 0) {
                  const url = window.URL.createObjectURL(retryBlob);
                  const link = document.createElement('a');
                  link.href = url;

                  let filename =
                    resource.fileName ||
                    resource.originalFileName ||
                    resource.title;

                  if (!filename.includes('.')) {
                    const extension = resource.fileType?.toLowerCase() || 'pdf';
                    filename = `${filename}.${extension}`;
                  }

                  filename = filename
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9._-]/g, '');

                  link.download = filename;
                  link.style.display = 'none';

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);

                  notify(`Downloading ${filename}...`, { type: 'success' });
                  return;
                }
              }
            } catch (retryError) {
              console.error('❌ Retry download failed:', retryError);
            }

            // Method 3: Direct download as final fallback
            try {
              console.log('🔄 Trying direct download method');
              const link = document.createElement('a');
              link.href = downloadUrl;

              // Fix filename with proper extension
              let filename =
                resource.fileName ||
                resource.originalFileName ||
                resource.title;

              // Ensure proper file extension
              if (!filename.includes('.')) {
                const extension = resource.fileType?.toLowerCase() || 'pdf';
                filename = `${filename}.${extension}`;
              }

              // Clean filename (remove special characters)
              filename = filename
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9._-]/g, '');

              link.download = filename;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.style.display = 'none';

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              notify(`Downloading ${filename}...`, { type: 'success' });
            } catch (directError) {
              console.error('❌ Direct download failed:', directError);

              // Method 3: Try to open in new tab as final fallback
              try {
                window.open(downloadUrl, '_blank', 'noopener,noreferrer');
                notify(
                  `Opened ${resource.title} in new tab (download failed)`,
                  { type: 'warning' },
                );
              } catch (fallbackError) {
                console.error('❌ Fallback failed:', fallbackError);
                notify(
                  'Unable to download or open file. Please check the file URL.',
                  { type: 'error' },
                );
              }
            }
          }
        }
      } else {
        notify('No file URL available for download', { type: 'warning' });
      }
    } catch (error) {
      console.error('❌ Download failed:', error);
      notify('Failed to download resource', { type: 'error' });
    } finally {
      setDownloadingResources((prev) => {
        const newSet = new Set(prev);
        newSet.delete(resource._id);
        return newSet;
      });
    }
  };

  const renderLearningResources = () => (
    <div className='learning-resources-section'>
      <div className='section-header'>
        <h3>📚 Learning Resources</h3>
        <p>Upload and manage files, documents, and links for the community</p>
        {isAdmin && (
          <button
            onClick={() => setShowUploadForm(true)}
            className='upload-btn'
          >
            <FaUpload /> Upload New Resource
          </button>
        )}
      </div>

      <div className='search-box'>
        <input
          type='text'
          placeholder='Search resources...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className='resources-grid'>
        {resources
          .filter(
            (resource) =>
              searchTerm === '' ||
              resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              resource.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
          )
          .map((resource) => (
            <div key={resource._id} className='resource-card'>
              <div className='resource-header'>
                <div className='resource-type'>
                  {fileTypes[resource.fileType]?.icon &&
                    React.createElement(fileTypes[resource.fileType].icon, {
                      style: { color: fileTypes[resource.fileType].color },
                    })}
                  <span>{resource.fileType || 'Other'}</span>
                </div>
                {isAdmin && (
                  <div className='resource-actions'>
                    <button onClick={() => setEditingResource(resource)}>
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource._id)}
                      disabled={deletingResources.has(resource._id)}
                      title={
                        deletingResources.has(resource._id)
                          ? 'Deleting...'
                          : 'Delete Resource'
                      }
                    >
                      {deletingResources.has(resource._id) ? '⏳' : <FaTrash />}
                    </button>
                  </div>
                )}
              </div>

              <div className='resource-content'>
                <h4>{resource.title}</h4>
                <p>{resource.description}</p>
                <div className='resource-meta'>
                  <span>📥 {resource.downloads || 0} downloads</span>
                  <span>
                    📅 {new Date(resource.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className='resource-footer'>
                <button
                  onClick={() => {
                    console.log('🔍 Resource for download:', {
                      title: resource.title,
                      fileUrl: resource.fileUrl,
                      fileType: resource.fileType,
                      category: resource.category,
                      fileName: resource.fileName,
                    });
                    handleDownloadResource(resource);
                  }}
                  disabled={downloadingResources.has(resource._id)}
                  className='download-btn'
                  title={
                    downloadingResources.has(resource._id)
                      ? 'Downloading...'
                      : 'Download Resource'
                  }
                >
                  {downloadingResources.has(resource._id) ? (
                    '⏳'
                  ) : (
                    <FaDownload />
                  )}
                  {downloadingResources.has(resource._id)
                    ? 'Downloading...'
                    : 'Download'}
                </button>
              </div>
            </div>
          ))}
      </div>

      {resources.length === 0 && (
        <div className='empty-state'>
          <div className='empty-icon'>📚</div>
          <h3>No resources found</h3>
          <p>Upload your first resource to get started</p>
        </div>
      )}
    </div>
  );

  const renderInfoResources = () => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);
    if (!currentTab || !currentTab.type) return null;

    const currentData = infoData[currentTab.type] || { items: [] };
    const items = isEditingInfo ? editableInfoItems : currentData.items;

    return (
      <div className='info-resources-section'>
        <div className='section-header'>
          <h3>
            {currentTab.icon && React.createElement(currentTab.icon)}{' '}
            {currentTab.name}
          </h3>
          <p>{currentTab.description}</p>
          {isAdmin && !isEditingInfo && (
            <button onClick={handleInfoEdit} className='edit-btn'>
              <FaEdit /> Edit Resources
            </button>
          )}
          {isAdmin && isEditingInfo && (
            <div className='edit-actions'>
              <button onClick={handleInfoSave} className='save-btn'>
                <FaEdit /> Save Changes
              </button>
              <button onClick={handleInfoCancel} className='cancel-btn'>
                <FaTimes /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className='info-resources-grid'>
          {items.map((item, index) => (
            <div key={index} className='info-resource-card'>
              {isEditingInfo ? (
                <div className='edit-mode'>
                  <input
                    type='text'
                    value={item.name || ''}
                    onChange={(e) =>
                      handleInfoItemChange(index, 'name', e.target.value)
                    }
                    placeholder='Resource name...'
                    className='edit-input'
                  />
                  <textarea
                    value={item.note || ''}
                    onChange={(e) =>
                      handleInfoItemChange(index, 'note', e.target.value)
                    }
                    placeholder='Description...'
                    className='edit-textarea'
                  />
                  <button
                    onClick={() => handleRemoveInfoItem(index)}
                    className='remove-btn'
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              ) : (
                <div className='view-mode'>
                  <h4>{item.name || 'Untitled'}</h4>
                  <p>{item.note || 'No description available'}</p>
                </div>
              )}
            </div>
          ))}

          {isEditingInfo && (
            <div className='add-item-card'>
              <button onClick={handleAddInfoItem} className='add-btn'>
                <FaUpload /> Add New Resource
              </button>
            </div>
          )}
        </div>

        {items.length === 0 && !isEditingInfo && (
          <div className='empty-state'>
            <div className='empty-icon'>📝</div>
            <h3>No resources added yet</h3>
            <p>Click Edit to add new resources</p>
          </div>
        )}
      </div>
    );
  };

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
      <div className='error-container'>
        <div className='error-icon'>⚠️</div>
        <h3>Failed to Load Resources</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className='resources-container'>
      {/* Header */}
      <div className='resources-header'>
        <div className='header-content'>
          <h2>📚 Resources Center</h2>
          <p>Access all community resources, documents, and information</p>
        </div>
        <button onClick={onClose} className='close-btn'>
          <FaTimes />
        </button>
      </div>

      {/* Tabs */}
      <div className='resources-tabs'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.icon && React.createElement(tab.icon)}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className='resources-content'>
        {activeTab === 'learning'
          ? renderLearningResources()
          : renderInfoResources()}
      </div>

      {/* Upload Modal - Rendered outside container for proper positioning */}
      {showUploadForm && (
        <div className='modal-overlay'>
          <div className='modal-container'>
            <ResourcesUpload
              onSave={saveResource}
              onCancel={() => setShowUploadForm(false)}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

      {/* Edit Resource Modal - Rendered outside container for proper positioning */}
      {editingResource && (
        <div className='modal-overlay'>
          <div className='modal-container'>
            <ResourcesUpload
              initialData={editingResource}
              onSave={saveResource}
              onCancel={() => setEditingResource(null)}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .resources-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          border-radius: 20px;
          border: 2px solid rgba(0, 212, 255, 0.3);
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .resources-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(0, 212, 255, 0.2);
        }

        .header-content h2 {
          color: #00d4ff;
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .header-content p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-size: 16px;
        }

        .close-btn {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.3);
          color: #ff6b6b;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 107, 107, 0.3);
          transform: scale(1.05);
        }

        .resources-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .tab {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 212, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .tab:hover {
          border-color: rgba(0, 212, 255, 0.4);
          color: #00d4ff;
          transform: translateY(-2px);
        }

        .tab.active {
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          border-color: rgba(0, 212, 255, 0.6);
          color: white;
          box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
        }

        .resources-content {
          min-height: 400px;
        }

        .section-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .section-header h3 {
          color: #00d4ff;
          font-size: 24px;
          margin: 0 0 8px 0;
          font-weight: 700;
        }

        .section-header p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 20px 0;
          font-size: 16px;
        }

        .upload-btn,
        .edit-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 auto;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          min-width: 200px;
          justify-content: center;
        }

        .upload-btn:hover,
        .edit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        /* Modal Overlay and Container */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-container {
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(0, 212, 255, 0.3);
          border-radius: 20px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .search-box {
          margin-bottom: 30px;
          text-align: center;
        }

        .search-box input {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 212, 255, 0.2);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          min-width: 300px;
          max-width: 100%;
          backdrop-filter: blur(10px);
          box-sizing: border-box;
        }

        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .resource-card {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 200px;
        }

        .resource-card:hover {
          border-color: rgba(0, 212, 255, 0.4);
          box-shadow: 0 8px 25px rgba(0, 212, 255, 0.2);
          transform: translateY(-2px);
        }

        .resource-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          flex-shrink: 0;
          position: relative;
        }

        .resource-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }

        .resource-type {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin-right: 80px; /* Space for action buttons */
        }

        .resource-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          position: absolute;
          top: 0;
          right: 0;
          z-index: 10;
        }

        .resource-actions button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
        }

        .resource-actions button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
          transform: translateY(-1px);
        }

        .resource-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .resource-actions button:disabled:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          transform: none;
        }

        .resource-content h4 {
          color: #00d4ff;
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .resource-content p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 16px 0;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }

        .resource-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
          flex-wrap: wrap;
          margin-top: auto;
        }

        .resource-footer {
          flex-shrink: 0;
          margin-top: auto;
        }

        .download-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          width: 100%;
        }

        .download-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .download-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .download-btn:disabled:hover {
          background: #3b82f6;
          transform: none;
          box-shadow: none;
        }

        .info-resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .info-resource-card {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .info-resource-card:hover {
          border-color: rgba(0, 212, 255, 0.4);
          box-shadow: 0 8px 25px rgba(0, 212, 255, 0.2);
          transform: translateY(-2px);
        }

        .edit-mode {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .edit-input,
        .edit-textarea {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          backdrop-filter: blur(10px);
        }

        .edit-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .edit-input::placeholder,
        .edit-textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .remove-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .view-mode h4 {
          color: #00d4ff;
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .view-mode p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }

        .add-item-card {
          border: 2px dashed rgba(0, 212, 255, 0.3);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 212, 255, 0.05);
          transition: all 0.3s ease;
        }

        .add-item-card:hover {
          border-color: rgba(0, 212, 255, 0.5);
          background: rgba(0, 212, 255, 0.1);
        }

        .add-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .edit-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .save-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cancel-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.6);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 8px 0;
          font-size: 20px;
        }

        .empty-state p {
          margin: 0;
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .resources-container {
            padding: 16px;
            margin: 10px;
            max-width: 100%;
          }

          .resources-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .header-content h2 {
            font-size: 24px;
          }

          .resources-tabs {
            gap: 6px;
            justify-content: center;
          }

          .tab {
            padding: 10px 16px;
            font-size: 13px;
            flex: 1;
            min-width: 0;
          }

          .search-box input {
            min-width: auto;
            width: 100%;
            max-width: 100%;
          }

          .resources-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .info-resources-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .resource-card {
            padding: 16px;
          }

          .resource-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
            position: relative;
          }

          .resource-actions {
            position: static;
            align-self: flex-end;
            margin-top: -8px;
          }

          .resource-type {
            margin-right: 0;
          }

          .resource-meta {
            flex-direction: column;
            gap: 8px;
          }

          .download-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .resources-container {
            padding: 12px;
            margin: 5px;
          }

          .tab {
            padding: 8px 12px;
            font-size: 12px;
          }

          .resource-card {
            padding: 12px;
          }

          .resource-content h4 {
            font-size: 16px;
          }

          .resource-content p {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default Resources;
