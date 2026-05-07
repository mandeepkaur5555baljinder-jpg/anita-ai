// Groq model config — used by router + UI
export const PROVIDERS = {
  auto:    { label: 'Auto',        emoji: '⚡', color: '#0a84ff',  model: 'llama-3.3-70b-versatile' },
  fast:    { label: 'Llama Fast',  emoji: '🚀', color: '#30d158',  model: 'llama-3.1-8b-instant'    },
  smart:   { label: 'Llama Smart', emoji: '🧠', color: '#bf5af2',  model: 'llama-3.3-70b-versatile' },
  mixtral: { label: 'Mixtral',     emoji: '🌀', color: '#ff9f0a',  model: 'llama-3.3-70b-versatile' },
  gemma:   { label: 'Gemma',       emoji: '💎', color: '#ff375f',  model: 'gemma2-9b-it'            },
};

export const getInfo = (p) => PROVIDERS[p] ?? PROVIDERS.auto;

// Keyword-based smart router → picks best Groq model
export const route = (prompt, selected) => {
  if (selected && selected !== 'auto') return selected;
  const p = prompt.toLowerCase();
  if (/\b(code|function|bug|debug|implement|class|component|refactor|typescript|javascript|python|react|css|html|error|fix)\b/.test(p)) return 'smart';
  if (/\b(analyze|summarize|explain|research|compare|overview|document|detail|comprehensive)\b/.test(p)) return 'mixtral';
  if (/\b(quick|short|simple|what is|define|hello|hi|hey|who)\b/.test(p)) return 'fast';
  return 'auto';
};
