import React, { useState, useEffect, useMemo } from 'react';
import {
  FaPhoneAlt,
  FaWalking,
  FaBookOpen,
  FaUsers,
  FaMoon,
  FaPray,
  FaCalendarAlt,
  FaBell,
  FaBullhorn,
} from 'react-icons/fa';
import { useNotify } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import { apiService } from '../services/api';

// Sample data for the info modal
const getInfoData = (dataType, apiData = null) => {
  // Use API data if available, otherwise use base dataset
  if (apiData) {
    return apiData;
  }

  // Base dataset (fallback)
  const base = {
    timetable: {
      title: 'Prayer Timetable',
      items: [
        { name: 'Fajr', time: '05:00 AM' },
        { name: 'Dhuhr', time: '12:30 PM' },
        { name: 'Asr', time: '03:45 PM' },
        { name: 'Maghrib', time: '06:15 PM' },
        { name: 'Isha', time: '07:30 PM' },
      ],
    },
    imam: {
      title: 'Imam Information',
      items: [{ name: 'Imam Sahab', mobile: '+91-9876500000' }],
    },
    aumoor: {
      title: 'Aumoor',
      items: [
        { name: 'Aumoomi Ghast', note: 'Every week — Monday after Maghrib' },
        { name: 'Taleem & Mashwara', note: 'Everyday after Isha' },
        {
          name: 'Haftwari Mashwara',
          note: "Every Jumu'ah after Jumu'ah at Jama Masjid Badarkha",
        },
        {
          name: 'Shab-guzari',
          note: 'Every Saturday — Garh Tehsil Masjid after Asr',
        },
      ],
    },
    running: {
      title: "Jama'at Activities",
      sections: [
        {
          title: "Upcoming Jama'at",
          items: [
            { name: "3 Days Jama'at", note: 'Starting 20th August 2025' },
            { name: "10 Days Jama'at", note: 'Starting 1st September 2025' },
          ],
        },
        {
          title: "Running Jama'at",
          items: [
            { name: "3 Days Jama'at", note: 'Ongoing - 15 members' },
            { name: "40 Days Jama'at", note: 'Day 25/40 - 5 members' },
          ],
        },
        {
          title: 'Current Tashkeel',
          items: [
            { name: 'Ameer', note: 'Maulana Yusuf Sahab' },
            { name: 'Naib Ameer', note: 'Maulana Ibrahim Sahab' },
            { name: 'Nazim-e-Tarbiyat', note: 'Maulana Hamza Sahab' },
          ],
        },
        {
          title: 'Taqaze',
          items: [
            { name: '3 Days', note: 'Minimum once a year' },
            { name: '10 Days', note: 'Once in 2 years' },
            { name: '40 Days', note: 'Once in 4 years' },
            { name: '4 Months', note: 'As per capacity' },
          ],
        },
        {
          title: 'Aumoor',
          items: [
            { name: 'Aumoomi Ghast', note: 'Every Monday after Maghrib' },
            { name: 'Taleem & Mashwara', note: 'Everyday after Isha' },
            {
              name: 'Haftwari Mashwara',
              note: "Every Jumu'ah after Jumu'ah at Jama Masjid Badarkha",
            },
            {
              name: 'Shab-guzari',
              note: 'Every Saturday — Garh Tehsil Masjid after Asr',
            },
          ],
        },
      ],
    },
    outgoing: {
      title: 'Outgoing Jamaat',
      items: [{ name: '3 days', note: "14th'August'2025 -7 AM" }],
    },

    resources_imp: {
      title: 'Important Islamic Resources',
      items: [
        { name: 'Quran', note: 'Tilawat, Tafseer links' },
        { name: 'Hadith', note: 'Sahih collections references' },
      ],
    },
    resources_dawah: {
      title: 'Dawah Guidelines',
      items: [
        { name: 'Methodology', note: 'Hikmat & husn-e-akhlaq' },
        { name: "Do's & Don'ts", note: 'Adab, ikhlas' },
      ],
    },
    resources_gallery: {
      title: 'Gallery',
      items: [{ name: 'Event Photos', note: 'Local activities' }],
    },
    resources_misc: {
      title: 'Miscellaneous',
      items: [{ name: 'FAQs', note: 'Common questions' }],
    },
  };

  return base[dataType];
};

const InfoModal = ({ data, onClose, onSave, readOnly = false }) => {
  console.log('🚀 InfoModal Component Mounted - props:', {
    data,
    onClose: !!onClose,
    onSave: !!onSave,
    readOnly,
  });

  // Normalize legacy keys used by mobile header
  const normalizedType = data === 'jamaat_activities' ? 'running' : data;
  console.log('🚀 InfoModal - normalizedType:', normalizedType);
  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [, setLoading] = useState(true);

  const infoData = useMemo(() => {
    console.log(
      '🔄 InfoData useMemo - data:',
      normalizedType,
      'apiData:',
      apiData,
    );

    // Use API data if available, otherwise fallback to base data
    let result;
    if (apiData && apiData.sections) {
      result = apiData;
    } else if (apiData && apiData.items) {
      result = apiData;
    } else {
      // Use fallback data
      result = getInfoData(normalizedType, null);
    }

    if (!result) {
      result = { title: 'Information', sections: [] };
    }

    console.log('🔄 Final infoData:', result);
    console.log('🔄 Final infoData.sections:', result?.sections);
    console.log('🔄 Is sections array?', Array.isArray(result?.sections));
    return result;
  }, [normalizedType, apiData]);

  // Get user context for admin check
  const { notify } = useNotify();
  const { isAdmin: userIsAdmin, user } = useUser();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching API data for type:', normalizedType);
        const response = await apiService.getInfoDataByType(normalizedType);
        if (response.success) {
          console.log(
            '📡 API Response for',
            normalizedType,
            ':',
            response.data,
          );
          setApiData(response.data);
        }
      } catch (error) {
        console.log(
          '❌ No API data found for',
          normalizedType,
          ', using fallback data. Error:',
          error.message,
        );
        setApiData(null);
      } finally {
        setLoading(false);
        console.log(
          '🔄 API fetch completed for type:',
          normalizedType,
          'apiData:',
          apiData,
        );
      }
    };

    if (normalizedType) {
      fetchData();
    }
  }, [normalizedType]);

  const isEditable = [
    'aumoor',
    'running',
    'outgoing',

    'resources_imp',
    'resources_dawah',
    'resources_gallery',
    'resources_misc',
  ].includes(normalizedType);
  const canEdit = isEditable && !readOnly && userIsAdmin;

  console.log(
    '🔍 InfoModal - data:',
    normalizedType,
    'isEditable:',
    isEditable,
    'readOnly:',
    readOnly,
    'canEdit:',
    canEdit,
    'onSave:',
    !!onSave,
    'isEditing:',
    isEditing,
    'Edit status:',
    canEdit ? '✅ ADMIN CAN EDIT' : '❌ READ-ONLY',
    'User context:',
    { isAdmin: userIsAdmin, user: user },
  );

  // Initialize editable items when data changes
  useEffect(() => {
    console.log('📊 InfoModal - Data loading effect START:', {
      type: normalizedType,
      hasInfoData: !!infoData,
      hasSections: Array.isArray(infoData?.sections),
      hasItems: Array.isArray(infoData?.items),
      sectionsCount: infoData?.sections?.length || 0,
      itemsCount: infoData?.items?.length || 0,
      items: infoData?.items?.slice(0, 2), // Log first 2 items
    });

    // Handle different data structures based on type
    if (Array.isArray(infoData?.sections)) {
      // Handle sections data (like Jama'at Activities)
      const sanitized = infoData.sections.map((sec) => ({
        title: sec && typeof sec.title === 'string' ? sec.title : '',
        items: Array.isArray(sec?.items) ? [...sec.items] : [],
      }));
      setEditableItems(sanitized);
    } else if (Array.isArray(infoData?.items)) {
      // Handle simple items data
      setEditableItems([...infoData.items]);
    } else {
      setEditableItems([]);
    }
  }, [infoData, normalizedType]);

  const handleEdit = () => {
    console.log(
      '🔧 Edit button clicked - canEdit:',
      canEdit,
      'data:',
      normalizedType,
    );
    console.log('🔧 isEditing before:', isEditing);
    if (!canEdit) {
      console.log('❌ Cannot edit - canEdit is false');
      return;
    }
    setIsEditing(true);
    console.log('✅ Edit mode enabled - isEditing set to true');
  };

  const handleSave = async () => {
    console.log(
      '💾 Save button clicked - data:',
      normalizedType,
      'editableItems:',
      editableItems,
    );

    // Reset error state
    setSaveError(null);
    setIsSaving(true);

    try {
      // Validate data before saving
      if (Array.isArray(infoData?.sections)) {
        // Validate sections (Jama'at Activities)
        for (let i = 0; i < editableItems.length; i++) {
          const section = editableItems[i];
          if (!section.title || section.title.trim() === '') {
            throw new Error(`Please fill in section ${i + 1} title`);
          }
          if (Array.isArray(section.items)) {
            for (let j = 0; j < section.items.length; j++) {
              const item = section.items[j];
              if (!item.name || item.name.trim() === '') {
                throw new Error(
                  `Please fill in item name in section "${section.title}"`,
                );
              }
            }
          }
        }
      } else if (Array.isArray(editableItems) && editableItems.length > 0) {
        // Validate items (Aumoor, etc.)
        const hasEmptyNames = editableItems.some(
          (item) => !item.name || item.name.trim() === '',
        );
        if (hasEmptyNames) {
          throw new Error('Please fill in all activity names');
        }
      }

      if (onSave) {
        // Build payload strictly matching type shape
        const payload = { type: normalizedType };
        if (Array.isArray(infoData?.sections)) {
          payload.sections = editableItems.map((sec) => ({
            title: sec.title || '',
            items: Array.isArray(sec.items)
              ? sec.items.map((it) => ({
                  name: it.name || '',
                  note: it.note || '',
                }))
              : [],
          }));
        } else {
          // Default mapping for other forms
          payload.items = (
            Array.isArray(editableItems) ? editableItems : []
          ).map((it) => ({ name: it.name || '', note: it.note || '' }));
        }

        console.log('📤 Sending payload to onSave:', payload);

        // Save to API
        const saveData = {
          type: payload.type,
          title: infoData.title,
          items: payload.items,
          sections: payload.sections,
        };

        const response = await apiService.createOrUpdateInfoData(saveData);

        if (response.success) {
          // Update local state with new data
          setApiData(response.data);

          // Force re-render by updating state
          setEditableItems([...editableItems]);

          // Show success message using notification system
          notify('✅ Information updated successfully!', { type: 'success' });
        } else {
          throw new Error('Failed to save data to server');
        }

        // Service worker notification
        try {
          if (
            'serviceWorker' in navigator &&
            navigator.serviceWorker.controller
          ) {
            const tag =
              normalizedType === 'running' ? 'jamaat-changed' : 'info-updated';
            navigator.serviceWorker.controller.postMessage({
              type: 'showNow',
              title: '✅ Information Updated Successfully!',
              body: `${infoData?.title || 'Information'} has been updated and saved.`,
              tag,
            });
          }
        } catch (error) {
          console.error('Service worker notification error:', error);
        }

        setIsEditing(false);
      }
    } catch (error) {
      console.error('❌ Save operation failed:', error);
      setSaveError(
        error.message || 'Failed to save information. Please try again.',
      );

      // Show error message using notification system
      notify(`❌ ${error.message || 'Failed to save information'}`, {
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data based on type
    if (infoData?.sections) {
      // Handle sections data (like Jama'at Activities)
      setEditableItems([...infoData.sections]);
    } else if (infoData?.items) {
      // Handle simple items data
      setEditableItems([...infoData.items]);
    } else {
      setEditableItems([]);
    }
  };

  const handleItemChange = (index, field, value, sectionIndex = null) => {
    const updated = [...editableItems];
    if (sectionIndex !== null) {
      // Update item inside a specific section
      const section = { ...updated[sectionIndex] };
      const items = [...section.items];
      items[index] = { ...items[index], [field]: value };
      section.items = items;
      updated[sectionIndex] = section;
    } else {
      // Update root-level item
      updated[index] = { ...updated[index], [field]: value };
    }
    setEditableItems(updated);
  };

  const handleAddItem = (sectionIndex = null) => {
    if (sectionIndex !== null) {
      // Add to a specific section
      const newSections = [...editableItems];
      if (!newSections[sectionIndex]) return;
      const section = { ...newSections[sectionIndex] };
      const items = Array.isArray(section.items) ? [...section.items] : [];
      items.push({ name: '', note: '' });
      section.items = items;
      newSections[sectionIndex] = section;
      setEditableItems(newSections);
    } else {
      // Add to root items
      setEditableItems([...editableItems, { name: '', note: '' }]);
    }
  };

  const handleRemoveItem = (index, sectionIndex = null) => {
    const updatedItems = [...editableItems];
    if (sectionIndex !== null) {
      if (!updatedItems[sectionIndex]) return;
      const section = { ...updatedItems[sectionIndex] };
      const items = Array.isArray(section.items) ? [...section.items] : [];
      items.splice(index, 1);
      section.items = items;
      updatedItems[sectionIndex] = section;
    } else {
      updatedItems.splice(index, 1);
    }
    setEditableItems(updatedItems);
  };

  const handleRemoveSection = (sectionIndex) => {
    const updated = [...editableItems];
    if (sectionIndex < 0 || sectionIndex >= updated.length) return;
    updated.splice(sectionIndex, 1);
    setEditableItems(updated);
  };

  const renderItems = (items, sectionIndex = null) => {
    const safeItems = Array.isArray(items) ? items : [];
    return safeItems.map((item, index) => (
      <div key={index} className='info-item'>
        {isEditing ? (
          <div
            className='editable-item'
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
            }}
          >
            <input
              type='text'
              value={item.name || ''}
              onChange={(e) =>
                handleItemChange(index, 'name', e.target.value, sectionIndex)
              }
              placeholder='Name'
              className='aumoor-edit-input'
              style={{ marginBottom: '8px' }}
            />
            <input
              type='text'
              value={item.note ?? ''}
              onChange={(e) => {
                handleItemChange(index, 'note', e.target.value, sectionIndex);
              }}
              placeholder='Description'
              className='aumoor-edit-input'
            />
            <button
              onClick={() => handleRemoveItem(index, sectionIndex)}
              className='aumoor-remove-btn'
              title='Remove item'
              aria-label='Remove item'
              style={{ marginTop: '8px' }}
            >
              <span className='remove-icon'>🗑️</span>
            </button>
          </div>
        ) : (
          <div className='info-row'>
            <span className='item-name'>{item.name}</span>
            <span className='item-note'>
              {item.mobile ?? item.note ?? '-'}
              {item.mobile && (
                <a
                  href={`tel:${item.mobile}`}
                  className='phone-link'
                  title='Call'
                >
                  <FaPhoneAlt size={12} style={{ marginLeft: '8px' }} />
                </a>
              )}
            </span>
          </div>
        )}
      </div>
    ));
  };

  // Icon chooser for Aumoor items
  const getAumoorIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('ghast') || t.includes('gasht') || t.includes('walk'))
      return <FaWalking />;
    if (t.includes('taleem')) return <FaBookOpen />;
    if (t.includes('mashwara')) return <FaUsers />;
    if (t.includes('shab') || t.includes('night')) return <FaMoon />;
    if (t.includes('namaz') || t.includes('salah') || t.includes('pray'))
      return <FaPray />;
    if (t.includes('hafta') || t.includes('week') || t.includes('jumu'))
      return <FaCalendarAlt />;
    return <FaBookOpen />;
  };

  const getJamaatIcon = (sectionTitle = '', itemName = '') => {
    const s = (sectionTitle || '').toLowerCase();
    const t = (itemName || '').toLowerCase();
    if (s.includes('upcoming') || t.includes('upcoming'))
      return <FaCalendarAlt />;
    if (s.includes('running') || t.includes('running')) return <FaWalking />;
    if (s.includes('tashkeel') || t.includes('ameer') || t.includes('nazim'))
      return <FaBullhorn />;
    if (s.includes('taqaze') || t.includes('taqaze')) return <FaBell />;
    return <FaUsers />;
  };

  return (
    <div className='modal-backdrop'>
      <div className='modal'>
        <div className='info-modal-header'>
          <div className='info-modal-title-section'>
            <h3 className='info-modal-title'>
              {infoData?.title || 'Information'}
            </h3>
            {normalizedType === 'aumoor' && (
              <span className='info-modal-subtitle'>
                Manage daily activities and schedules
              </span>
            )}
          </div>
          <div className='info-modal-actions'>
            {canEdit && !isEditing && (
              <button
                onClick={handleEdit}
                className='info-edit-btn'
                title='Edit activities'
              >
                <span className='edit-icon'>✏️</span>
                Edit
              </button>
            )}
            {canEdit && isEditing && (
              <div className='info-editing-actions'>
                <button
                  onClick={handleSave}
                  className='info-save-btn'
                  title='Save changes'
                  disabled={isSaving}
                >
                  <span className='save-icon'>{isSaving ? '⏳' : '💾'}</span>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className='info-cancel-btn'
                  title='Cancel editing'
                >
                  <span className='cancel-icon'>❌</span>
                  Cancel
                </button>
              </div>
            )}
            {!canEdit && (
              <span className='info-readonly-indicator'>
                <span className='readonly-icon'>🔒</span>
                Read-only
              </span>
            )}
          </div>
        </div>

        {/* Error Message Display */}
        {saveError && (
          <div
            className='error-message'
            style={{
              margin: '10px 0',
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span>{saveError}</span>
            <button
              onClick={() => setSaveError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ width: '100%' }}>
          {(() => {
            console.log(
              '🎯 InfoModal Render - infoData?.sections:',
              infoData?.sections,
            );
            console.log(
              '🎯 InfoModal Render - Array.isArray(infoData?.sections):',
              Array.isArray(infoData?.sections),
            );
            console.log('🎯 InfoModal Render - editableItems:', editableItems);
            return null;
          })()}
          {Array.isArray(infoData?.sections) ? (
            // Render sections for Jama'at Activities
            <div className='jamaat-activities-container'>
              {(Array.isArray(editableItems) ? editableItems : []).map(
                (section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className={
                      isEditing ? 'jamaat-edit-section' : 'jamaat-section'
                    }
                  >
                    <div
                      className={
                        isEditing
                          ? 'jamaat-edit-title-line'
                          : 'section-title-line'
                      }
                    >
                      {isEditing ? (
                        <input
                          type='text'
                          value={section.title}
                          onChange={(e) => {
                            const updatedSections = [...editableItems];
                            updatedSections[sectionIndex] = {
                              ...updatedSections[sectionIndex],
                              title: e.target.value,
                            };
                            setEditableItems(updatedSections);
                          }}
                        />
                      ) : (
                        <span>{section.title}</span>
                      )}
                    </div>
                    <div style={{ padding: '16px' }}>
                      {isEditing ? (
                        renderItems(section.items, sectionIndex)
                      ) : (
                        <div className='section-grid'>
                          {(Array.isArray(section.items)
                            ? section.items
                            : []
                          ).map((it, idx) => (
                            <div key={idx} className='section-item'>
                              <div className='section-icon'>
                                {getJamaatIcon(section.title, it?.name)}
                              </div>
                              <div className='section-body'>
                                <div className='section-item-title'>
                                  {it?.name || '-'}
                                </div>
                                <div className='section-item-note'>
                                  {it?.note || '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderTop: '1px solid #e5e7eb',
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: 'rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <button
                          onClick={() => handleAddItem(sectionIndex)}
                          style={{
                            background:
                              'linear-gradient(135deg, #116530, #059669)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(17, 101, 48, 0.2)',
                          }}
                        >
                          + Add Item
                        </button>
                        <button
                          onClick={() => handleRemoveSection(sectionIndex)}
                          style={{
                            background: 'rgba(255, 107, 107, 0.2)',
                            color: '#ff6b6b',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          Remove Section
                        </button>
                      </div>
                    )}
                  </div>
                ),
              )}
              {isEditing && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      setEditableItems([
                        ...editableItems,
                        { title: 'New Section', items: [] },
                      ]);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #116530, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: '0 4px 8px rgba(17, 101, 48, 0.2)',
                    }}
                  >
                    + Add New Section
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Render simple items list (for Aumoor, Outgoing, etc.)
            <div style={{ width: '100%' }}>
              {!isEditing && normalizedType === 'aumoor' ? (
                <div className='aumoor-container'>
                  <div className='aumoor-header'>
                    <div className='aumoor-info'>
                      <span className='aumoor-info-icon'>📅</span>
                      <span className='aumoor-info-text'>
                        Daily activities and weekly schedules for the community
                      </span>
                    </div>
                  </div>
                  <div className='aumoor-grid'>
                    {(Array.isArray(editableItems) ? editableItems : []).map(
                      (item, index) => (
                        <div key={index} className='aumoor-card'>
                          <div className='aumoor-icon'>
                            {getAumoorIcon(item?.name)}
                          </div>
                          <div className='aumoor-body'>
                            <div className='aumoor-title'>
                              {item?.name || '-'}
                            </div>
                            <div className='aumoor-note'>
                              {item?.note || '-'}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  {editableItems.length === 0 && (
                    <div className='aumoor-empty-state'>
                      <div className='empty-icon'>📝</div>
                      <div className='empty-text'>No activities added yet</div>
                      <div className='empty-subtext'>
                        Click Edit to add new activities
                      </div>
                    </div>
                  )}
                </div>
              ) : isEditing && normalizedType === 'aumoor' ? (
                <div className='aumoor-edit-container'>
                  <div className='aumoor-edit-header-info'>
                    <div className='edit-info'>
                      <span className='edit-info-icon'>✏️</span>
                      <span className='edit-info-text'>
                        Edit activities below. You can add, remove, or modify
                        any activity.
                      </span>
                    </div>
                  </div>
                  <div className='aumoor-edit-grid'>
                    {(Array.isArray(editableItems) ? editableItems : []).map(
                      (item, index) => (
                        <div key={index} className='aumoor-edit-card'>
                          <div className='aumoor-edit-header'>
                            <div className='aumoor-edit-icon'>
                              {getAumoorIcon(item?.name)}
                            </div>
                            <div className='aumoor-edit-title'>
                              Activity {index + 1}
                            </div>
                            <button
                              className='aumoor-remove-btn'
                              onClick={() => handleRemoveItem(index)}
                              title='Remove Activity'
                            >
                              <span className='remove-icon'>🗑️</span>
                            </button>
                          </div>
                          <div className='aumoor-edit-body'>
                            <div className='edit-field-group'>
                              <label className='edit-field-label'>
                                Activity Name
                              </label>
                              <input
                                type='text'
                                className='aumoor-edit-input'
                                value={item?.name || ''}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'name',
                                    e.target.value,
                                  )
                                }
                                placeholder='Enter activity name...'
                              />
                            </div>
                            <div className='edit-field-group'>
                              <label className='edit-field-label'>
                                Description/Note
                              </label>
                              <textarea
                                className='aumoor-edit-textarea'
                                value={item?.note || ''}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'note',
                                    e.target.value,
                                  )
                                }
                                placeholder='Enter activity description or schedule...'
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  <div className='aumoor-add-section'>
                    <button
                      className='aumoor-add-btn'
                      onClick={() =>
                        setEditableItems([
                          ...editableItems,
                          { name: '', note: '' },
                        ])
                      }
                    >
                      <span>➕</span>
                      <span>Add New Activity</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Default rendering for other data types
                <div style={{ width: '100%' }}>
                  {isEditing ? (
                    // Edit mode rendering
                    <div style={{ width: '100%' }}>
                      {(Array.isArray(editableItems) ? editableItems : []).map(
                        (item, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '16px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '12px',
                              marginBottom: '16px',
                              background: '#ffffff',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <div style={{ marginBottom: '12px' }}>
                              <label
                                style={{
                                  display: 'block',
                                  fontWeight: '600',
                                  marginBottom: '6px',
                                  color: '#374151',
                                }}
                              >
                                Resource Name
                              </label>
                              <input
                                type='text'
                                value={item?.name || ''}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'name',
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  backgroundColor: '#f9fafb',
                                }}
                                placeholder='Enter resource name...'
                              />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label
                                style={{
                                  display: 'block',
                                  fontWeight: '600',
                                  marginBottom: '6px',
                                  color: '#374151',
                                }}
                              >
                                Description/Note
                              </label>
                              <textarea
                                value={item?.note || ''}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    'note',
                                    e.target.value,
                                  )
                                }
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  backgroundColor: '#f9fafb',
                                  minHeight: '80px',
                                  resize: 'vertical',
                                }}
                                placeholder='Enter description or note...'
                              />
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '8px',
                              }}
                            >
                              <button
                                onClick={() => handleRemoveItem(index)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                }}
                                title='Remove Resource'
                              >
                                🗑️ Remove
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                      <div
                        style={{
                          textAlign: 'center',
                          marginTop: '20px',
                          padding: '16px',
                          border: '2px dashed #d1d5db',
                          borderRadius: '12px',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <button
                          onClick={() => handleAddItem()}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 auto',
                          }}
                        >
                          ➕ Add New Resource
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Read-only mode rendering
                    <div style={{ width: '100%' }}>
                      {(Array.isArray(editableItems) ? editableItems : []).map(
                        (item, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              marginBottom: '12px',
                              background: 'rgba(0, 0, 0, 0.4)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(0, 212, 255, 0.2)',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                color: '#00d4ff',
                                fontSize: '16px',
                              }}
                            >
                              {item?.name || '-'}
                            </div>
                            <div
                              style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                lineHeight: '1.4',
                              }}
                            >
                              {item?.note || '-'}
                            </div>
                          </div>
                        ),
                      )}
                      {editableItems.length === 0 && (
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '16px',
                          }}
                        >
                          📝 No resources added yet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Premium CSS Styles for Aumoor */}
              <style jsx>{`
                .aumoor-container {
                  background: rgba(0, 0, 0, 0.4);
                  backdrop-filter: blur(25px);
                  border: 2px solid rgba(0, 212, 255, 0.3);
                  border-radius: 20px;
                  padding: 20px;
                  margin: 0;
                }

                .aumoor-header {
                  background: linear-gradient(
                    135deg,
                    #00d4ff,
                    #0099cc,
                    #006699
                  );
                  border: 1px solid rgba(0, 212, 255, 0.4);
                  border-radius: 12px;
                  padding: 16px;
                  margin-bottom: 20px;
                  position: relative;
                }

                .aumoor-header::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(
                    135deg,
                    rgba(0, 0, 0, 0.2) 0%,
                    rgba(0, 0, 0, 0.1) 100%
                  );
                  border-radius: 12px;
                }

                .aumoor-info {
                  position: relative;
                  z-index: 1;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }

                .aumoor-info-icon {
                  font-size: 18px;
                  color: #ffffff;
                  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }

                .aumoor-info-text {
                  font-size: 14px;
                  color: #ffffff;
                  font-style: italic;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                  opacity: 0.9;
                }

                .aumoor-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                  gap: 16px;
                  margin-bottom: 20px;
                }

                .aumoor-card {
                  background: rgba(0, 0, 0, 0.4);
                  border: 1px solid rgba(0, 212, 255, 0.2);
                  border-radius: 12px;
                  padding: 16px;
                  transition: all 0.3s ease;
                  backdrop-filter: blur(10px);
                }

                .aumoor-card:hover {
                  border-color: rgba(0, 212, 255, 0.4);
                  box-shadow: 0 8px 25px rgba(0, 212, 255, 0.2);
                  transform: translateY(-2px);
                }

                .aumoor-icon {
                  width: 40px;
                  height: 40px;
                  border-radius: 10px;
                  background: rgba(0, 212, 255, 0.2);
                  color: #00d4ff;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  flex: 0 0 40px;
                  font-size: 16px;
                  border: 1px solid rgba(0, 212, 255, 0.3);
                  margin-bottom: 12px;
                }

                .aumoor-body {
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                }

                .aumoor-title {
                  font-weight: 700;
                  color: #00d4ff;
                  font-size: 15px;
                  line-height: 1.3;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .aumoor-note {
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 13px;
                  line-height: 1.4;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .aumoor-empty-state {
                  text-align: center;
                  padding: 40px 20px;
                  background: rgba(0, 0, 0, 0.3);
                  border: 2px dashed rgba(0, 212, 255, 0.3);
                  border-radius: 12px;
                  margin-top: 20px;
                  backdrop-filter: blur(10px);
                }

                .empty-icon {
                  font-size: 32px;
                  margin-bottom: 12px;
                  opacity: 0.6;
                  color: #00d4ff;
                }

                .empty-text {
                  font-size: 16px;
                  font-weight: 600;
                  color: #00d4ff;
                  margin-bottom: 4px;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .empty-subtext {
                  font-size: 13px;
                  color: rgba(255, 255, 255, 0.7);
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                /* Edit Mode Styles */
                .aumoor-edit-container {
                  background: rgba(0, 0, 0, 0.4);
                  backdrop-filter: blur(25px);
                  border: 2px solid rgba(0, 212, 255, 0.3);
                  border-radius: 20px;
                  padding: 20px;
                  margin: 0;
                }

                .aumoor-edit-header-info {
                  background: linear-gradient(
                    135deg,
                    #00d4ff,
                    #0099cc,
                    #006699
                  );
                  border: 1px solid rgba(0, 212, 255, 0.4);
                  border-radius: 12px;
                  padding: 16px;
                  margin-bottom: 20px;
                  position: relative;
                }

                .aumoor-edit-header-info::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(
                    135deg,
                    rgba(0, 0, 0, 0.2) 0%,
                    rgba(0, 0, 0, 0.1) 100%
                  );
                  border-radius: 12px;
                }

                .edit-info {
                  position: relative;
                  z-index: 1;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                }

                .edit-info-icon {
                  font-size: 18px;
                  color: #ffffff;
                  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                  animation: pulse 2s infinite;
                }

                .edit-info-text {
                  font-size: 14px;
                  color: #ffffff;
                  font-weight: 500;
                  line-height: 1.4;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .aumoor-edit-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                  gap: 20px;
                  margin-bottom: 24px;
                }

                .aumoor-edit-card {
                  background: rgba(0, 0, 0, 0.4);
                  border: 2px solid rgba(0, 212, 255, 0.2);
                  border-radius: 16px;
                  padding: 20px;
                  transition: all 0.3s ease;
                  backdrop-filter: blur(10px);
                  position: relative;
                  overflow: hidden;
                }

                .aumoor-edit-card::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: linear-gradient(90deg, #00d4ff, #0099cc, #006699);
                  opacity: 0;
                  transition: opacity 0.3s ease;
                }

                .aumoor-edit-card:hover {
                  border-color: rgba(0, 212, 255, 0.4);
                  box-shadow: 0 8px 25px rgba(0, 212, 255, 0.2);
                  transform: translateY(-2px);
                }

                .aumoor-edit-card:hover::before {
                  opacity: 1;
                }

                .aumoor-edit-header {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-bottom: 16px;
                  padding-bottom: 12px;
                  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
                }

                .aumoor-edit-icon {
                  width: 36px;
                  height: 36px;
                  border-radius: 8px;
                  background: rgba(0, 212, 255, 0.2);
                  color: #00d4ff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 16px;
                  border: 1px solid rgba(0, 212, 255, 0.3);
                }

                .aumoor-edit-title {
                  font-weight: 700;
                  color: #00d4ff;
                  font-size: 16px;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .aumoor-remove-btn {
                  margin-left: auto;
                  background: rgba(255, 107, 107, 0.2);
                  color: #ff6b6b;
                  border: 1px solid rgba(255, 107, 107, 0.3);
                  border-radius: 8px;
                  padding: 8px 12px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  backdrop-filter: blur(10px);
                }

                .aumoor-remove-btn:hover {
                  background: rgba(255, 107, 107, 0.3);
                  border-color: rgba(255, 107, 107, 0.5);
                  transform: translateY(-1px);
                }

                .aumoor-edit-body {
                  display: flex;
                  flex-direction: column;
                  gap: 16px;
                }

                .edit-field-group {
                  display: flex;
                  flex-direction: column;
                  gap: 6px;
                }

                .edit-field-label {
                  font-size: 13px;
                  font-weight: 600;
                  color: #00d4ff;
                  margin-bottom: 6px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .aumoor-edit-input {
                  width: 100%;
                  padding: 12px 14px;
                  border: 2px solid rgba(0, 212, 255, 0.3);
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: 500;
                  background: rgba(0, 0, 0, 0.3);
                  transition: all 0.3s ease;
                  color: #ffffff;
                  backdrop-filter: blur(10px);
                }

                .aumoor-edit-input:focus {
                  outline: none;
                  border-color: rgba(0, 212, 255, 0.6);
                  background: rgba(0, 0, 0, 0.4);
                  box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
                  transform: translateY(-1px);
                }

                .aumoor-edit-input::placeholder {
                  color: rgba(255, 255, 255, 0.5);
                  font-weight: 400;
                  font-style: italic;
                }

                .aumoor-edit-textarea {
                  width: 100%;
                  padding: 12px 14px;
                  border: 2px solid rgba(0, 212, 255, 0.3);
                  border-radius: 10px;
                  font-size: 14px;
                  background: rgba(0, 0, 0, 0.3);
                  transition: all 0.3s ease;
                  resize: vertical;
                  min-height: 80px;
                  font-family: inherit;
                  line-height: 1.5;
                  color: #ffffff;
                  backdrop-filter: blur(10px);
                }

                .aumoor-edit-textarea:focus {
                  outline: none;
                  border-color: rgba(0, 212, 255, 0.6);
                  background: rgba(0, 0, 0, 0.4);
                  box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
                  transform: translateY(-1px);
                }

                .aumoor-edit-textarea::placeholder {
                  color: rgba(255, 255, 255, 0.5);
                  font-style: italic;
                  font-weight: 400;
                }

                .aumoor-add-section {
                  text-align: center;
                  padding: 24px;
                  border: 3px dashed rgba(0, 212, 255, 0.3);
                  border-radius: 16px;
                  background: rgba(0, 0, 0, 0.3);
                  transition: all 0.3s ease;
                  position: relative;
                  overflow: hidden;
                  backdrop-filter: blur(10px);
                }

                .aumoor-add-section::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: -100%;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(0, 212, 255, 0.1),
                    transparent
                  );
                  transition: left 0.5s ease;
                }

                .aumoor-add-section:hover {
                  border-color: rgba(0, 212, 255, 0.5);
                  background: rgba(0, 0, 0, 0.4);
                  transform: translateY(-2px);
                  box-shadow: 0 8px 16px rgba(0, 212, 255, 0.1);
                }

                .aumoor-add-section:hover::before {
                  left: 100%;
                }

                .aumoor-add-btn {
                  display: inline-flex;
                  align-items: center;
                  gap: 10px;
                  padding: 16px 28px;
                  background: linear-gradient(135deg, #00d4ff, #0099cc);
                  color: white;
                  border: none;
                  border-radius: 12px;
                  font-size: 15px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 8px rgba(0, 212, 255, 0.2);
                  position: relative;
                  overflow: hidden;
                }

                .aumoor-add-btn::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: -100%;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.2),
                    transparent
                  );
                  transition: left 0.5s ease;
                }

                .aumoor-add-btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 6px 12px rgba(0, 212, 255, 0.3);
                  background: linear-gradient(135deg, #0099cc, #006699);
                }

                .aumoor-add-btn:hover::before {
                  left: 100%;
                }

                /* Jama'at Activities Premium Styles */
                .jamaat-activities-container {
                  background: rgba(0, 0, 0, 0.4);
                  backdrop-filter: blur(25px);
                  border: 2px solid rgba(0, 212, 255, 0.3);
                  border-radius: 20px;
                  padding: 20px;
                  margin: 0;
                }

                .jamaat-section {
                  background: rgba(0, 0, 0, 0.4);
                  backdrop-filter: blur(25px);
                  border: 2px solid rgba(0, 212, 255, 0.2);
                  border-radius: 16px;
                  margin-bottom: 20px;
                  overflow: hidden;
                }

                .section-title-line {
                  background: linear-gradient(
                    135deg,
                    #00d4ff,
                    #0099cc,
                    #006699
                  );
                  border: 1px solid rgba(0, 212, 255, 0.4);
                  border-radius: 12px;
                  color: #ffffff;
                  font-weight: 700;
                  padding: 12px 16px;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                  position: relative;
                }

                .section-title-line::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(
                    135deg,
                    rgba(0, 0, 0, 0.2) 0%,
                    rgba(0, 0, 0, 0.1) 100%
                  );
                  border-radius: 12px;
                }

                .section-title-line span {
                  position: relative;
                  z-index: 1;
                }

                .section-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                  gap: 16px;
                  padding: 20px;
                }

                .section-item {
                  background: rgba(0, 0, 0, 0.4);
                  border: 1px solid rgba(0, 212, 255, 0.2);
                  border-radius: 12px;
                  padding: 16px;
                  transition: all 0.3s ease;
                  backdrop-filter: blur(10px);
                  display: flex;
                  gap: 12px;
                }

                .section-item:hover {
                  border-color: rgba(0, 212, 255, 0.4);
                  box-shadow: 0 8px 25px rgba(0, 212, 255, 0.2);
                  transform: translateY(-2px);
                }

                .section-icon {
                  width: 40px;
                  height: 40px;
                  border-radius: 10px;
                  background: rgba(0, 212, 255, 0.2);
                  color: #00d4ff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex: 0 0 40px;
                  font-size: 16px;
                  border: 1px solid rgba(0, 212, 255, 0.3);
                }

                .section-body {
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                  flex: 1;
                }

                .section-item-title {
                  font-weight: 700;
                  color: #00d4ff;
                  font-size: 15px;
                  line-height: 1.3;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .section-item-note {
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 13px;
                  line-height: 1.4;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                /* Edit Mode Styles for Jama'at Activities */
                .jamaat-edit-section {
                  background: rgba(0, 0, 0, 0.4);
                  backdrop-filter: blur(25px);
                  border: 2px solid rgba(0, 212, 255, 0.2);
                  border-radius: 16px;
                  margin-bottom: 20px;
                  overflow: hidden;
                  transition: all 0.3s ease;
                }

                .jamaat-edit-section:hover {
                  border-color: rgba(0, 212, 255, 0.4);
                  box-shadow: 0 8px 25px rgba(0, 212, 255, 0.2);
                }

                .jamaat-edit-title-line {
                  background: linear-gradient(
                    135deg,
                    #00d4ff,
                    #0099cc,
                    #006699
                  );
                  border: 1px solid rgba(0, 212, 255, 0.4);
                  border-radius: 12px;
                  color: #ffffff;
                  font-weight: 700;
                  padding: 12px 16px;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                  position: relative;
                }

                .jamaat-edit-title-line::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(
                    135deg,
                    rgba(0, 0, 0, 0.2) 0%,
                    rgba(0, 0, 0, 0.1) 100%
                  );
                  border-radius: 12px;
                }

                @keyframes pulse {
                  0%,
                  100% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.7;
                  }
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                  .aumoor-grid,
                  .section-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                  }

                  .aumoor-edit-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                  }

                  .aumoor-card,
                  .section-item {
                    padding: 12px;
                  }

                  .aumoor-edit-card {
                    padding: 16px;
                  }

                  .aumoor-icon,
                  .section-icon {
                    width: 36px;
                    height: 36px;
                    font-size: 14px;
                  }
                }
              `}</style>
            </div>
          )}
        </div>

        <div className='muted-note'>
          Confidential — use only when necessary.
        </div>

        <div className='actions'>
          {isEditing ? (
            <>
              <button
                type='button'
                className='ghost'
                onClick={handleCancel}
                style={{ marginRight: '10px' }}
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSave}
                style={{ background: '#4caf50', color: 'white' }}
              >
                Save Changes
              </button>
            </>
          ) : (
            <button type='button' className='ghost' onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
