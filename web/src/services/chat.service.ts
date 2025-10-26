import axios from '../lib/axios';
import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    influencer?: {
      profilePic: string | null;
    };
    salon?: {
      profilePic: string | null;
    };
  };
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastMessage?: string;
  unreadCount?: number;
  otherUser?: {
    id: string;
    name: string;
    email: string;
    role: 'INFLUENCER' | 'SALON';
    influencer?: {
      profilePic: string | null;
    };
    salon?: {
      profilePic: string | null;
      businessName?: string;
    };
  };
  participants: Array<{
    id: string;
    userId: string;
    joinedAt: string;
    lastReadAt?: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      influencer?: {
        profilePic: string | null;
      };
      salon?: {
        profilePic: string | null;
        businessName?: string;
      };
    };
  }>;
  messages?: Message[];
}

export interface ContactItem {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'INFLUENCER' | 'SALON';
    influencer?: { profilePic: string | null };
    salon?: { profilePic: string | null; businessName?: string };
  };
  conversation: {
    id: string;
    lastMessageAt?: string;
    lastMessage?: string;
    unreadCount?: number;
  } | null;
}

class ChatService {
  private socket: Socket | null = null;

  /**
   * Initialize Socket.IO connection
   */
  connectSocket(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Use base URL without /api/v1 for WebSocket
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    
    console.log('[WebSocket] Connecting to:', baseUrl);
    console.log('[WebSocket] Token present:', !!token);
    
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      console.error('[WebSocket] Check if backend is running and token is valid');
    });

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  /**
   * Send typing indicator
   */
  startTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await axios.get('/chat/conversations');
    return response.data.data;
  }

  /**
   * Get contacts (accepted connections) with search and pagination
   */
  async getContacts(params: { search?: string; role?: 'INFLUENCER' | 'SALON'; cursor?: string; limit?: number } = {}): Promise<{ data: ContactItem[]; pageInfo: { nextCursor: string | null; hasMore: boolean } }> {
    const response = await axios.get('/chat/contacts', { params });
    return response.data;
  }

  /**
   * Get or create a conversation with a user
   */
  async getOrCreateConversation(otherUserId: string): Promise<Conversation> {
    const response = await axios.get(`/chat/conversations/${otherUserId}`);
    return response.data.data;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Message[]; pagination: any }> {
    const response = await axios.get(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return response.data;
  }

  /**
   * Send a text message
   */
  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<Message> {
    const response = await axios.post(
      `/chat/conversations/${conversationId}/messages`,
      { content, messageType: 'TEXT' }
    );
    return response.data.data;
  }

  /**
   * Send a file/image message
   */
  async sendFileMessage(
    conversationId: string,
    fileUrl: string,
    fileName: string,
    fileSize: number,
    messageType: 'IMAGE' | 'FILE'
  ): Promise<Message> {
    const response = await axios.post(
      `/chat/conversations/${conversationId}/messages`,
      {
        content: fileName,
        messageType,
        fileUrl,
        fileName,
        fileSize,
      }
    );
    return response.data.data;
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await axios.patch(`/chat/messages/${messageId}`, {
      content,
    });
    return response.data.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await axios.delete(`/chat/messages/${messageId}`);
  }
}

export default new ChatService();
