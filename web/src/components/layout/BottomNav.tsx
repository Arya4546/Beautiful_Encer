import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiUsers, FiMessageCircle, FiBell, FiUser } from 'react-icons/fi';
import { useNotificationStore } from '../../store/notificationStore';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const navItems = [
    { to: '/discover', icon: FiHome, label: t('nav.discover'), badge: 0 },
    { to: '/requests', icon: FiUsers, label: t('nav.requests'), badge: 0 },
    { to: '/chat', icon: FiMessageCircle, label: t('nav.chat'), badge: 0 },
    { to: '/notifications', icon: FiBell, label: t('nav.notifications'), badge: unreadCount },
    { to: '/profile', icon: FiUser, label: t('nav.profile'), badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                isActive ? 'text-magenta' : 'text-gray-600'
              }`
            }
          >
            <div className="relative">
              <Icon size={24} strokeWidth={1.5} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
