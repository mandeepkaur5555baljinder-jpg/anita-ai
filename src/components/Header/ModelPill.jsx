import { useState } from 'react';
import { PROVIDERS } from '../../services/aiRouter';
import useChatStore from '../../store/useChatStore';

const ModelPill = () => {
  const [open, setOpen] = useState(false);
  const { provider, setProvider } = useChatStore();
  const info = PROVIDERS[provider];

  const pick = (p) => { setProvider(p); setOpen(false); };

  return (
    <div className="model-pill-wrap">
      <button className="model-pill glass" onClick={() => setOpen(o => !o)} id="model-pill-btn">
        <span>{info.emoji}</span>
        <span>{info.label}</span>
        <span className={`pill-caret${open ? ' open' : ''}`}>▾</span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 190 }} onClick={() => setOpen(false)} />
          <div className="model-dropdown glass" style={{ zIndex: 200 }}>
            {Object.entries(PROVIDERS).map(([key, val]) => (
              <button
                key={key}
                className={`model-opt${provider === key ? ' sel' : ''}`}
                onClick={() => pick(key)}
                id={`model-opt-${key}`}
              >
                <span className="opt-dot" style={{ background: val.color }} />
                <span>{val.emoji}</span>
                <span>{val.label}</span>
                {key === 'auto' && <span className="opt-badge">smart</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelPill;
