import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiUsers, FiMessageCircle, FiBell, FiUser, FiBriefcase } from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { io, Socket } from 'socket.io-client';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { unreadCount, fetchUnreadCount, setUnreadCount, addNotification } = useNotificationStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      // Fetch initial unread count only once
      const hasFetched = sessionStorage.getItem('unread_count_fetched');
      if (!hasFetched) {
        fetchUnreadCount();
        sessionStorage.setItem('unread_count_fetched', 'true');
      }

      // Setup WebSocket for real-time notifications
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';
      const socket: Socket = io(baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('[Notifications] WebSocket connected');
        socket.emit('join', user.id);
      });

      socket.on('new_notification', ({ notification, unreadCount: count }) => {
        console.log('[Notifications] New notification received', notification);
        addNotification(notification);
        setUnreadCount(count);
      });

      socket.on('notification_count_updated', ({ count }) => {
        console.log('[Notifications] Count updated', count);
        setUnreadCount(count);
      });

      socket.on('disconnect', () => {
        console.log('[Notifications] WebSocket disconnected');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const navItems = [
    { to: '/discover', icon: FiHome, label: t('nav.discover'), badge: 0 },
    { to: '/requests', icon: FiUsers, label: t('nav.requests'), badge: 0 },
    // Projects - different routes for salon vs influencer
    ...(user?.role === 'SALON' 
      ? [{ to: '/salon/projects', icon: FiBriefcase, label: t('nav.projects'), badge: 0 }]
      : [{ to: '/influencer/projects', icon: FiBriefcase, label: t('nav.projects'), badge: 0 }]
    ),
    { to: '/chat', icon: FiMessageCircle, label: t('nav.chat'), badge: 0 },
    { to: '/notifications', icon: FiBell, label: t('nav.notifications'), badge: unreadCount },
    // Only show Social Media for influencers
    ...(user?.role === 'INFLUENCER' ? [{ to: '/social-media', icon: FaInstagram, label: t('nav.socialMedia'), badge: 0 }] : []),
    { to: '/profile', icon: FiUser, label: t('nav.profile'), badge: 0 },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-border fixed left-0 top-16 bottom-0 z-40">
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-magenta to-magenta-dark text-white shadow-medium'
                    : 'text-text-secondary hover:bg-background-secondary hover:text-text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
