import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CreditCard, CheckCircle, XCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatsCard } from '../../components/admin/StatsCard';
import adminService from '../../services/admin.service';

const COLORS = ['#e91e63', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

const AdminPayments: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  // Fetch payment statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-payment-stats', dateRange],
    queryFn: () => adminService.getPaymentStats(dateRange.startDate, dateRange.endDate),
  });

  // Fetch all payments with filters
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments', page, statusFilter, planFilter, dateRange],
    queryFn: () => adminService.getPayments({
      page,
      limit: 20,
      status: statusFilter || undefined,
      subscriptionPlan: planFilter || undefined,
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
    }),
  });

  const stats = statsData?.data;
  const payments = paymentsData?.data;

  // Prepare chart data
  const planChartData = stats?.revenueByPlan?.map((item: any) => ({
    name: t(`admin.payments.plans.${item.plan.toLowerCase()}`),
    revenue: item.revenue,
    count: item.count,
  })) || [];

  const monthlyRevenueData = stats?.monthlyRevenue?.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString(i18n.language, { month: 'short', year: 'numeric' }),
    revenue: item.revenue,
    count: item.count,
  })).reverse() || [];

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
    setPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPlanFilter('');
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
            <h1 className="text-2xl font-bold text-gray-800">{t('admin.payments.title')}</h1>
            <p className="text-gray-600 mt-1">{t('admin.payments.subtitle')}</p>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange(e.target.value, dateRange.endDate)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder={t('admin.payments.startDate')}
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange(dateRange.startDate, e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder={t('admin.payments.endDate')}
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
            title={t('admin.payments.totalPayments')}
            value={stats?.overview.totalPayments || 0}
            icon={CreditCard}
            iconColor="text-pink-500"
          />
          <StatsCard
            title={t('admin.payments.totalRevenue')}
            value={`¥${(stats?.overview.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-500"
          />
          <StatsCard
            title={t('admin.payments.successRate')}
            value={`${stats?.overview.successRate || 0}%`}
            icon={TrendingUp}
            iconColor="text-blue-500"
          />
          <StatsCard
            title={t('admin.payments.successful')}
            value={stats?.overview.successfulPayments || 0}
            icon={CheckCircle}
            iconColor="text-purple-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Plan */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('admin.payments.revenueByPlan')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {planChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('admin.payments.monthlyTrend')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#e91e63" strokeWidth={2} name={t('admin.payments.revenue')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Spenders */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-bold text-gray-800">{t('admin.payments.topSpenders')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.topSpenders?.map((spender: any, index: number) => (
              <div key={spender.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index < 3 ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{spender.name}</div>
                    <div className="text-xs text-gray-500">{spender.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                        {spender.role === 'SALON' ? t('admin.payments.salon') : t('admin.payments.influencer')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-800">¥{spender.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{spender.paymentCount} {t('admin.payments.payments')}</div>
                </div>
              </div>
            ))}
            {(!stats?.topSpenders || stats.topSpenders.length === 0) && (
              <div className="col-span-2 text-center text-gray-500 py-8">{t('admin.payments.noData')}</div>
            )}
          </div>
        </div>

        {/* Subscription Plans Breakdown */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('admin.payments.planBreakdown')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats?.revenueByPlan?.map((plan: any, index: number) => (
              <div key={plan.plan} className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800 text-lg">
                    {t(`admin.payments.plans.${plan.plan.toLowerCase()}`)}
                  </h4>
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">¥{plan.revenue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{t('admin.payments.totalRevenue')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-700">{plan.count}</div>
                    <div className="text-xs text-gray-500">{t('admin.payments.subscriptions')}</div>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.revenueByPlan || stats.revenueByPlan.length === 0) && (
              <div className="col-span-3 text-center text-gray-500 py-8">{t('admin.payments.noData')}</div>
            )}
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-xl shadow-md border border-pink-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-gray-800">{t('admin.payments.allPayments')}</h3>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                >
                  <option value="">{t('admin.payments.allStatuses')}</option>
                  <option value="SUCCEEDED">{t('admin.payments.statusSucceeded')}</option>
                  <option value="FAILED">{t('admin.payments.statusFailed')}</option>
                  <option value="PENDING">{t('admin.payments.statusPending')}</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                >
                  <option value="">{t('admin.payments.allPlans')}</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Enterprise</option>
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
                    {t('admin.payments.table.user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.payments.table.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.payments.table.plan')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.payments.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.payments.table.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.payments.table.transactionId')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : payments?.payments?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {t('admin.payments.noPayments')}
                    </td>
                  </tr>
                ) : (
                  payments?.payments?.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.user.name}</div>
                        <div className="text-xs text-gray-500">{payment.user.email}</div>
                        <span className="inline-flex mt-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                          {payment.user.role === 'SALON' ? t('admin.payments.salon') : t('admin.payments.influencer')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {payment.currency === 'JPY' ? '¥' : '$'}{payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {t(`admin.payments.plans.${payment.subscriptionPlan.toLowerCase()}`)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'SUCCEEDED' ? t('admin.payments.statusSucceeded') :
                           payment.status === 'PENDING' ? t('admin.payments.statusPending') :
                           t('admin.payments.statusFailed')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString(i18n.language)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 font-mono">
                          {payment.stripePaymentIntentId?.substring(0, 20)}...
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {payments && payments.pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {t('admin.payments.showing')} {((page - 1) * 20) + 1} - {Math.min(page * 20, payments.pagination.total)} {t('admin.payments.of')} {payments.pagination.total}
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
                  onClick={() => setPage(p => Math.min(payments.pagination.totalPages, p + 1))}
                  disabled={page === payments.pagination.totalPages}
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

export default AdminPayments;
