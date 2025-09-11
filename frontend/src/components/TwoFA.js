import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AuthForm.css';

const TwoFA = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && e.ctrlKey) {
      e.preventDefault();
      handlePaste(e);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const email = sessionStorage.getItem('pending2faEmail');
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      localStorage.setItem('authToken', data.token);
      sessionStorage.removeItem('pending2faEmail');
      window.location.href = '/home';
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = () => {
    window.location.href = '/';
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form">
        <h2>Two-Factor Authentication</h2>
        <p className="twofa-description">
          Enter the 6-digit code sent to your email address
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="twofa-inputs">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`twofa-input ${error ? 'error' : ''}`}
                disabled={isLoading}
              />
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading || code.join('').length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="twofa-actions">
            <button 
              type="button" 
              className="resend-button"
              onClick={resendCode}
              disabled={isLoading}
            >
              Resend Code
            </button>
            <p className="resend-timer">
              Didn't receive the code? Check your spam folder or try again in 30 seconds.
            </p>
          </div>

          <div className="auth-switch">
            <p>
              <Link to="/" className="switch-link">
                Back to Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFA;
