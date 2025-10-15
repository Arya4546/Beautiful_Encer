import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "./LanguageSwitcher";

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t('landing.nav.features'), href: "#features" },
    { name: t('landing.nav.howItWorks'), href: "#how-it-works" },
    { name: t('landing.nav.benefits'), href: "#benefits" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-pink-100" 
          : "bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <motion.a 
            href="/" 
            className="text-xl sm:text-2xl font-black"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent">
              Beautiful
            </span>
            <span className="text-gray-800">Encer</span>
          </motion.a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-pink-600 transition-colors duration-200 font-medium text-sm lg:text-base"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <LanguageSwitcher />
            <button 
              onClick={() => navigate('/login')}
              className="text-gray-700 hover:text-pink-600 transition-colors font-medium text-sm lg:text-base"
            >
              {t('common.login')}
            </button>
            <motion.button
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-shadow text-sm lg:text-base"
            >
              {t('common.signup')}
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-2xl text-gray-800 hover:text-pink-600 transition-colors"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-pink-100"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-pink-600 transition-colors font-medium py-2"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-pink-100 space-y-3">
                <button 
                  onClick={() => { navigate('/login'); setIsOpen(false); }}
                  className="block w-full text-center py-3 text-gray-700 hover:text-pink-600 transition-colors font-medium border border-gray-300 rounded-xl"
                >
                  {t('common.login')}
                </button>
                <button
                  onClick={() => { navigate('/signup'); setIsOpen(false); }}
                  className="block w-full text-center py-3 bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-md"
                >
                  {t('common.signup')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
