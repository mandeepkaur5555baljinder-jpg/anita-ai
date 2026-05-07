import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sendChatBackup } from '../services/backupService';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ── Permanent IndexedDB storage (never deleted by browser) ── */
const idbStorage = {
  getItem: async (name) => {
    try {
      const db = await openDB();
      const tx = db.transaction('store', 'readonly');
      const val = await tx.objectStore('store').get(name);
      return val ?? null;
    } catch { return null; }
  },
  setItem: async (name, value) => {
    try {
      const db = await openDB();
      const tx = db.transaction('store', 'readwrite');
      await tx.objectStore('store').put(value, name);
    } catch (e) { console.warn('[IDB] write failed:', e); }
  },
  removeItem: async (name) => {
    try {
      const db = await openDB();
      const tx = db.transaction('store', 'readwrite');
      await tx.objectStore('store').delete(name);
    } catch {}
  },
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('anita-db', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('store');
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      provider: 'auto',
      isStreaming: false,
      streamMsgId: null,
      backupEmail: '',   // email to auto-backup chats to

      // ── Selectors ──────────────────────────────
      activeConv: () => get().conversations.find(c => c.id === get().activeId) ?? null,

      // ── Conversations ──────────────────────────
      newConv: () => {
        const id = uid();
        set(s => ({
          conversations: [{ id, title: 'New Chat', messages: [], ts: Date.now() }, ...s.conversations],
          activeId: id,
          isStreaming: false,
        }));
        return id;
      },

      selectConv: (id) => set({ activeId: id, isStreaming: false }),

      deleteConv: (id) => set(s => {
        const rest = s.conversations.filter(c => c.id !== id);
        return {
          conversations: rest,
          activeId: s.activeId === id ? (rest[0]?.id ?? null) : s.activeId,
          isStreaming: s.activeId === id ? false : s.isStreaming,
        };
      }),

      setTitle: (id, title) => set(s => ({
        conversations: s.conversations.map(c => c.id === id ? { ...c, title: title.slice(0, 52) } : c),
      })),

      // ── Messages ───────────────────────────────
      addMsg: (convId, msg) => {
        const id = uid();
        const full = { id, ts: Date.now(), ...msg };
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === convId ? { ...c, messages: [...c.messages, full] } : c
          ),
        }));
        return id;
      },

      appendChunk: (convId, msgId, chunk) => set(s => ({
        conversations: s.conversations.map(c =>
          c.id === convId
            ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, content: (m.content ?? '') + chunk } : m) }
            : c
        ),
      })),

      finaliseMsg: (convId, msgId, provider, remainingText = null) => {
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === convId
              ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, provider, remainingText } : m) }
              : c
          ),
        }));

        /* Auto-backup to Gmail if a backup email is set */
        const state = get();
        const backupEmail = state.backupEmail;
        if (backupEmail) {
          const conv = state.conversations.find(c => c.id === convId);
          if (conv) {
            sendChatBackup(backupEmail, conv).catch(e =>
              console.warn('[Backup] Email failed:', e.message)
            );
          }
        }
      },

      // ── UI State ───────────────────────────────
      setStreaming: (val, msgId = null) => set({ isStreaming: val, streamMsgId: msgId }),
      setProvider: (p) => set({ provider: p }),
      setBackupEmail: (email) => set({ backupEmail: email }),
      clearAll: () => set({ conversations: [], activeId: null }),
    }),
    {
      name: 'anita-store-v4',
      storage: createJSONStorage(() => idbStorage),
      partialize: s => ({
        conversations: s.conversations,
        activeId: s.activeId,
        provider: s.provider,
        backupEmail: s.backupEmail,
      }),
    }
  )
);

export default useChatStore;
