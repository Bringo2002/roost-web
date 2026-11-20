import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations, getMessages } from '../../services/users';
import { formatTimeAgo } from '../../utils/format';
import type { ConversationSummary, Message } from '../../types/user';
import styles from './Messages.module.css';

// Messages are end-to-end encrypted and the web app can't decrypt them yet,
// so show a placeholder instead of ciphertext.
function conversationPreview(c: ConversationSummary): string {
  if (c.decryptedPreview) return c.decryptedPreview;
  if (c.lastMessageContent && !c.lastMessageNonce) return c.lastMessageContent;
  if (c.lastMessageNonce) return '🔒 Encrypted message';
  if (c.hasAttachment) return '📎 Attachment';
  return 'No messages yet';
}

function bubbleText(m: Message): string {
  if (m.content && !m.nonce) return m.content;
  if (m.nonce) return '🔒 Encrypted message';
  if (m.attachmentMeta) return '📎 Attachment';
  return '';
}

export function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toParam = searchParams.get('to');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(toParam ? Number(toParam) : null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      setMessages(data);
    } catch { /* non-critical */ }
    finally { setLoadingMsgs(false); }
  }, [selectedId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConv = conversations.find(c => c.partner.id === selectedId);

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
                  {conversationPreview(conv)}
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
                <span className={styles.emptyDesc}>No messages yet.</span>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`${styles.msgBubble} ${
                    msg.senderId === user?.id ? styles.msgSent : styles.msgReceived
                  }`}
                >
                  {bubbleText(msg)}
                  <div className={styles.msgTime}>{formatTimeAgo(msg.timestamp)}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.encryptedNotice}>
            🔒 Messages are end-to-end encrypted. Reading and replying are
            available in the Roost app for now.
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
