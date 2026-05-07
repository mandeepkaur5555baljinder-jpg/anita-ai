import { useState, useEffect, useRef } from 'react';
import useChatStore from '../store/useChatStore';
import './SettingsPage.css';

/* ── Reusable toggle ── */
const Toggle = ({ checked, onChange }) => (
  <label className="sett-toggle">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span className="sett-track"><span className="sett-thumb" /></span>
  </label>
);

/* ── Pill selector ── */
const PillSelect = ({ options, value, onChange }) => (
  <div className="sett-pills">
    {options.map(opt => (
      <button
        key={opt}
        className={`sett-pill ${value === opt ? 'active' : ''}`}
        onClick={() => onChange(opt)}
      >{opt}</button>
    ))}
  </div>
);

const TONES = ['Friendly', 'Professional', 'Creative'];
const SIZES = ['Small', 'Medium', 'Large'];

export default function SettingsPage({ isOpen, onClose, onOpenOtp, loggedInEmail, onLogout }) {
  const { conversations, clearAll, backupEmail, setBackupEmail } = useChatStore();
  const [backupInput, setBackupInput] = useState(backupEmail || '');
  const [backupSaved, setBackupSaved] = useState(false);


  // Appearance
  const [dark, setDark] = useState(() => document.body.classList.contains('dark'));
  const [fontSize, setFontSize] = useState('Medium');

  // Personality
  const [tone, setTone] = useState('Friendly');


  /* Apply dark mode */
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  /* Apply font size */
  useEffect(() => {
    const map = { Small: '13px', Medium: '15px', Large: '17px' };
    document.documentElement.style.setProperty('--text-base', map[fontSize]);
  }, [fontSize]);

  /* Handle OTP send (simulated — wire to Firebase/email API) */
  const handleSendOTP = async () => {
    if (!email.includes('@')) { setOtpMsg('Enter a valid Gmail address.'); return; }
    setOtpLoading(true);
    await new Promise(r => setTimeout(r, 1200)); // Simulate network call
    setOtpSent(true);
    setOtpLoading(false);
    setOtpMsg(`OTP sent to ${email}. Check your inbox!`);
  };

  /* Handle OTP verify (simulated) */
  const handleVerifyOTP = async () => {
    if (otp.length < 4) { setOtpMsg('Enter the OTP from your email.'); return; }
    setOtpLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setOtpLoading(false);
    setLoggedIn(true);
    setUserEmail(email);
    setOtpMsg('');
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserEmail('');
    setEmail('');
    setOtp('');
    setOtpSent(false);
    setOtpMsg('');
  };

  /* Export chat as JSON */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'anita-chat-export.json';
    a.click();
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`sett-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />

      {/* Panel */}
      <aside className={`sett-panel ${isOpen ? 'open' : ''}`}>
        <div className="sett-header">
          <h2 className="sett-title">Settings</h2>
          <button className="sett-close-btn" onClick={onClose} aria-label="Close settings">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="sett-scroll">

          {/* ── APPEARANCE ── */}
          <div className="sett-section">
            <p className="sett-section-label">Appearance</p>
            <div className="sett-card">
              <div className="sett-row">
                <div className="sett-row-left">
                  <span className="sett-row-icon">🌙</span>
                  <div>
                    <p className="sett-row-title">Dark Mode</p>
                    <p className="sett-row-sub">Switch to night theme</p>
                  </div>
                </div>
                <Toggle checked={dark} onChange={setDark} />
              </div>
              <div className="sett-divider" />
              <div className="sett-row sett-row-col">
                <div className="sett-row-left">
                  <span className="sett-row-icon">🔤</span>
                  <div>
                    <p className="sett-row-title">Font Size</p>
                    <p className="sett-row-sub">Adjust text size across the app</p>
                  </div>
                </div>
                <PillSelect options={SIZES} value={fontSize} onChange={setFontSize} />
              </div>
            </div>
          </div>

          {/* ── PERSONALITY ── */}
          <div className="sett-section">
            <p className="sett-section-label">Personality</p>
            <div className="sett-card">
              <div className="sett-row sett-row-col">
                <div className="sett-row-left">
                  <span className="sett-row-icon">✨</span>
                  <div>
                    <p className="sett-row-title">Anita's Tone</p>
                    <p className="sett-row-sub">How should Anita talk to you?</p>
                  </div>
                </div>
                <PillSelect options={TONES} value={tone} onChange={setTone} />
              </div>
              <div className="sett-divider" />
              <div className="sett-row">
                <div className="sett-row-left">
                  <span className="sett-row-icon">🤖</span>
                  <div>
                    <p className="sett-row-title">AI Name</p>
                    <p className="sett-row-sub">Created by Kratin</p>
                  </div>
                </div>
                <span className="sett-badge">Anita</span>
              </div>
            </div>
          </div>

          {/* ── ACCOUNT ── */}
          <div className="sett-section">
            <p className="sett-section-label">Account</p>
            <div className="sett-card">
              {loggedInEmail ? (
                <>
                  <div className="sett-row">
                    <div className="sett-row-left">
                      <div className="sett-avatar">{loggedInEmail[0]?.toUpperCase()}</div>
                      <div>
                        <p className="sett-row-title">Signed In</p>
                        <p className="sett-row-sub">{loggedInEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="sett-divider" />
                  <button className="sett-action-btn danger" onClick={onLogout}>Sign Out</button>
                </>
              ) : (
                <>
                  <div className="sett-row">
                    <div className="sett-row-left">
                      <span className="sett-row-icon">📧</span>
                      <div>
                        <p className="sett-row-title">Gmail Login</p>
                        <p className="sett-row-sub">Sign in securely with OTP</p>
                      </div>
                    </div>
                  </div>
                  <div className="sett-divider" />
                  <button className="sett-action-btn primary" onClick={onOpenOtp}>
                    Sign in with Gmail OTP
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── DATA & BACKUP ── */}
          <div className="sett-section">
            <p className="sett-section-label">Data &amp; Backup</p>
            <div className="sett-card">
              <div className="sett-row">
                <div className="sett-row-left">
                  <span className="sett-row-icon">📨</span>
                  <div>
                    <p className="sett-row-title">Auto Gmail Backup</p>
                    <p className="sett-row-sub">Save every chat to Gmail after each reply</p>
                  </div>
                </div>
              </div>
              <div className="sett-input-group">
                <input
                  className="sett-input"
                  type="email"
                  placeholder="backup@gmail.com"
                  value={backupInput}
                  onChange={e => { setBackupInput(e.target.value); setBackupSaved(false); }}
                />
                <button
                  className={`sett-action-btn ${backupSaved ? '' : 'primary'}`}
                  onClick={() => { setBackupEmail(backupInput.trim()); setBackupSaved(true); }}
                  disabled={!backupInput.trim()}
                >
                  {backupSaved ? '✅ Backup Enabled!' : 'Enable Auto Backup'}
                </button>
                {backupEmail && (
                  <button className="sett-action-btn danger" onClick={() => { setBackupEmail(''); setBackupInput(''); setBackupSaved(false); }}>
                    🚫 Disable Backup
                  </button>
                )}
              </div>
              <div className="sett-divider" />
              <button className="sett-action-btn" onClick={handleExport}>
                📤 Export Chat History
              </button>
              <div className="sett-divider" />
              <button className="sett-action-btn danger" onClick={() => {
                if (window.confirm('Clear all chats? This cannot be undone.')) clearAll?.();
              }}>
                🗑 Clear All Chats
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="sett-footer">Anita v1.0 · Made with ❤️ by Kratin</p>
        </div>
      </aside>
    </>
  );
}
