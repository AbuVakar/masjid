import React, { useState, useCallback, useMemo } from 'react';
import { useNotify } from '../context/NotificationContext';
import {
  FaUpload,
  FaLink,
  FaImage,
  FaVideo,
  FaFilePdf,
  FaFileWord,
  FaTimes,
  FaTags,
  FaBook,
  FaMusic,
  FaFileAlt,
} from 'react-icons/fa';
import {
  logError,
  measurePerformance,
  ERROR_SEVERITY,
} from '../utils/errorHandler';

const ResourcesUpload = ({
  onSave,
  onCancel,
  initialData = null,
  isAdmin = false,
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'PDF',
    fileUrl: initialData?.fileUrl || '',
    tags: initialData?.tags || [],
  });

  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const { notify } = useNotify();

  // Simplified file type configurations
  const fileTypes = useMemo(
    () => ({
      PDF: {
        icon: FaFilePdf,
        label: 'PDF',
        color: '#ef4444',
        accept: '.pdf',
      },
      Document: {
        icon: FaFileWord,
        label: 'Document',
        color: '#3b82f6',
        accept: '.doc,.docx',
      },
      Image: {
        icon: FaImage,
        label: 'Image',
        color: '#10b981',
        accept: '.jpg,.jpeg,.png,.gif',
      },
      Video: {
        icon: FaVideo,
        label: 'Video',
        color: '#8b5cf6',
        accept: '.mp4,.avi,.mov',
      },
      Audio: {
        icon: FaMusic,
        label: 'Audio',
        color: '#f59e0b',
        accept: '.mp3,.wav,.ogg',
      },
      Link: {
        icon: FaLink,
        label: 'Link',
        color: '#06b6d4',
        accept: null,
      },
      Other: {
        icon: FaFileAlt,
        label: 'Other',
        color: '#6b7280',
        accept: '*',
      },
    }),
    [],
  );

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!file && !formData.fileUrl) {
      newErrors.file = 'Please select a file or provide a URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, file]);

  // Handle file selection
  const handleFileChange = useCallback(
    (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        if (selectedFile.size > 10 * 1024 * 1024) {
          notify('File size must be less than 10MB', { type: 'error' });
          return;
        }
        setFile(selectedFile);
        setFormData((prev) => ({ ...prev, fileUrl: '' }));
        setErrors((prev) => ({ ...prev, file: null }));
      }
    },
    [notify],
  );

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((category) => {
    setFormData((prev) => ({
      ...prev,
      category,
    }));
    setFile(null);
    setErrors((prev) => ({ ...prev, file: null }));
  }, []);

  // Handle tag management
  const addTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const removeTag = useCallback((tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const handleTagKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    },
    [addTag],
  );

  // Handle actual file upload
  const handleFileUpload = useCallback(
    async (file) => {
      try {
        console.log('📤 Starting file upload for:', file.name);

        // File validation
        if (!file) {
          throw new Error('No file selected');
        }

        // File size validation (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          throw new Error(
            `File size too large. Maximum size is 50MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          );
        }

        // File type validation
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'video/mp4',
          'audio/mpeg',
          'text/plain',
        ];
        if (!allowedTypes.includes(file.type) && !file.name.includes('.')) {
          throw new Error(
            `File type not supported. Allowed types: PDF, Images, Videos, Audio, Text files`,
          );
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('title', formData.title || '');
        uploadFormData.append('description', formData.description || '');
        uploadFormData.append('category', formData.category || 'PDF');
        uploadFormData.append('tags', JSON.stringify(formData.tags || []));
        uploadFormData.append('isPublic', 'true');
        uploadFormData.append('uploadedBy', 'admin');

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please login again.');
        }

        // Show upload progress
        setUploadProgress(10);

        const response = await fetch('http://localhost:5000/api/resources', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        setUploadProgress(50);

        console.log('📡 Upload response status:', response.status);
        console.log('📡 Upload response headers:', response.headers);

        if (!response.ok) {
          let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;

          try {
            const errorData = await response.json();
            if (errorData.error && errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          } catch (parseError) {
            // If JSON parsing fails, try to get text
            try {
              const errorText = await response.text();
              if (errorText.includes('File too large')) {
                errorMessage =
                  'File size too large. Please choose a smaller file.';
              } else if (errorText.includes('Invalid file type')) {
                errorMessage =
                  'File type not supported. Please choose a different file.';
              } else if (errorText.includes('Authentication')) {
                errorMessage = 'Authentication failed. Please login again.';
              }
            } catch (textError) {
              // Use default error message
            }
          }

          throw new Error(errorMessage);
        }

        setUploadProgress(90);

        const result = await response.json();
        console.log('✅ Upload successful:', result);

        if (!result.success) {
          throw new Error(result.message || 'Upload failed');
        }

        if (!result.data || !result.data.fileUrl) {
          throw new Error('Upload successful but file URL not received');
        }

        setUploadProgress(100);

        return result.data.fileUrl;
      } catch (error) {
        console.error('❌ Upload error:', error);

        // Handle specific error types
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error(
            'Network error. Please check your internet connection.',
          );
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Server not responding. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Upload timeout. Please try again.');
        }

        throw error;
      }
    },
    [formData],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      console.log('🔍 Form submission started');

      if (!validateForm()) {
        console.log('❌ Form validation failed');
        notify('Please fix the errors in the form', { type: 'error' });
        return;
      }

      setIsUploading(true);
      setIsSubmitting(true);
      setUploadProgress(0);
      console.log('📤 Starting upload process...');

      try {
        await measurePerformance('Resource Upload', async () => {
          if (file) {
            console.log('📁 File upload for:', file.name);
            // File upload is handled directly in handleFileUpload
            const fileUrl = await handleFileUpload(file);
            console.log('✅ File uploaded successfully');

            // Create resource data for the uploaded file
            const resourceData = {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              fileUrl: fileUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              tags: formData.tags,
              isPublic: true,
              uploadedBy: 'admin',
            };

            // Save the resource using the onSave function
            const saveResult = await onSave(resourceData);
            console.log('✅ Resource saved successfully:', saveResult);

            // Only close modal if save was successful
            if (saveResult && saveResult.success) {
              notify('Resource uploaded and saved successfully!', {
                type: 'success',
              });
              onCancel();
            } else {
              throw new Error('Failed to save resource to database');
            }
          } else if (formData.fileUrl) {
            // For URL-based resources
            const resourceData = {
              ...formData,
              uploadedBy: 'admin',
              isPublic: true,
            };

            if (initialData?.id) {
              resourceData.id = initialData.id;
              resourceData.createdAt = initialData.createdAt;
              resourceData.downloadCount = initialData.downloadCount;
              console.log('📝 Editing existing resource:', initialData.id);
            } else {
              console.log('➕ Creating new resource');
            }

            console.log('📦 Final resource data:', resourceData);
            const saveResult = await onSave(resourceData);
            console.log('✅ Resource saved successfully:', saveResult);

            // Only close modal if save was successful
            if (saveResult && saveResult.success) {
              notify('Resource saved successfully!', { type: 'success' });
              onCancel();
            } else {
              throw new Error('Failed to save resource to database');
            }
          } else {
            throw new Error('Either file upload or file URL is required');
          }
        });
      } catch (error) {
        console.error('❌ Upload error:', error);
        logError(error, 'ResourcesUpload:handleSubmit', ERROR_SEVERITY.MEDIUM);

        // Show specific error messages to user
        let userMessage = 'Failed to save resource. Please try again.';

        if (error.message.includes('Authentication')) {
          userMessage = 'Authentication failed. Please login again.';
        } else if (error.message.includes('File size too large')) {
          userMessage = 'File size too large. Please choose a smaller file.';
        } else if (error.message.includes('File type not supported')) {
          userMessage =
            'File type not supported. Please choose a different file.';
        } else if (error.message.includes('Network error')) {
          userMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('Server not responding')) {
          userMessage = 'Server not responding. Please try again later.';
        } else if (error.message.includes('timeout')) {
          userMessage = 'Upload timeout. Please try again.';
        } else if (error.message.includes('file URL not received')) {
          userMessage =
            'Upload completed but file processing failed. Please try again.';
        }

        notify(userMessage, { type: 'error' });
      } finally {
        setIsUploading(false);
        setIsSubmitting(false);
        setUploadProgress(0);
      }
    },
    [
      formData,
      file,
      validateForm,
      handleFileUpload,
      onSave,
      onCancel,
      initialData,
      notify,
    ],
  );

  const currentFileType = fileTypes[formData.category];

  return (
    <div className='learning-resources-form'>
      {/* Header */}
      <div className='learning-resources-header'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
            <FaBook className='text-white text-xl' />
          </div>
          <div>
            <h2 className='learning-resources-title'>
              {initialData ? 'Edit Resource' : 'Add New Resource'}
            </h2>
            <p className='text-sm text-gray-500 mt-1'>
              Share Islamic knowledge and educational materials
            </p>
          </div>
        </div>
        <button onClick={onCancel} className='learning-resources-close'>
          <FaTimes size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className='form-field-group'>
          <label className='form-field-label required'>Resource Title</label>
          <input
            type='text'
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`learning-resources-input ${
              errors.title ? 'error' : ''
            }`}
            placeholder='Enter a descriptive title for your resource'
            maxLength={100}
          />
          {errors.title && <p className='error-message'>{errors.title}</p>}
        </div>

        {/* Description */}
        <div className='form-field-group'>
          <label className='form-field-label required'>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`learning-resources-textarea ${
              errors.description ? 'error' : ''
            }`}
            placeholder='Briefly describe what this resource contains'
            rows={3}
            maxLength={300}
          />
          {errors.description && (
            <p className='error-message'>{errors.description}</p>
          )}
        </div>

        {/* Category Selection */}
        <div className='form-field-group'>
          <label className='form-field-label required'>Category</label>
          <div className='category-grid'>
            {Object.entries(fileTypes).map(([key, config]) => (
              <button
                key={key}
                type='button'
                onClick={() => handleCategoryChange(key)}
                className={`category-button ${
                  formData.category === key ? 'selected' : ''
                }`}
                style={{
                  '--category-color': config.color,
                }}
              >
                <config.icon size={20} className='icon' />
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className='form-field-group'>
          <label className='form-field-label required'>
            {formData.category === 'Link' ? 'Resource URL' : 'Upload File'}
          </label>

          {formData.category === 'Link' ? (
            <input
              type='url'
              value={formData.fileUrl}
              onChange={(e) => handleInputChange('fileUrl', e.target.value)}
              className={`learning-resources-input ${
                errors.fileUrl ? 'error' : ''
              }`}
              placeholder='https://example.com/resource'
            />
          ) : (
            <div className='space-y-4'>
              <div className='file-upload-area'>
                <input
                  type='file'
                  onChange={handleFileChange}
                  accept={currentFileType?.accept}
                  className='hidden'
                  id='file-upload'
                />
                <label htmlFor='file-upload' className='cursor-pointer'>
                  <FaUpload size={32} className='file-upload-icon' />
                  <p className='file-upload-text'>
                    Click to upload or drag and drop
                  </p>
                  <p className='file-upload-hint'>
                    {currentFileType?.accept} (Max 10MB)
                  </p>
                </label>
              </div>

              {file && (
                <div className='file-preview'>
                  <div className='file-preview-info'>
                    <currentFileType.icon
                      size={20}
                      className='file-preview-icon'
                    />
                    <div className='file-preview-details'>
                      <h4>{file.name}</h4>
                      <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => setFile(null)}
                    className='file-preview-remove'
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              )}

              {/* Alternative URL input */}
              <div className='mt-4'>
                <p className='text-sm text-gray-600 mb-2'>
                  Or provide a direct file URL:
                </p>
                <input
                  type='url'
                  value={formData.fileUrl}
                  onChange={(e) => handleInputChange('fileUrl', e.target.value)}
                  className='learning-resources-input'
                  placeholder='https://example.com/file.pdf'
                />
              </div>
            </div>
          )}

          {(errors.file || errors.fileUrl) && (
            <p className='error-message'>{errors.file || errors.fileUrl}</p>
          )}
        </div>

        {/* Tags */}
        <div className='form-field-group'>
          <label className='form-field-label'>Tags (Optional)</label>
          <div className='tags-section'>
            <div className='tags-input-group'>
              <input
                type='text'
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className='tags-input'
                placeholder='Add tags to help others find this resource'
              />
              <button
                type='button'
                onClick={addTag}
                className='tags-add-button'
              >
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className='tags-list'>
                {formData.tags.map((tag, index) => (
                  <span key={index} className='tag-item'>
                    <FaTags size={12} />
                    {tag}
                    <button
                      type='button'
                      onClick={() => removeTag(tag)}
                      className='tag-remove'
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className='upload-progress'>
            <div className='progress-header'>
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className='progress-bar'>
              <div
                className='progress-fill'
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='form-actions'>
          <button
            type='button'
            onClick={onCancel}
            className='cancel-button'
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='submit-button'
            disabled={isUploading || isSubmitting}
          >
            {isUploading
              ? 'Uploading...'
              : isSubmitting
                ? 'Saving...'
                : initialData
                  ? 'Update Resource'
                  : 'Upload Resource'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourcesUpload;
