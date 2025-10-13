import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import chatService, { type Conversation, type Message } from '../services/chat.service';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { MessageActionsDropdown } from '../components/MessageActionsDropdown';
import { Send, X, ArrowLeft } from 'lucide-react';
import { showToast } from '../utils/toast';

export const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isMobileListView, setIsMobileListView] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  
  // Auth
  const currentUser = useAuthStore((state) => state.user);

  // Load conversations on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    
    const loadConversations = async () => {
      try {
        const data = await chatService.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    const authToken = localStorage.getItem('accessToken');
    if (!authToken) return;

    chatService.connectSocket(authToken);
    const socket = chatService.getSocket();

    if (!socket) return;

    const loadConversations = async () => {
      try {
        const data = await chatService.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    // Listen for new messages
    socket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      // Update conversation list
      loadConversations();
    });

    // Listen for edited messages
    socket.on('message_edited', (message: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    });

    // Listen for deleted messages
    socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'Message deleted' } : m
        )
      );
    });

    // Listen for typing indicators
    socket.on('user_typing', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set(prev).add(userId));
    });

    socket.on('user_stopped_typing', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.off('new_message');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      try {
        const response = await chatService.getMessages(selectedConversation.id);
        setMessages(response.data);
        chatService.joinConversation(selectedConversation.id);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();

    return () => {
      if (selectedConversation) {
        chatService.leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileListView(false);
  };

  // Handle typing
  const handleTyping = () => {
    if (!selectedConversation) return;

    chatService.startTyping(selectedConversation.id);

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      chatService.stopTyping(selectedConversation.id);
    }, 3000);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    const tempMessage = messageInput;
    setSendingMessage(true);
    
    try {
      if (editingMessage) {
        await chatService.editMessage(editingMessage.id, messageInput);
        setEditingMessage(null);
        showToast.success('Message updated');
      } else {
        await chatService.sendMessage(selectedConversation.id, messageInput);
      }
      setMessageInput('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      showToast.error(error?.response?.data?.error || 'Failed to send message');
      // Restore message input on error
      setMessageInput(tempMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle edit message
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setMessageInput(message.content);
    messageInputRef.current?.focus();
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message? This action cannot be undone.')) return;

    try {
      await chatService.deleteMessage(messageId);
      showToast.success('Message deleted');
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      showToast.error(error?.response?.data?.error || 'Failed to delete message');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageInput('');
  };

  // Format time
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get other user display name
  const getDisplayName = (conversation: Conversation) => {
    if (conversation.otherUser?.role === 'SALON') {
      return conversation.otherUser.salon?.businessName || conversation.otherUser.name;
    }
    return conversation.otherUser?.name || 'Unknown';
  };

  // Get other user profile pic
  const getProfilePic = (conversation: Conversation) => {
    if (conversation.otherUser?.role === 'INFLUENCER') {
      return conversation.otherUser.influencer?.profilePic;
    }
    return conversation.otherUser?.salon?.profilePic;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex h-screen pt-16 md:pt-20">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-magenta"></div>
              <p className="mt-4 text-text-secondary">{t('chat.loadingConversations')}</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="fixed inset-0 pt-16 md:pt-20 pb-16 md:pb-0 flex bg-background">
        <Sidebar />
        
        {/* Main Chat Container */}
        <div className="flex-1 flex overflow-hidden md:ml-64">
          {/* Conversations List */}
          <div
            className={`${
              isMobileListView ? 'flex' : 'hidden'
            } md:flex w-full md:w-80 lg:w-96 border-r border-border bg-white flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
              <h1 className="text-2xl font-bold text-text-primary">{t('chat.title')}</h1>
            </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto chat-scroll">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-semibold text-text-primary text-lg mb-2">{t('chat.noConversations')}</p>
              <p className="text-sm mb-4">{t('chat.toStart')}</p>
              <ol className="text-sm text-left max-w-xs mx-auto space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-magenta">1.</span>
                  <span>{t('chat.goToDiscovery')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-magenta">2.</span>
                  <span>{t('chat.connectWithUsers')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-magenta">3.</span>
                  <span>{t('chat.viewProfile')} <span className="font-semibold text-magenta">"{t('chat.message')}"</span></span>
                </li>
              </ol>
            </div>
          ) : (
            conversations.map((conversation) => {
              const displayName = getDisplayName(conversation);
              const profilePic = getProfilePic(conversation);

              return (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-magenta/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt={displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-magenta text-white flex items-center justify-center font-semibold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary truncate">
                          {displayName}
                        </h3>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-text-secondary">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                      {conversation.unreadCount !== undefined && conversation.unreadCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold text-white bg-magenta rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`${
          !isMobileListView ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col bg-gray-50 overflow-hidden`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-border p-4 flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => setIsMobileListView(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to conversations"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>

              {getProfilePic(selectedConversation) ? (
                <img
                  src={getProfilePic(selectedConversation)!}
                  alt={getDisplayName(selectedConversation)}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-magenta text-white flex items-center justify-center font-semibold">
                  {getDisplayName(selectedConversation).charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="font-semibold text-text-primary">
                  {getDisplayName(selectedConversation)}
                </h2>
                <p className="text-sm text-text-secondary">
                  {typingUsers.size > 0 ? 'typing...' : selectedConversation.otherUser?.email}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
              {messages.map((message) => {
                const isOwn = message.senderId === currentUser?.id;
                const showActions = isOwn && !message.isDeleted;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <div className="flex items-center space-x-2 mb-1">
                          {message.sender.influencer?.profilePic ||
                          message.sender.salon?.profilePic ? (
                            <img
                              src={
                                message.sender.influencer?.profilePic ||
                                message.sender.salon?.profilePic ||
                                ''
                              }
                              alt={message.sender.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-semibold">
                              {message.sender.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-text-primary">
                            {message.sender.name}
                          </span>
                        </div>
                      )}

                      <div
                        className={`rounded-lg p-3 ${
                          isOwn
                            ? 'bg-magenta text-white'
                            : 'bg-white text-text-primary border border-border'
                        } ${message.isDeleted ? 'opacity-60 italic' : ''}`}
                      >
                        <p className="break-words">{message.content}</p>
                        <div className="flex items-center justify-between mt-1 space-x-2">
                          <span
                            className={`text-xs ${
                              isOwn ? 'text-white/70' : 'text-text-secondary'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                            {message.isEdited && ' (edited)'}
                          </span>

                          {showActions && (
                            <MessageActionsDropdown
                              onEdit={() => handleEditMessage(message)}
                              onDelete={() => handleDeleteMessage(message.id)}
                              isOwn={isOwn}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-border p-4 flex-shrink-0">
              {editingMessage && (
                <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-800 font-medium">
                    Editing message
                  </span>
                  <button
                    onClick={handleCancelEdit}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                    title="Cancel editing"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="flex space-x-2">
                <textarea
                  ref={messageInputRef}
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={t('chat.typePlaceholder')}
                  className="flex-1 resize-none border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-magenta/50"
                  rows={1}
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="px-4 py-3 bg-magenta text-white rounded-lg hover:bg-magenta/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center space-x-2"
                >
                  <Send size={20} />
                  <span className="hidden sm:inline">
                    {editingMessage ? t('chat.update') : t('chat.send')}
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                {t('chat.selectConversation')}
              </h2>
              <p className="text-text-secondary">
                {t('chat.chooseConversation')}
              </p>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
};
