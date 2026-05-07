import { useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import useChatStore from '../../store/useChatStore';

const CHIPS = [
  { label: '✨ Write me a React component', tag: 'Llama Smart' },
  { label: '🔍 Explain how AI works',       tag: 'Mixtral' },
  { label: '🧠 Summarize this topic',       tag: 'Mixtral' },
  { label: '💡 Plan my next project',       tag: 'Llama Fast' },
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
  const listRef  = useRef(null);
  const bottomRef = useRef(null);
  const { conversations, activeId, isStreaming, streamMsgId } = useChatStore();
  const conv = conversations.find(c => c.id === activeId);
  const messages = conv?.messages ?? [];

  /* Smooth scroll to bottom whenever messages update or streaming ticks */
  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  /* During streaming, keep scrolling without smooth (instant follow) */
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
    <div className="msg-list" ref={listRef} id="msg-list" role="log" aria-live="polite" aria-label="Chat messages">
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
  );
};

export default ChatContainer;

