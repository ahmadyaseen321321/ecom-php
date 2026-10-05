import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Loader2,
  Mail,
  Lock,
  Phone,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Leaf,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { loginUser, registerUser, verifyOtpApi } from '../services/api';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
  // Mode can be: 'login' | 'signup' | 'otp'
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, navigateTo, showToast } = useCart();

  const [rememberMe, setRememberMe] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);

  // OTP State (6 digits)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);
  const [resendTimer, setResendTimer] = useState(59);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (mode === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, resendTimer]);

  if (!isOpen) return null;

  const resetForm = () => {
    setError('');
    setOtp(['', '', '', '', '', '']);
    setResendTimer(59);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  // Helper to mask phone number e.g. +1 (555) 000-0089 -> +1 (555) ••••89
  const getMaskedPhone = () => {
    if (!phone) return '+1 (555) ••••89';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 4) {
      const lastFour = digits.slice(-2);
      return `+1 (${digits.slice(0, 3) || '555'}) ••••${lastFour}`;
    }
    return phone;
  };

  // Handle Form Submission (Login or Signup transition to OTP)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      setLoading(true);
      try {
        const data = await loginUser(email, password);
        if (data && data.user) {
          login(data.user, data.token);
          onClose();
        } else if (data && data._networkError) {
          setError('Cannot reach the server. Please check your connection and try again.');
        } else if (data && data._failed) {
          setError(data.message || 'Invalid email or password. Please try again.');
        } else {
          setError('Invalid email or password. Please try again.');
        }
      } catch (err) {
        setError('A network error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!phone.trim()) {
        setError('Please enter a valid phone number');
        return;
      }

      setLoading(true);
      try {
        const userData = {
          full_name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          age,
          password,
          role: 'user'
        };
        // Call register API or prepare for OTP
        await registerUser(userData);
        // After signup form is submitted, show OTP verification screen!
        setMode('otp');
        setResendTimer(59);
        setOtp(['', '', '', '', '', '']);
      } catch (err) {
        setError('Failed to initiate registration. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // If user pasted a string of digits
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      if (otpInputsRef.current[nextFocus]) {
        otpInputsRef.current[nextFocus].focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance focus if digit entered
    if (value && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      if (otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  // Handle OTP Submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOtpApi(phone || email, fullCode);
      if (response) {
        const userObj = {
          name: `${firstName} ${lastName}`.trim() || 'Jane Doe',
          email: email || 'jane@example.com',
          phone: phone || '+1 (555) 000-0000',
          role: 'user'
        };
        login(userObj, 'mock-jwt-token');
        if (showToast) showToast('Phone number verified & account created successfully!');
        onClose();
      } else {
        setError('Invalid OTP code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(59);
    setOtp(['', '', '', '', '', '']);
    setError('');
    if (showToast) showToast('A new OTP code has been sent!');
  };

  return createPortal(
    <div className="auth-modal-overlay">
      {/* Header inside Auth Screen */}
      <header className="auth-screen-header">
        <div className="auth-header-logo">
          <div className="logo-icon">
            <Leaf size={20} />
          </div>
          <span className="brand-name">Novanest</span>
        </div>

        <nav className="auth-header-nav">
          <span className="auth-nav-link" onClick={() => { onClose(); navigateTo('home'); }}>Home</span>
          <span className="auth-nav-link" onClick={() => { onClose(); navigateTo('shop'); }}>Shop</span>
          <span className="auth-nav-link">About</span>
          <span className="auth-nav-link">Contact</span>
          <button className="auth-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </nav>
      </header>

      <div className="auth-split-layout">
        {/* Left Side: Visual Hero Image & Text Overlay */}
        <div className="auth-visual-side">
          <div className="auth-visual-image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop"
              alt="Novanest Lifestyle"
              className="auth-hero-img"
            />
            <div className="auth-visual-overlay"></div>
          </div>

          <div className="auth-visual-content">
            {mode === 'login' ? (
              <>
                <h1>Elevate your everyday style</h1>
                <p>
                  Join our community and get access to exclusive, curated collections reflecting sustainable and modern living.
                </p>
              </>
            ) : (
              <>
                <h1>Join the Novanest Community.</h1>
                <p>
                  Empowering eco-conscious sellers with sustainable tools and a global marketplace. Start your journey towards greener retail today.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Form / Screen Content */}
        <div className="auth-form-side">
          {/* Logo at Top Right Content Header */}
          <div className="auth-content-brand">
            <Leaf size={22} className="brand-leaf-icon" />
            <span className="brand-title">Novanest</span>
          </div>

          {/* LOGIN SCREEN */}
          {mode === 'login' && (
            <div className="auth-card-content login-layout">
              <div className="auth-header">
                <h2>Welcome Back</h2>
                <p>Sign in to continue your journey with Novanest.</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="auth-error">{error}</div>}

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-with-action">
                    <label>Password</label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Password reset link sent to your email!');
                      }}
                      className="forgot-password-link"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-options-row">
                  <label className="remember-me-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="stitch-checkbox"
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <div className="social-buttons-row">
                <button type="button" className="social-btn google-btn">
                  <svg className="social-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button type="button" className="social-btn facebook-btn">
                  <svg className="social-icon" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              <div className="auth-switch">
                <span>Don't have an account? </span>
                <button type="button" className="switch-link-btn" onClick={() => switchMode('signup')}>
                  Sign up
                </button>
              </div>
            </div>
          )}

          {/* SIGNUP SCREEN */}
          {mode === 'signup' && (
            <div className="auth-card-box signup-layout">
              <div className="auth-header">
                <h2>Create Your Account</h2>
                <p>Start your journey with Novanest Seller Hub today.</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="auth-error">{error}</div>}

                <div className="name-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={18} />
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Age (Optional)</label>
                  <div className="input-with-icon">
                    <Calendar className="input-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <ShieldCheck className="input-icon" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-checkbox-row">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={agreeToMarketing}
                    onChange={(e) => setAgreeToMarketing(e.target.checked)}
                    className="stitch-checkbox"
                  />
                  <label htmlFor="marketing">
                    I want to receive inspiration, marketing promotions and updates via email.
                  </label>
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <div className="social-buttons-row">
                <button type="button" className="social-btn google-btn">
                  <svg className="social-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button type="button" className="social-btn facebook-btn">
                  <svg className="social-icon" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              <div className="auth-card-footer-link">
                <span>Already have an account? </span>
                <button type="button" className="switch-link-btn highlight" onClick={() => switchMode('login')}>
                  Sign in here
                </button>
              </div>
            </div>
          )}

          {/* OTP VERIFICATION SCREEN */}
          {mode === 'otp' && (
            <div className="auth-card-box otp-layout">
              <div className="auth-header">
                <h2>Verify Your Number</h2>
                <p>We've sent a 6-digit code to {getMaskedPhone()}</p>
              </div>

              <form className="auth-form" onSubmit={handleOtpSubmit}>
                {error && <div className="auth-error">{error}</div>}

                <div className="otp-inputs-grid">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`otp-digit-input ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>

                <div className="otp-resend-row">
                  <Clock size={16} className="clock-icon" />
                  <span>
                    {resendTimer > 0 ? (
                      `Resend code in 0:${resendTimer < 10 ? '0' + resendTimer : resendTimer}`
                    ) : (
                      <button type="button" className="resend-action-btn" onClick={handleResendOtp}>
                        Resend code now
                      </button>
                    )}
                  </span>
                </div>

                <button className="auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="otp-back-link">
                <button type="button" className="switch-link-btn muted" onClick={() => switchMode('login')}>
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="auth-screen-footer">
        <p>© 2024 Novanest. All rights reserved. Built with love and olive green.</p>
      </footer>
    </div>,
    document.body
  );
}
