import { api } from './api';
import type { User, ConversationSummary, Message } from '../types/user';

export async function getCurrentUser(): Promise<User> {
  return api.get<User>('/api/users/me');
}

export async function getUserById(id: number): Promise<User> {
  return api.get<User>(`/api/users/${id}`);
}

export async function updateProfile(data: { name?: string; phone?: string }): Promise<User> {
  return api.put<User>('/api/users/me', data);
}

export async function becomeLister(): Promise<void> {
  await api.post<void>('/api/auth/lister-profile');
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const data = await api.get<ConversationSummary[]>('/api/chat/conversations');
  return Array.isArray(data) ? data : [];
}

export async function getUnreadCount(): Promise<number> {
  const data = await api.get<{ count?: number }>('/api/chat/unread-count');
  return typeof data?.count === 'number' ? data.count : 0;
}

interface RawChatMessage {
  id: number;
  sender?: { id: number };
  recipient?: { id: number };
  content?: string;
  nonce?: string;
  timestamp: string;
  read: boolean;
  attachmentMeta?: string;
  attachmentMetaNonce?: string;
}

// Content is end-to-end encrypted: the API returns ciphertext + nonce.
// Attachment payloads are intentionally dropped here; the web app can't
// decrypt them yet.
export async function getMessages(partnerId: number, limit = 50): Promise<Message[]> {
  const data = await api.get<RawChatMessage[]>(`/api/chat/history/${partnerId}?limit=${limit}`);
  if (!Array.isArray(data)) return [];
  return data.map(m => ({
    id: m.id,
    senderId: m.sender?.id ?? 0,
    receiverId: m.recipient?.id ?? 0,
    content: m.content ?? '',
    nonce: m.nonce,
    timestamp: m.timestamp,
    read: m.read,
    attachmentMeta: m.attachmentMeta,
    attachmentMetaNonce: m.attachmentMetaNonce,
  }));
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post('/api/auth/change-password', { currentPassword, newPassword });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to change password' };
  }
}

/** Turns the signed-in account into a host (lister). Refresh the user afterwards to pick up the new role. */
export async function becomeHost(): Promise<void> {
  await api.post('/api/auth/lister-profile');
}
