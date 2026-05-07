import { useRef, useEffect, useCallback, useState } from 'react';
import MessageBubble from './MessageBubble';
import useChatStore from '../../store/useChatStore';

const CHIPS = [
  { label: '✨ Write me a React component', tag: '' },
  { label: '🔍 Explain how AI works' },
  { label: '🧠 Summarize this topic' },
  { label: '💡 Plan my next project' },
];

const Welcome = ({ onChip }) => (
  <div className="welcome">
    <img src="/icon-192.png" alt="Anita" className="welcome-icon-img" />
    <h1 className="welcome-title">Meet Anita</h1>
    <p className="welcome-sub">
      Hi! I'm Anita, your friendly AI assistant made by Kratin.<br />
      Just ask me anything — I'll give you a detailed answer like a friend would!
    </p>
    <div className="chips">
      {CHIPS.map(({ label, tag }) => (
        <button key={label} className="chip" onClick={() => onChip(label.replace(/^[^\w]+/, '').trim())}>
          {label} <span className="chip-tag">→ {tag}</span>
        </button>
      ))}
    </div>
  </div>
);

const ChatContainer = ({ onChip }) => {
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const [showArrow, setShowArrow] = useState(false);
  const { conversations, activeId, isStreaming, streamMsgId } = useChatStore();
  const conv = conversations.find(c => c.id === activeId);
  const messages = conv?.messages ?? [];

  /* Smooth scroll to bottom */
  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  /* Show/hide scroll-to-bottom arrow */
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowArrow(distFromBottom > 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  /* During streaming, keep scrolling (instant follow) */
  useEffect(() => {
    if (!isStreaming) return;
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (atBottom) el.scrollTop = el.scrollHeight;
  });

  if (!messages.length) {
    return <div className="msg-list"><Welcome onChip={onChip} /></div>;
  }

  return (
    <div className="msg-list-wrap">
      <div
        className="msg-list"
        ref={listRef}
        id="msg-list"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        onScroll={handleScroll}
      >
        <div className="msg-inner">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isStreaming={isStreaming && msg.id === streamMsgId}
              style={{ animationDelay: `${Math.min(idx * 0.03, 0.15)}s` }}
            />
          ))}
          <div ref={bottomRef} aria-hidden="true" style={{ height: '1px' }} />
        </div>
      </div>

      {/* Scroll-to-bottom arrow — shown when user scrolled up */}
      <button
        className={`scroll-arrow-btn ${showArrow ? 'scroll-arrow-btn--visible' : ''}`}
        onClick={scrollToBottom}
        aria-label="Scroll to bottom"
        title="Scroll to bottom"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
};

export default ChatContainer;
