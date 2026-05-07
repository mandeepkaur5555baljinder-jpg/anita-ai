import { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import ChatContainer from './components/Chat/ChatContainer';
import ChatInput from './components/Chat/ChatInput';
import SettingsPage from './components/SettingsPage';
import OtpModal from './components/Auth/OtpModal';
import useChatStore from './store/useChatStore';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');
  const [chipText, setChipText] = useState('');

  const { conversations, activeId } = useChatStore();
  const activeTitle = conversations.find(c => c.id === activeId)?.title ?? 'Anita';


  return (
    <>
      <Orbs />
      <div className="app-shell">
        <Sidebar
          collapsed={sidebarCollapsed}
          onSettingsOpen={() => setSettingsOpen(true)}
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
            <SettingsBtn onClick={() => setSettingsOpen(true)} />
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
        onLogout={() => setLoggedInEmail('')}
      />
      <OtpModal
        isOpen={otpOpen}
        onClose={() => setOtpOpen(false)}
        onSuccess={(email) => setLoggedInEmail(email)}
      />
    </>
  );
}
