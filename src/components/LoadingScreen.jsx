import { useEffect, useState } from 'react';

const LoadingScreen = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'done' | 'hidden'

  useEffect(() => {
    // Simulate loading progress
    const steps = [
      { target: 30, delay: 100 },
      { target: 65, delay: 300 },
      { target: 85, delay: 500 },
      { target: 100, delay: 800 },
    ];

    let current = 0;
    const timers = steps.map(({ target, delay }) =>
      setTimeout(() => setProgress(target), delay)
    );

    // After full progress, fade out
    const doneTimer = setTimeout(() => {
      setPhase('done');
      setTimeout(() => {
        setPhase('hidden');
        onDone?.();
      }, 600);
    }, 1200);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  if (phase === 'hidden') return null;

  return (
    <div className={`loading-screen ${phase === 'done' ? 'loading-screen--out' : ''}`}>
      {/* Animated orbs */}
      <div className="ls-orbs" aria-hidden="true">
        <div className="ls-orb ls-orb-1" />
        <div className="ls-orb ls-orb-2" />
        <div className="ls-orb ls-orb-3" />
      </div>

      <div className="ls-content">
        {/* Logo */}
        <div className="ls-logo-wrap">
          <img src="/icon-192.png" alt="Anita" className="ls-logo" />
          <div className="ls-logo-ring" />
          <div className="ls-logo-ring ls-logo-ring--2" />
        </div>

        {/* Brand */}
        <h1 className="ls-title">Anita</h1>
        <p className="ls-sub">Your AI Companion</p>

        {/* Progress bar */}
        <div className="ls-bar-wrap">
          <div className="ls-bar">
            <div className="ls-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="ls-pct">{progress}%</span>
        </div>

        {/* Footer */}
        <p className="ls-footer">Made by Kratin</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
