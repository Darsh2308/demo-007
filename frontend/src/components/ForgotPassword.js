import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthForm.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      await res.json();
      setIsEmailSent(true);
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      alert('Password reset email sent again');
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="auth-form-container">
        <div className="auth-form">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Check Your Email</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="email-instructions">
              Please check your email and click the link to reset your password. 
              The link will expire in 1 hour.
            </p>
            
            <div className="resend-section">
              <p>Didn't receive the email?</p>
              <button 
                className="resend-button"
                onClick={handleResendEmail}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend Email'}
              </button>
            </div>

            <div className="auth-switch">
              <p>
                <Link to="/" className="switch-link">
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>Reset Password</h2>
        <p className="forgot-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
              placeholder="Enter your email address"
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="auth-switch">
            <p>
              Remember your password?{' '}
              <Link to="/" className="switch-link">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
