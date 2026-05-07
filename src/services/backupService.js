/**
 * backupService.js — Auto-emails a chat transcript via EmailJS
 * Sends after every AI reply when the user has set a backup email.
 */
import emailjs from '@emailjs/browser';

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || '';
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

/* Use a separate template ID for backups (or the same one if you prefer) */
const BACKUP_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_BACKUP_TEMPLATE_ID
  || import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  || '';

/* Throttle: only send backup email max once per 5 minutes per conversation */
const lastSent = {};

export const sendChatBackup = async (email, conversation) => {
  if (!SERVICE_ID || !BACKUP_TEMPLATE_ID || !PUBLIC_KEY) return;
  if (!email || !conversation?.messages?.length) return;

  /* Throttle per conversation */
  const now = Date.now();
  if (lastSent[conversation.id] && now - lastSent[conversation.id] < 5 * 60 * 1000) return;
  lastSent[conversation.id] = now;

  /* Build a readable transcript */
  const transcript = conversation.messages
    .map(m => {
      const role = m.role === 'user' ? '👤 You' : '🤖 Anita';
      const time = new Date(m.ts || now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `${role} [${time}]:\n${m.content}`;
    })
    .join('\n\n---\n\n');

  const messageCount = conversation.messages.length;
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  await emailjs.send(
    SERVICE_ID,
    BACKUP_TEMPLATE_ID,
    {
      to_email: email,
      to_name: email.split('@')[0],
      chat_title: conversation.title || 'Anita Chat',
      chat_date: date,
      message_count: messageCount,
      transcript: transcript.slice(0, 8000), // EmailJS has limits
      app_name: 'Anita AI',
    },
    PUBLIC_KEY
  );
};
