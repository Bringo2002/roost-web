import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations, getMessages, sendMessage } from '../../services/users';
import { formatTimeAgo } from '../../utils/format';
import type { ConversationSummary } from '../../types/user';
import styles from './Messages.module.css';

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

export function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toParam = searchParams.get('to');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(toParam ? Number(toParam) : null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // Load conversations
  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch { /* non-critical */ }
    finally { setLoadingConvs(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Load messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedId) return;
    setLoadingMsgs(true);
    try {
      const data = await getMessages(selectedId);
      setMessages(data as ChatMessage[]);
    } catch { /* non-critical */ }
    finally { setLoadingMsgs(false); }
  }, [selectedId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConv = conversations.find(c => c.partner.id === selectedId);

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedId || sending) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg('');

    // Optimistic append
    const optimistic: ChatMessage = {
      id: Date.now(),
      senderId: user?.id || 0,
      receiverId: selectedId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await sendMessage(selectedId, content);
    } catch {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className={styles.page}>
      {/* ── Conversation List ──────────────────────────── */}
      <div className={`${styles.convList} ${selectedId && isMobile ? styles.hiddenMobile : ''}`}>
        <div className={styles.convHeader}>
          <h1 className={styles.convTitle}>Messages</h1>
        </div>

        {loadingConvs ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : conversations.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✉</span>
            <span className={styles.emptyTitle}>No conversations yet</span>
            <span className={styles.emptyDesc}>Contact a property owner to start a conversation.</span>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.partner.id}
              className={`${styles.convItem} ${selectedId === conv.partner.id ? styles.convItemActive : ''}`}
              onClick={() => setSelectedId(conv.partner.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') setSelectedId(conv.partner.id); }}
            >
              <div className={styles.avatar}>
                {conv.partner.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className={styles.convInfo}>
                <div className={styles.convName}>{conv.partner.name}</div>
                <div className={styles.convPreview}>
                  {conv.decryptedPreview || conv.lastMessageContent || 'No messages yet'}
                </div>
              </div>
              <div className={styles.convMeta}>
                <span className={styles.convTime}>
                  {formatTimeAgo(conv.lastMessageTimestamp)}
                </span>
                {conv.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Chat Area ─────────────────────────────────── */}
      {selectedId ? (
        <div className={`${styles.chatArea} ${!selectedId && isMobile ? styles.hiddenMobile : ''}`}>
          <div className={styles.chatHeader}>
            <button
              className={styles.chatHeaderBack}
              onClick={() => setSelectedId(null)}
              type="button"
            >
              ←
            </button>
            <div className={styles.avatar} style={{ width: 36, height: 36, fontSize: '0.875rem' }}>
              {selectedConv?.partner.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className={styles.chatHeaderName}>
              {selectedConv?.partner.name || 'Chat'}
            </span>
          </div>

          <div className={styles.messages}>
            {loadingMsgs ? (
              <div className={styles.loading}><div className={styles.spinner} /></div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>💬</span>
                <span className={styles.emptyDesc}>Send a message to start the conversation.</span>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${styles.msgBubble} ${
                    msg.senderId === user?.id ? styles.msgSent : styles.msgReceived
                  }`}
                >
                  {msg.content}
                  <div className={styles.msgTime}>{formatTimeAgo(msg.timestamp)}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputBar}>
            <textarea
              ref={textareaRef}
              className={styles.inputField}
              placeholder="Type a message..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              type="button"
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <div className={`${styles.chatArea} ${isMobile ? styles.hiddenMobile : ''}`}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✉</span>
            <span className={styles.emptyTitle}>Select a conversation</span>
            <span className={styles.emptyDesc}>Choose a conversation from the list to start chatting.</span>
          </div>
        </div>
      )}
    </div>
  );
}
