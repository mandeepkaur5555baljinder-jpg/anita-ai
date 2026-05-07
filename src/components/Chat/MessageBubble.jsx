import { memo } from 'react';

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
        </div>
        <div className="msg-time">{fmtTime(msg.ts)}{isUser && ' ✓✓'}</div>
      </div>

      {isUser && (
        <div className="msg-avatar av-user">U</div>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;
