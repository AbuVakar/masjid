import React, { useState, useEffect } from 'react';
import {
  FaFilter,
  FaCalendar,
  FaUser,
  FaCog,
  FaTimes,
  FaSave,
  FaTrash,
} from 'react-icons/fa';
import './CustomFilters.css';

/**
 * Custom Filters Component
 * Provides advanced filtering options for admin notifications
 */
const CustomFilters = ({
  notifications,
  onFilterChange,
  onSaveFilter,
  savedFilters,
  onLoadFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    users: [],
    actions: [],
    resources: [],
    severity: [],
    priority: [],
    readStatus: 'all',
  });
  const [filterName, setFilterName] = useState('');

  // Extract unique values from notifications
  const uniqueUsers = [...new Set(notifications.map((n) => n.username))].filter(
    Boolean,
  );
  const uniqueActions = [...new Set(notifications.map((n) => n.action))].filter(
    Boolean,
  );
  const uniqueResources = [
    ...new Set(notifications.map((n) => n.resource)),
  ].filter(Boolean);
  const uniqueSeverities = [
    ...new Set(notifications.map((n) => n.severity)),
  ].filter(Boolean);
  const uniquePriorities = [
    ...new Set(notifications.map((n) => n.priority)),
  ].filter(Boolean);

  // Apply filters to notifications
  const applyFilters = (notificationList, currentFilters) => {
    return notificationList.filter((notification) => {
      // Date range filter
      if (currentFilters.dateRange.start && currentFilters.dateRange.end) {
        const notificationDate = new Date(notification.timestamp);
        if (
          notificationDate < currentFilters.dateRange.start ||
          notificationDate > currentFilters.dateRange.end
        ) {
          return false;
        }
      }

      // User filter
      if (
        currentFilters.users.length > 0 &&
        !currentFilters.users.includes(notification.username)
      ) {
        return false;
      }

      // Action filter
      if (
        currentFilters.actions.length > 0 &&
        !currentFilters.actions.includes(notification.action)
      ) {
        return false;
      }

      // Resource filter
      if (
        currentFilters.resources.length > 0 &&
        !currentFilters.resources.includes(notification.resource)
      ) {
        return false;
      }

      // Severity filter
      if (
        currentFilters.severity.length > 0 &&
        !currentFilters.severity.includes(notification.severity)
      ) {
        return false;
      }

      // Priority filter
      if (
        currentFilters.priority.length > 0 &&
        !currentFilters.priority.includes(notification.priority)
      ) {
        return false;
      }

      // Read status filter
      if (currentFilters.readStatus !== 'all') {
        const isRead = notification.read || false;
        if (currentFilters.readStatus === 'read' && !isRead) return false;
        if (currentFilters.readStatus === 'unread' && isRead) return false;
      }

      return true;
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters };

    if (filterType === 'dateRange') {
      newFilters.dateRange = value;
    } else if (filterType === 'readStatus') {
      newFilters.readStatus = value;
    } else {
      // Handle array-based filters
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(
          (item) => item !== value,
        );
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
    }

    setFilters(newFilters);
    onFilterChange(applyFilters(notifications, newFilters));
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      dateRange: { start: null, end: null },
      users: [],
      actions: [],
      resources: [],
      severity: [],
      priority: [],
      readStatus: 'all',
    };
    setFilters(clearedFilters);
    onFilterChange(notifications); // Show all notifications
  };

  // Save current filter
  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      alert('Please enter a name for this filter');
      return;
    }

    onSaveFilter(filterName.trim(), { ...filters });
    setFilterName('');
  };

  // Load saved filter
  const loadSavedFilter = (savedFilter) => {
    setFilters(savedFilter);
    onFilterChange(applyFilters(notifications, savedFilter));
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.users.length > 0) count++;
    if (filters.actions.length > 0) count++;
    if (filters.resources.length > 0) count++;
    if (filters.severity.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.readStatus !== 'all') count++;
    return count;
  };

  return (
    <div className='custom-filters'>
      {/* Filter Toggle Button */}
      <button
        className='filter-toggle-btn'
        onClick={() => setIsOpen(!isOpen)}
        title='Custom Filters'
      >
        <FaFilter />
        <span>Filters</span>
        {getActiveFilterCount() > 0 && (
          <span className='filter-badge'>{getActiveFilterCount()}</span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className='filter-panel'>
          <div className='filter-header'>
            <h3>
              <FaFilter /> Custom Filters
            </h3>
            <button
              className='close-btn'
              onClick={() => setIsOpen(false)}
              title='Close filters'
            >
              <FaTimes />
            </button>
          </div>

          <div className='filter-content'>
            {/* Date Range Filter */}
            <div className='filter-section'>
              <h4>
                <FaCalendar /> Date Range
              </h4>
              <div className='date-inputs'>
                <div className='date-input'>
                  <label>From:</label>
                  <input
                    type='datetime-local'
                    value={filters.dateRange.start || ''}
                    onChange={(e) =>
                      handleFilterChange('dateRange', {
                        ...filters.dateRange,
                        start: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className='date-input'>
                  <label>To:</label>
                  <input
                    type='datetime-local'
                    value={filters.dateRange.end || ''}
                    onChange={(e) =>
                      handleFilterChange('dateRange', {
                        ...filters.dateRange,
                        end: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* User Filter */}
            <div className='filter-section'>
              <h4>
                <FaUser /> Users
              </h4>
              <div className='checkbox-group'>
                {uniqueUsers.map((user) => (
                  <label key={user} className='checkbox-item'>
                    <input
                      type='checkbox'
                      checked={filters.users.includes(user)}
                      onChange={() => handleFilterChange('users', user)}
                    />
                    <span>{user}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Filter */}
            <div className='filter-section'>
              <h4>
                <FaCog /> Actions
              </h4>
              <div className='checkbox-group'>
                {uniqueActions.map((action) => (
                  <label key={action} className='checkbox-item'>
                    <input
                      type='checkbox'
                      checked={filters.actions.includes(action)}
                      onChange={() => handleFilterChange('actions', action)}
                    />
                    <span>{action}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Resource Filter */}
            <div className='filter-section'>
              <h4>
                <FaCog /> Resources
              </h4>
              <div className='checkbox-group'>
                {uniqueResources.map((resource) => (
                  <label key={resource} className='checkbox-item'>
                    <input
                      type='checkbox'
                      checked={filters.resources.includes(resource)}
                      onChange={() => handleFilterChange('resources', resource)}
                    />
                    <span>{resource}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className='filter-section'>
              <h4>Priority</h4>
              <div className='checkbox-group'>
                {uniquePriorities.map((priority) => (
                  <label key={priority} className='checkbox-item'>
                    <input
                      type='checkbox'
                      checked={filters.priority.includes(priority)}
                      onChange={() => handleFilterChange('priority', priority)}
                    />
                    <span className={`priority-${priority.toLowerCase()}`}>
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Read Status Filter */}
            <div className='filter-section'>
              <h4>Read Status</h4>
              <div className='radio-group'>
                <label className='radio-item'>
                  <input
                    type='radio'
                    name='readStatus'
                    value='all'
                    checked={filters.readStatus === 'all'}
                    onChange={(e) =>
                      handleFilterChange('readStatus', e.target.value)
                    }
                  />
                  <span>All</span>
                </label>
                <label className='radio-item'>
                  <input
                    type='radio'
                    name='readStatus'
                    value='read'
                    checked={filters.readStatus === 'read'}
                    onChange={(e) =>
                      handleFilterChange('readStatus', e.target.value)
                    }
                  />
                  <span>Read</span>
                </label>
                <label className='radio-item'>
                  <input
                    type='radio'
                    name='readStatus'
                    value='unread'
                    checked={filters.readStatus === 'unread'}
                    onChange={(e) =>
                      handleFilterChange('readStatus', e.target.value)
                    }
                  />
                  <span>Unread</span>
                </label>
              </div>
            </div>

            {/* Filter Actions */}
            <div className='filter-actions'>
              <button
                className='clear-btn'
                onClick={clearFilters}
                title='Clear all filters'
              >
                <FaTrash /> Clear All
              </button>

              <div className='save-filter'>
                <input
                  type='text'
                  placeholder='Filter name'
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <button
                  className='save-btn'
                  onClick={saveCurrentFilter}
                  title='Save current filter'
                >
                  <FaSave /> Save
                </button>
              </div>
            </div>

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className='saved-filters'>
                <h4>Saved Filters</h4>
                <div className='saved-filters-list'>
                  {savedFilters.map((savedFilter, index) => (
                    <button
                      key={index}
                      className='saved-filter-btn'
                      onClick={() => loadSavedFilter(savedFilter.filter)}
                      title={`Load: ${savedFilter.name}`}
                    >
                      {savedFilter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFilters;
