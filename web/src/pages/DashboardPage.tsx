/**
 * Dashboard Page
 * Main dashboard after successful onboarding
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { showToast } from '../utils/toast';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { FiLogOut, FiUser, FiCheckCircle } from 'react-icons/fi';

export const DashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (location.state?.message) {
      showToast.success(location.state.message);
    }
  }, [location.state]);

  const handleLogout = () => {
    logout();
    showToast.success(t('toast.success.logoutSuccess'));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
             Real Media
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <FiLogOut />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <FiCheckCircle className="text-green-600" size={40} />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome, {user?.name}! 🎉
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your profile is all set! Start exploring the platform and connect with {user?.role === 'INFLUENCER' ? 'brands' : 'influencers'}.
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-purple-600" size={24} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Profile Status: Active
                </h3>
                <p className="text-gray-600 mb-4">
                  Your account is ready to use. You can now access all platform features!
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Profile created successfully
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Email verified
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Account activated
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Your Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="font-medium text-gray-900">
                    {user?.role === 'INFLUENCER' ? 'Influencer' : 'Salon'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mt-8"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">What's Next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  1
                </span>
                <span>Complete your profile with social media connections</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  2
                </span>
                <span>Explore the dashboard and discover opportunities</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  3
                </span>
                <span>
                  {user?.role === 'INFLUENCER'
                    ? 'Start connecting with brands and growing your influence'
                    : 'Start finding and collaborating with influencers'}
                </span>
              </li>
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
