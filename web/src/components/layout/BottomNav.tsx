import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiMessageCircle, FiBell, FiUser } from 'react-icons/fi';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/discover', icon: FiHome, label: 'Home' },
    { to: '/requests', icon: FiUsers, label: 'Requests' },
    { to: '/chats', icon: FiMessageCircle, label: 'Chats' },
    { to: '/notifications', icon: FiBell, label: 'Notifications' },
    { to: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-magenta' : 'text-gray-600'
              }`
            }
          >
            <Icon size={24} strokeWidth={1.5} />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
