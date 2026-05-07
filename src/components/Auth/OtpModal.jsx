import { useState, useRef, useEffect } from 'react';
import { sendOTP, verifyOTP } from '../../services/otpService';
import './OtpModal.css';

/* ── Animated Check ── */
const CheckIcon = () => (
  <svg viewBox="0 0 52 52" width="52" height="52">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#30d158" strokeWidth="2" className="otp-check-circle" />
    <path fill="none" stroke="#30d158" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      d="M14 27l8 8 16-16" className="otp-check-path" />
  </svg>
);

export default function OtpModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'success'
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  /* Countdown timer for resend */
  const startTimer = () => {
    setResendTimer(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('email'); setEmail(''); setDigits(['','','','','','']);
        setError(''); setLoading(false); setResendTimer(0);
        clearInterval(timerRef.current);
      }, 400);
    }
  }, [isOpen]);

  /* Send OTP */
  const handleSend = async () => {
    setError('');
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.'); return;
    }
    setLoading(true);
    try {
      await sendOTP(email);
      setStep('otp');
      startTimer();
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (e) {
      console.error('[OTP] Send failed:', e);
      setError(e.message || 'Failed to send OTP. Check your EmailJS template settings.');
    } finally { setLoading(false); }
  };

  /* OTP digit input handling */
  const handleDigit = (index, val) => {
    const v = val.replace(/\D/, '').slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    setError('');
    if (v && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerify();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  /* Verify OTP */
  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600)); // small UX delay
    const result = verifyOTP(code);
    if (result.valid) {
      setStep('success');
      setTimeout(() => { onSuccess?.(email); onClose(); }, 2200);
    } else {
      setError(result.reason);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
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

        {/* ── STEP: Email ── */}
        {step === 'email' && (
          <div className="otp-step">
            <div className="otp-icon-wrap">
              <div className="otp-icon">✉️</div>
            </div>
            <h2 className="otp-title">Sign in to Anita</h2>
            <p className="otp-sub">Enter your email and we'll send you a one-time code to sign in securely.</p>

            <div className={`otp-email-field ${email ? 'has-value' : ''}`}>
              <input
                type="email"
                className="otp-email-input"
                placeholder=" "
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                autoFocus
                id="otp-email"
              />
              <label className="otp-email-label" htmlFor="otp-email">Email address</label>
            </div>

            {error && <p className="otp-error"><span>⚠</span> {error}</p>}

            <button className="otp-btn primary" onClick={handleSend} disabled={loading || !email}>
              {loading
                ? <span className="otp-spinner" />
                : <><span>Send Code</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
              }
            </button>
          </div>
        )}

        {/* ── STEP: OTP Digits ── */}
        {step === 'otp' && (
          <div className="otp-step">
            <div className="otp-icon-wrap">
              <div className="otp-icon">🔐</div>
            </div>
            <h2 className="otp-title">Check your email</h2>
            <p className="otp-sub">We sent a 6-digit code to<br /><strong>{email}</strong></p>

            <div className="otp-boxes" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className={`otp-box ${d ? 'filled' : ''} ${error ? 'error' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && <p className="otp-error"><span>⚠</span> {error}</p>}

            <button
              className="otp-btn primary"
              onClick={handleVerify}
              disabled={loading || digits.join('').length < 6}
            >
              {loading ? <span className="otp-spinner" /> : 'Verify & Sign In'}
            </button>

            <div className="otp-resend">
              {resendTimer > 0
                ? <span>Resend code in <strong>{resendTimer}s</strong></span>
                : <button className="otp-link" onClick={() => { setDigits(['','','','','','']); setError(''); handleSend(); }}>
                    Resend code
                  </button>
              }
            </div>

            <button className="otp-link muted" onClick={() => { setStep('email'); setError(''); }}>
              ← Change email
            </button>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === 'success' && (
          <div className="otp-step success">
            <div className="otp-success-icon">
              <CheckIcon />
            </div>
            <h2 className="otp-title">You're in! 🎉</h2>
            <p className="otp-sub">Signed in as <strong>{email}</strong>.<br />Welcome to Anita!</p>
          </div>
        )}

      </div>
    </div>
  );
}
