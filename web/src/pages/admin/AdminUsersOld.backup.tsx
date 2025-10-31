import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Eye, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import adminService from '../../services/admin.service';
import { showToast } from '../../utils/toast';
import { format } from 'date-fns';

export const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [pagination.page, search, roleFilter, verifiedFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        role: roleFilter || undefined,
        verified: verifiedFilter || undefined,
      });
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast.error(t('admin.users.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!window.confirm(t('admin.users.confirmSuspend'))) return;

    try {
      await adminService.suspendUser(userId);
      showToast.success(t('admin.users.success.suspended'));
      loadUsers();
    } catch (error) {
      showToast.error(t('admin.users.error.suspendFailed'));
    }
  };

  const handleActivate = async (userId: string) => {
    if (!window.confirm(t('admin.users.confirmActivate'))) return;

    try {
      await adminService.activateUser(userId);
      showToast.success(t('admin.users.success.activated'));
      loadUsers();
    } catch (error) {
      showToast.error(t('admin.users.error.activateFailed'));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm(t('admin.users.confirmDelete'))) return;

    try {
      await adminService.deleteUser(userId);
      showToast.success(t('admin.users.success.deleted'));
      loadUsers();
    } catch (error) {
      showToast.error(t('admin.users.error.deleteFailed'));
    }
  };

  const isVerified = (user: any) => {
    if (user.role === 'INFLUENCER') {
      return user.influencer?.emailVerified;
    }
    return user.salon?.emailVerified;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('admin.users.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.users.allUsers')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.users.search')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('admin.users.filters.all')}</option>
              <option value="INFLUENCER">{t('common.influencer')}</option>
              <option value="SALON">{t('common.salon')}</option>
            </select>

            {/* Verification Filter */}
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('admin.users.filters.allVerified')}</option>
              <option value="true">{t('admin.users.filters.verifiedOnly')}</option>
              <option value="false">{t('admin.users.filters.unverifiedOnly')}</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('admin.common.noData')}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.email')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.role')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.joined')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.role === 'INFLUENCER' && user.influencer?.profilePic ? (
                                <img
                                  src={user.influencer.profilePic}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : user.role === 'SALON' && user.salon?.profilePic ? (
                                <img
                                  src={user.salon.profilePic}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              {user.role === 'SALON' && user.salon?.businessName && (
                                <div className="text-xs text-gray-500">{user.salon.businessName}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'INFLUENCER' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isVerified(user)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isVerified(user) 
                              ? t('admin.users.status.active') 
                              : t('admin.users.status.suspended')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {isVerified(user) ? (
                              <button
                                onClick={() => handleSuspend(user.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                title={t('admin.users.actions.suspend')}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(user.id)}
                                className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50"
                                title={t('admin.users.actions.activate')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                              title={t('admin.users.actions.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {users.map((user) => (
                  <div key={user.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-12 w-12">
                          {user.role === 'INFLUENCER' && user.influencer?.profilePic ? (
                            <img
                              src={user.influencer.profilePic}
                              alt={user.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : user.role === 'SALON' && user.salon?.profilePic ? (
                            <img
                              src={user.salon.profilePic}
                              alt={user.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium text-lg">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isVerified(user) ? (
                          <button
                            onClick={() => handleSuspend(user.id)}
                            className="text-red-600 p-2 rounded-lg hover:bg-red-50"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            className="text-green-600 p-2 rounded-lg hover:bg-green-50"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 p-2 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'INFLUENCER' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        isVerified(user)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isVerified(user) 
                          ? t('admin.users.status.active') 
                          : t('admin.users.status.suspended')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {t('admin.common.showing')} {(pagination.page - 1) * pagination.limit + 1} {t('admin.common.to')}{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} {t('admin.common.of')}{' '}
                  {pagination.total} {t('admin.common.results')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('admin.common.previous')}
                  </button>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {t('admin.common.next')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
