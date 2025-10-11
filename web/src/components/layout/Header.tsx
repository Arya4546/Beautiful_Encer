import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../utils/toast.util';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully', { key: 'logout' });
    navigate('/login');
    setIsDropdownOpen(false);
  };

  const getProfilePic = () => {
    if (user?.role === 'INFLUENCER' && user?.influencer?.profilePic) {
      return user.influencer.profilePic;
    }
    if (user?.role === 'SALON' && user?.salon?.profilePic) {
      return user.salon.profilePic;
    }
    return null;
  };

  const getDisplayName = () => {
    if (user?.role === 'SALON' && user?.salon?.businessName) {
      return user.salon.businessName;
    }
    return user?.name || 'User';
  };

  const profilePic = getProfilePic();
  const displayName = getDisplayName();
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/discover" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-magenta to-magenta-dark rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">BE</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-magenta to-magenta-dark bg-clip-text text-transparent hidden sm:block">
              Beautiful Encer
            </span>
          </Link>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 hover:bg-background-secondary rounded-xl px-3 py-2 transition-colors"
            >
              {/* Profile Picture */}
              <div className="relative">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-magenta"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white font-bold border-2 border-magenta">
                    {initials}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Name (hidden on mobile) */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-text-primary">{displayName}</p>
                <p className="text-xs text-text-tertiary capitalize">{user?.role?.toLowerCase()}</p>
              </div>

              <FiChevronDown
                size={16}
                className={`text-text-secondary transition-transform hidden md:block ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-large border border-border overflow-hidden animate-scale-in">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-border bg-background-secondary">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-background-secondary transition-colors flex items-center space-x-3 text-text-primary"
                  >
                    <FiUser size={18} />
                    <span className="text-sm font-medium">Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/settings');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-background-secondary transition-colors flex items-center space-x-3 text-text-primary"
                  >
                    <FiSettings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-border py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 text-red-600"
                  >
                    <FiLogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
