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
                    <div className='timing-picker-group'>
                      <div className='timing-picker'>
                        <button
                          type='button'
                          className='timing-btn timing-btn-up'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Fajr',
                              Math.min(
                                (preferences.prayerTiming?.Fajr || 5) + 1,
                                60,
                              ),
                            )
                          }
                        >
                          ▶
                        </button>
                        <div className='timing-display'>
                          {preferences.prayerTiming?.Fajr || 5}
                        </div>
                        <button
                          type='button'
                          className='timing-btn timing-btn-down'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Fajr',
                              Math.max(
                                (preferences.prayerTiming?.Fajr || 5) - 1,
                                1,
                              ),
                            )
                          }
                        >
                          ◀
                        </button>
                      </div>
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>☀️ Dhuhr/Juma</label>
                    <div className='timing-picker-group'>
                      <div className='timing-picker'>
                        <button
                          type='button'
                          className='timing-btn timing-btn-up'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Dhuhr',
                              Math.min(
                                (preferences.prayerTiming?.Dhuhr || 5) + 1,
                                60,
                              ),
                            )
                          }
                        >
                          ▶
                        </button>
                        <div className='timing-display'>
                          {preferences.prayerTiming?.Dhuhr || 5}
                        </div>
                        <button
                          type='button'
                          className='timing-btn timing-btn-down'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Dhuhr',
                              Math.max(
                                (preferences.prayerTiming?.Dhuhr || 5) - 1,
                                1,
                              ),
                            )
                          }
                        >
                          ◀
                        </button>
                      </div>
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>🌤️ Asr</label>
                    <div className='timing-picker-group'>
                      <div className='timing-picker'>
                        <button
                          type='button'
                          className='timing-btn timing-btn-up'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Asr',
                              Math.min(
                                (preferences.prayerTiming?.Asr || 5) + 1,
                                60,
                              ),
                            )
                          }
                        >
                          ▶
                        </button>
                        <div className='timing-display'>
                          {preferences.prayerTiming?.Asr || 5}
                        </div>
                        <button
                          type='button'
                          className='timing-btn timing-btn-down'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Asr',
                              Math.max(
                                (preferences.prayerTiming?.Asr || 5) - 1,
                                1,
                              ),
                            )
                          }
                        >
                          ◀
                        </button>
                      </div>
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>🌆 Maghrib</label>
                    <div className='timing-picker-group'>
                      <div className='timing-picker'>
                        <button
                          type='button'
                          className='timing-btn timing-btn-up'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Maghrib',
                              Math.min(
                                (preferences.prayerTiming?.Maghrib || 5) + 1,
                                60,
                              ),
                            )
                          }
                        >
                          ▶
                        </button>
                        <div className='timing-display'>
                          {preferences.prayerTiming?.Maghrib || 5}
                        </div>
                        <button
                          type='button'
                          className='timing-btn timing-btn-down'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Maghrib',
                              Math.max(
                                (preferences.prayerTiming?.Maghrib || 5) - 1,
                                1,
                              ),
                            )
                          }
                        >
                          ◀
                        </button>
                      </div>
                      <span className='timing-unit'>min</span>
                    </div>
                  </div>
                  <div className='timing-card'>
                    <label className='timing-label'>🌙 Isha</label>
                    <div className='timing-picker-group'>
                      <div className='timing-picker'>
                        <button
                          type='button'
                          className='timing-btn timing-btn-up'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Isha',
                              Math.min(
                                (preferences.prayerTiming?.Isha || 5) + 1,
                                60,
                              ),
                            )
                          }
                        >
                          ▶
                        </button>
                        <div className='timing-display'>
                          {preferences.prayerTiming?.Isha || 5}
                        </div>
                        <button
                          type='button'
                          className='timing-btn timing-btn-down'
                          onClick={() =>
                            handlePreferenceChange(
                              'prayerTiming',
                              'Isha',
                              Math.max(
                                (preferences.prayerTiming?.Isha || 5) - 1,
                                1,
                              ),
                            )
                          }
                        >
                          ◀
                        </button>
                      </div>
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
      <style>{`
        .user-profile-form {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px;
          box-sizing: border-box;
        }

        .user-info-card {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          align-items: center;
          gap: 16px;
          background: #0f172a;
          border: 1px solid #1f2937;
          border-radius: 12px;
          padding: 16px;
          color: #e5e7eb;
          backdrop-filter: blur(8px);
          margin-bottom: 16px;
        }

        .user-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .avatar-text { font-weight: 800; font-size: 20px; color: #fff; }

        .user-details { min-width: 0; }
        .user-name { margin: 0 0 4px 0; font-size: 18px; color: #fff; }
        .user-mobile { margin: 0; opacity: 0.85; font-size: 14px; }

        .role-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid #1f2937;
          background: #111827;
          color: #e5e7eb;
        }

        .user-actions { display: flex; gap: 10px; align-items: center; }

        .action-btn {
          border: 0;
          padding: 10px 14px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .edit-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }

        .cancel-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }

        .logout-btn {
          background: #111827;
          color: #e5e7eb;
          border: 1px solid #1f2937;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
        }

        .action-btn:hover { transform: translateY(-1px); }
        .logout-btn:hover { transform: translateY(-1px); }

        .preferences-form, .preferences-summary {
          background: #0b1220;
          border: 1px solid #1f2937;
          border-radius: 12px;
          padding: 16px;
          color: #e5e7eb;
        }

        .form-section { display: flex; flex-direction: column; gap: 16px; }
        .section-title { margin: 0; font-size: 16px; color: #00d4ff; }

        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }

        .checkbox-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #0b1324;
          border: 1px solid #1f2937;
        }
        .checkbox-item input { accent-color: #3b82f6; }
        .label-text { color: #e5e7eb; }

        .checkmark { width: 14px; height: 14px; display: inline-block; }
        .label-text { font-size: 14px; }

        .timing-section { margin-top: 4px; }
        .timing-title { margin: 0 0 4px 0; font-size: 15px; color: #93c5fd; }
        .timing-subtitle { margin: 0 0 10px 0; opacity: 0.85; font-size: 12px; }

        .timing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .timing-card { background: #0b1324; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; }
        .timing-label { display: block; margin-bottom: 6px; font-size: 14px; opacity: 1; color: #ffffff; font-weight: 900; text-shadow: 0 0 6px rgba(255, 255, 255, 1); visibility: visible; -webkit-text-stroke: 0.5px rgba(255, 255, 255, 0.8); }
        .timing-input-group { display: flex; align-items: center; gap: 8px; }
        .timing-input {
          width: 72px;
          background: #0b1324;
          border: 1px solid #334155;
          color: #e5e7eb;
          padding: 8px 10px;
          border-radius: 8px;
        }
        .timing-input:focus { outline: 2px solid rgba(59,130,246,0.6); outline-offset: 1px; }
        .timing-unit { opacity: 0.85; font-size: 13px; }

        .quiet-section { margin-top: 2px; }
        .quiet-time-inputs { display: flex; gap: 12px; margin-top: 8px; }
        .time-input-group { display: flex; align-items: center; gap: 8px; }
        .time-input {
          background: #0b1324;
          border: 1px solid #334155;
          color: #e5e7eb;
          padding: 8px 10px;
          border-radius: 8px;
        }
        .time-input:focus { outline: 2px solid rgba(59,130,246,0.6); outline-offset: 1px; }

        .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
        .save-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          border: 0;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        .preferences-summary { margin-top: 10px; }
        .summary-title { margin: 0 0 10px 0; color: #00d4ff; font-size: 16px; }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .summary-card { display: flex; align-items: center; gap: 10px; background: #0b1324; border: 1px solid #1f2937; border-radius: 10px; padding: 12px; }
        .summary-icon { font-size: 18px; }
        .summary-content h5 { margin: 0 0 4px 0; font-size: 14px; color: #e5e7eb; }
        .status.enabled { color: #34d399; }
        .status.disabled { color: #fca5a5; }

        .timing-summary { margin-top: 12px; }
        .timing-summary-title { margin: 0 0 8px 0; font-size: 15px; color: #93c5fd; }
        .timing-summary-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .timing-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #111827; border: 1px solid #1f2937; }
        .timing-name { font-size: 13px; opacity: 0.95; }
        .timing-value { font-size: 12px; opacity: 0.9; }

        .quiet-summary { margin-top: 12px; }
        .quiet-summary-title { margin: 0 0 8px 0; font-size: 15px; color: #93c5fd; }
        .quiet-time-display { display: inline-flex; align-items: center; gap: 8px; background: #111827; border: 1px solid #1f2937; padding: 6px 10px; border-radius: 999px; }
        .quiet-time { font-size: 13px; }
        .quiet-separator { opacity: 0.8; font-size: 12px; }

        @media (max-width: 640px) {
          .user-info-card { grid-template-columns: 64px 1fr; grid-auto-rows: auto; }
          .user-actions { grid-column: 1 / -1; justify-content: flex-end; }
        }
      `}</style>
    </div>
  );
};

export default UserProfile;
