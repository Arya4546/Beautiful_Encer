import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useNotificationStore } from '../store/notificationStore';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
        return '🤝';
      case 'CONNECTION_ACCEPTED':
        return '✅';
      case 'CONNECTION_REJECTED':
        return '❌';
      case 'NEW_MESSAGE':
        return '💬';
      case 'MESSAGE_REPLY':
        return '↩️';
      case 'PROFILE_VIEW':
        return '👀';
      case 'SYSTEM':
        return '📢';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'CONNECTION_REQUEST' || notification.type === 'CONNECTION_ACCEPTED') {
      navigate('/requests');
    } else if (notification.type === 'NEW_MESSAGE' && notification.conversationId) {
      navigate('/chat');
    } else if (notification.type === 'PROFILE_VIEW') {
      navigate('/profile');
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <>
        <Header />
        <div className="fixed inset-0 pt-16 md:pt-20 pb-16 md:pb-0 flex bg-background">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center md:ml-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-magenta"></div>
              <p className="mt-4 text-text-secondary">Loading notifications...</p>
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
        
        <div className="flex-1 overflow-hidden md:ml-64">
          <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
                  <p className="text-sm text-text-secondary mt-1">
                    Stay updated with your latest activities
                  </p>
                </div>
                {notifications.some(n => !n.isRead) && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-2 px-4 py-2 bg-magenta text-white rounded-lg hover:bg-magenta/90 transition-colors"
                  >
                    <CheckCheck size={18} />
                    <span className="hidden sm:inline">Mark All Read</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto chat-scroll">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bell size={40} className="text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary mb-2">
                    No notifications yet
                  </h2>
                  <p className="text-text-secondary max-w-md">
                    When you get connection requests, messages, or other updates, they'll appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                        !notification.isRead ? 'bg-magenta/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-magenta to-magenta-dark rounded-full flex items-center justify-center text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-text-primary">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-text-secondary mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-text-secondary mt-2">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>

                            {/* Unread indicator */}
                            {!notification.isRead && (
                              <div className="ml-2 w-2 h-2 bg-magenta rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 text-gray-400 hover:text-magenta hover:bg-magenta/10 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
};
