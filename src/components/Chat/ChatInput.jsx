import { useState, useRef, useCallback } from 'react';
import useChatStore from '../../store/useChatStore';
import { askAI } from '../../services/aiService';

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
  </svg>
);

const ChatInput = ({ chipText, clearChip }) => {
  const [text, setText] = useState('');
  const taRef = useRef(null);
  const chipRef = useRef(false);

  const {
    activeId, provider, isStreaming, conversations,
    newConv, addMsg, appendChunk, finaliseMsg, setStreaming, setTitle,
  } = useChatStore();

  /* Apply chip text once */
  if (chipText && !chipRef.current) {
    chipRef.current = true;
    setTimeout(() => {
      setText(chipText);
      clearChip?.();
      chipRef.current = false;
      taRef.current?.focus();
    }, 0);
  }

  const resize = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const send = useCallback(async () => {
    const prompt = text.trim();
    if (!prompt || isStreaming) return;

    setText('');
    if (taRef.current) { taRef.current.style.height = 'auto'; }

    let convId = activeId;
    if (!convId) convId = newConv();

    const conv = useChatStore.getState().conversations.find(c => c.id === convId);
    const history = conv?.messages ?? [];

    addMsg(convId, { role: 'user', content: prompt });
    if (history.length === 0) setTitle(convId, prompt);

    const aiId = addMsg(convId, { role: 'ai', content: '', provider: null });
    setStreaming(true, aiId);

    try {
      const { text: reply, provider: resolvedProvider } = await askAI(prompt, provider, history);

      for (let i = 0; i < reply.length; i++) {
        if (!useChatStore.getState().isStreaming) break;
        appendChunk(convId, aiId, reply[i]);
        const delay = reply[i] === ' ' ? 18 : reply[i] === '\n' ? 35 : 10;
        await new Promise(r => setTimeout(r, delay));
      }

      finaliseMsg(convId, aiId, resolvedProvider);
    } catch (err) {
      appendChunk(convId, aiId, `⚠️ ${err.message}`);
    } finally {
      setStreaming(false);
    }
  }, [text, isStreaming, activeId, provider, newConv, addMsg, appendChunk, finaliseMsg, setStreaming, setTitle]);

  const hasText = text.trim().length > 0;

  return (
    <div className="input-area">
      <div className="input-wrap">
        <div className={`input-pill ${isStreaming ? 'streaming' : ''}`}>
          <textarea
            ref={taRef}
            className="chat-ta"
            placeholder="Message Anita…"
            rows={1}
            value={text}
            onChange={e => { setText(e.target.value); resize(e.target); }}
            onKeyDown={handleKey}
            disabled={isStreaming}
            id="chat-input"
            aria-label="Message"
          />
          <button
            className={`send-btn ${isStreaming ? 'stop' : ''} ${!isStreaming && !hasText ? 'inactive' : ''}`}
            onClick={isStreaming ? () => setStreaming(false) : send}
            disabled={!isStreaming && !hasText}
            id="send-btn"
            aria-label={isStreaming ? 'Stop' : 'Send'}
          >
            {isStreaming ? <StopIcon /> : <SendIcon />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
