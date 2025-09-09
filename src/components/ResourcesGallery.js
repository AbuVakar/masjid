import React, { useState, useCallback, useMemo } from 'react';
import { useNotify } from '../context/NotificationContext';
import {
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaFileWord,
  FaImage,
  FaVideo,
  FaLink,
  FaTh,
  FaList,
} from 'react-icons/fa';
import {
  logError,
  measurePerformance,
  ERROR_SEVERITY,
} from '../utils/errorHandler';

const ResourcesGallery = ({
  resources = [],
  loading = false,
  onEdit,
  onDelete,
  onDownload,
  canEdit = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedTags, setSelectedTags] = useState([]);
  const { notify } = useNotify();

  // File type configurations
  const fileTypes = {
    PDF: { icon: FaFilePdf, label: 'PDF', color: 'text-red-500' },
    Document: { icon: FaFileWord, label: 'Document', color: 'text-blue-500' },
    Image: { icon: FaImage, label: 'Image', color: 'text-green-500' },
    Video: { icon: FaVideo, label: 'Video', color: 'text-purple-500' },
    Link: { icon: FaLink, label: 'Link', color: 'text-orange-500' },
    Audio: { icon: FaLink, label: 'Audio', color: 'text-yellow-500' },
    Other: { icon: FaLink, label: 'Other', color: 'text-gray-500' },
  };

  // Get all unique categories and tags
  const categories = useMemo(() => {
    const cats = [...new Set(resources.map((r) => r.category))];
    return ['all', ...cats];
  }, [resources]);

  const allTags = useMemo(() => {
    const tags = resources.flatMap((r) => r.tags || []);
    return [...new Set(tags)];
  }, [resources]);

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter((resource) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || resource.category === selectedCategory;

      // Tags filter
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => resource.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesTags;
    });

    // Sort resources
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'downloads':
          aValue = a.downloadCount || 0;
          bValue = b.downloadCount || 0;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    resources,
    searchTerm,
    selectedCategory,
    selectedTags,
    sortBy,
    sortOrder,
  ]);

  // Handle download/view
  const handleDownload = useCallback(
    async (resource) => {
      try {
        await measurePerformance('Resource Download', async () => {
          if (resource.type === 'link') {
            // Open link in new tab
            window.open(resource.fileUrl, '_blank');
          } else {
            // For files, create a download link
            const link = document.createElement('a');
            link.href = resource.fileUrl;
            link.download = resource.originalFileName || resource.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }

          // Increment download count
          if (onDownload) {
            await onDownload(resource.id);
          }

          notify(
            `Successfully ${resource.type === 'link' ? 'opened' : 'downloaded'} ${resource.title}`,
            { type: 'success' },
          );
        });
      } catch (error) {
        logError(
          error,
          'ResourcesGallery:handleDownload',
          ERROR_SEVERITY.MEDIUM,
        );
        notify('Failed to download resource', { type: 'error' });
      }
    },
    [onDownload, notify],
  );

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Format date
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Premium Search and Filters */}
      <div className='bg-gradient-to-br from-slate-700/50 via-purple-700/50 to-slate-700/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Premium Search */}
          <div className='lg:col-span-2'>
            <div className='relative'>
              <input
                type='text'
                placeholder='🔍 Search Islamic resources, Quran guides, lectures, and educational materials...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-6 py-4 bg-slate-800/50 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-300'
              />
              <div className='absolute right-4 top-1/2 transform -translate-y-1/2'>
                <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse'></div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className='flex items-center justify-center'>
            <div className='text-center'>
              <div className='text-white text-2xl font-bold mb-1'>
                {filteredAndSortedResources.length} of {resources.length}{' '}
                Resources
              </div>
              <div className='text-purple-200 text-sm'>
                Discover premium Islamic knowledge and educational materials
              </div>
            </div>
          </div>
        </div>

        {/* Premium Filters */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8'>
          {/* Category Filter */}
          <div>
            <label className='block text-purple-200 text-sm font-semibold mb-3'>
              📁Filter by Category
            </label>
            <div className='flex flex-wrap gap-3'>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-white/10'
                  }`}
                >
                  {category === 'all' ? '📚 All Resources' : `📁 ${category}`}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className='block text-purple-200 text-sm font-semibold mb-3'>
              🏷️Filter by Tags
            </label>
            <div className='flex flex-wrap gap-2 max-h-24 overflow-y-auto'>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag],
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    selectedTags.includes(tag)
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-white/10'
                  }`}
                >
                  🏷️ {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort and View Controls */}
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10'>
          <div className='flex items-center space-x-4'>
            <span className='text-purple-200 text-sm font-semibold'>
              Sort by:
            </span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className='px-4 py-2 bg-slate-800/50 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm'
            >
              <option value='createdAt-desc'>🕒📅 Date</option>
              <option value='title-asc'>📄📝 Title</option>
              <option value='downloads-desc'>🔥⬇️ Popular</option>
              <option value='category-asc'>📂📁 Type</option>
            </select>
          </div>

          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              <FaTh size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              <FaList size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Resources Display */}
      {filteredAndSortedResources.length === 0 ? (
        <div className='bg-gradient-to-br from-slate-700/50 via-purple-700/50 to-slate-700/50 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl text-center'>
          <div className='text-6xl mb-6'>📚</div>
          <h3 className='text-2xl font-bold text-white mb-4'>
            No Resources Found
          </h3>
          <p className='text-purple-200 text-lg mb-6'>
            Try adjusting your search terms or filters to find premium Islamic
            resources
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedTags([]);
            }}
            className='px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold'
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredAndSortedResources.map((resource) => (
            <div
              key={resource.id}
              className='group bg-gradient-to-br from-slate-700/50 via-purple-700/50 to-slate-700/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25'
            >
              {/* Resource Header */}
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  <div className='p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg border border-white/10'>
                    {React.createElement(
                      fileTypes[resource.type]?.icon || FaLink,
                      {
                        size: 24,
                        className:
                          fileTypes[resource.type]?.color || 'text-gray-400',
                      },
                    )}
                  </div>
                  <div>
                    <h3 className='text-lg font-bold text-white group-hover:text-purple-200 transition-colors duration-300'>
                      {resource.title}
                    </h3>
                    <p className='text-sm text-purple-200'>
                      {resource.category}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => onEdit(resource)}
                      className='p-2 rounded-lg bg-slate-600/50 text-slate-300 hover:bg-slate-500/50 hover:text-white transition-all duration-300'
                    >
                      <FaEdit size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(resource.id)}
                      className='p-2 rounded-lg bg-red-600/50 text-red-300 hover:bg-red-500/50 hover:text-white transition-all duration-300'
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Resource Description */}
              <p className='text-slate-300 text-sm mb-4 line-clamp-2'>
                {resource.description}
              </p>

              {/* Resource Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className='flex flex-wrap gap-2 mb-4'>
                  {resource.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className='px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-full'
                    >
                      {tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className='px-2 py-1 bg-slate-600/50 text-slate-300 text-xs rounded-full'>
                      +{resource.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Resource Meta */}
              <div className='flex items-center justify-between text-xs text-slate-400 mb-4'>
                <div className='flex items-center space-x-4'>
                  <span>📅 {formatDate(resource.createdAt)}</span>
                  <span>⬇️ {resource.downloadCount || 0}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <span>💾 {formatFileSize(resource.fileSize)}</span>
                  <span>👤 {resource.uploadedBy}</span>
                </div>
              </div>

              {/* Resource Actions */}
              <div className='flex items-center space-x-3'>
                <button
                  onClick={() => handleDownload(resource)}
                  className='flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold group-hover:shadow-lg group-hover:shadow-purple-500/25'
                >
                  <FaDownload size={16} />
                  <span>Download</span>
                </button>
                {resource.type === 'link' && (
                  <button
                    onClick={() => window.open(resource.fileUrl, '_blank')}
                    className='p-3 bg-slate-600/50 text-slate-300 rounded-2xl hover:bg-slate-500/50 hover:text-white transition-all duration-300'
                  >
                    <FaEye size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourcesGallery;
