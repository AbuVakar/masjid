import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaClock, FaPray } from 'react-icons/fa';
import { useNotifications } from '../hooks/useNotifications';
import { useUser } from '../context/UserContext';

// Fetch sunset time from API with better error handling
const fetchSunsetTime = async (
  date,
  latitude = 28.7774,
  longitude = 78.0603,
) => {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // Use a more reliable API - OpenWeatherMap or fallback to calculation
    const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${dateStr}&formatted=0`;

    console.log(`🌅 Fetching sunset from: ${url}`);

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

    console.log(`🌅 API Response:`, data);

    if (data.status === 'OK' && data.results.sunset) {
      // Parse the sunset time string directly
      const sunsetTimeStr = data.results.sunset; // Format: "2024-01-01T12:30:00+00:00"

      // Extract time part and convert to IST
      const sunsetDate = new Date(sunsetTimeStr);

      // Add 5.5 hours for IST
      const istTime = new Date(sunsetDate.getTime() + 5.5 * 60 * 60 * 1000);

      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();

      console.log(`🌅 Raw API Response: ${sunsetTimeStr}`);
      console.log(`🌅 Parsed Date: ${sunsetDate.toISOString()}`);
      console.log(`🌅 IST Time: ${istTime.toISOString()}`);
      console.log(`🌅 Hours: ${hours}, Minutes: ${minutes}`);

      // Validate time
      if (hours < 12 || hours > 23) {
        console.warn('⚠️ Invalid sunset time - using fallback');
        return calculateSunsetFallback(date, latitude, longitude);
      }

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      throw new Error('Failed to fetch sunset data');
    }
  } catch (error) {
    console.warn(
      'Sunset API failed, using fallback calculation:',
      error.message,
    );
    // Fallback to approximate calculation if API fails
    return calculateSunsetFallback(date, latitude, longitude);
  }
};

// Improved fallback calculation function
const calculateSunsetFallback = (
  date,
  latitude = 28.7774,
  longitude = 78.0603,
) => {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
  );

  // More accurate base sunset time for Indian latitude
  let baseHour = 18;
  let baseMinute = 15; // Earlier base time for India

  // Seasonal adjustment based on day of year
  const daysFromSolstice = Math.abs(dayOfYear - 172); // June 21st is day 172
  const seasonalAdjustment =
    Math.cos((daysFromSolstice / 365) * 2 * Math.PI) * 45; // Reduced adjustment

  // Latitude adjustment (India is around 28°N)
  const latitudeAdjustment = (latitude - 28) * 2; // Minutes per degree

  let totalMinutes =
    baseHour * 60 + baseMinute + seasonalAdjustment + latitudeAdjustment;
  let finalHour = Math.floor(totalMinutes / 60);
  let finalMinute = Math.floor(totalMinutes % 60);

  // Ensure valid time range
  if (finalHour >= 24) finalHour = finalHour % 24;
  if (finalHour < 0) finalHour = 24 + finalHour;
  if (finalMinute >= 60) {
    finalMinute = finalMinute % 60;
    finalHour = (finalHour + 1) % 24;
  }

  return `${finalHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
};

const Clock = ({ time, nextPrayer, prayerTimes: propPrayerTimes }) => {
  // Get notification hooks and user context
  const { schedulePrayerNotifications } = useNotifications();
  const { user } = useUser();

  // Memoize default prayer times to prevent recreation on each render
  const defaultPrayerTimes = useMemo(
    () => ({
      Fajr: '05:00',
      Dhuhr: '12:30',
      Asr: '15:45',
      Maghrib: '18:15', // This will be calculated dynamically
      Isha: '19:30',
    }),
    [],
  );

  const [displayTime, setDisplayTime] = useState('--:--:--');
  const [displayNextPrayer, setDisplayNextPrayer] = useState('Next: --');
  const [dayName, setDayName] = useState('');
  const [sunsetTime, setSunsetTime] = useState('18:30'); // Default sunset time

  const pad = useCallback((n) => (n < 10 ? `0${n}` : `${n}`), []);

  // Fetch sunset time from API
  const fetchSunsetForDate = useCallback(async (date) => {
    try {
      const sunset = await fetchSunsetTime(date, 28.7774, 78.0603);
      setSunsetTime(sunset);
      console.log(
        `🌅 API sunset for ${date.toDateString()}: ${sunset} (Location: 28.7774°N, 78.0603°E)`,
      );
    } catch (error) {
      console.error('Failed to fetch sunset time:', error);
      // Use fallback calculation
      const fallbackSunset = calculateSunsetFallback(date, 28.7774, 78.0603);
      setSunsetTime(fallbackSunset);
      console.log(
        `🌅 Fallback sunset for ${date.toDateString()}: ${fallbackSunset} (Location: 28.7774°N, 78.0603°E)`,
      );
    }
  }, []);

  // Calculate current prayer times including dynamic Maghrib
  const getCurrentPrayerTimes = useCallback(() => {
    // Validate sunsetTime before using it
    let validSunsetTime = '18:30'; // Default fallback

    if (
      sunsetTime &&
      typeof sunsetTime === 'string' &&
      sunsetTime.includes(':')
    ) {
      const [hours, minutes] = sunsetTime.split(':').map(Number);
      if (
        !isNaN(hours) &&
        !isNaN(minutes) &&
        hours >= 0 &&
        hours <= 23 &&
        minutes >= 0 &&
        minutes <= 59
      ) {
        validSunsetTime = sunsetTime;
      } else {
        console.warn(
          'Clock - Invalid sunset time format, using default:',
          sunsetTime,
        );
      }
    } else {
      console.warn(
        'Clock - Sunset time not available, using default:',
        sunsetTime,
      );
    }

    console.log('Clock - Using sunset time:', validSunsetTime);

    return {
      ...(propPrayerTimes || defaultPrayerTimes),
      Maghrib: validSunsetTime,
    };
  }, [propPrayerTimes, defaultPrayerTimes, sunsetTime]);

  // Apply prayer timing preferences to adjust notification times
  const getAdjustedPrayerTimes = useCallback(() => {
    const baseTimes = getCurrentPrayerTimes();
    const timingPrefs = user?.preferences?.prayerTiming;

    if (!timingPrefs) {
      return baseTimes;
    }

    const adjustedTimes = {};

    Object.entries(baseTimes).forEach(([prayer, time]) => {
      const timingOffset = timingPrefs[prayer] || 5; // Default to 5 minutes
      const [hours, minutes] = time.split(':').map(Number);

      // Calculate adjusted time (subtract the offset minutes)
      let adjustedMinutes = minutes - timingOffset;
      let adjustedHours = hours;

      // Handle negative minutes (borrow from hours)
      if (adjustedMinutes < 0) {
        adjustedMinutes += 60;
        adjustedHours -= 1;
      }

      // Handle negative hours (borrow from previous day)
      if (adjustedHours < 0) {
        adjustedHours += 24;
      }

      // Ensure valid time format
      const validHours = Math.max(0, Math.min(23, adjustedHours));
      const validMinutes = Math.max(0, Math.min(59, adjustedMinutes));

      adjustedTimes[prayer] =
        `${validHours.toString().padStart(2, '0')}:${validMinutes.toString().padStart(2, '0')}`;
    });

    console.log('Clock - Base prayer times:', baseTimes);
    console.log('Clock - Timing preferences:', timingPrefs);
    console.log('Clock - Adjusted prayer times:', adjustedTimes);

    return adjustedTimes;
  }, [getCurrentPrayerTimes, user?.preferences?.prayerTiming]);

  // Memoize the update function with all its dependencies
  const updateClock = useCallback(() => {
    const now = new Date();
    const daysFull = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setDisplayTime(currentTime);
    setDayName(daysFull[now.getDay()]);

    // Scheduling moved to a dedicated effect to avoid duplicate timers each second

    // Get current prayer times with dynamic Maghrib
    const effectivePrayerTimes = getCurrentPrayerTimes();

    // Restrict to known prayers only; ignore any extra fields
    const orderedPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    // Next prayer calculation (sort by time for robustness)
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const isFriday = now.getDay() === 5;
    const mapEntries = orderedPrayers.map((name) => {
      const time = effectivePrayerTimes[name];
      // On Friday, show Juma at 13:10 instead of Dhuhr
      if (isFriday && name === 'Dhuhr') {
        const h = 13,
          m = 10;
        return { name: 'Juma', time: '13:10', minutes: h * 60 + m };
      }

      // Validate time format before parsing
      if (!time || typeof time !== 'string' || !time.includes(':')) {
        console.warn(`Clock - Invalid time format for ${name}:`, time);
        return { name, time: '00:00', minutes: 0 };
      }

      const [h, m] = String(time).split(':').map(Number);

      // Validate parsed hours and minutes
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        console.warn(
          `Clock - Invalid time values for ${name}: hours=${h}, minutes=${m}`,
        );
        return { name, time: '00:00', minutes: 0 };
      }

      return { name, time, minutes: h * 60 + m };
    });
    const prayerEntries = mapEntries.sort((a, b) => a.minutes - b.minutes);

    const next =
      prayerEntries.find((p) => p.minutes > currentTimeInMinutes) ||
      prayerEntries[0];
    if (next) {
      const diff = next.minutes - currentTimeInMinutes;
      const diffHours = Math.floor(diff / 60);
      const diffMins = diff % 60;
      const format12 = (hhmm) => {
        const [H, M] = String(hhmm).split(':').map(Number);
        const hour12 = H % 12 || 12;
        const ampm = H >= 12 ? 'p.m' : 'a.m';
        return `${hour12}:${pad(M)} ${ampm}`;
      };

      setDisplayNextPrayer(
        `Next: ${next.name} @ ${format12(next.time)} ${
          diff > 0
            ? `(${diffHours > 0 ? `${diffHours}h ` : ''}${diffMins}m)`
            : ''
        }`.trim(),
      );
    }
  }, [
    getCurrentPrayerTimes,
    getAdjustedPrayerTimes,
    pad,
    schedulePrayerNotifications,
    user?.preferences?.notifications,
  ]);

  // Fetch sunset time when component mounts and date changes
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    fetchSunsetForDate(today);
  }, [fetchSunsetForDate]);

  // Check for daily date change and update Maghrib time
  useEffect(() => {
    const checkDailyUpdate = () => {
      const now = new Date();
      const currentDate = now.toDateString();

      // Always update Maghrib time (no localStorage needed)
      console.log(`📅 Clock - Date: ${currentDate}, updating Maghrib time...`);

      // Fetch new Maghrib time
      const fetchMaghribTime = async () => {
        try {
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          const sunset = await fetchSunsetTime(today, 28.7774, 78.0603);
          setSunsetTime(sunset);
          console.log(`🌅 Clock - Daily update: Maghrib set to ${sunset}`);
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
          setSunsetTime(fallbackSunset);
          console.log(
            `🌅 Clock - Daily fallback: Maghrib set to ${fallbackSunset}`,
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
  }, []);

  // Set up the interval for the clock
  useEffect(() => {
    const timer = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(timer);
  }, [updateClock]);

  // Schedule notifications only when times or prefs change (not every second)
  useEffect(() => {
    if (!user?.preferences?.notifications?.prayer) return;
    if (!schedulePrayerNotifications) return;

    const adjustedPrayerTimes = getAdjustedPrayerTimes();
    console.log('Clock - Scheduling (effect) for:', adjustedPrayerTimes);
    schedulePrayerNotifications(
      adjustedPrayerTimes,
      user.preferences.notifications,
    );
  }, [
    getAdjustedPrayerTimes,
    schedulePrayerNotifications,
    user?.preferences?.notifications,
  ]);

  return (
    <div className='clock-container'>
      <div className='time'>
        <FaClock /> <span className='clock-time'>{displayTime}</span>{' '}
        <span className='clock-day'>{dayName}</span>
      </div>
      <div className='prayer-time'>
        <FaPray /> {displayNextPrayer}
      </div>
    </div>
  );
};

export default Clock;
