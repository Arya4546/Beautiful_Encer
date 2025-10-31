import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "./LanguageSwitcher";

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax effect for logo
  const logoY = useTransform(scrollY, [0, 100], [0, -10]);
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
    <>
      {/* Navbar with glassmorphism */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-2xl shadow-xl shadow-pink-500/5 border-b border-pink-200/50" 
            : "bg-transparent"
        }`}
      >
        {/* Animated border gradient */}
        {isScrolled && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-full bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50" />
          </motion.div>
        )}

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo with magnetic effect */}
            <motion.a 
              href="/" 
              className="relative group cursor-pointer"
              style={{ y: logoY, scale: logoScale }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* BE Logo Image - Standalone with 3D effect */}
              <motion.div
                whileHover={{ 
                  rotateY: [0, 10, -10, 0],
                  rotateX: [0, 5, -5, 0]
                }}
                transition={{ duration: 0.6 }}
                className="relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img 
                  src="/BE.png" 
                  alt="Beautiful Encer" 
                  className="h-24 w-auto sm:h-28 md:h-32 lg:h-36 xl:h-40 object-contain relative z-10 transition-all duration-300"
                  style={{
                    filter: 'drop-shadow(0 8px 20px rgba(236, 72, 153, 0.35)) drop-shadow(0 4px 8px rgba(168, 85, 247, 0.25))',
                  }}
                />
                {/* 3D Glow effect layers */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 via-fuchsia-400 to-purple-500 opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-300"
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </motion.a>

            {/* Desktop Nav with hover indicators */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link, idx) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                  className="group relative px-5 py-2 text-gray-700 font-semibold text-sm transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="relative z-10 group-hover:text-pink-600 transition-colors">
                    {link.name}
                  </span>
                  
                  {/* Animated underline */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-600 to-fuchsia-600 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Hover background */}
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-pink-50 -z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.a>
              ))}
            </div>

            {/* Desktop CTAs with magnetic buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <LanguageSwitcher />
              
              <motion.button 
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 text-gray-700 hover:text-pink-600 font-semibold text-sm transition-colors rounded-xl hover:bg-pink-50"
              >
                {t('common.login')}
              </motion.button>

              <motion.button
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-3 bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/40 overflow-hidden transition-all"
              >
                <span className="relative z-10">{t('common.signup')}</span>
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />

                {/* Gradient shift on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </div>

            {/* Mobile Menu Button with animation */}
            <div className="lg:hidden flex items-center gap-3">
              <LanguageSwitcher />
              
              <motion.button 
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.9 }}
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-fuchsia-100 flex items-center justify-center text-gray-800 hover:from-pink-200 hover:to-fuchsia-200 transition-all"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isOpen ? 'close' : 'open'}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu with slide animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-pink-50 to-fuchsia-50 p-6 border-b border-pink-200">
                <div className="flex items-center justify-between">
                  {/* BE Logo - Standalone with 3D effect */}
                  <div className="relative">
                    <img 
                      src="/BE.png" 
                      alt="Beautiful Encer" 
                      className="h-24 w-auto object-contain relative z-10"
                      style={{
                        filter: 'drop-shadow(0 6px 16px rgba(236, 72, 153, 0.3)) drop-shadow(0 3px 8px rgba(168, 85, 247, 0.2))',
                      }}
                    />
                    <div className="absolute inset-0 blur-xl opacity-30 bg-gradient-to-br from-pink-400 to-purple-500 transform translate-y-1 -z-10"></div>
                  </div>
                  
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-800 hover:bg-pink-100 transition-colors shadow-md"
                  >
                    <FaTimes className="text-xl" />
                  </motion.button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-6 space-y-2">
                {navLinks.map((link, idx) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="group block py-4 px-4 rounded-xl text-gray-700 font-semibold hover:bg-pink-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="group-hover:text-pink-600 transition-colors">{link.name}</span>
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        className="text-pink-600"
                      >
                        →
                      </motion.div>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* CTAs */}
              <div className="p-6 space-y-3 border-t border-pink-100">
                <motion.button 
                  onClick={() => { navigate('/login'); setIsOpen(false); }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 text-center text-gray-700 font-semibold border-2 border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-all"
                >
                  {t('common.login')}
                </motion.button>

                <motion.button
                  onClick={() => { navigate('/signup'); setIsOpen(false); }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full py-4 bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg overflow-hidden"
                >
                  <span className="relative z-10">{t('common.signup')}</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-pink-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </div>

              {/* Footer decoration */}
              <div className="p-6 text-center text-sm text-gray-500">
                <p>Join 50,000+ users today</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
