import React, { useState, useEffect } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { apiService } from '../services/api';
import { useNotify } from '../context/NotificationContext';

const ResetPassword = ({ token, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { notify } = useNotify();

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setIsLoading(false);
      notify('Invalid or missing reset token', { type: 'error' });
    } else {
      setIsLoading(false);
    }
  }, [token, notify]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      notify('Please fill in all fields', { type: 'error' });
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      notify(passwordError, { type: 'error' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      notify('Passwords do not match', { type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.resetPassword(
        token,
        formData.newPassword,
      );

      if (response.success) {
        notify(
          'Password reset successfully! You can now login with your new password.',
          {
            type: 'success',
          },
        );

        // Clear form
        setFormData({
          newPassword: '',
          confirmPassword: '',
        });

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        notify(
          response.message || 'Failed to reset password. Please try again.',
          {
            type: 'error',
          },
        );
      }
    } catch (error) {
      console.error('Reset password error:', error);
      notify('Failed to reset password. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='reset-password-container'>
        <div className='reset-password-header'>
          <h2>🔄 Validating Reset Token</h2>
          <p className='reset-password-subtitle'>Please wait...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className='reset-password-container'>
        <div className='reset-password-header'>
          <h2>❌ Invalid Reset Link</h2>
          <p className='reset-password-subtitle'>
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className='reset-password-form'>
          <div className='reset-error-message'>
            <p>🔍 Please request a new password reset link.</p>
            <p>💡 The link may have expired or been used already.</p>
          </div>

          <button type='button' className='reset-link-btn' onClick={onBack}>
            <FaArrowLeft /> Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='reset-password-container'>
      <div className='reset-password-header'>
        <h2>🔑 Reset Password</h2>
        <p className='reset-password-subtitle'>Enter your new password below</p>
      </div>

      <form className='reset-password-form' onSubmit={handleSubmit}>
        <div className='reset-input-group'>
          <label htmlFor='newPassword'>
            <FaLock /> New Password
          </label>
          <div className='password-input-wrapper'>
            <input
              type={showPassword ? 'text' : 'password'}
              id='newPassword'
              name='newPassword'
              className='reset-input'
              value={formData.newPassword}
              onChange={handleChange}
              placeholder='Enter new password'
              disabled={isSubmitting}
              autoComplete='new-password'
              required
            />
            <button
              type='button'
              className='password-toggle'
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className='reset-input-group'>
          <label htmlFor='confirmPassword'>
            <FaLock /> Confirm Password
          </label>
          <div className='password-input-wrapper'>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id='confirmPassword'
              name='confirmPassword'
              className='reset-input'
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder='Confirm new password'
              disabled={isSubmitting}
              autoComplete='new-password'
              required
            />
            <button
              type='button'
              className='password-toggle'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type='submit'
          className='reset-submit-btn'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span>🔄 Resetting...</span>
          ) : (
            <span>🔑 Reset Password</span>
          )}
        </button>

        <button
          type='button'
          className='reset-link-btn'
          onClick={onBack}
          disabled={isSubmitting}
        >
          <FaArrowLeft /> Back to Login
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;

// Custom styles for ResetPassword component
const styles = `
  .reset-password-container {
    max-width: 320px;
    width: 90%;
    margin: 0 auto;
    padding: 20px;
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

  .reset-password-container::before {
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

  .reset-password-header {
    text-align: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }

  .reset-password-header h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
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
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    letter-spacing: 0.8px;
  }

  .reset-password-subtitle {
    margin: 0;
    color: #e5e7eb;
    font-size: 14px;
    font-weight: 400;
    opacity: 0.9;
  }

  .reset-password-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    z-index: 1;
  }

  .reset-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .reset-input-group label {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #f3f4f6;
  }

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .reset-input {
    flex: 1;
    padding: 12px 40px 12px 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    font-size: 14px;
    transition: all 0.3s ease;
    backdrop-filter: blur(15px);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .reset-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .reset-input:focus {
    outline: none;
    border-color: #ffffff;
    background: rgba(255, 255, 255, 0.2);
    box-shadow:
      0 0 0 3px rgba(255, 255, 255, 0.4),
      0 2px 8px rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .password-toggle:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }

  .reset-submit-btn {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    color: #059669;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 8px;
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.4);
    letter-spacing: 0.5px;
  }

  .reset-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 6px 15px rgba(255, 255, 255, 0.5),
      0 2px 8px rgba(5, 150, 105, 0.3);
    background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  }

  .reset-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .reset-link-btn {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: white;
    padding: 10px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    backdrop-filter: blur(15px);
    box-shadow: 0 1px 4px rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .reset-link-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow:
      0 2px 6px rgba(255, 255, 255, 0.25),
      0 1px 3px rgba(5, 150, 105, 0.15);
  }

  .reset-error-message {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    text-align: center;
  }

  .reset-error-message p {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #fecaca;
    font-weight: 500;
  }

  .reset-error-message p:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    .reset-password-container {
      max-width: 280px;
      width: 85%;
      margin: 10px auto;
      padding: 16px;
      border-radius: 16px;
    }

    .reset-password-header h2 {
      font-size: 20px;
      margin-bottom: 6px;
    }

    .reset-password-subtitle {
      font-size: 12px;
    }

    .reset-password-form {
      gap: 12px;
    }

    .reset-input-group {
      gap: 4px;
    }

    .reset-input-group label {
      font-size: 12px;
      gap: 4px;
    }

    .reset-input {
      padding: 10px 36px 10px 10px;
      font-size: 12px;
      border-radius: 8px;
    }

    .reset-submit-btn {
      padding: 10px 16px;
      font-size: 12px;
      border-radius: 10px;
      margin-top: 6px;
    }

    .reset-link-btn {
      padding: 8px 12px;
      font-size: 12px;
      border-radius: 8px;
      gap: 6px;
    }

    .reset-error-message {
      padding: 10px;
      margin-bottom: 12px;
    }

    .reset-error-message p {
      font-size: 10px;
    }
  }
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);
