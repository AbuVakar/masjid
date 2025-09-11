import React, { useState, useEffect } from 'react';
import { useNotify } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import {
  sanitizeString,
  validateTime,
  VALIDATION_RULES,
} from '../utils/validation';
import InfoModal from './InfoModal';
import UserProfile from './UserProfile';
import BackupRestoreModal from './BackupRestoreModal';
import PrayerTimeHistory from './PrayerTimeHistory';
import AdminDashboard from './AdminDashboard';
import AdvancedNotificationSettings from './AdvancedNotificationSettings';
import './AdvancedNotificationSettings.css';
import NotificationTester from './NotificationTester';
import './NotificationTester.css';
import './MobileModalFixes.css';
import mobileViewport from '../utils/mobileViewport';

// Function to fetch sunset time from API with better error handling
const fetchSunsetTime = async (
  date,
  latitude = 28.7774,
  longitude = 78.0603,
) => {
  try {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    // Use Sunrise-Sunset API with formatted=0 for 24-hour format
    const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${dateStr}&formatted=0`;

    console.log(`🌅 Modal - Fetching sunset from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log(`🌅 Modal - API Response:`, data);

    if (data.status === 'OK' && data.results.sunset) {
      // Convert UTC time to IST (UTC+5:30)
      const sunsetUTC = new Date(data.results.sunset);
      const sunsetIST = new Date(sunsetUTC.getTime() + 5.5 * 60 * 60 * 1000); // Add 5.5 hours

      // Use local methods since we've converted to IST
      const hours = sunsetIST.getHours();
      const minutes = sunsetIST.getMinutes();

      console.log(`🌅 Modal - Raw API Response: ${data.results.sunset}`);
      console.log(`🌅 Modal - UTC Sunset: ${sunsetUTC.toISOString()}`);
      console.log(`🌅 Modal - IST Sunset: ${sunsetIST.toISOString()}`);
      console.log(
        `🌅 Modal - Final Time: ${hours}:${minutes.toString().padStart(2, '0')}`,
      );

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      throw new Error('Failed to fetch sunset data');
    }
  } catch (error) {
    console.warn(
      'Modal - Sunset API failed, using fallback calculation:',
      error.message,
    );
    // Fallback to approximate calculation if API fails
    return calculateSunsetFallback(date, latitude, longitude);
  }
};

// Fallback calculation function (same as Clock.js)
const calculateSunsetFallback = (
  date,
  latitude = 28.7774,
  longitude = 78.0603,
) => {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
  );

  // Base sunset time for the latitude
  let baseHour = 18;
  let baseMinute = 30;

  // Seasonal adjustment
  const daysFromSolstice = Math.abs(dayOfYear - 172);
  const seasonalAdjustment =
    Math.cos((daysFromSolstice / 365) * 2 * Math.PI) * 60;

  let totalMinutes = baseHour * 60 + baseMinute + seasonalAdjustment;
  let finalHour = Math.floor(totalMinutes / 60);
  let finalMinute = Math.floor(totalMinutes % 60);

  if (finalHour >= 24) finalHour = finalHour % 24;
  if (finalHour < 0) finalHour = 24 + finalHour;

  return `${finalHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
};

const Modal = ({
  type,
  data,
  onClose,
  onSave,
  onLogout,
  L,
  loading = false,
}) => {
  console.log('🚀 Modal Component Mounted - type:', type, 'data:', data);
  console.log('🔍 Modal - InfoModal import successful:', !!InfoModal);
  const { notify } = useNotify();
  const { isAdmin } = useUser();
  // State declarations at the top level to avoid conditional calls
  const [formData, setFormData] = useState({});

  // Contact Admin form state (keep un-conditional)
  const [contactForm, setContactForm] = useState({
    category: 'Jamaat',
    name: '',
    mobile: '',
    message: '',
  });

  // Timetable local state
  const [times, setTimes] = useState({
    Fajr: data?.times?.Fajr || '05:15',
    Dhuhr: data?.times?.Dhuhr || '14:15',
    Asr: data?.times?.Asr || '17:30',
    Maghrib: data?.times?.Maghrib || '19:10',
    Isha: data?.times?.Isha || '20:45',
  });

  // Dynamic Maghrib time state
  const [dynamicMaghrib, setDynamicMaghrib] = useState('18:30');

  // Prayer time history view state
  const [showHistory, setShowHistory] = useState(false);
  const [timeValidity, setTimeValidity] = useState({
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  });

  // NO JAVASCRIPT - PURE CSS APPROACH

  // Contact form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dynamic Maghrib time when timetable modal opens
  useEffect(() => {
    if (type === 'timetable') {
      const fetchMaghribTime = async () => {
        try {
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          const sunset = await fetchSunsetTime(today, 28.7774, 78.0603);
          setDynamicMaghrib(sunset);
          console.log(`🌅 Modal - Dynamic Maghrib set to: ${sunset}`);
        } catch (error) {
          console.error('Failed to fetch Maghrib time:', error);
          // Use fallback calculation
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          const fallbackSunset = calculateSunsetFallback(
            today,
            28.7774,
            78.0603,
          );
          setDynamicMaghrib(fallbackSunset);
          console.log(`🌅 Modal - Fallback Maghrib set to: ${fallbackSunset}`);
        }
      };

      fetchMaghribTime();
    }
  }, [type]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    let originalStyle = null;

    if (type) {
      // Apply mobile-optimized scroll prevention
      originalStyle = mobileViewport.preventBodyScroll();

      // Setup mobile viewport listener for dynamic updates
      mobileViewport.setupMobileViewportListener();

      console.log(
        '📱 Modal opened - body scroll prevented, mobile viewport setup',
      );
    }

    // Re-enable body scroll when modal closes
    return () => {
      if (originalStyle) {
        mobileViewport.restoreBodyScroll(originalStyle);
        console.log('📱 Modal closed - body scroll restored');
      }
    };
  }, [type]);

  // Check for daily date change and update Maghrib time
  useEffect(() => {
    if (type === 'timetable') {
      const checkDailyUpdate = () => {
        const now = new Date();
        const currentDate = now.toDateString();

        // Check if we need to update Maghrib time (no localStorage needed)
        console.log(`📅 Date: ${currentDate}, updating Maghrib time...`);

        // Fetch new Maghrib time
        const fetchMaghribTime = async () => {
          try {
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            const sunset = await fetchSunsetTime(today, 28.7774, 78.0603);
            setDynamicMaghrib(sunset);
            console.log(`🌅 Modal - Daily update: Maghrib set to ${sunset}`);
          } catch (error) {
            console.error('Failed to fetch daily Maghrib time:', error);
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            const fallbackSunset = calculateSunsetFallback(
              today,
              28.7774,
              78.0603,
            );
            setDynamicMaghrib(fallbackSunset);
            console.log(
              `🌅 Modal - Daily fallback: Maghrib set to ${fallbackSunset}`,
            );
          }
        };

        fetchMaghribTime();
      };

      // Check immediately
      checkDailyUpdate();

      // Set up interval to check every hour
      const interval = setInterval(checkDailyUpdate, 60 * 60 * 1000); // 1 hour

      return () => clearInterval(interval);
    }
  }, [type]);

  // Update times when data prop changes
  useEffect(() => {
    if (type === 'timetable' && data?.times) {
      setTimes({
        ...data.times,
        Maghrib: dynamicMaghrib, // Use dynamic Maghrib time
      });
    }
  }, [data, type, dynamicMaghrib]);

  // Reset contact form when opening contact modal
  useEffect(() => {
    if (type === 'contact_admin') {
      setContactForm({ category: 'Jamaat', name: '', mobile: '', message: '' });
    }
  }, [type]);

  useEffect(() => {
    if (type === 'house') {
      const isEdit = data?.mode === 'edit';
      console.log('🔍 House modal - isEdit:', isEdit, 'data:', data);
      const initialData = isEdit
        ? {
            ...(data?.house || {}),
            id: data?.house?.id || data?.house?._id, // Ensure ID field consistency
          }
        : { number: '', street: '' };
      console.log('🔍 House modal - initialData:', initialData);
      setFormData(initialData);
    } else if (type === 'member') {
      const isEdit = data?.mode === 'edit';
      setFormData(
        isEdit
          ? {
              ...(data?.member || {}),
              houseId: data?.houseId,
              id: data?.member?.id || data?.member?._id || data?.memberId,
              maktab: data?.member?.maktab ?? 'no',
              dawatCounts: data?.member?.dawatCounts || {
                '3-day': 0,
                '10-day': 0,
                '40-day': 0,
                '4-month': 0,
              },
            }
          : {
              name: '',
              fatherName: '',
              age: '',
              gender: 'Male',
              role: 'Member',
              occupation: '',
              education: 'Below 8th',
              quran: 'no',
              dawat: 'Nil',
              mobile: '',
              maktab: 'no',
              fatherNameDefault: data?.headName || '',
              dawatCounts: {
                '3-day': 0,
                '10-day': 0,
                '40-day': 0,
                '4-month': 0,
              },
            },
      );
    } else if (type === 'info') {
      // Info modal doesn't need form data
    }
  }, [type, data]);

  // Initialize/editable timetable values when this modal is opened
  useEffect(() => {
    if (type === 'timetable') {
      setTimes({
        Fajr: data?.times?.Fajr || '05:15',
        Dhuhr: data?.times?.Dhuhr || '14:15',
        Asr: data?.times?.Asr || '17:30',
        Maghrib: data?.times?.Maghrib || '19:10',
        Isha: data?.times?.Isha || '20:45',
      });
    }
  }, [type, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Don't sanitize fields that need to preserve spaces
    const fieldsToPreserveSpaces = [
      'street',
      'name',
      'fatherName',
      'occupation',
    ];
    const sanitizedValue = fieldsToPreserveSpaces.includes(name)
      ? value
      : sanitizeString(value);

    if (name === 'dawat') {
      // When Dawat Status changes, update dawatCounts accordingly
      let newCounts = { '3-day': 0, '10-day': 0, '40-day': 0, '4-month': 0 };
      if (sanitizedValue === '3-day') newCounts['3-day'] = 1;
      else if (sanitizedValue === '10-day') newCounts['10-day'] = 1;
      else if (sanitizedValue === '40-day') newCounts['40-day'] = 1;
      else if (sanitizedValue === '4-month') newCounts['4-month'] = 1;
      setFormData((prev) => ({
        ...prev,
        dawat: sanitizedValue,
        dawatCounts: newCounts,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
  };

  const handleSubmit = async () => {
    try {
      let payload = { ...formData };

      if (type === 'member') {
        // Basic validation
        if (!payload.name || payload.name.trim().length === 0) {
          notify('Member name is required', { type: 'error' });
          return;
        }
        const ageNum = Number(payload.age);
        if (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
          notify('Please enter a valid age (0-120)', { type: 'error' });
          return;
        }
        if (!payload.gender) {
          notify('Please select gender', { type: 'error' });
          return;
        }
        if (!payload.role) {
          notify('Please select role', { type: 'error' });
          return;
        }
        if (payload.mobile && !/^\+?\d{7,15}$/.test(String(payload.mobile))) {
          notify('Please enter a valid mobile number', { type: 'error' });
          return;
        }

        // Convert age to number and ensure all required fields are present
        payload.age = ageNum;
        payload.isChild = ageNum < 14; // Set isChild based on age
        payload.mode = data?.mode;
        payload.houseId = data?.houseId;

        // Ensure required fields have default values
        payload.gender = payload.gender || 'Male';
        payload.role = payload.role || 'Member';
        payload.occupation = payload.occupation || 'Other';
        payload.education = payload.education || 'Below 8th';
        payload.quran = payload.quran || 'no';
        payload.maktab = payload.maktab || 'no';
        payload.dawat = payload.dawat || 'Nil';
        payload.dawatCounts = payload.dawatCounts || {
          '3-day': 0,
          '10-day': 0,
          '40-day': 0,
          '4-month': 0,
        };

        if (data?.mode === 'edit') {
          payload.id = data?.member?.id || data?.memberId;
        }

        // Debug logging
        console.log('Member payload:', payload);
        console.log('Modal data:', data);
      } else if (type === 'house') {
        console.log('🔍 House submit - payload before validation:', payload);
        console.log('🔍 House submit - data:', data);

        if (!payload.number && payload.number !== 0) {
          notify('House number is required', { type: 'error' });
          return;
        }
        if (!payload.street || payload.street.trim().length === 0) {
          notify('Street is required', { type: 'error' });
          return;
        }
        payload.mode = data?.mode;
        if (data?.mode === 'edit') {
          payload.id = data?.house?.id || data?.house?._id;
          console.log('🔍 House submit - edit mode, ID set to:', payload.id);
        }
        console.log('🔍 House submit - final payload:', payload);
      }

      if (onSave) {
        await onSave(payload, type);
      } else {
        console.warn('onSave function not provided to Modal component');
        onClose();
      }
    } catch (error) {
      console.error('Modal save error:', error);
      notify(`Failed to save: ${error.message}`, { type: 'error' });
    }
  };

  if (type === 'house') {
    return (
      <div className='modal-backdrop house-modal-backdrop'>
        <div className='modal house-modal'>
          <h3>
            {data?.mode === 'add'
              ? 'Add New House'
              : `Edit House — ${data?.house?.number ?? ''}`}
          </h3>
          <div className='form-row'>
            <div>
              <label>House Number</label>
              <input
                name='number'
                type='number'
                value={formData.number || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Street</label>
              <input
                name='street'
                value={formData.street || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className='actions'>
            <button className='ghost' onClick={onClose}>
              Cancel
            </button>
            <button onClick={handleSubmit}>
              {data?.mode === 'add' ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'member') {
    return (
      <div className='modal-backdrop member-modal-backdrop'>
        <div className='modal member-modal'>
          <h3>
            {data?.mode === 'add' ? 'Add Member' : 'Edit Member'} — House{' '}
            {data?.houseId ?? ''}
          </h3>
          <div className='form-row'>
            <div>
              <label>Name</label>
              <input
                name='name'
                value={formData.name || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Father's Name</label>
              <input
                name='fatherName'
                placeholder={formData.fatherNameDefault || ''}
                value={formData.fatherName || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Age</label>
              <input
                name='age'
                type='number'
                min='0'
                value={formData.age || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className='form-row'>
            <div>
              <label>Gender</label>
              <select
                name='gender'
                value={formData.gender}
                onChange={handleChange}
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <label>Role</label>
              <select name='role' value={formData.role} onChange={handleChange}>
                <option>Member</option>
                <option>Head</option>
              </select>
            </div>
          </div>
          <div className='form-row'>
            <div>
              <label>Occupation</label>
              <input
                name='occupation'
                value={formData.occupation || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Education</label>
              <select
                name='education'
                value={formData.education}
                onChange={handleChange}
              >
                <option>Below 8th</option>
                <option>10th</option>
                <option>12th</option>
                <option>Graduate</option>
                <option>Above Graduate</option>
              </select>
            </div>
          </div>
          <div className='form-row'>
            <div>
              <label>Quran Read</label>
              <select
                name='quran'
                value={formData.quran}
                onChange={handleChange}
              >
                <option value='yes'>Yes</option>
                <option value='no'>No</option>
              </select>
            </div>
            {Number(formData.age) < 14 && (
              <div>
                <label>Maktab</label>
                <select
                  name='maktab'
                  value={formData.maktab || 'no'}
                  onChange={handleChange}
                >
                  <option value='yes'>Yes</option>
                  <option value='no'>No</option>
                </select>
              </div>
            )}
            <div>
              <label>Dawat Status</label>
              <select
                name='dawat'
                value={formData.dawat || ''}
                onChange={handleChange}
              >
                <option value='Nil'>Nil</option>
                <option value='3-day'>3 days</option>
                <option value='10-day'>10 days</option>
                <option value='40-day'>40 days</option>
                <option value='4-month'>4 months</option>
              </select>
            </div>
          </div>
          <div className='form-row'>
            <div>
              <label>3 days count</label>
              <input
                type='number'
                min='0'
                name='dc_3'
                value={formData.dawatCounts?.['3-day'] ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dawatCounts: {
                      ...(prev.dawatCounts || {}),
                      '3-day': Math.max(0, parseInt(e.target.value || '0')),
                    },
                  }))
                }
              />
            </div>
            <div>
              <label>10 days count</label>
              <input
                type='number'
                min='0'
                name='dc_10'
                value={formData.dawatCounts?.['10-day'] ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dawatCounts: {
                      ...(prev.dawatCounts || {}),
                      '10-day': Math.max(0, parseInt(e.target.value || '0')),
                    },
                  }))
                }
              />
            </div>
          </div>
          <div className='form-row'>
            <div>
              <label>40 days count</label>
              <input
                type='number'
                min='0'
                name='dc_40'
                value={formData.dawatCounts?.['40-day'] ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dawatCounts: {
                      ...(prev.dawatCounts || {}),
                      '40-day': Math.max(0, parseInt(e.target.value || '0')),
                    },
                  }))
                }
              />
            </div>
            <div>
              <label>4 months count</label>
              <input
                type='number'
                min='0'
                name='dc_4m'
                value={formData.dawatCounts?.['4-month'] ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dawatCounts: {
                      ...(prev.dawatCounts || {}),
                      '4-month': Math.max(0, parseInt(e.target.value || '0')),
                    },
                  }))
                }
              />
            </div>
          </div>
          <div className='form-row'>
            <div>
              <label>Mobile</label>
              <input
                name='mobile'
                value={formData.mobile || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className='actions'>
            <button className='ghost' onClick={onClose}>
              Cancel
            </button>
            <button onClick={handleSubmit}>
              {data?.mode === 'add' ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Timetable modal (editable prayer times)
  if (type === 'timetable') {
    console.log(
      '🔍 Timetable modal - isAdmin:',
      isAdmin,
      'showHistory:',
      showHistory,
    );

    // Show history view if requested
    if (showHistory) {
      console.log('🔄 Showing PrayerTimeHistory component');
      return <PrayerTimeHistory onBack={() => setShowHistory(false)} />;
    }

    const onChange = (e) => {
      const { name, value } = e.target;
      setTimes((t) => ({ ...t, [name]: value }));
      setTimeValidity((v) => ({ ...v, [name]: validateTime(value) }));
    };

    const handleSaveClick = () => {
      console.log('🔍 Modal - handleSaveClick called');
      console.log('🔍 Modal - isAdmin:', isAdmin);
      console.log('🔍 Modal - times:', times);
      console.log('🔍 Modal - onSave function exists:', !!onSave);

      // Validate only prayer times before saving
      const prayerTimes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      for (const prayer of prayerTimes) {
        if (
          Object.prototype.hasOwnProperty.call(times, prayer) &&
          !validateTime(times[prayer])
        ) {
          notify(
            `Invalid time format for ${prayer}. ${VALIDATION_RULES.TIME_HHMM.MESSAGE}`,
            { type: 'error' },
          );
          return; // Prevent saving
        }
      }

      if (onSave) {
        console.log('🔍 Modal - Calling onSave with times:', times);
        onSave({ times }, type);
      } else {
        console.warn('onSave function not provided to Modal component');
        onClose();
      }
    };

    const handleResetClick = () => {
      const ok = window.confirm(
        'Reset prayer times? This will revert Fajr, Dhuhr, Asr and Isha to their original values. Maghrib remains Auto from sunset.',
      );
      if (!ok) return;
      const fallback = {
        Fajr: '05:15',
        Dhuhr: '14:15',
        Asr: '17:30',
        Maghrib: dynamicMaghrib, // Use dynamic Maghrib time
        Isha: '20:45',
      };
      const base = data && data.times ? data.times : fallback; // original values or sensible defaults
      setTimes({
        ...base,
        Maghrib: dynamicMaghrib, // Ensure Maghrib stays dynamic
      });
    };

    // Get mobile-optimized positioning
    const mobilePosition = mobileViewport.getMobileModalPosition();
    const deviceInfo = mobileViewport.getMobileDeviceInfo();

    return (
      <div className='modal-backdrop timetable-modal-backdrop'>
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
              // OnePlus-specific optimizations
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
                // OnePlus-specific scroll optimizations
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
              }),
            }}
          >
            <div className='timetable-header'>
              <div className='timetable-ayah'>
                <div className='ayah-text'>
                  Beshak Namaz apne muqarrar waqto mein momino par farz hai
                </div>
                <div className='ayah-ref'>(Surah An Nisa — Ayat 103)</div>
              </div>
            </div>

            <div className='timetable-content'>
              <div className='note-section'>
                <div className='note-content'>
                  <strong>Note:</strong> Maghrib automatically calculated from
                  sunset for your location (28°46'38.8"N 78°03'37.0"E); other
                  times editable. On Fridays, Dhuhr switches to Juma at 1:10 PM.
                </div>
              </div>

              <div className='timetable-grid'>
                <div className='time-field'>
                  <label>Fajr</label>
                  <input
                    type='time'
                    step='60'
                    name='Fajr'
                    value={times.Fajr}
                    onChange={onChange}
                    className={!timeValidity.Fajr ? 'invalid-time' : ''}
                    style={{ cursor: 'text' }}
                  />
                </div>
                <div className='time-field'>
                  <label>Dhuhr</label>
                  <input
                    type='time'
                    step='60'
                    name='Dhuhr'
                    value={times.Dhuhr}
                    onChange={onChange}
                    className={!timeValidity.Dhuhr ? 'invalid-time' : ''}
                    style={{ cursor: 'text' }}
                  />
                </div>
                <div className='time-field'>
                  <label>Asr</label>
                  <input
                    type='time'
                    step='60'
                    name='Asr'
                    value={times.Asr}
                    onChange={onChange}
                    className={!timeValidity.Asr ? 'invalid-time' : ''}
                    style={{ cursor: 'text' }}
                  />
                </div>
                <div className='time-field'>
                  <label>
                    Maghrib <span className='badge-auto'>Auto</span>
                  </label>
                  <input
                    type='time'
                    step='60'
                    name='Maghrib'
                    value={dynamicMaghrib}
                    onChange={onChange}
                    disabled
                  />
                </div>
                <div className='time-field'>
                  <label>Isha</label>
                  <input
                    type='time'
                    step='60'
                    name='Isha'
                    value={times.Isha}
                    onChange={onChange}
                    className={!timeValidity.Isha ? 'invalid-time' : ''}
                    style={{ cursor: 'text' }}
                  />
                </div>
              </div>

              <div className='prayer-summary'>
                <div className='summary-heading'>
                  <span className='heading-title'>Prayer Timetable</span>
                  <span className='heading-sub'>Fazilatien</span>
                </div>
                <ul className='prayer-list'>
                  <li className='prayer-item'>
                    <div className='prayer-name'>Fajr</div>
                    <div className='prayer-time'>{times.Fajr}</div>
                    <div className='prayer-quote'>
                      Fajr chehre ka noor hai — ise kabhi na chhodo.
                    </div>
                  </li>
                  <li className='prayer-item'>
                    <div className='prayer-name'>Dhuhr</div>
                    <div className='prayer-time'>{times.Dhuhr}</div>
                    <div className='prayer-quote'>
                      Dhuhr rooh ko sukoon deta hai, din ki thakan ko mitaata
                      hai.
                    </div>
                  </li>
                  <li className='prayer-item'>
                    <div className='prayer-name'>Asr</div>
                    <div className='prayer-time'>{times.Asr}</div>
                    <div className='prayer-quote'>
                      Asr ka waqt ghanimat hai, guzar jaane se pehle apne Rabb
                      ko yaad karo.
                    </div>
                  </li>
                  <li className='prayer-item'>
                    <div className='prayer-name'>Maghrib</div>
                    <div className='prayer-time'>{times.Maghrib}</div>
                    <div className='prayer-quote highlight'>
                      Maghrib duaon ki qabooliyat ka waqt hai.
                    </div>
                  </li>
                  <li className='prayer-item'>
                    <div className='prayer-name'>Isha</div>
                    <div className='prayer-time'>{times.Isha}</div>
                    <div className='prayer-quote'>
                      Isha imaan ko mazboot karta hai, aur neend ko barkat deta
                      hai.
                    </div>
                  </li>
                </ul>
              </div>
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
                // OnePlus-specific footer optimizations
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
              onClick={onClose}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                minHeight: '35px',
                minWidth: '60px',
                borderRadius: '8px',
                border: '3px solid #ffffff',
                background: '#0000ff',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                maxWidth: '90px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.8)',
                cursor: 'pointer',
                visibility: 'visible',
                opacity: 1,
              }}
            >
              CLOSE
            </button>
            <button
              type='button'
              className='action-btn ghost'
              onClick={() => {
                console.log('📜 History button clicked - isAdmin:', isAdmin);
                setShowHistory(true);
                console.log('📜 showHistory set to true');
              }}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                minHeight: '35px',
                minWidth: '60px',
                borderRadius: '8px',
                border: '3px solid #ffffff',
                background: '#0000ff',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                maxWidth: '90px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.8)',
                cursor: 'pointer',
                visibility: 'visible',
                opacity: 1,
              }}
            >
              HISTORY
            </button>
            <button
              type='button'
              className='action-btn ghost'
              onClick={handleResetClick}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                minHeight: '35px',
                minWidth: '60px',
                borderRadius: '8px',
                border: '3px solid #ffffff',
                background: '#0000ff',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                maxWidth: '90px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.8)',
                cursor: 'pointer',
                visibility: 'visible',
                opacity: 1,
              }}
            >
              RESET
            </button>
            <button
              type='button'
              className='action-btn primary'
              onClick={handleSaveClick}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                minHeight: '35px',
                minWidth: '60px',
                borderRadius: '8px',
                border: '3px solid #00ff00',
                background: 'linear-gradient(45deg, #00ff00, #00cc00)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                maxWidth: '90px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 8px rgba(0,255,0,0.4)',
                cursor: 'pointer',
                visibility: 'visible',
                opacity: 1,
              }}
            >
              SAVE
            </button>
          </div>
          {/* PURE CSS MOBILE FIX - NO JAVASCRIPT */}
          <style>{`
            /* MOBILE TIMETABLE FIX - UNIVERSAL */
            @media (max-width: 1080px), (max-width: 768px), (max-width: 480px), (max-width: 360px) {
              .modal.timetable-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 0 !important;
                background: #000000 !important;
                z-index: 999999 !important;
                overflow: hidden !important;
              }
              
              .timetable-container {
                height: calc(100vh - 50px) !important;
                overflow-y: auto !important;
                padding: 20px !important;
                padding-bottom: 0 !important;
                margin: 0 !important;
                background: #111111 !important;
                -webkit-overflow-scrolling: touch !important;
                overscroll-behavior: contain !important;
              }
              
              .timetable-actions {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100vw !important;
                height: 50px !important;
                padding: 5px !important;
                background: #ff0000 !important;
                border-top: 2px solid #00ff00 !important;
                z-index: 9999999 !important;
                display: flex !important;
                justify-content: space-around !important;
                align-items: center !important;
                gap: 5px !important;
                box-shadow: 0 -3px 15px rgba(0,0,0,0.8) !important;
              }
              
              .timetable-actions .action-btn {
                padding: 4px 8px !important;
                font-size: 10px !important;
                font-weight: bold !important;
                min-height: 30px !important;
                min-width: 50px !important;
                border-radius: 5px !important;
                border: 1px solid #ffffff !important;
                background: #0000ff !important;
                color: #ffffff !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex: 1 !important;
                max-width: 80px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.6) !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
              }
              
              .timetable-actions .action-btn:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 16px rgba(0,0,0,0.8) !important;
              }
              
              .timetable-actions .action-btn.primary {
                background: linear-gradient(45deg, #00ff00, #00cc00) !important;
                border-color: #00ff00 !important;
                box-shadow: 0 6px 12px rgba(0,255,0,0.4) !important;
              }
              
              .timetable-actions .action-btn.primary:hover {
                background: linear-gradient(45deg, #00cc00, #009900) !important;
                box-shadow: 0 8px 16px rgba(0,255,0,0.6) !important;
              }
              
              /* FORCE REMOVE ALL EXTRA SPACE */
              .prayer-summary {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
              }
              
              .prayer-list {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
              }
              
              .prayer-item:last-child {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
              }
            }
            
            /* FALLBACK CSS - NO MEDIA QUERY - FORCE APPLY */
            .modal.timetable-modal {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              border-radius: 0 !important;
              background: #000000 !important;
              z-index: 999999 !important;
              overflow: hidden !important;
            }
            
            .timetable-container {
              height: calc(100vh - 60px) !important;
              overflow-y: auto !important;
              padding: 20px !important;
              padding-bottom: 0 !important;
              margin: 0 !important;
              background: #111111 !important;
              -webkit-overflow-scrolling: touch !important;
              overscroll-behavior: contain !important;
            }
            
            .timetable-actions {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              right: 0 !important;
              width: 100vw !important;
              height: 60px !important;
              padding: 8px !important;
              background: #ff0000 !important;
              border-top: 5px solid #00ff00 !important;
              z-index: 9999999 !important;
              display: flex !important;
              justify-content: space-around !important;
              align-items: center !important;
              gap: 8px !important;
              box-shadow: 0 -10px 30px rgba(0,0,0,0.9) !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            .timetable-actions .action-btn {
              padding: 6px 10px !important;
              font-size: 12px !important;
              font-weight: bold !important;
              min-height: 35px !important;
              min-width: 60px !important;
              border-radius: 8px !important;
              border: 3px solid #ffffff !important;
              background: #0000ff !important;
              color: #ffffff !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              flex: 1 !important;
              max-width: 90px !important;
              text-transform: uppercase !important;
              letter-spacing: 1px !important;
              box-shadow: 0 4px 8px rgba(0,0,0,0.8) !important;
              cursor: pointer !important;
              transition: all 0.3s ease !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            .timetable-actions .action-btn.primary {
              background: linear-gradient(45deg, #00ff00, #00cc00) !important;
              border-color: #00ff00 !important;
              box-shadow: 0 2px 5px rgba(0,255,0,0.4) !important;
            }
            
            /* Premium CSS Styles - Converted to inline styles */
            .modal-backdrop {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 99999;
              backdrop-filter: blur(5px);
              overflow: hidden;
              touch-action: none;
            }

            .modal {
              background: rgba(0, 0, 0, 0.4);
              backdrop-filter: blur(25px);
              border: 2px solid rgba(0, 212, 255, 0.3);
              border-radius: 20px;
              max-width: 800px;
              width: 90%;
              max-height: 95vh;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
              position: relative;
              z-index: 100000;
            }

            /* MOBILE TIMETABLE MODAL - FORCE FULL SCREEN */
            @media (max-width: 768px) {
              .modal.timetable-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                border-radius: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: #000000 !important;
              }

              .timetable-container {
                height: calc(100vh - 80px) !important;
                overflow-y: auto !important;
                padding-bottom: 80px !important;
              }

              .timetable-actions {
                position: absolute !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                height: 80px !important;
                padding: 15px 20px !important;
                background: #ff0000 !important;
                border-top: 4px solid #00ff00 !important;
                z-index: 999999 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                gap: 12px !important;
                flex-wrap: nowrap !important;
                margin: 0 !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.9) !important;
              }

              .action-btn {
                padding: 14px 18px !important;
                font-size: 0.9rem !important;
                font-weight: 700 !important;
                min-height: 50px !important;
                min-width: 85px !important;
                border-radius: 12px !important;
                flex: 1 !important;
                max-width: 115px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: transparent !important;
                border: 3px solid #ffffff !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
                background: #0000ff !important;
                color: #ffffff !important;
              }

              .action-btn.primary {
                background: linear-gradient(135deg, #00d4ff, #0099cc) !important;
                color: #ffffff !important;
                box-shadow: 0 6px 20px rgba(0, 212, 255, 0.7) !important;
                border: 3px solid #00d4ff !important;
                flex: 1.3 !important;
                max-width: 125px !important;
              }

              .action-btn.ghost {
                background: rgba(0, 212, 255, 0.5) !important;
                color: #ffffff !important;
                border: 3px solid #00d4ff !important;
                box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4) !important;
              }
            }

            .timetable-modal {
              padding: 0;
            }

            .timetable-container {
              background: rgba(0, 0, 0, 0.2);
              backdrop-filter: blur(25px);
              border-radius: 20px;
              overflow: hidden;
              max-width: 100%;
              width: 100%;
              margin: 0;
              max-height: 95vh;
              min-height: 400px;
              display: flex;
              flex-direction: column;
              position: relative;
              justify-content: space-between;
            }

            .timetable-header {
              background: linear-gradient(135deg, #00d4ff, #0099cc, #006699);
              color: white;
              padding: 20px;
              text-align: center;
              position: relative;
              flex-shrink: 0;
            }

            .timetable-header::before {
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
            }

            .timetable-ayah {
              position: relative;
              z-index: 1;
            }

            .ayah-text {
              font-weight: 900;
              font-size: 1.6rem;
              line-height: 1.35;
              color: #ffffff;
              letter-spacing: 0.2px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
              margin-bottom: 6px;
            }

            .ayah-ref {
              font-size: 0.8rem;
              opacity: 0.9;
              color: rgba(255, 255, 255, 0.9);
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .timetable-content {
              padding: 20px;
              background: rgba(0, 0, 0, 0.1);
              flex: 1;
              overflow-y: auto;
              max-height: calc(95vh - 280px);
              -webkit-overflow-scrolling: touch;
              overscroll-behavior: contain;
              backdrop-filter: blur(10px);
            }

            .note-section {
              margin-bottom: 15px;
            }

            .note-content {
              background: rgba(0, 212, 255, 0.1);
              border: 1px solid rgba(0, 212, 255, 0.3);
              border-radius: 10px;
              padding: 10px 12px;
              font-size: 0.85rem;
              line-height: 1.4;
              color: #00d4ff;
              text-align: center;
              backdrop-filter: blur(10px);
            }

            .timetable-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
              gap: 12px;
              margin-bottom: 20px;
            }

            .time-field {
              display: flex;
              flex-direction: column;
              gap: 6px;
              background: rgba(0, 0, 0, 0.4);
              border: 1px solid rgba(0, 212, 255, 0.2);
              border-radius: 10px;
              padding: 12px;
              backdrop-filter: blur(10px);
            }

            .time-field label {
              font-weight: 700;
              color: #00d4ff;
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 0.85rem;
              line-height: 1.2;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .time-field input[type='time'] {
              padding: 8px 10px;
              border: 1px solid rgba(0, 212, 255, 0.3);
              border-radius: 6px;
              font-size: 0.9rem;
              background: rgba(255, 255, 255, 0.9);
              color: #000000;
              width: 100%;
              box-sizing: border-box;
              backdrop-filter: blur(10px);
              transition: all 0.3s ease;
            }

            .time-field input[type='time']:focus {
              outline: none;
              border-color: rgba(0, 212, 255, 0.6);
              box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
            }

            .time-field input[type='time']:disabled {
              background: rgba(255, 255, 255, 0.7);
              color: rgba(0, 0, 0, 0.5);
              cursor: not-allowed;
            }

            .badge-auto {
              background: rgba(0, 255, 136, 0.2);
              color: #00ff88;
              border: 1px solid rgba(0, 255, 136, 0.4);
              border-radius: 10px;
              padding: 2px 6px;
              font-size: 0.65rem;
              font-weight: 600;
            }

            .invalid-time {
              border-color: #ff6b6b !important;
              box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1) !important;
            }

            .prayer-summary {
              margin-top: 15px;
            }

            .summary-heading {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 15px;
              background: rgba(0, 212, 255, 0.1);
              border: 1px solid rgba(0, 212, 255, 0.3);
              border-radius: 10px;
              color: #00d4ff;
              margin-bottom: 12px;
              backdrop-filter: blur(10px);
            }

            .summary-heading .heading-title {
              font-weight: 800;
              font-size: 1.1rem;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .summary-heading .heading-sub {
              font-size: 0.75rem;
              opacity: 0.9;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .prayer-list {
              list-style: none;
              padding: 0;
              margin: 0;
              display: grid;
              gap: 10px;
            }

            .prayer-item {
              display: grid;
              grid-template-columns: 70px 60px 1fr;
              gap: 12px;
              align-items: center;
              padding: 12px;
              background: rgba(0, 0, 0, 0.4);
              border: 1px solid rgba(0, 212, 255, 0.2);
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }

            .prayer-name {
              font-weight: 800;
              color: #00d4ff;
              font-size: 0.85rem;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .prayer-time {
              font-weight: 700;
              color: #00ff88;
              font-size: 0.9rem;
              font-family: 'Courier New', monospace;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .prayer-quote {
              color: rgba(255, 255, 255, 0.9);
              font-size: 0.8rem;
              line-height: 1.3;
              font-style: italic;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .prayer-quote.highlight {
              color: #00d4ff;
              font-weight: 600;
            }

            .timetable-actions {
              display: flex;
              gap: 8px;
              justify-content: center;
              padding: 12px 16px;
              border-top: 1px solid rgba(0, 212, 255, 0.2);
              background: rgba(0, 0, 0, 0.5);
              flex-wrap: wrap;
              flex-shrink: 0;
              position: sticky;
              bottom: 0;
              z-index: 10;
            }

            .action-btn {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 6px 12px;
              border: none;
              border-radius: 6px;
              font-size: 0.8rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
              min-width: 60px;
              justify-content: center;
            }

            .action-btn.ghost {
              background: rgba(0, 212, 255, 0.2);
              color: #00d4ff;
              border: 1px solid rgba(0, 212, 255, 0.4);
            }

            .action-btn.ghost:hover {
              background: rgba(0, 212, 255, 0.3);
              border-color: rgba(0, 212, 255, 0.6);
              transform: translateY(-2px);
            }

            .action-btn.primary {
              background: linear-gradient(135deg, #00d4ff, #0099cc);
              color: white;
              box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
            }

            .action-btn.primary:hover {
              background: linear-gradient(135deg, #0099cc, #006699);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
            }

            /* Mobile Responsive Design */
            @media (max-width: 768px) {
              .modal {
                width: 100vw !important;
                height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                margin: 0 !important;
                border-radius: 0 !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                overflow: hidden !important;
                z-index: 99999 !important;
                background: transparent !important;
              }

              .timetable-container {
                width: 100% !important;
                height: 100vh !important;
                max-height: 100vh !important;
                border-radius: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: visible !important;
                position: relative !important;
                background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460) !important;
                padding-bottom: 0 !important;
                justify-content: flex-start !important;
              }

              .timetable-header {
                padding: 12px !important;
                flex-shrink: 0 !important;
                min-height: 60px !important;
                background: linear-gradient(135deg, #00d4ff, #0099cc, #006699) !important;
              }

              .ayah-text {
                font-size: 1rem !important;
                line-height: 1.3 !important;
                margin-bottom: 4px !important;
              }

              .ayah-ref {
                font-size: 0.7rem !important;
              }

              .timetable-content {
                flex: 1 !important;
                padding: 12px !important;
                padding-bottom: 120px !important;
                overflow-y: scroll !important;
                -webkit-overflow-scrolling: touch !important;
                background: transparent !important;
                backdrop-filter: none !important;
                min-height: 0 !important;
                max-height: none !important;
                height: auto !important;
                position: relative !important;
              }

              .note-section {
                margin-bottom: 12px !important;
              }

              .note-content {
                padding: 8px !important;
                font-size: 0.8rem !important;
                line-height: 1.3 !important;
              }

              .timetable-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 8px !important;
                margin-bottom: 15px !important;
              }

              .time-field {
                padding: 8px !important;
                gap: 4px !important;
                background: rgba(0, 0, 0, 0.4) !important;
                border: 1px solid rgba(0, 212, 255, 0.2) !important;
                border-radius: 8px !important;
              }

              .time-field label {
                font-size: 0.8rem !important;
                color: #00d4ff !important;
                font-weight: 600 !important;
              }

              .time-field input[type='time'] {
                padding: 6px 8px !important;
                font-size: 0.85rem !important;
                min-height: 36px !important;
                background: rgba(255, 255, 255, 0.9) !important;
                border: 1px solid rgba(0, 212, 255, 0.3) !important;
                border-radius: 4px !important;
              }

              .prayer-summary {
                margin-top: 12px !important;
                margin-bottom: 20px !important;
                padding-bottom: 20px !important;
              }

              .summary-heading {
                padding: 8px !important;
                margin-bottom: 8px !important;
                background: rgba(0, 212, 255, 0.1) !important;
                border: 1px solid rgba(0, 212, 255, 0.3) !important;
                border-radius: 8px !important;
              }

              .summary-heading .heading-title {
                font-size: 1rem !important;
                color: #00d4ff !important;
              }

              .summary-heading .heading-sub {
                font-size: 0.7rem !important;
                color: #00d4ff !important;
              }

              .prayer-item {
                grid-template-columns: 60px 50px 1fr !important;
                gap: 8px !important;
                padding: 8px !important;
                margin-bottom: 8px !important;
                background: rgba(0, 0, 0, 0.4) !important;
                border: 1px solid rgba(0, 212, 255, 0.2) !important;
                border-radius: 8px !important;
              }

              .prayer-name {
                font-size: 0.8rem !important;
                color: #00d4ff !important;
                font-weight: 600 !important;
              }

              .prayer-time {
                font-size: 0.85rem !important;
                color: #00ff88 !important;
                font-weight: 600 !important;
              }

              .prayer-quote {
                font-size: 0.75rem !important;
                line-height: 1.2 !important;
                color: rgba(255, 255, 255, 0.9) !important;
              }

              .timetable-actions {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                padding: 10px 8px !important;
                background: rgba(0, 0, 0, 0.95) !important;
                backdrop-filter: blur(15px) !important;
                border-top: 1px solid rgba(0, 212, 255, 0.3) !important;
                z-index: 1000 !important;
                display: flex !important;
                justify-content: center !important;
                gap: 6px !important;
                flex-wrap: nowrap !important;
                min-height: 55px !important;
                margin: 0 !important;
                width: 100vw !important;
                flex-shrink: 0 !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
              }

              .action-btn {
                padding: 8px 10px !important;
                font-size: 0.75rem !important;
                gap: 3px !important;
                min-height: 38px !important;
                min-width: 65px !important;
                border-radius: 6px !important;
                font-weight: 600 !important;
                flex: 1 !important;
                max-width: 90px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: transparent !important;
              }

              .action-btn.primary {
                flex: 1.3 !important;
                max-width: 110px !important;
                background: linear-gradient(135deg, #00d4ff, #0099cc) !important;
                color: white !important;
                box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3) !important;
              }

              .action-btn.ghost {
                background: rgba(0, 212, 255, 0.2) !important;
                color: #00d4ff !important;
                border: 1px solid rgba(0, 212, 255, 0.4) !important;
              }
            }

            /* Small Mobile Devices - Extra Small Screens */
            @media (max-width: 480px) {
              .timetable-actions {
                padding: 8px 6px !important;
                gap: 4px !important;
                min-height: 50px !important;
              }

              .action-btn {
                padding: 6px 8px !important;
                font-size: 0.7rem !important;
                min-height: 35px !important;
                min-width: 60px !important;
                max-width: 80px !important;
              }

              .action-btn.primary {
                max-width: 100px !important;
              }
            }

            /* Extra Small Mobile Devices */
            @media (max-width: 360px) {
              .timetable-actions {
                padding: 6px 4px !important;
                gap: 3px !important;
                min-height: 45px !important;
              }

              .action-btn {
                padding: 5px 6px !important;
                font-size: 0.65rem !important;
                min-height: 32px !important;
                min-width: 55px !important;
                max-width: 70px !important;
              }

              .action-btn.primary {
                max-width: 85px !important;
              }
            }

            /* Physical Mobile Device Fix - Higher Priority */
            @media (max-width: 1080px) and (max-height: 2400px), 
                   (max-width: 1080px) and (orientation: portrait),
                   (max-width: 1080px) and (-webkit-min-device-pixel-ratio: 2) {
              .timetable-actions {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                padding: 12px 8px !important;
                background: rgba(0, 0, 0, 0.98) !important;
                backdrop-filter: blur(20px) !important;
                border-top: 2px solid rgba(0, 212, 255, 0.5) !important;
                z-index: 9999 !important;
                display: flex !important;
                justify-content: center !important;
                gap: 8px !important;
                flex-wrap: nowrap !important;
                min-height: 65px !important;
                margin: 0 !important;
                width: 100vw !important;
                flex-shrink: 0 !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5) !important;
              }

              .action-btn {
                padding: 10px 12px !important;
                font-size: 0.8rem !important;
                gap: 4px !important;
                min-height: 45px !important;
                min-width: 75px !important;
                border-radius: 8px !important;
                font-weight: 600 !important;
                flex: 1 !important;
                max-width: 100px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: transparent !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
              }

              .action-btn.primary {
                flex: 1.3 !important;
                max-width: 120px !important;
                background: linear-gradient(135deg, #00d4ff, #0099cc) !important;
                color: white !important;
                box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4) !important;
                border: 1px solid rgba(0, 212, 255, 0.6) !important;
              }

              .action-btn.ghost {
                background: rgba(0, 212, 255, 0.25) !important;
                color: #00d4ff !important;
                border: 1px solid rgba(0, 212, 255, 0.5) !important;
              }
            }

            /* OnePlus Nord CE 3 Lite 5G Specific Fix */
            @media (max-width: 1080px) and (max-height: 2400px) {
              .timetable-content {
                padding-bottom: 200px !important;
                overflow-y: scroll !important;
                -webkit-overflow-scrolling: touch !important;
                height: calc(100vh - 140px) !important;
              }

              .timetable-actions {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                padding: 20px 15px !important;
                background: #000000 !important;
                backdrop-filter: blur(25px) !important;
                border-top: 4px solid #00d4ff !important;
                z-index: 999999 !important;
                display: flex !important;
                justify-content: center !important;
                gap: 12px !important;
                flex-wrap: nowrap !important;
                min-height: 80px !important;
                margin: 0 !important;
                width: 100vw !important;
                flex-shrink: 0 !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
                box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.9) !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
              }

              .action-btn {
                padding: 15px 18px !important;
                font-size: 0.9rem !important;
                gap: 6px !important;
                min-height: 55px !important;
                min-width: 90px !important;
                border-radius: 12px !important;
                font-weight: 700 !important;
                flex: 1 !important;
                max-width: 120px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                flex-shrink: 0 !important;
                touch-action: manipulation !important;
                -webkit-tap-highlight-color: transparent !important;
                border: 3px solid #ffffff !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
              }

              .action-btn.primary {
                flex: 1.5 !important;
                max-width: 140px !important;
                background: linear-gradient(135deg, #00d4ff, #0099cc) !important;
                color: #ffffff !important;
                box-shadow: 0 8px 25px rgba(0, 212, 255, 0.6) !important;
                border: 3px solid #00d4ff !important;
              }

              .action-btn.ghost {
                background: rgba(0, 212, 255, 0.4) !important;
                color: #00d4ff !important;
                border: 3px solid #00d4ff !important;
                box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3) !important;
              }
            }


            /* FORCE REMOVE ALL EXTRA SPACE */
            .timetable-container {
              padding-bottom: 0px !important;
              margin-bottom: 0px !important;
            }
            
            .prayer-summary {
              margin-bottom: 0px !important;
              padding-bottom: 0px !important;
            }
            
            .prayer-list {
              margin-bottom: 0px !important;
              padding-bottom: 0px !important;
            }
            
            .prayer-item:last-child {
              margin-bottom: 0px !important;
              padding-bottom: 0px !important;
            }

            /* End of Mobile Styles */
          `}</style>
        </div>
      </div>
    );
  }

  if (type === 'export' || type === 'export_pdf') {
    const allCols = (data && data.allColumns) || [];
    const initial = new Set((data && data.columns) || allCols);
    const idFor = (col) =>
      `col_${col.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    const handleExport = () => {
      // Read current checkbox states directly to avoid async state issues
      const cols = allCols.filter((col) => {
        const el = document.getElementById(idFor(col));
        return el ? !!el.checked : initial.has(col);
      });
      if (onSave) {
        onSave({ columns: cols.length ? cols : allCols, __target: type });
      } else {
        console.warn('onSave function not provided to Modal component');
        onClose();
      }
    };
    return (
      <div className='modal-backdrop export-modal-backdrop'>
        <div className='modal export-modal'>
          <h3 style={{ marginBottom: 6 }}>
            {type === 'export_pdf' ? 'Export PDF Columns' : 'Export Columns'}
          </h3>
          <div
            className='form-row'
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 8,
            }}
          >
            {allCols.map((col) => (
              <label
                key={col}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '6px 8px',
                  background: '#f8fafc',
                }}
              >
                <input
                  id={idFor(col)}
                  type='checkbox'
                  defaultChecked={initial.has(col)}
                />
                <span>{col}</span>
              </label>
            ))}
          </div>
          <div className='actions'>
            <button type='button' className='ghost' onClick={onClose}>
              Cancel
            </button>
            <button type='button' onClick={handleExport}>
              Export
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Info modals (imam, running, aumoor, etc.)
  // Info modals (imam, running, aumoor, etc.)
  if (type === 'info') {
    // Role-based access control for contact info
    const readOnly = data === 'contact' && !isAdmin; // Only admin can edit contact info
    console.log(
      '🔍 Modal - info type:',
      data,
      'readOnly:',
      readOnly,
      'isAdmin:',
      isAdmin,
      'onSave:',
      !!onSave,
      'Contact edit access:',
      data === 'contact'
        ? isAdmin
          ? 'ADMIN CAN EDIT'
          : 'READ-ONLY FOR USER'
        : 'N/A',
    );
    console.log('🔍 Modal - About to render InfoModal with data:', data);
    console.log('🔍 Modal - Rendering InfoModal component now');
    return (
      <div className='modal-backdrop info-modal-backdrop'>
        <div className='modal info-modal'>
          <InfoModal
            data={data}
            onClose={onClose}
            onSave={onSave}
            readOnly={readOnly}
          />
        </div>
      </div>
    );
  }

  if (type === 'about') {
    const VisionMission = require('./VisionMission.jsx').default;
    return (
      <div className='modal-backdrop about-modal-backdrop'>
        <div className='modal about-modal'>
          <h3 style={{ marginBottom: 8 }}>About Us</h3>
          <VisionMission />
          <div className='actions'>
            <button type='button' className='ghost' onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'contact_admin') {
    const onChange = (e) => {
      const { name, value } = e.target;
      // Preserve spaces in name and message fields
      const fieldsToPreserveSpaces = ['name', 'message'];
      const sanitizedValue = fieldsToPreserveSpaces.includes(name)
        ? value
        : sanitizeString(value);
      setContactForm((f) => ({ ...f, [name]: sanitizedValue }));
    };

    // Set default category if not already set
    if (!contactForm.category) {
      setContactForm((f) => ({ ...f, category: 'General' }));
    }

    const handleSend = async () => {
      if (isSubmitting) return; // Prevent double submission

      // Validate category
      if (!contactForm.category) {
        notify('Please select a category', {
          type: 'error',
        });
        return;
      }

      // Validate name
      if (!contactForm.name.trim()) {
        notify('Please enter your name', {
          type: 'error',
        });
        return;
      }

      // Validate mobile (optional but if provided, must be valid)
      if (
        contactForm.mobile &&
        !/^\+?\d{7,15}$/.test(String(contactForm.mobile))
      ) {
        notify('Please enter a valid mobile number', {
          type: 'error',
        });
        return;
      }

      // Validate message
      if (!contactForm.message.trim()) {
        notify('Please enter your message', {
          type: 'error',
        });
        return;
      }

      // Validate message length
      if (contactForm.message.trim().length < 10) {
        notify('Message must be at least 10 characters long', {
          type: 'error',
        });
        return;
      }

      setIsSubmitting(true);

      console.log('📧 Contact form submission started:', {
        category: contactForm.category,
        name: contactForm.name,
        mobile: contactForm.mobile,
        messageLength: contactForm.message.length,
        hasOnSave: !!onSave,
      });

      try {
        // First save to database
        if (onSave) {
          console.log('📧 Calling onSave function...');
          await onSave(contactForm, 'contact_admin');
          console.log('📧 onSave function completed successfully');
        }

        // Generate WhatsApp URL
        const adminNumber = '+917060813814'; // Admin WhatsApp number
        const formattedMessage = `🕌 *New Contact Message from Masjid Dashboard*

📋 *Category:* ${contactForm.category}
👤 *Name:* ${contactForm.name}
📱 *Mobile:* ${contactForm.mobile || 'Not provided'}
💬 *Message:* ${contactForm.message}

⏰ *Time:* ${new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}

---
*Sent from Masjid Dashboard System*`;

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminNumber}&text=${encodeURIComponent(formattedMessage)}`;

        console.log('📱 Generated WhatsApp URL:', whatsappUrl);

        // Show success message
        notify('Message saved! Opening WhatsApp...', {
          type: 'success',
        });

        // Open WhatsApp in new tab
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
          onClose(); // Close modal after opening WhatsApp
        }, 1000);
      } catch (error) {
        console.error('❌ Contact form submission error:', error);
        notify('Failed to send message. Please try again.', {
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
        console.log('📧 Contact form submission finished');
      }
    };

    return (
      <div className='modal-backdrop contact-admin-modal-backdrop'>
        <div
          className='modal contact-admin-modal'
          style={{
            maxHeight: '95vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className='modal-header'>
            <h3>📧 Contact Admin</h3>
            <button
              className='modal-close-btn'
              onClick={onClose}
              aria-label='Close contact form'
            >
              ✕
            </button>
          </div>

          {/* Contact List Button */}
          <div
            style={{
              background: 'linear-gradient(to right, #f0fdf4, #eff6ff)',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  background: '#22c55e',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '8px',
                }}
              >
                📋
              </div>
              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    fontWeight: '600',
                    color: '#166534',
                    margin: '0 0 4px 0',
                  }}
                >
                  Contact List
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#15803d',
                    margin: '0 0 8px 0',
                  }}
                >
                  View all contacts and their details
                </p>
                <button
                  type='button'
                  onClick={() => {
                    // Close current modal and trigger contact list modal
                    onClose();
                    // Use a custom event to trigger contact list modal
                    const event = new CustomEvent('openContactListModal');
                    window.dispatchEvent(event);
                  }}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#16a34a';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#22c55e';
                  }}
                >
                  📋 View Contact List
                </button>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {/* Category Selection */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                }}
              >
                📋 Select Category *
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  { value: 'Jamaat', label: 'Jamaat', icon: '🕌' },
                  { value: 'Taqaza', label: 'Taqaza', icon: '📢' },
                  { value: 'Suggestions', label: 'Suggestions', icon: '💡' },
                  {
                    value: 'Facing Issues',
                    label: 'Facing Issues',
                    icon: '⚠️',
                  },
                  { value: 'General', label: 'General', icon: '📝' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type='button'
                    onClick={() =>
                      onChange({
                        target: { name: 'category', value: cat.value },
                      })
                    }
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px 12px',
                      minHeight: '80px',
                      border:
                        contactForm.category === cat.value
                          ? '2px solid #3b82f6'
                          : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      background:
                        contactForm.category === cat.value
                          ? '#3b82f6'
                          : 'white',
                      color:
                        contactForm.category === cat.value
                          ? 'white'
                          : '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '20px', marginBottom: '6px' }}>
                      {cat.icon}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name and Mobile Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  👤 Your Name *
                </label>
                <input
                  type='text'
                  name='name'
                  value={contactForm.name}
                  onChange={onChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  placeholder='Enter your full name'
                  maxLength={100}
                />
              </div>

              {/* Mobile */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px',
                  }}
                >
                  📱 Mobile Number (Optional)
                </label>
                <input
                  type='tel'
                  name='mobile'
                  value={contactForm.mobile}
                  onChange={onChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  placeholder='+91 98765 43210'
                  maxLength={20}
                />
                <p
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '6px',
                    marginBottom: 0,
                  }}
                >
                  Admin will contact you on this number if needed
                </p>
              </div>
            </div>

            {/* Message */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                💬 Your Message *
              </label>
              <textarea
                name='message'
                value={contactForm.message}
                onChange={onChange}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder='Describe your inquiry or message in detail...'
                maxLength={1000}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      background: '#22c55e',
                      borderRadius: '50%',
                    }}
                  ></div>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>
                    {contactForm.message.length}/1000 characters
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#16a34a',
                  }}
                >
                  📱 <span>Will be sent to admin on WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className='actions'>
              <button type='submit' disabled={isSubmitting} className='primary'>
                {isSubmitting ? 'Sending...' : '📱 Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (type === 'notify_prefs') {
    return (
      <div className='modal-backdrop notification-prefs-modal-backdrop'>
        <div className='modal notification-prefs-modal'>
          <AdvancedNotificationSettings
            user={data?.user}
            onClose={onClose}
            onSave={onSave}
          />
        </div>
      </div>
    );
  }

  if (type === 'notification_tester') {
    return (
      <div className='modal-backdrop notification-tester-modal-backdrop'>
        <div className='modal notification-tester-modal'>
          <NotificationTester user={data?.user} onClose={onClose} />
        </div>
      </div>
    );
  }

  if (type === 'backup_restore') {
    return (
      <div className='modal-backdrop backup-modal-backdrop'>
        <div className='modal backup-modal'>
          <div className='modal-header'>
            <h3>💾 Data Backup & Restore</h3>
            <button
              className='modal-close-btn'
              onClick={onClose}
              aria-label='Close backup'
            >
              ✕
            </button>
          </div>
          <BackupRestoreModal
            currentData={data?.currentData}
            onBackup={data?.onBackup}
            onRestore={data?.onRestore}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  if (type === 'user_profile') {
    return (
      <div className='modal-backdrop profile-modal-backdrop'>
        <div className='modal profile-modal'>
          <div className='modal-header'>
            <h3>User Profile</h3>
            <button
              className='modal-close-btn'
              onClick={onClose}
              aria-label='Close profile'
            >
              ✕
            </button>
          </div>
          <UserProfile
            user={data?.user}
            onUpdatePreferences={onSave}
            onLogout={onLogout || onClose}
          />
        </div>
      </div>
    );
  }

  if (type === 'admin_dashboard') {
    return (
      <div className='modal-backdrop admin-dashboard-modal-backdrop'>
        <div className='modal admin-dashboard-modal'>
          <AdminDashboard onClose={onClose} />
        </div>
      </div>
    );
  }

  return null;
};

export default Modal;
