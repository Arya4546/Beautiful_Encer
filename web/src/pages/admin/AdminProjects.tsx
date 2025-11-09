import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, DollarSign, CheckCircle, XCircle, Clock, TrendingUp, Users, Award } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatsCard } from '../../components/admin/StatsCard';
import adminService from '../../services/admin.service';
import { projectStatusLabels, projectTypeLabels, ProjectStatus, ProjectType } from '../../types/project.types';

const COLORS = ['#e91e63', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

const AdminProjects: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Fetch project statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-project-stats', dateRange],
    queryFn: () => adminService.getProjectStats(dateRange.startDate, dateRange.endDate),
  });

  // Fetch all projects with filters
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects', page, statusFilter, typeFilter, dateRange],
    queryFn: () => adminService.getProjects({
      page,
      limit: 20,
      status: statusFilter || undefined,
      projectType: typeFilter || undefined,
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
    }),
  });

  const stats = statsData?.data;
  const projects = projectsData?.data;

  // Prepare chart data
  const statusChartData = stats?.statusBreakdown ? [
    { name: t('admin.projects.status.pending'), value: stats.statusBreakdown.pending, color: '#f59e0b' },
    { name: t('admin.projects.status.accepted'), value: stats.statusBreakdown.accepted, color: '#10b981' },
    { name: t('admin.projects.status.rejected'), value: stats.statusBreakdown.rejected, color: '#ef4444' },
    { name: t('admin.projects.status.inProgress'), value: stats.statusBreakdown.inProgress, color: '#3b82f6' },
    { name: t('admin.projects.status.completed'), value: stats.statusBreakdown.completed, color: '#8b5cf6' },
    { name: t('admin.projects.status.cancelled'), value: stats.statusBreakdown.cancelled, color: '#6b7280' },
  ] : [];

  const typeChartData = stats?.projectsByType?.map((item: any) => ({
    name: projectTypeLabels[item.type as ProjectType][i18n.language as 'en' | 'ja'],
    count: item.count,
    budget: item.totalBudget,
  })) || [];

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setDateRange({ startDate: '', endDate: '' });
    setPage(1);
  };

  if (statsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('admin.projects.title')}</h1>
            <p className="text-gray-600 mt-1">{t('admin.projects.subtitle')}</p>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange(e.target.value, dateRange.endDate)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder={t('admin.projects.startDate')}
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange(dateRange.startDate, e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder={t('admin.projects.endDate')}
            />
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title={t('admin.projects.totalProjects')}
            value={stats?.overview.totalProjects || 0}
            icon={Briefcase}
            iconColor="text-pink-500"
          />
          <StatsCard
            title={t('admin.projects.totalBudget')}
            value={`¥${(stats?.overview.totalBudget || 0).toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-500"
          />
          <StatsCard
            title={t('admin.projects.acceptanceRate')}
            value={`${stats?.overview.acceptanceRate || 0}%`}
            icon={TrendingUp}
            iconColor="text-blue-500"
          />
          <StatsCard
            title={t('admin.projects.completionRate')}
            value={`${stats?.overview.completionRate || 0}%`}
            icon={CheckCircle}
            iconColor="text-purple-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('admin.projects.statusBreakdown')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Project Types Bar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('admin.projects.byType')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#e91e63" name={t('admin.projects.projectCount')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Salons */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-800">{t('admin.projects.topSalons')}</h3>
            </div>
            <div className="space-y-3">
              {stats?.topSalons?.map((salon: any, index: number) => (
                <div key={salon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{salon.businessName}</div>
                      <div className="text-xs text-gray-500">{salon.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{salon.projectCount}</div>
                    <div className="text-xs text-gray-500">{t('admin.projects.projects')}</div>
                  </div>
                </div>
              ))}
              {(!stats?.topSalons || stats.topSalons.length === 0) && (
                <div className="text-center text-gray-500 py-8">{t('admin.projects.noData')}</div>
              )}
            </div>
          </div>

          {/* Top Influencers */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-bold text-gray-800">{t('admin.projects.topInfluencers')}</h3>
            </div>
            <div className="space-y-3">
              {stats?.topInfluencers?.map((influencer: any, index: number) => (
                <div key={influencer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-pink-500' : index === 1 ? 'bg-pink-400' : 'bg-pink-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{influencer.name}</div>
                      <div className="text-xs text-gray-500">{influencer.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{influencer.completedProjects}</div>
                    <div className="text-xs text-gray-500">{t('admin.projects.completed')}</div>
                  </div>
                </div>
              ))}
              {(!stats?.topInfluencers || stats.topInfluencers.length === 0) && (
                <div className="text-center text-gray-500 py-8">{t('admin.projects.noData')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="bg-white rounded-xl shadow-md border border-pink-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-gray-800">{t('admin.projects.allProjects')}</h3>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                >
                  <option value="">{t('admin.projects.allStatuses')}</option>
                  {Object.values(ProjectStatus).map((status) => (
                    <option key={status} value={status}>
                      {projectStatusLabels[status][i18n.language as 'en' | 'ja']}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                >
                  <option value="">{t('admin.projects.allTypes')}</option>
                  {Object.values(ProjectType).map((type) => (
                    <option key={type} value={type}>
                      {projectTypeLabels[type][i18n.language as 'en' | 'ja']}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.projects.table.title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.projects.table.salon')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.projects.table.influencer')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.projects.table.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.projects.table.budget')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.projects.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.projects.table.date')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : projects?.projects?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {t('admin.projects.noProjects')}
                    </td>
                  </tr>
                ) : (
                  projects?.projects?.map((project: any) => (
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.salon.businessName}</div>
                        <div className="text-xs text-gray-500">{project.salon.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.influencer.name}</div>
                        <div className="text-xs text-gray-500">{project.influencer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {projectTypeLabels[project.projectType as ProjectType][i18n.language as 'en' | 'ja']}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ¥{project.budget.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                          project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          project.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {projectStatusLabels[project.status as ProjectStatus][i18n.language as 'en' | 'ja']}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(project.proposedAt).toLocaleDateString(i18n.language)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {projects && projects.pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {t('admin.projects.showing')} {((page - 1) * 20) + 1} - {Math.min(page * 20, projects.pagination.total)} {t('admin.projects.of')} {projects.pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => setPage(p => Math.min(projects.pagination.totalPages, p + 1))}
                  disabled={page === projects.pagination.totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
