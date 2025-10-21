import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiLogOut, FiUser, FiSettings, FiChevronDown } from 'react-icons/fi';
import { FaRocket } from 'react-icons/fa';
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
    <header className="bg-white/80 backdrop-blur-2xl border-b border-pink-200/50 fixed top-0 left-0 right-0 z-50 shadow-xl shadow-pink-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Rocket Icon */}
          <Link to="/discover" className="flex items-center gap-2 flex-shrink-0 group">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-fuchsia-600 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <FaRocket className="text-white text-lg" />
            </motion.div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-xl font-black bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent">
                Beautiful
              </span>
              <span className="text-xs font-bold text-gray-500 tracking-wider">ENCER</span>
            </div>
          </Link>

          {/* Language Switcher & Profile */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            
            {/* Profile Dropdown */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-3 hover:bg-pink-50 rounded-xl px-3 py-2 transition-all border border-transparent hover:border-pink-200 min-w-[48px]"
              type="button"
            >
              {/* Profile Picture - Fixed width to prevent shift */}
              <div className="relative w-10 h-10 flex-shrink-0">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-pink-500 shadow-lg"
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
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-fuchsia-600 flex items-center justify-center text-white font-bold border-2 border-pink-500 shadow-lg"
                  style={{ display: profilePic ? 'none' : 'flex' }}
                >
                  {initials}
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Name (hidden on mobile) */}
              <div className="hidden md:block text-left min-w-[120px]">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role === 'INFLUENCER' ? t('common.influencer') : t('common.salon')}
                </p>
              </div>

              <FiChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 hidden md:block ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </motion.button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-pink-200 overflow-hidden z-50 origin-top-right"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-pink-100 bg-gradient-to-br from-pink-50 to-fuchsia-50">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <motion.button
                    onClick={() => {
                      navigate('/profile');
                      setIsDropdownOpen(false);
                    }}
                    whileHover={{ x: 4 }}
                    className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-all flex items-center space-x-3 text-gray-900 group"
                    type="button"
                  >
                    <FiUser size={18} className="group-hover:text-pink-600 transition-colors" />
                    <span className="text-sm font-medium">{t('nav.profile')}</span>
                  </motion.button>
                </div>

                {/* Logout */}
                <div className="border-t border-pink-100 py-2">
                  <motion.button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    whileHover={{ x: 4 }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-all flex items-center space-x-3 text-red-600 group disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </motion.button>
                </div>
              </motion.div>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
