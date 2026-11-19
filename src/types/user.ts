export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  lastActiveAt?: string;
  responseTime?: string;
}

export interface AuthResponse {
  token: string;
  isNewUser?: boolean;
  newUser?: boolean;
}

export interface ConversationSummary {
  partner: User;
  lastMessageContent?: string;
  lastMessageNonce?: string;
  lastMessageTimestamp?: string;
  lastMessageSenderId?: number;
  unreadCount: number;
  lastMessageAttachmentMeta?: string;
  lastMessageAttachmentMetaNonce?: string;
  hasAttachment: boolean;
  decryptedPreview?: string;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  nonce?: string;
  timestamp: string;
  read: boolean;
  attachmentMeta?: string;
  attachmentMetaNonce?: string;
}
