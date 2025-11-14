import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiHome, FiUsers, FiMessageCircle, FiBell, FiUser, FiShoppingBag } from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const user = useAuthStore((state) => state.user);

  // Build navigation items based on user role
  const navItems = [
    { to: '/discover', icon: FiHome, label: t('nav.discover'), badge: 0 },
    { to: '/requests', icon: FiUsers, label: t('nav.requests'), badge: 0 },
    // Marketplace - visible for both roles
    { to: user?.role === 'SALON' ? '/salon/marketplace' : '/marketplace', icon: FiShoppingBag, label: t('nav.marketplace'), badge: 0 },
    { to: '/chat', icon: FiMessageCircle, label: t('nav.chat'), badge: 0 },
    { to: '/notifications', icon: FiBell, label: t('nav.notifications'), badge: unreadCount },
    // Only show Social Media for influencers
    ...(user?.role === 'INFLUENCER' ? [{ to: '/social-media', icon: FaInstagram, label: t('nav.socialMedia'), badge: 0 }] : []),
    { to: '/profile', icon: FiUser, label: t('nav.profile'), badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto overflow-x-auto scrollbar-hide">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[60px] h-full transition-colors relative px-2 ${
                isActive ? 'text-magenta' : 'text-gray-600'
              }`
            }
          >
            <div className="relative flex-shrink-0">
              <Icon size={20} strokeWidth={1.5} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 truncate max-w-full text-center leading-tight">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
