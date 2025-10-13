import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGlobe } from 'react-icons/fa';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ja' ? 'en' : 'ja';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const isJapanese = i18n.language === 'ja';
  
  // Determine if we're on landing page (dark background) or authenticated pages (white background)
  const isLandingPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';
  
  // Dynamic classes based on context
  const textColorClass = isLandingPage ? 'text-white' : 'text-gray-700';
  const iconColorClass = isLandingPage ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 transition-all"
      aria-label="Switch language"
      title={isJapanese ? 'Switch to English' : '日本語に切り替え'}
    >
      <FaGlobe className={`text-lg ${iconColorClass}`} />
      <span className={`font-medium text-sm ${textColorClass}`}>
        {isJapanese ? '日本語' : 'English'}
      </span>
    </motion.button>
  );
};
