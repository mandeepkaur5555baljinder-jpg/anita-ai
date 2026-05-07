import { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import './OtpModal.css';

const CheckIcon = () => (
  <svg viewBox="0 0 52 52" width="52" height="52">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#30d158" strokeWidth="2" className="otp-check-circle" />
    <path fill="none" stroke="#30d158" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      d="M14 27l8 8 16-16" className="otp-check-path" />
  </svg>
);

export default function OtpModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('auth'); // 'auth' | 'success'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('auth'); setEmail(''); setPassword('');
        setError(''); setLoading(false); setResetSent(false); setShowPassword(false);
      }, 400);
    }
  }, [isOpen]);

  const handleReset = async () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter your email address first to reset password.'); return;
    }
    setLoading(true); setError(''); setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.'); return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.'); return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setStep('success');
      setTimeout(() => { onSuccess?.(email); onClose(); }, 2200);
    } catch (err) {
      console.error('[Auth Error]', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`otp-overlay ${isOpen ? 'show' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`otp-modal ${isOpen ? 'enter' : ''}`}>

        {/* Close button */}
        <button className="otp-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* ── STEP: Auth (Login/Signup) ── */}
        {step === 'auth' && (
          <form className="otp-step" onSubmit={handleSubmit}>
            <div className="otp-icon-wrap">
              <div className="otp-icon">🔐</div>
            </div>
            <h2 className="otp-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="otp-sub">
              {isLogin ? 'Sign in to access your chat history.' : 'Sign up to securely save your chats to the cloud.'}
            </p>

            <div className={`otp-email-field ${email ? 'has-value' : ''}`} style={{ marginBottom: '12px' }}>
              <input
                type="email"
                className="otp-email-input"
                placeholder=" "
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoFocus
                id="auth-email"
              />
              <label className="otp-email-label" htmlFor="auth-email">Email address</label>
            </div>

            <div className={`otp-email-field ${password ? 'has-value' : ''}`}>
              <input
                type={showPassword ? "text" : "password"}
                className="otp-email-input"
                placeholder=" "
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                id="auth-password"
                style={{ paddingRight: '40px' }}
              />
              <label className="otp-email-label" htmlFor="auth-password">Password</label>
              
              <button 
                type="button" 
                className="otp-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', width: '100%' }}>
                <button type="button" className="otp-link muted" onClick={handleReset} style={{ fontSize: '12.5px' }}>
                  Forgot Password?
                </button>
              </div>
            )}

            {resetSent && (
              <p className="otp-error" style={{ marginTop: '12px', color: '#30d158', backgroundColor: 'rgba(48,209,88,0.08)', borderColor: 'rgba(48,209,88,0.2)' }}>
                <span>✓</span> Password reset email sent!
              </p>
            )}

            {error && <p className="otp-error" style={{ marginTop: '12px' }}><span>⚠</span> {error}</p>}

            <button type="submit" className="otp-btn primary" disabled={loading || !email || !password} style={{ marginTop: '20px' }}>
              {loading
                ? <span className="otp-spinner" />
                : <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
              }
            </button>

            <button 
              type="button" 
              className="otp-link muted" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ marginTop: '16px' }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        )}

        {/* ── STEP: Success ── */}
        {step === 'success' && (
          <div className="otp-step success">
            <div className="otp-success-icon">
              <CheckIcon />
            </div>
            <h2 className="otp-title">You're in! 🎉</h2>
            <p className="otp-sub">Signed in securely.<br />Welcome to Anita!</p>
          </div>
        )}

      </div>
    </div>
  );
}
