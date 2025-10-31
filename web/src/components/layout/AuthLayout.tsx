/**
 * Auth Layout
 * Layout wrapper for authentication pages
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Brand */}
        <Link to="/" className="block mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-1.5"
          >
            {/* BE Logo Image - Standalone with 3D effect */}
            <div className="relative">
              <img 
                src="/BE.png" 
                alt="Beautiful Encer" 
                className="h-32 w-auto sm:h-36 object-contain relative z-10"
                style={{
                  filter: 'drop-shadow(0 10px 25px rgba(236, 72, 153, 0.3)) drop-shadow(0 4px 10px rgba(168, 85, 247, 0.2))',
                }}
              />
              {/* 3D Shadow layers */}
              <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-br from-pink-400 to-purple-500 transform translate-y-2 -z-10"></div>
            </div>
            <p className="text-gray-600 text-xs font-medium">Influencer Marketing Platform</p>
          </motion.div>
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-6"
        >
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>
            )}
          </div>

          {children}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-3 text-xs">
          © 2025 Beautiful Encer. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};
