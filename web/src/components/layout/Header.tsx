import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLogOut, FiUser, FiSettings, FiChevronDown } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../../utils/toast';
import { ButtonLoader } from '../ui/Loader';
import { LanguageSwitcher } from '../LanguageSwitcher';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsDropdownOpen(false);
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 300));
    
    logout();
    showToast.success(t('toast.success.logoutSuccess'));
    navigate('/login');
    
    // Reset loading state after navigation
    setIsLoggingOut(false);
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
    <header className="bg-white border-b border-border fixed top-0 left-0 right-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/discover" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-magenta to-magenta-dark rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">BE</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-magenta to-magenta-dark bg-clip-text text-transparent hidden sm:block">
              {t('brand.name')}
            </span>
          </Link>

          {/* Language Switcher & Profile */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            
            {/* Profile Dropdown */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 hover:bg-background-secondary rounded-xl px-3 py-2 transition-colors min-w-[48px]"
              type="button"
            >
              {/* Profile Picture - Fixed width to prevent shift */}
              <div className="relative w-10 h-10 flex-shrink-0">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-magenta"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback initials */}
                <div 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white font-bold border-2 border-magenta"
                  style={{ display: profilePic ? 'none' : 'flex' }}
                >
                  {initials}
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Name (hidden on mobile) */}
              <div className="hidden md:block text-left min-w-[120px]">
                <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
                <p className="text-xs text-text-tertiary capitalize truncate">
                  {user?.role === 'INFLUENCER' ? t('common.influencer') : t('common.salon')}
                </p>
              </div>

              <FiChevronDown
                size={16}
                className={`text-text-secondary transition-transform duration-200 hidden md:block ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-large border border-border overflow-hidden z-50 animate-fade-in-scale origin-top-right">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-border bg-gradient-to-br from-magenta/5 to-magenta-dark/5">
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
                    className="w-full px-4 py-3 text-left hover:bg-background-secondary transition-colors flex items-center space-x-3 text-text-primary group"
                    type="button"
                  >
                    <FiUser size={18} className="group-hover:text-magenta transition-colors" />
                    <span className="text-sm font-medium">{t('nav.profile')}</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-border py-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 text-red-600 group disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {isLoggingOut ? (
                      <>
                        <ButtonLoader />
                        <span className="text-sm font-medium">{t('common.loading')}</span>
                      </>
                    ) : (
                      <>
                        <FiLogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">{t('common.logout')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
