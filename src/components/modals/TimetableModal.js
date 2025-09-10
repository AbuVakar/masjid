import React, { useState, useEffect } from 'react';
import { useNotify } from '../../context/NotificationContext';
import { validateTime } from '../../utils/validation';

// Mobile Footer Portal Component
const MobileFooterPortal = ({ onClose, handleSave, loading, timeValidity }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  const footerContent = (
    <div 
      className="mobile-footer-portal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100vw',
        height: 'auto',
        minHeight: '70px',
        background: '#ffffff',
        borderTop: '3px solid #007bff',
        zIndex: 2147483647,
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '15px 20px',
        paddingBottom: `calc(15px + env(safe-area-inset-bottom))`,
        boxShadow: '0 -8px 25px rgba(0, 0, 0, 0.4)',
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <button 
        type='button' 
        className='ghost' 
        onClick={onClose}
        style={{
          flex: 1,
          maxWidth: '140px',
          minHeight: '50px',
          padding: '15px 20px',
          fontSize: '16px',
          fontWeight: '700',
          borderRadius: '10px',
          border: '2px solid #ddd',
          background: '#ffffff',
          color: '#333333',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        Cancel
      </button>
      <button
        type='button'
        onClick={handleSave}
        disabled={loading || Object.values(timeValidity).some((valid) => !valid)}
        style={{
          flex: 1,
          maxWidth: '140px',
          minHeight: '50px',
          padding: '15px 20px',
          fontSize: '16px',
          fontWeight: '700',
          borderRadius: '10px',
          border: '2px solid #007bff',
          background: '#007bff',
          color: 'white',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        {loading ? 'Saving...' : 'Save Times'}
      </button>
    </div>
  );

  return ReactDOM.createPortal(footerContent, document.body);
};

// Function to fetch sunset time from API
const fetchSunsetTime = async (
  date,
  latitude = 28.7774,
  longitude = 78.0603,
) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${dateStr}&formatted=0`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.sunset) {
      const sunsetUTC = new Date(data.results.sunset);
      const sunsetIST = new Date(sunsetUTC.getTime() + 5.5 * 60 * 60 * 1000);
      const hours = sunsetIST.getUTCHours();
      const minutes = sunsetIST.getUTCMinutes();

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      throw new Error('Failed to fetch sunset data');
    }
  } catch (error) {
    console.error('Error fetching sunset time:', error);
    return calculateSunsetFallback(date, latitude, longitude);
  }
};

// Fallback calculation function
const calculateSunsetFallback = (
  date,
  latitude = 28.7774,
  longitude = 78.0603,
) => {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
  );

  let baseHour = 18;
  let baseMinute = 30;

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

const TimetableModal = ({ data, onClose, onSave, L, loading = false }) => {
  const { notify } = useNotify();

  const [times, setTimes] = useState({
    Fajr: data?.times?.Fajr || '05:15',
    Dhuhr: data?.times?.Dhuhr || '14:15',
    Asr: data?.times?.Asr || '17:30',
    Maghrib: data?.times?.Maghrib || '19:10',
    Isha: data?.times?.Isha || '20:45',
  });

  const [dynamicMaghrib, setDynamicMaghrib] = useState('18:30');
  const [timeValidity, setTimeValidity] = useState({
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  });

  // Fetch dynamic Maghrib time when modal opens
  useEffect(() => {
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
      } catch (error) {
        console.error('Failed to fetch Maghrib time:', error);
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const fallbackSunset = calculateSunsetFallback(today, 28.7774, 78.0603);
        setDynamicMaghrib(fallbackSunset);
      }
    };

    fetchMaghribTime();
  }, []);

  // Check for daily date change and update Maghrib time
  useEffect(() => {
    const checkDailyUpdate = () => {
      const now = new Date();
      const currentDate = now.toDateString();

      // Always update Maghrib time (no localStorage needed)
      console.log(`📅 Date: ${currentDate}, updating Maghrib time...`);

      const fetchMaghribTime = async () => {
        try {
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          const sunset = await fetchSunsetTime(today, 28.7774, 78.0603);
          setDynamicMaghrib(sunset);
        } catch (error) {
          console.error('Failed to update Maghrib time:', error);
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
        }
      };

      fetchMaghribTime();
    };

    checkDailyUpdate();
  }, []);

  // Update times when data changes
  useEffect(() => {
    if (data?.times) {
      setTimes(data.times);
    }
  }, [data?.times]);

  // Dynamic Viewport Height Fix for Mobile
  useEffect(() => {
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  const handleTimeChange = (prayer, value) => {
    const isValid = validateTime(value);
    setTimeValidity((prev) => ({ ...prev, [prayer]: isValid }));

    if (isValid) {
      setTimes((prev) => ({ ...prev, [prayer]: value }));
    }
  };

  const handleSave = async () => {
    const invalidTimes = Object.entries(timeValidity).filter(
      ([_, valid]) => !valid,
    );

    if (invalidTimes.length > 0) {
      notify('Please fix invalid time formats', { type: 'error' });
      return;
    }

    try {
      const timesToSave = { ...times, Maghrib: dynamicMaghrib };
      await onSave({ type: 'timetable', times: timesToSave });
      notify('Prayer times updated successfully!', { type: 'success' });
      onClose();
    } catch (error) {
      notify('Failed to update prayer times', { type: 'error' });
    }
  };

  const prayerNames = {
    Fajr: 'Fajr',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha',
  };

  return (
    <div className='modal-backdrop timetable-modal-backdrop'>
      <div className='modal timetable-modal'>
        <div className='modal-header'>
          <h3>🕌 Prayer Times</h3>
          <button
            className='modal-close-btn'
            onClick={onClose}
            aria-label='Close timetable'
          >
            ✕
          </button>
        </div>
        <div className='modal-body'>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              Update prayer times for the masjid
            </p>
            <p style={{ fontSize: 12, color: '#888' }}>
              Maghrib time is automatically calculated based on sunset
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(prayerNames).map(([prayer, name]) => (
              <div
                key={prayer}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <label style={{ minWidth: 80, fontWeight: 500 }}>{name}:</label>
                <input
                  type='time'
                  value={prayer === 'Maghrib' ? dynamicMaghrib : times[prayer]}
                  onChange={(e) => handleTimeChange(prayer, e.target.value)}
                  disabled={prayer === 'Maghrib' || loading}
                  style={{
                    padding: 8,
                    border: `1px solid ${timeValidity[prayer] ? '#ddd' : '#ff4444'}`,
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                />
                {prayer === 'Maghrib' && (
                  <span style={{ fontSize: 12, color: '#666' }}>
                    (Auto-calculated)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Universal Footer - Always Visible */}
        <div className='modal-footer' style={{
          position: 'relative',
          width: '100%',
          background: '#ffffff',
          borderTop: '3px solid #007bff',
          padding: '15px 20px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          marginTop: 'auto'
        }}>
          <button 
            type='button' 
            className='ghost' 
            onClick={onClose}
            style={{
              flex: 1,
              maxWidth: '140px',
              minHeight: '50px',
              padding: '15px 20px',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: '10px',
              border: '2px solid #ddd',
              background: '#ffffff',
              color: '#333333',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={
              loading || Object.values(timeValidity).some((valid) => !valid)
            }
            style={{
              flex: 1,
              maxWidth: '140px',
              minHeight: '50px',
              padding: '15px 20px',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: '10px',
              border: '2px solid #007bff',
              background: '#007bff',
              color: 'white',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {loading ? 'Saving...' : 'Save Times'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimetableModal;
