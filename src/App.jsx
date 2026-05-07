import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import ChatContainer from './components/Chat/ChatContainer';
import ChatInput from './components/Chat/ChatInput';
import SettingsPage from './components/SettingsPage';
import OtpModal from './components/Auth/OtpModal';
import LoadingScreen from './components/LoadingScreen';
import useChatStore from './store/useChatStore';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/* Animated glass orbs */
const Orbs = () => (
  <div className="orbs" aria-hidden="true">
    <div className="orb orb-1" />
    <div className="orb orb-2" />
    <div className="orb orb-3" />
    <div className="orb orb-4" />
  </div>
);

/* Circular settings button */
const SettingsBtn = ({ onClick }) => (
  <button
    onClick={onClick}
    aria-label="Settings"
    className="settings-circle-btn"
  >
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  </button>
);


export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // start collapsed on mobile
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');
  const [chipText, setChipText] = useState('');
  const [loaded, setLoaded] = useState(false);

  const shellRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const { conversations, activeId } = useChatStore();
  const activeTitle = conversations.find(c => c.id === activeId)?.title ?? 'Anita';

  /* ── Firebase Auth & Cloud Save ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoggedInEmail(user.email);
        // Fetch chats from Firestore
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.conversations && data.conversations.length > 0) {
              useChatStore.setState({ conversations: data.conversations });
            }
          }
        } catch (e) {
          console.error("Failed to load cloud chats:", e);
        }
      } else {
        setLoggedInEmail('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Save chats to Cloud whenever they change
  useEffect(() => {
    const user = auth.currentUser;
    if (user && conversations.length > 0) {
      setDoc(doc(db, 'users', user.uid), { conversations }, { merge: true })
        .catch(e => console.error("Failed to save cloud chats:", e));
    }
  }, [conversations]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLoggedInEmail('');
      // Clear local chats for privacy
      useChatStore.setState({ conversations: [], activeId: null });
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  /* ── FIX: White screen when mobile keyboard opens ──
     The visual viewport shrinks when the keyboard appears.
     We listen to it and set a CSS variable so the app always
     fills exactly the visible area — no white gap ever. */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // Set the app height to the actual visible viewport height
      const h = vv.height;
      document.documentElement.style.setProperty('--vvh', `${h}px`);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  /* ── Swipe gesture: right → open sidebar, left → close sidebar ── */
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

      // Only count mostly-horizontal swipes (dx > 50px, vertical drift < 60px)
      if (Math.abs(dx) > 50 && dy < 60) {
        if (dx > 0) {
          // Swipe RIGHT → open sidebar
          setSidebarCollapsed(false);
        } else {
          // Swipe LEFT → close sidebar
          setSidebarCollapsed(true);
        }
      }
      touchStartX.current = null;
      touchStartY.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  /* Request fullscreen as soon as loading finishes */
  const handleLoaded = useCallback(() => {
    setLoaded(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleLoaded} />}

      <Orbs />

      {/* Sidebar backdrop — tap to close on mobile */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <div className="app-shell" ref={shellRef}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onSettingsOpen={() => setSettingsOpen(true)}
          onClose={() => setSidebarCollapsed(true)}
        />

        <main className="chat-main">
          <header className="chat-header">
            <div className="header-left">
              <button
                className="menu-btn"
                onClick={() => setSidebarCollapsed(c => !c)}
                aria-label="Toggle sidebar"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <span className="header-title">{activeTitle}</span>
            </div>
            <div className="header-right">
              <SettingsBtn onClick={() => setSettingsOpen(true)} />
            </div>
          </header>

          <ChatContainer onChip={setChipText} />
          <ChatInput chipText={chipText} clearChip={() => setChipText('')} />
        </main>
      </div>

      <SettingsPage
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenOtp={() => setOtpOpen(true)}
        loggedInEmail={loggedInEmail}
        onLogout={handleLogout}
      />
      <OtpModal
        isOpen={otpOpen}
        onClose={() => setOtpOpen(false)}
        onSuccess={(email) => setLoggedInEmail(email)}
      />
    </>
  );
}
