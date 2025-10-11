import React from 'react';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { FiMessageCircle } from 'react-icons/fi';

export const ChatPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 md:pb-12">
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-magenta-light to-magenta mb-6">
            <FiMessageCircle size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Chat Feature
          </h1>
          <p className="text-xl text-text-secondary max-w-md mx-auto">
            Coming soon! Connect and chat with your network.
          </p>
          <div className="mt-8 inline-block px-6 py-3 bg-magenta text-white rounded-full font-semibold">
            Under Development 🚀
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
