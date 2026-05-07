import useChatStore from '../../store/useChatStore';

/* Time ago helper */
const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
};

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.55 }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const Sidebar = ({ collapsed, onSettingsOpen }) => {
  const { conversations, activeId, newConv, selectConv, deleteConv } = useChatStore();

  const handleUserClick = () => {
    onSettingsOpen?.();
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>

      {/* Brand */}
      <div className="sidebar-brand">
        <img src="/icon-192.png" alt="Anita" className="brand-icon-img" />
        <div>
          <div className="brand-name">Anita</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Your AI companion</div>
        </div>
      </div>

      {/* New Chat */}
      <button className="btn-new" onClick={() => newConv()} id="btn-new-chat">
        <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span> New Chat
      </button>

      {/* History */}
      {conversations.length > 0 && (
        <>
          <span className="conv-section-label">Recent Chats</span>
          <div className="conv-list">
            {conversations.map(c => (
              <div
                key={c.id}
                className={`conv-item${c.id === activeId ? ' active' : ''}`}
                onClick={() => selectConv(c.id)}
                role="button"
                tabIndex={0}
              >
                <ChatIcon />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="conv-title">{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{timeAgo(c.ts)}</div>
                </div>
                <button
                  className="conv-del"
                  onClick={e => { e.stopPropagation(); deleteConv(c.id); }}
                  aria-label="Delete"
                >✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {conversations.length === 0 && (
        <div className="conv-empty">No conversations yet.<br />Start a new chat!</div>
      )}

      {/* User footer — opens settings */}
      <div className="sidebar-user" onClick={handleUserClick} role="button" tabIndex={0}>
        <div className="user-avatar">A</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Anita User</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Free Plan</div>
        </div>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--muted)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

    </aside>
  );
};

export default Sidebar;
