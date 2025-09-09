import React, { useState, useEffect } from 'react';

const UserProfile = ({ user, onUpdatePreferences, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const defaultPrefs = {
      notifications: {
        prayer: true,
        jamaat: true,
        info: true,
        clearAll: false,
        admin: false,
      },
      prayerTiming: {
        Fajr: 5,
        Dhuhr: 5,
        Asr: 5,
        Maghrib: 5,
        Isha: 5,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '06:00',
      },
    };

    // Merge with user preferences if they exist
    if (user?.preferences) {
      return {
        ...defaultPrefs,
        ...user.preferences,
        notifications: {
          ...defaultPrefs.notifications,
          ...user.preferences.notifications,
        },
        prayerTiming: {
          ...defaultPrefs.prayerTiming,
          ...user.preferences.prayerTiming,
        },
        quietHours: {
          ...defaultPrefs.quietHours,
          ...user.preferences.quietHours,
        },
      };
    }

    return defaultPrefs;
  });

  const handlePreferenceChange = (category, key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    // Create a clean payload with only the fields that backend expects
    const payload = {
      preferences: {
        notifications: preferences.notifications || {},
        prayerTiming: preferences.prayerTiming || {},
        quietHours: preferences.quietHours || {},
        theme: preferences.theme || 'light',
        language: preferences.language || 'en',
      },
    };

    console.log('=== USERPROFILE SAVE DEBUG ===');
    console.log('UserProfile - Fajr timing:', preferences.prayerTiming?.Fajr);
    console.log('UserProfile - Dhuhr timing:', preferences.prayerTiming?.Dhuhr);
    console.log('UserProfile - Asr timing:', preferences.prayerTiming?.Asr);
    console.log(
      'UserProfile - Maghrib timing:',
      preferences.prayerTiming?.Maghrib,
    );
    console.log('UserProfile - Isha timing:', preferences.prayerTiming?.Isha);
    console.log(
      'UserProfile - Full prayer timing object:',
      preferences.prayerTiming,
    );
    console.log('UserProfile - Clean payload:', payload);
    console.log(
      'UserProfile - Payload JSON:',
      JSON.stringify(payload, null, 2),
    );
    console.log('=== END USERPROFILE DEBUG ===');
    onUpdatePreferences(payload, 'user_profile');
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (user?.preferences) {
      const defaultPrefs = {
        notifications: {
          prayer: true,
          jamaat: true,
          info: true,
          clearAll: false,
          admin: false,
        },
        prayerTiming: {
          Fajr: 5,
          Dhuhr: 5,
          Asr: 5,
          Maghrib: 5,
          Isha: 5,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
        },
      };

      const updatedPrefs = {
        ...defaultPrefs,
        ...user.preferences,
        notifications: {
          ...defaultPrefs.notifications,
          ...user.preferences.notifications,
        },
        prayerTiming: {
          ...defaultPrefs.prayerTiming,
          ...user.preferences.prayerTiming,
        },
        quietHours: {
          ...defaultPrefs.quietHours,
          ...user.preferences.quietHours,
        },
      };

      setPreferences(updatedPrefs);
    }
    setIsEditing(false);
  };

  // Update preferences when user data changes (but not during editing)
  useEffect(() => {
    if (user?.preferences && !isEditing) {
      const defaultPrefs = {
        notifications: {
          prayer: true,
          jamaat: true,
          info: true,
          clearAll: false,
          admin: false,
        },
        prayerTiming: {
          Fajr: 5,
          Dhuhr: 5,
          Asr: 5,
          Maghrib: 5,
          Isha: 5,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
        },
      };

      const updatedPrefs = {
        ...defaultPrefs,
        ...user.preferences,
        notifications: {
          ...defaultPrefs.notifications,
          ...user.preferences.notifications,
        },
        prayerTiming: {
          ...defaultPrefs.prayerTiming,
          ...user.preferences.prayerTiming,
        },
        quietHours: {
          ...defaultPrefs.quietHours,
          ...user.preferences.quietHours,
        },
      };

      console.log(
        'UserProfile - Updating preferences from user data:',
        updatedPrefs,
      );
      setPreferences(updatedPrefs);
    }
  }, [user?.preferences, isEditing]);

  if (!user) {
    return (
      <div className='user-profile'>
        <p>No user logged in</p>
        <button onClick={onLogout}>Go to Login</button>
      </div>
    );
  }

  // Debug user object and preferences
  console.log('UserProfile - User object:', user);
  console.log('UserProfile - Current preferences state:', preferences);
  console.log('UserProfile - User preferences:', user?.preferences);

  return (
    <div className='user-profile-form'>
      {/* User Info Card */}
      <div className='user-info-card'>
        <div className='user-avatar'>
          <span className='avatar-text'>
            {(user.name || user.username || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className='user-details'>
          <h3 className='user-name'>{user.name || user.username || 'User'}</h3>
          <p className='user-mobile'>
            {user.mobile || user.phone || user.email || 'No contact info'}
          </p>
          <span className={`role-badge ${user.role || 'user'}`}>
            {user.role === 'admin'
              ? '👑 Admin'
              : user.role === 'guest'
                ? '👤 Guest'
                : '👤 User'}
          </span>
        </div>
        <div className='user-actions'>
          <button
            className={`action-btn ${isEditing ? 'cancel-btn' : 'edit-btn'}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '❌ Cancel' : '✏️ Edit Preferences'}
          </button>
          <button className='logout-btn' onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className='preferences-form'>
          <div className='form-section'>
            <h4 className='section-title'>📢 Notification Preferences</h4>

            <div className='checkbox-group'>
              <label className='checkbox-item'>
                <input
                  type='checkbox'
                  checked={preferences.notifications?.prayer || false}
                  onChange={(e) =>
                    handlePreferenceChange(
                      'notifications',
                      'prayer',
                      e.target.checked,
                    )
                  }
                />
                <span className='checkmark'></span>
                <span className='label-text'>🕌 Prayer Time Notifications</span>
              </label>

              <label className='checkbox-item'>
                <input
                  type='checkbox'
                  checked={preferences.notifications?.jamaat || false}
                  onChange={(e) =>
                    handlePreferenceChange(
                      'notifications',
                      'jamaat',
                      e.target.checked,
                    )
                  }
                />
                <span className='checkmark'></span>
                <span className='label-text'>👥 Jamaat Updates</span>
              </label>

              <label className='checkbox-item'>
                <input
                  type='checkbox'
                  checked={preferences.notifications?.info || false}
                  onChange={(e) =>
                    handlePreferenceChange(
                      'notifications',
                      'info',
                      e.target.checked,
                    )
                  }
                />
                <span className='checkmark'></span>
                <span className='label-text'>📋 Information Updates</span>
              </label>

              <label className='checkbox-item'>
                <input
                  type='checkbox'
                  checked={preferences.notifications?.clearAll || false}
                  onChange={(e) =>
                    handlePreferenceChange(
                      'notifications',
                      'clearAll',
                      e.target.checked,
                    )
                  }
                />
                <span className='checkmark'></span>
                <span className='label-text'>🗑️ Data Clear Notifications</span>
              </label>
            </div>

            {preferences.notifications?.prayer && (
              <div className='timing-section'>
                <h5 className='timing-title'>⏰ Prayer Notification Timing</h5>
                <p className='timing-subtitle'>Minutes before each prayer</p>
                <div className='timing-grid'>
                  <div className='timing-card'>
                    <label className='timing-label'>🌅 Fajr</label>
                    <div className='timing-input-group'>
                      <input
                        type='number'
                        min='1'
                        max='60'
                        value={preferences.prayerTiming?.Fajr || 5}
                        onChange={(e) =>
                          handlePreferenceChange(
                            'prayerTiming',
                            'Fajr',
                            parseInt(e.target.value) || 5,
                          )
                        }
                        className='timing-input'
                      />
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>☀️ Dhuhr/Juma</label>
                    <div className='timing-input-group'>
                      <input
                        type='number'
                        min='1'
                        max='60'
                        value={preferences.prayerTiming?.Dhuhr || 5}
                        onChange={(e) =>
                          handlePreferenceChange(
                            'prayerTiming',
                            'Dhuhr',
                            parseInt(e.target.value) || 5,
                          )
                        }
                        className='timing-input'
                      />
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>🌤️ Asr</label>
                    <div className='timing-input-group'>
                      <input
                        type='number'
                        min='1'
                        max='60'
                        value={preferences.prayerTiming?.Asr || 5}
                        onChange={(e) =>
                          handlePreferenceChange(
                            'prayerTiming',
                            'Asr',
                            parseInt(e.target.value) || 5,
                          )
                        }
                        className='timing-input'
                      />
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>🌆 Maghrib</label>
                    <div className='timing-input-group'>
                      <input
                        type='number'
                        min='1'
                        max='60'
                        value={preferences.prayerTiming?.Maghrib || 5}
                        onChange={(e) =>
                          handlePreferenceChange(
                            'prayerTiming',
                            'Maghrib',
                            parseInt(e.target.value) || 5,
                          )
                        }
                        className='timing-input'
                      />
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>🌙 Isha</label>
                    <div className='timing-input-group'>
                      <input
                        type='number'
                        min='1'
                        max='60'
                        value={preferences.prayerTiming?.Isha || 5}
                        onChange={(e) =>
                          handlePreferenceChange(
                            'prayerTiming',
                            'Isha',
                            parseInt(e.target.value) || 5,
                          )
                        }
                        className='timing-input'
                      />
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className='quiet-section'>
              <h5 className='section-title'>🔇 Quiet Hours</h5>
              <label className='checkbox-item'>
                <input
                  type='checkbox'
                  checked={preferences.quietHours?.enabled || false}
                  onChange={(e) =>
                    handlePreferenceChange(
                      'quietHours',
                      'enabled',
                      e.target.checked,
                    )
                  }
                />
                <span className='checkmark'></span>
                <span className='label-text'>Enable Quiet Hours</span>
              </label>

              {preferences.quietHours?.enabled && (
                <div className='quiet-time-inputs'>
                  <div className='time-input-group'>
                    <label>From:</label>
                    <input
                      type='time'
                      value={preferences.quietHours?.start || '22:00'}
                      onChange={(e) =>
                        handlePreferenceChange(
                          'quietHours',
                          'start',
                          e.target.value,
                        )
                      }
                      className='time-input'
                    />
                  </div>
                  <div className='time-input-group'>
                    <label>To:</label>
                    <input
                      type='time'
                      value={preferences.quietHours?.end || '06:00'}
                      onChange={(e) =>
                        handlePreferenceChange(
                          'quietHours',
                          'end',
                          e.target.value,
                        )
                      }
                      className='time-input'
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='form-actions'>
              <button className='save-btn' onClick={handleSave}>
                💾 Save Preferences
              </button>
              <button className='cancel-btn' onClick={handleCancel}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className='preferences-summary'>
          <h4 className='summary-title'>📊 Current Preferences</h4>

          <div className='summary-grid'>
            <div className='summary-card'>
              <div className='summary-icon'>🕌</div>
              <div className='summary-content'>
                <h5>Prayer Notifications</h5>
                <span
                  className={`status ${preferences.notifications?.prayer ? 'enabled' : 'disabled'}`}
                >
                  {preferences.notifications?.prayer
                    ? '✅ Enabled'
                    : '❌ Disabled'}
                </span>
              </div>
            </div>

            <div className='summary-card'>
              <div className='summary-icon'>👥</div>
              <div className='summary-content'>
                <h5>Jamaat Updates</h5>
                <span
                  className={`status ${preferences.notifications?.jamaat ? 'enabled' : 'disabled'}`}
                >
                  {preferences.notifications?.jamaat
                    ? '✅ Enabled'
                    : '❌ Disabled'}
                </span>
              </div>
            </div>

            <div className='summary-card'>
              <div className='summary-icon'>📋</div>
              <div className='summary-content'>
                <h5>Info Updates</h5>
                <span
                  className={`status ${preferences.notifications?.info ? 'enabled' : 'disabled'}`}
                >
                  {preferences.notifications?.info
                    ? '✅ Enabled'
                    : '❌ Disabled'}
                </span>
              </div>
            </div>

            <div className='summary-card'>
              <div className='summary-icon'>🔇</div>
              <div className='summary-content'>
                <h5>Quiet Hours</h5>
                <span
                  className={`status ${preferences.quietHours?.enabled ? 'enabled' : 'disabled'}`}
                >
                  {preferences.quietHours?.enabled
                    ? '✅ Enabled'
                    : '❌ Disabled'}
                </span>
              </div>
            </div>
          </div>

          {preferences.notifications?.prayer && (
            <div className='timing-summary'>
              <h5 className='timing-summary-title'>⏰ Prayer Timing</h5>
              <div className='timing-summary-grid'>
                <div className='timing-chip'>
                  <span className='timing-icon'>🌅</span>
                  <span className='timing-name'>Fajr</span>
                  <span className='timing-value'>
                    {preferences.prayerTiming?.Fajr || 5}min
                  </span>
                </div>
                <div className='timing-chip'>
                  <span className='timing-icon'>☀️</span>
                  <span className='timing-name'>Dhuhr</span>
                  <span className='timing-value'>
                    {preferences.prayerTiming?.Dhuhr || 5}min
                  </span>
                </div>
                <div className='timing-chip'>
                  <span className='timing-icon'>🌤️</span>
                  <span className='timing-name'>Asr</span>
                  <span className='timing-value'>
                    {preferences.prayerTiming?.Asr || 5}min
                  </span>
                </div>
                <div className='timing-chip'>
                  <span className='timing-icon'>🌆</span>
                  <span className='timing-name'>Maghrib</span>
                  <span className='timing-value'>
                    {preferences.prayerTiming?.Maghrib || 5}min
                  </span>
                </div>
                <div className='timing-chip'>
                  <span className='timing-icon'>🌙</span>
                  <span className='timing-name'>Isha</span>
                  <span className='timing-value'>
                    {preferences.prayerTiming?.Isha || 5}min
                  </span>
                </div>
              </div>
            </div>
          )}

          {preferences.quietHours?.enabled && (
            <div className='quiet-summary'>
              <h5 className='quiet-summary-title'>🔇 Quiet Hours</h5>
              <div className='quiet-time-display'>
                <span className='quiet-time'>
                  {preferences.quietHours.start}
                </span>
                <span className='quiet-separator'>to</span>
                <span className='quiet-time'>{preferences.quietHours.end}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
