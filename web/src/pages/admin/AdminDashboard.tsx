import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Network, MessageSquare, Share2, CheckCircle, Clock, UserCheck, UserX } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatsCard } from '../../components/admin/StatsCard';
import adminService from '../../services/admin.service';
import { showToast } from '../../utils/toast';

const COLORS = ['#e91e63', '#10b981', '#f59e0b'];

interface SyncResult {
  success: number;
  failed: number;
  failures: Array<{
    accountId: string;
    platform: string;
    error: string;
  }>;
}

const SocialMediaSyncControl: React.FC = () => {
  const { t } = useTranslation();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncTrigger = async () => {
    try {
      setSyncLoading(true);
      setSyncError(null);
      setSyncResult(null);

      const result = await adminService.triggerSocialMediaSync();
      setSyncResult(result);

      if (result.failed === 0) {
        showToast.success(`Successfully synced ${result.success} accounts`);
      } else {
        showToast.success(`Synced ${result.success} accounts (${result.failed} failed - see details below)`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to trigger sync';
      setSyncError(errorMsg);
      showToast.error(errorMsg);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Social Media Data Sync</h2>
        <p className="text-sm text-gray-600">
          Manually trigger data synchronization for all social media accounts
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm text-gray-500 mb-2">
            This will sync data for Instagram, TikTok, YouTube, and X accounts that haven't been updated in the last 7 days.
          </div>
          {syncResult && (
            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-gray-800">Sync Complete</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="text-green-600">✓ Successfully synced: {syncResult.success} accounts</div>
                {syncResult.failed > 0 && (
                  <div className="text-amber-600">⚠ Failed: {syncResult.failed} accounts</div>
                )}
              </div>
              {syncResult.failures && syncResult.failures.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold text-gray-700">Failures:</div>
                  {syncResult.failures.map((failure, index) => (
                    <div key={index} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                      <div className="font-semibold text-red-700">{failure.platform} - {failure.accountId}</div>
                      <div className="text-red-600">{failure.error}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {syncError && (
            <div className="mt-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-700">Sync Failed</span>
              </div>
              <div className="text-sm text-red-600">{syncError}</div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleSyncTrigger}
            disabled={syncLoading}
            className="px-6 py-3 rounded-xl text-white text-sm font-semibold shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto"
            style={{
              background: syncLoading 
                ? 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)' 
                : 'linear-gradient(135deg, #E89BB5 0%, #B8D8E8 100%)',
              opacity: syncLoading ? 0.7 : 1
            }}
          >
            {syncLoading ? (
              <div className="flex items-center gap-2 justify-center">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Syncing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <Share2 className="w-5 h-5" />
                <span>Trigger Sync</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      setStats(response.data.stats);
      setCharts(response.data.charts);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      showToast.error(t('admin.common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magenta"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-text-secondary">{t('admin.common.noData')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">{t('admin.dashboard.title')}</h1>
          <p className="text-text-secondary mt-1">{t('admin.dashboard.overview')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatsCard
            title={t('admin.dashboard.stats.totalUsers')}
            value={stats.users.total}
            subtitle={`${stats.users.influencers} ${t('admin.dashboard.stats.influencers')} • ${stats.users.salons} ${t('admin.dashboard.stats.salons')}`}
            icon={Users}
            iconColor="text-magenta"
          />
          
          <StatsCard
            title={t('admin.dashboard.stats.connections')}
            value={stats.connections.total}
            subtitle={`${stats.connections.accepted} ${t('admin.dashboard.stats.accepted')}`}
            icon={Network}
            iconColor="text-green-600"
          />
          
          <StatsCard
            title={t('admin.dashboard.stats.messages')}
            value={stats.messages.total}
            icon={MessageSquare}
            iconColor="text-pink-500"
          />
          
          <StatsCard
            title={t('admin.dashboard.stats.socialMedia')}
            value={stats.socialMedia.total}
            subtitle={`${stats.socialMedia.instagram} Instagram • ${stats.socialMedia.tiktok} TikTok`}
            icon={Share2}
            iconColor="text-magenta-dark"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatsCard
            title={t('admin.dashboard.stats.verified')}
            value={stats.users.verified}
            icon={UserCheck}
            iconColor="text-green-600"
          />
          
          <StatsCard
            title={t('admin.dashboard.stats.unverified')}
            value={stats.users.unverified}
            icon={UserX}
            iconColor="text-red-600"
          />
          
          <StatsCard
            title={t('admin.dashboard.stats.pending')}
            value={stats.connections.pending}
            icon={Clock}
            iconColor="text-yellow-600"
          />
          
          <StatsCard
            title={t('admin.dashboard.stats.recentSignups')}
            value={stats.users.recentSignups}
            subtitle={t('admin.dashboard.stats.last30Days')}
            icon={CheckCircle}
            iconColor="text-magenta"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-soft border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {t('admin.dashboard.charts.userGrowth')}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ee" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b6b6b"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#6b6b6b" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3e8ee', borderRadius: '8px' }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="influencers" 
                    stroke="#e91e63" 
                    strokeWidth={2}
                    name={t('admin.dashboard.stats.influencers')}
                    dot={{ fill: '#e91e63', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="salons" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name={t('admin.dashboard.stats.salons')}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Connection Status Chart */}
          <div className="bg-white rounded-xl shadow-soft border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {t('admin.dashboard.charts.connectionStatus')}
            </h3>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.connectionStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {charts.connectionStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3e8ee', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Social Media Sync Control */}
        <SocialMediaSyncControl />
      </div>
    </AdminLayout>
  );
};
