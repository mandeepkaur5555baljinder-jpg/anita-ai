import { memo } from 'react';
import useChatStore from '../../store/useChatStore';
import SnakeGame from '../Games/SnakeGame';
import FlappyBird from '../Games/FlappyBird';
import ChessGame from '../Games/ChessGame';
import LudoGame from '../Games/LudoGame';
import CarGame from '../Games/CarGame';

/* ── Custom User Sparkle Icon ── */
const UserSparkles = () => (
  <svg viewBox="0 0 48 48" width="18" height="18" style={{ transform: 'translateY(-1px)' }}>
    <path fill="#ffffff" d="M22 8c1.5 6 4.5 9 10.5 10.5-6 1.5-9 4.5-10.5 10.5-1.5-6-4.5-9-10.5-10.5C17.5 17 20.5 14 22 8z" />
    <path fill="#ffffff" d="M33 26c1 3 2.5 4.5 5.5 5.5-3 1-4.5 2.5-5.5 5.5-1-3-2.5-4.5-5.5-5.5 3-1 4.5-2.5 5.5-5.5z" />
  </svg>
);

/* ── Markdown formatter ── */
const fmt = (text) => {
  if (!text) return '';
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\d+\. (.+)$/gm, '<li style="list-style:decimal">$1</li>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
};

/* ── Format time ── */
const fmtTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/*
 * ── Message content renderer ──
 * ChatInput already streams characters one-by-one via appendChunk.
 * We MUST NOT re-animate those chars or we get a race condition → "undefined" glitch.
 * While streaming: show raw text directly with a blinking cursor.
 * When done: render formatted markdown HTML.
 */
const MessageContent = ({ text, active }) => {
  if (text.includes('[GAME:SNAKE]')) return <SnakeGame />;
  if (text.includes('[GAME:FLAPPY]')) return <FlappyBird />;
  if (text.includes('[GAME:CHESS]')) return <ChessGame />;
  if (text.includes('[GAME:LUDO]')) return <LudoGame />;
  if (text.includes('[GAME:CAR]')) return <CarGame />;

  if (active) {
    return (
      <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text || ''}<span className="cursor" />
      </span>
    );
  }
  return <div dangerouslySetInnerHTML={{ __html: `<p>${fmt(text)}</p>` }} />;
};

/* ── Thinking dots ── */
const Thinking = () => (
  <div className="thinking">
    <span /><span /><span />
  </div>
);

/* ── Message Bubble ── */
const MessageBubble = memo(({ msg, isStreaming }) => {
  const isUser = msg.role === 'user';
  const isEmpty = !msg.content;
  const hasRemaining = !!msg.remainingText;
  
  const handleContinue = async () => {
    const store = useChatStore.getState();
    const activeId = store.activeId;
    
    // Mark as streaming globally for this message
    store.setStreaming(true, msg.id);
    
    const text = msg.remainingText;
    // Clear remaining text so the button disappears
    store.finaliseMsg(activeId, msg.id, msg.provider, null);

    let stoppedEarly = false;
    let newRemaining = '';
    
    for (let i = 0; i < text.length; i++) {
      if (!useChatStore.getState().isStreaming) {
        stoppedEarly = true;
        newRemaining = text.substring(i);
        break;
      }
      useChatStore.getState().appendChunk(activeId, msg.id, text[i]);
      const delay = text[i] === ' ' ? 18 : text[i] === '\n' ? 35 : 10;
      await new Promise(r => setTimeout(r, delay));
    }

    // Re-finalize with any new remaining text if stopped again
    useChatStore.getState().finaliseMsg(activeId, msg.id, msg.provider, stoppedEarly ? newRemaining : null);
    
    if (useChatStore.getState().streamMsgId === msg.id) {
      useChatStore.getState().setStreaming(false);
    }
  };

  return (
    <div className={`msg-row${isUser ? ' user' : ''}`}>
      {!isUser && (
        <div className="msg-avatar av-ai">✦</div>
      )}

      <div className="msg-body">
        <div className={`msg-bubble${isUser ? ' user' : ' ai'}`}>
          {isUser
            ? msg.content
            : isEmpty && isStreaming
              ? <Thinking />
              : <MessageContent text={msg.content ?? ''} active={isStreaming} />
          }
          {!isUser && hasRemaining && !isStreaming && (
            <button className="continue-btn" onClick={handleContinue}>
              Continue generating
            </button>
          )}
        </div>
        <div className="msg-time">{fmtTime(msg.ts)}{isUser && ' ✓✓'}</div>
      </div>

      {isUser && (
        <div className="msg-avatar av-user">
          <UserSparkles />
        </div>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;
