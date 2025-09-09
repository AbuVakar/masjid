import React, { useState, useCallback, useEffect } from 'react';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaMobile,
  FaEnvelope,
} from 'react-icons/fa';
import { useNotify } from '../context/NotificationContext';
import {
  validateLoginCredentials,
  validateRegistrationData,
} from '../utils/validation';
import {
  logError,
  measurePerformance,
  ERROR_SEVERITY,
} from '../utils/errorHandler';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

// Demo user credentials for testing (removed for security)

// Admin credentials with proper password format (for reference)
// const ADMIN_CREDENTIALS = {
//   username: 'admin',
//   password: 'admin123',
//   mobile: '9876543210',
//   email: 'bakrabu786@gmail.com'
// };

const UserAuth = ({ onLogin, onRegister, onGuestMode, loading = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotify();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    email: '',
  });

  // Clear form data when component mounts and when switching modes
  useEffect(() => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      mobile: '',
      email: '',
    });
    setErrors({});
    // Ensure password is hidden
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isLogin]);

  // Clear form on mount and ensure password is hidden
  useEffect(() => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      mobile: '',
      email: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  // Clear errors when switching modes
  useEffect(() => {
    setErrors({});
  }, [isLogin]);

  // Check for reset token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token =
      urlParams.get('token') ||
      window.location.pathname.split('/reset-password/')[1];

    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle input changes with validation
  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field-specific error
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [errors],
  );

  // Validate form data
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (isLogin) {
      const validation = validateLoginCredentials(formData);
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          if (error.includes('Username')) newErrors.username = error;
          if (error.includes('Password')) newErrors.password = error;
        });
      }
    } else {
      const validation = validateRegistrationData(formData);
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          if (error.includes('Username')) newErrors.username = error;
          if (error.includes('Password')) newErrors.password = error;
          if (error.includes('confirm')) newErrors.confirmPassword = error;
          if (error.includes('Mobile')) newErrors.mobile = error;
          if (error.includes('Email')) newErrors.email = error;
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [isLogin, formData]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract only login credentials from formData
      const loginCredentials = {
        username: formData.username,
        password: formData.password,
      };

      await onLogin(loginCredentials);
    } catch (error) {
      console.error('Login error:', error);
      notify('Login failed. Please try again.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, notify, onLogin, isLogin]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      // Extract only registration data from formData
      const registrationData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        mobile: formData.mobile,
        name: formData.username, // Use username as name if not provided
      };

      await onRegister(registrationData);
      setIsLogin(true);
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        mobile: '',
      });
    } catch (error) {
      console.error('Registration error:', error);
      notify('Registration failed. Please try again.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, notify, onRegister]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (isLogin) {
        handleLogin();
      } else {
        handleRegister();
      }
    },
    [isLogin, handleLogin, handleRegister],
  );

  // Handle guest mode
  const handleGuestMode = useCallback(async () => {
    try {
      await measurePerformance('Guest Mode Access', async () => {
        await onGuestMode();
      });
      // Notification is handled in App.js - no need for duplicate
    } catch (error) {
      logError(error, 'Guest Mode', ERROR_SEVERITY.MEDIUM);
      notify('Failed to enter guest mode', { type: 'error' });
    }
  }, [onGuestMode, notify]);

  // Get input class name based on validation state
  const getInputClassName = useCallback(
    (field) => {
      const baseClass = 'auth-input';
      if (errors[field]) return `${baseClass} error`;
      if (formData[field]) return `${baseClass} valid`;
      return baseClass;
    },
    [errors, formData],
  );

  // Show reset password component if needed
  if (showResetPassword) {
    return (
      <ResetPassword
        token={resetToken}
        onBack={() => {
          setShowResetPassword(false);
          setResetToken(null);
          setIsLogin(true);
        }}
        onSuccess={() => {
          setShowResetPassword(false);
          setResetToken(null);
          setIsLogin(true);
        }}
      />
    );
  }

  // Show forgot password component if needed
  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBack={() => setShowForgotPassword(false)}
        onResetPassword={() => {
          setShowForgotPassword(false);
          setIsLogin(true);
        }}
      />
    );
  }

  return (
    <div className='auth-container'>
      <div className='auth-header'>
        <h2>🕌 Silsila-ul-Ahwaal</h2>
        <p className='auth-subtitle'>
          {isLogin
            ? 'Welcome back! Please sign in to continue.'
            : 'Create your account to get started.'}
        </p>
      </div>

      <form className='auth-form' onSubmit={handleSubmit}>
        {/* Username Field */}
        <div className='input-group'>
          <label htmlFor='username'>
            <FaUser /> Username <span className='required-asterisk'>*</span>
          </label>
          <input
            type='text'
            id='username'
            className={getInputClassName('username')}
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder='Enter your username'
            disabled={isSubmitting || loading}
            autoComplete='username'
            required
          />
          {errors.username && (
            <div className='error-message'>{errors.username}</div>
          )}
        </div>

        {/* Password Field */}
        <div className='input-group'>
          <label htmlFor='password'>
            <FaLock /> Password <span className='required-asterisk'>*</span>
          </label>
          <div className='password-input-container'>
            <input
              type={showPassword ? 'text' : 'password'}
              id='password'
              className={getInputClassName('password')}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder='Enter your password'
              disabled={isSubmitting || loading}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
            <button
              type='button'
              className='password-toggle'
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting || loading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {errors.password && (
            <div className='error-message'>{errors.password}</div>
          )}
        </div>

        {/* Registration Fields - Compact Layout */}
        {!isLogin && (
          <div className='registration-fields'>
            {/* Confirm Password Field */}
            <div className='input-group'>
              <label htmlFor='confirmPassword'>
                <FaLock /> Confirm Password{' '}
                <span className='required-asterisk'>*</span>
              </label>
              <div className='password-input-container'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id='confirmPassword'
                  className={getInputClassName('confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  placeholder='Confirm your password'
                  disabled={isSubmitting || loading}
                  autoComplete='new-password'
                  required
                />
                <button
                  type='button'
                  className='password-toggle'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting || loading}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className='error-message'>{errors.confirmPassword}</div>
              )}
            </div>

            {/* Mobile and Email in Row */}
            <div className='input-row'>
              <div className='input-group'>
                <label htmlFor='mobile'>
                  <FaMobile /> Mobile{' '}
                  <span className='optional-text'>(optional)</span>
                </label>
                <input
                  type='tel'
                  id='mobile'
                  className={getInputClassName('mobile')}
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder='Mobile number'
                  disabled={isSubmitting || loading}
                  autoComplete='tel'
                />
                {errors.mobile && (
                  <div className='error-message'>{errors.mobile}</div>
                )}
              </div>

              <div className='input-group'>
                <label htmlFor='email'>
                  <FaEnvelope /> Email{' '}
                  <span className='required-asterisk'>*</span>
                </label>
                <input
                  type='email'
                  id='email'
                  className={getInputClassName('email')}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder='Email address'
                  disabled={isSubmitting || loading}
                  autoComplete='email'
                  required
                />
                {errors.email && (
                  <div className='error-message'>{errors.email}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type='submit'
          className='auth-submit-btn'
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? (
            <span>🔄 {isLogin ? 'Signing In...' : 'Creating Account...'}</span>
          ) : (
            <span>{isLogin ? '🔐 Sign In' : '📝 Create Account'}</span>
          )}
        </button>

        {/* Forgot Password Link (Login mode only) */}
        {isLogin && (
          <div className='auth-links'>
            <button
              type='button'
              className='forgot-password-link'
              onClick={() => setShowForgotPassword(true)}
            >
              🔑 Forgot Password?
            </button>
          </div>
        )}
      </form>

      {/* Mode Toggle */}
      <div className='auth-mode-toggle'>
        <button
          type='button'
          className='mode-toggle-btn'
          onClick={() => setIsLogin(!isLogin)}
          disabled={isSubmitting || loading}
        >
          {isLogin
            ? '📝 Need an account? Sign up'
            : '🔐 Already have an account? Sign in'}
        </button>
      </div>

      {/* Guest Mode */}
      <div className='auth-guest-section'>
        <button
          type='button'
          className='guest-mode-btn'
          onClick={handleGuestMode}
          disabled={isSubmitting || loading}
        >
          👤 Continue as Guest
        </button>
      </div>

      <style>{`
        .auth-container {
          max-width: 450px;
          width: 90%;
          margin: 0 auto;
          padding: 12px;
          background: linear-gradient(
            135deg,
            #047857 0%,
            #059669 20%,
            #10b981 40%,
            #34d399 60%,
            #6ee7b7 80%,
            #a7f3d0 100%
          );
          border-radius: 20px;
          box-shadow:
            0 20px 40px rgba(5, 150, 105, 0.5),
            0 8px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          color: #ffffff;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .auth-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.2) 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.1) 60%,
            transparent 80%,
            rgba(255, 255, 255, 0.15) 100%
          );
          pointer-events: none;
        }

        .auth-container::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 70%
          );
          animation: shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes shimmer {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
        }

        .auth-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .auth-header h2 {
          margin: 0 0 4px 0;
          font-size: 26px;
          font-weight: 800;
          background: linear-gradient(
            135deg,
            #fbbf24 0%,
            #f59e0b 25%,
            #d97706 50%,
            #b45309 75%,
            #92400e 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 3px 6px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 1;
          letter-spacing: 1px;
          text-align: center;
        }

        .auth-subtitle {
          margin: 0;
          color: #000000;
          font-size: 12px;
          font-weight: 600;
          opacity: 1;
          text-shadow: none;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .input-group label {
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 3px;
          color: #f3f4f6;
        }

        .required-asterisk {
          color: #ef4444;
          font-weight: bold;
          font-size: 12px;
        }

        .optional-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 9px;
          font-weight: 400;
          font-style: italic;
        }

        .auth-input {
          padding: 6px 10px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          font-size: 12px;
          transition: all 0.3s ease;
          backdrop-filter: blur(15px);
          position: relative;
          z-index: 1;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .password-input-container .auth-input {
          padding-right: 30px; /* Make space for eye icon */
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .auth-input:focus {
          outline: none;
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.2);
          box-shadow:
            0 0 0 3px rgba(255, 255, 255, 0.4),
            0 2px 8px rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .auth-input.error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .auth-input.valid {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .password-input-container {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(128, 128, 128, 0.1);
          border: 1px solid rgba(128, 128, 128, 0.3);
          color: #808080;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.3s ease;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          opacity: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(5px);
        }

        .password-toggle:hover {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.2);
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
        }

        .password-toggle:active {
          transform: translateY(-50%) scale(0.95);
        }

        .error-message {
          color: #ef4444;
          font-size: 9px;
          margin-top: 1px;
          font-weight: 500;
        }

        .registration-fields {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .auth-submit-btn {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          color: #059669;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 4px;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.4);
          position: relative;
          z-index: 1;
          letter-spacing: 0.5px;
        }

        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 6px 15px rgba(255, 255, 255, 0.5),
            0 2px 8px rgba(5, 150, 105, 0.3);
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
        }

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .auth-links {
          text-align: center;
          margin-top: 10px;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: underline;
          cursor: pointer;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .forgot-password-link:hover {
          color: white;
        }

        .auth-mode-toggle {
          margin-top: 12px;
          text-align: center;
        }

        .mode-toggle-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(15px);
          box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
        }

        .mode-toggle-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow:
            0 2px 8px rgba(255, 255, 255, 0.3),
            0 1px 4px rgba(5, 150, 105, 0.2);
        }

        .auth-guest-section {
          margin-top: 10px;
          text-align: center;
        }

        .guest-mode-btn {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(15px);
          box-shadow: 0 1px 4px rgba(255, 255, 255, 0.15);
        }

        .guest-mode-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
          box-shadow:
            0 2px 6px rgba(255, 255, 255, 0.25),
            0 1px 3px rgba(5, 150, 105, 0.15);
        }

        @media (max-width: 768px) {
          .auth-container {
            max-width: 400px;
            width: 90%;
            margin: 8px auto;
            padding: 10px;
            border-radius: 16px;
          }

          .auth-header h2 {
            font-size: 22px;
          }

          .auth-subtitle {
            font-size: 11px;
            color: #000000;
            opacity: 1;
            text-shadow: none;
            font-weight: 600;
          }

          .input-group label {
            font-size: 10px;
          }

          .auth-input {
            padding: 5px 8px;
            font-size: 11px;
          }

          .password-input-container .auth-input {
            padding-right: 25px; /* Make space for eye icon on mobile */
          }

          .password-toggle {
            right: 6px;
            font-size: 10px;
            padding: 3px;
            color: #808080;
            opacity: 1;
            background: rgba(128, 128, 128, 0.1);
            border: 1px solid rgba(128, 128, 128, 0.3);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }

          .password-toggle:hover {
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.2);
            opacity: 1;
            transform: translateY(-50%) scale(1.1);
          }
        }

        @media (max-width: 480px) {
          .auth-container {
            max-width: 320px;
            width: 85%;
            margin: 10px auto;
            padding: 6px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(5, 150, 105, 0.6);
            background: linear-gradient(
              135deg,
              #059669 0%,
              #10b981 30%,
              #34d399 60%,
              #6ee7b7 85%,
              #a7f3d0 100%
            );
          }

          .auth-header {
            margin-bottom: 4px;
          }

          .auth-header h2 {
            font-size: 19px;
            margin-bottom: 1px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          }

          .auth-subtitle {
            font-size: 9px;
            color: #000000;
            opacity: 1;
            margin-bottom: 2px;
            text-shadow: none;
            font-weight: 600;
          }

          .auth-form {
            gap: 2px;
          }

          .input-group {
            gap: 0px;
          }

          .input-group label {
            font-size: 8px;
            gap: 0px;
            font-weight: 500;
            margin-bottom: 1px;
          }

          .required-asterisk {
            font-size: 10px;
          }

          .optional-text {
            font-size: 7px;
          }

          .auth-input {
            padding: 3px 5px;
            font-size: 9px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
          }

          .password-input-container .auth-input {
            padding-right: 20px; /* Make space for eye icon on smallest screens */
          }

          .password-toggle {
            right: 4px;
            font-size: 8px;
            padding: 2px;
            color: #808080;
            opacity: 1;
            background: rgba(128, 128, 128, 0.1);
            border: 1px solid rgba(128, 128, 128, 0.3);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }

          .password-toggle:hover {
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.2);
            opacity: 1;
            transform: translateY(-50%) scale(1.1);
          }

          .auth-input:focus {
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.25);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
          }

          .auth-submit-btn {
            padding: 4px 8px;
            font-size: 10px;
            border-radius: 5px;
            margin-top: 2px;
            font-weight: 600;
            letter-spacing: 0.5px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            color: #059669;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .auth-submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.6);
          }

          .mode-toggle-btn {
            padding: 4px 8px;
            font-size: 10px;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
          }

          .guest-mode-btn {
            padding: 3px 8px;
            font-size: 9px;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
          }

          .input-row {
            grid-template-columns: 1fr;
            gap: 2px;
          }

          .password-toggle {
            right: 3px;
            font-size: 8px;
            color: rgba(255, 255, 255, 0.8);
          }

          .error-message {
            font-size: 6px;
            margin-top: 0px;
            color: #fecaca;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }

          .auth-container::before {
            background: linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.2) 0%,
              transparent 50%,
              rgba(255, 255, 255, 0.1) 100%
            );
          }

          .auth-container::after {
            background: radial-gradient(
              circle,
              rgba(255, 255, 255, 0.15) 0%,
              transparent 60%
            );
            animation: shimmer 4s ease-in-out infinite;
          }
        }
      `}</style>
    </div>
  );
};

export default UserAuth;
