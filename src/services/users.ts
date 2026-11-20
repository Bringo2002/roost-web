import { api } from './api';
import type { User, ConversationSummary } from '../types/user';

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

export async function getMessages(partnerId: number, page = 0): Promise<unknown[]> {
  const data = await api.get<unknown[]>(`/api/chat/messages/${partnerId}?page=${page}`);
  return Array.isArray(data) ? data : [];
}

export async function sendMessage(receiverId: number, content: string): Promise<unknown> {
  return api.post('/api/chat/send', { receiverId, content });
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
