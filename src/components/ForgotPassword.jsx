import React, { useState } from 'react';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { apiService } from '../services/api';
import { useNotify } from '../context/NotificationContext';

const ForgotPassword = ({ onBack, onResetPassword }) => {
  // Inject custom styles
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const { notify } = useNotify();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      notify('Please enter your email address', { type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setAccountNotFound(false);
    try {
      const response = await apiService.forgotPassword(email);
      if (response.success && response.emailSent) {
        setIsEmailSent(true);
        notify('Password reset instructions sent to your email', {
          type: 'success',
        });
      } else if (response.success === false && response.message) {
        if (response.message.includes('No account found')) {
          setAccountNotFound(true);
        }
        notify(response.message, {
          type: 'error',
        });
      } else {
        notify('Failed to send reset email. Please try again.', {
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      notify('Failed to send reset email. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className='forgot-password-container'>
        <div className='forgot-password-header'>
          <h2>📧 Check Your Email</h2>
          <p className='forgot-password-subtitle'>
            Reset instructions sent to <strong>{email}</strong>
          </p>
        </div>

        <div className='forgot-password-form'>
          <div className='forgot-success-message'>
            <p>Check your spam folder if you don't see the email.</p>
          </div>

          <button
            type='button'
            className='forgot-submit-btn'
            onClick={() => {
              setIsEmailSent(false);
              setEmail('');
              setAccountNotFound(false);
            }}
          >
            🔄 Try Again
          </button>

          <button type='button' className='forgot-link-btn' onClick={onBack}>
            <FaArrowLeft /> Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (accountNotFound) {
    return (
      <div className='forgot-password-container'>
        <div className='forgot-password-header'>
          <h2>❌ Account Not Found</h2>
          <p className='forgot-password-subtitle'>
            No account found with email: <strong>{email}</strong>
          </p>
        </div>

        <div className='forgot-password-form'>
          <div className='forgot-error-message'>
            <p>🔍 Please check your email address and try again.</p>
            <p>
              💡 If you don't have an account, please contact the administrator.
            </p>
          </div>

          <button
            type='button'
            className='forgot-submit-btn'
            onClick={() => {
              setAccountNotFound(false);
              setEmail('');
            }}
          >
            🔄 Try Different Email
          </button>

          <button type='button' className='forgot-link-btn' onClick={onBack}>
            <FaArrowLeft /> Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='forgot-password-container'>
      <div className='forgot-password-header'>
        <h2>🔑 Forgot Password</h2>
        <p className='forgot-password-subtitle'>
          Enter your email to receive reset instructions
        </p>
      </div>

      <form className='forgot-password-form' onSubmit={handleSubmit}>
        <div className='forgot-input-group'>
          <label htmlFor='email'>
            <FaEnvelope /> Email
          </label>
          <input
            type='email'
            id='email'
            className='forgot-input'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Enter your email address'
            disabled={isSubmitting}
            autoComplete='email'
            required
          />
        </div>

        <button
          type='submit'
          className='forgot-submit-btn'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span>🔄 Sending...</span>
          ) : (
            <span>📧 Send Reset Link</span>
          )}
        </button>

        <button
          type='button'
          className='forgot-link-btn'
          onClick={onBack}
          disabled={isSubmitting}
        >
          <FaArrowLeft /> Back to Login
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;

// Custom styles for ForgotPassword component
const styles = `
  .forgot-password-container {
    max-width: 280px;
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

  .forgot-password-container::before {
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

  .forgot-password-header {
    text-align: center;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
  }

  .forgot-password-header h2 {
    margin: 0 0 4px 0;
    font-size: 20px;
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

  .forgot-password-subtitle {
    margin: 0;
    color: #e5e7eb;
    font-size: 11px;
    font-weight: 400;
    opacity: 0.9;
  }

  .forgot-password-form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    z-index: 1;
  }

  .forgot-input-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .forgot-input-group label {
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 3px;
    color: #f3f4f6;
  }

  .forgot-input {
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

  .forgot-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .forgot-input:focus {
    outline: none;
    border-color: #ffffff;
    background: rgba(255, 255, 255, 0.2);
    box-shadow:
      0 0 0 3px rgba(255, 255, 255, 0.4),
      0 2px 8px rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .forgot-submit-btn {
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

  .forgot-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 6px 15px rgba(255, 255, 255, 0.5),
      0 2px 8px rgba(5, 150, 105, 0.3);
    background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  }

  .forgot-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .forgot-link-btn {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
    backdrop-filter: blur(15px);
    box-shadow: 0 1px 4px rgba(255, 255, 255, 0.15);
  }

  .forgot-link-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow:
      0 2px 6px rgba(255, 255, 255, 0.25),
      0 1px 3px rgba(5, 150, 105, 0.15);
  }

  .forgot-success-message {
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 8px;
    text-align: center;
  }

  .forgot-success-message p {
    margin: 0;
    font-size: 10px;
    color: #bbf7d0;
    font-weight: 500;
  }

  .forgot-error-message {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    padding: 8px;
    margin-bottom: 8px;
    text-align: center;
  }

  .forgot-error-message p {
    margin: 0 0 4px 0;
    font-size: 10px;
    color: #fecaca;
    font-weight: 500;
  }

  .forgot-error-message p:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 480px) {
    .forgot-password-container {
      max-width: 260px;
      width: 85%;
      margin: 10px auto;
      padding: 6px;
      border-radius: 12px;
    }

    .forgot-password-header h2 {
      font-size: 16px;
      margin-bottom: 1px;
    }

    .forgot-password-subtitle {
      font-size: 9px;
    }

    .forgot-password-form {
      gap: 4px;
    }

    .forgot-input-group {
      gap: 1px;
    }

    .forgot-input-group label {
      font-size: 9px;
      gap: 2px;
    }

    .forgot-input {
      padding: 4px 6px;
      font-size: 10px;
      border-radius: 6px;
    }

    .forgot-submit-btn {
      padding: 4px 8px;
      font-size: 10px;
      border-radius: 6px;
      margin-top: 2px;
    }

    .forgot-link-btn {
      padding: 4px 8px;
      font-size: 10px;
      border-radius: 6px;
    }

    .forgot-success-message {
      padding: 6px;
      margin-bottom: 6px;
    }

    .forgot-success-message p {
      font-size: 8px;
    }

    .forgot-error-message {
      padding: 6px;
      margin-bottom: 6px;
    }

    .forgot-error-message p {
      font-size: 8px;
    }
  }
`;
