import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Network, MessageSquare, Share2, CheckCircle, Clock, UserCheck, UserX } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatsCard } from '../../components/admin/StatsCard';
import adminService from '../../services/admin.service';
import { showToast } from '../../utils/toast';

const COLORS = ['#e91e63', '#10b981', '#f59e0b'];

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
      </div>
    </AdminLayout>
  );
};
