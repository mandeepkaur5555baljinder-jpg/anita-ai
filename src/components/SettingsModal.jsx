import { useState, useEffect } from 'react';

const SettingsModal = ({ isOpen, onClose }) => {
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark'));
  const [apiKey, setApiKey] = useState('');

  // Handle dark mode toggle
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  if (!isOpen) return null;

  return (
    <div className="overlay show" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div 
        className="glass panel" 
        style={{ width: '90%', maxWidth: '400px', background: 'var(--glass-bg)', padding: '24px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--color-muted)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Dark Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Dark Mode</span>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isDark} 
                onChange={(e) => setIsDark(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '4px 0' }} />

          {/* Settings API Key Placeholder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 500 }}>Groq API Key</span>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Must be set in your .env file as VITE_GROQ_API_KEY.</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
