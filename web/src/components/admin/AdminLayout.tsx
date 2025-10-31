import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  Activity, 
  Menu, 
  X, 
  LogOut,
  UserCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { LanguageSwitcher } from '../LanguageSwitcher';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.nav.dashboard') },
    { path: '/admin/users', icon: Users, label: t('admin.nav.users') },
    { path: '/admin/connections', icon: Network, label: t('admin.nav.connections') },
    { path: '/admin/activity-logs', icon: Activity, label: t('admin.nav.activityLogs') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-border z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
            title={sidebarOpen ? t('common.close') : t('common.menu')}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <img src="/BE.png" alt="Beautiful Encer" className="h-14 w-auto" />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center justify-center">
            <img src="/BE.png" alt="Beautiful Encer" className="h-24 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={item.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-magenta to-pink-500 text-white shadow-soft'
                      : 'text-text-secondary hover:bg-background-tertiary hover:translate-x-1'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <Link
              to="/admin/profile"
              onClick={() => setSidebarOpen(false)}
              title={t('admin.nav.profile')}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-background-tertiary hover:translate-x-1 transition-all duration-200"
            >
              <UserCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{t('admin.nav.profile')}</span>
            </Link>
            
            <button
              onClick={handleLogout}
              title={t('common.logout')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 hover:translate-x-1 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{t('common.logout')}</span>
            </button>

            <div className="pt-2 flex justify-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
