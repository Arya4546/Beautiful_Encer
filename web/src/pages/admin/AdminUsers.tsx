import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, Ban, CheckCircle, Trash2, Filter } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { UserFormModal } from '../../components/admin/UserFormModal';
import { Pagination } from '../../components/admin/Pagination';
import adminService from '../../services/admin.service';
import { showToast } from '../../utils/toast';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'INFLUENCER' | 'SALON' | 'ADMIN';
  createdAt: string;
  influencer?: {
    profilePic?: string;
    emailVerified: boolean;
    bio?: string;
    region?: string;
  };
  salon?: {
    profilePic?: string;
    emailVerified: boolean;
    businessName?: string;
    description?: string;
  };
}

export const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
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
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [userFormModal, setUserFormModal] = useState<{ open: boolean; user?: User }>({ open: false });
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'suspend' | 'activate' | 'delete';
    userId?: string;
    userName?: string;
  }>({ open: false, type: 'delete' });
  const [actionLoading, setActionLoading] = useState(false);

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

  const isVerified = (user: User) => {
    if (user.role === 'INFLUENCER') {
      return user.influencer?.emailVerified || false;
    }
    return user.salon?.emailVerified || false;
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.userId) return;

    try {
      setActionLoading(true);
      
      switch (confirmModal.type) {
        case 'suspend':
          await adminService.suspendUser(confirmModal.userId);
          showToast.success(t('admin.users.success.suspended'));
          break;
        case 'activate':
          await adminService.activateUser(confirmModal.userId);
          showToast.success(t('admin.users.success.activated'));
          break;
        case 'delete':
          await adminService.deleteUser(confirmModal.userId);
          showToast.success(t('admin.users.success.deleted'));
          break;
      }

      setConfirmModal({ open: false, type: 'delete' });
      loadUsers();
    } catch (error) {
      showToast.error(t('admin.users.error.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const getConfirmModalProps = () => {
    const { type, userName } = confirmModal;
    
    switch (type) {
      case 'suspend':
        return {
          title: t('admin.users.confirmSuspendTitle'),
          message: t('admin.users.confirmSuspend', { name: userName }),
          confirmText: t('admin.users.actions.suspend'),
          type: 'warning' as const,
        };
      case 'activate':
        return {
          title: t('admin.users.confirmActivateTitle'),
          message: t('admin.users.confirmActivate', { name: userName }),
          confirmText: t('admin.users.actions.activate'),
          type: 'info' as const,
        };
      case 'delete':
        return {
          title: t('admin.users.confirmDeleteTitle'),
          message: t('admin.users.confirmDelete', { name: userName }),
          confirmText: t('common.delete'),
          type: 'danger' as const,
        };
    }
  };

  const handleUserFormSubmit = async (data: any) => {
    try {
      if (userFormModal.user) {
        // Edit mode
        await adminService.updateUser(userFormModal.user.id, {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          ...(userFormModal.user.role === 'INFLUENCER' && {
            bio: data.bio,
            region: data.region,
          }),
          ...(userFormModal.user.role === 'SALON' && {
            businessName: data.businessName,
            description: data.description,
          }),
        });
        showToast.success(t('admin.users.success.updated'));
      } else {
        // Create mode
        await adminService.createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          phoneNumber: data.phoneNumber || undefined,
          ...(data.role === 'INFLUENCER' && {
            bio: data.bio || undefined,
            region: data.region || undefined,
          }),
          ...(data.role === 'SALON' && {
            businessName: data.businessName || undefined,
            description: data.description || undefined,
          }),
        });
        showToast.success(t('admin.users.success.created'));
      }
      setUserFormModal({ open: false });
      loadUsers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('admin.users.error.actionFailed');
      showToast.error(errorMessage);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {t('admin.users.title')}
            </h1>
            <p className="text-gray-600 mt-1">{t('admin.users.subtitle')}</p>
          </div>
          <button
            onClick={() => setUserFormModal({ open: true })}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-magenta to-pink-500 text-white rounded-lg font-semibold hover:shadow-medium transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>{t('admin.users.createUser')}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft border border-border overflow-hidden">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('admin.users.searchPlaceholder')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Toggle Button (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-text-secondary hover:bg-background-tertiary transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>{t('common.filter')}</span>
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 ${showFilters ? 'block' : 'hidden sm:grid'}`}>
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent bg-white transition-all"
              >
                <option value="">{t('admin.users.filters.allRoles')}</option>
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
                className="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent bg-white transition-all"
              >
                <option value="">{t('admin.users.filters.allStatus')}</option>
                <option value="true">{t('admin.users.filters.activeOnly')}</option>
                <option value="false">{t('admin.users.filters.suspendedOnly')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-soft border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-gray-600">{t('common.loading')}</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">{t('admin.users.noUsers')}</p>
                <p className="text-sm text-gray-500">{t('admin.users.noUsersDescription')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t('admin.users.table.user')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t('admin.users.table.email')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t('admin.users.table.role')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t('admin.users.table.status')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t('admin.users.table.joined')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {t('admin.users.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {user.role === 'INFLUENCER' && user.influencer?.profilePic ? (
                                <img
                                  src={user.influencer.profilePic}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                                />
                              ) : user.role === 'SALON' && user.salon?.profilePic ? (
                                <img
                                  src={user.salon.profilePic}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-magenta to-pink-500 flex items-center justify-center ring-2 ring-border">
                                  <span className="text-white font-semibold text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                              {user.role === 'SALON' && user.salon?.businessName && (
                                <p className="text-xs text-gray-500 truncate">{user.salon.businessName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.role === 'INFLUENCER' 
                              ? 'bg-pink-100 text-pink-700' 
                              : 'bg-magenta/10 text-magenta-dark'
                          }`}>
                            {user.role === 'INFLUENCER' ? t('common.influencer') : t('common.salon')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            isVerified(user)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {isVerified(user) 
                              ? t('admin.users.status.active') 
                              : t('admin.users.status.suspended')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setUserFormModal({ open: true, user })}
                              className="p-2 text-text-tertiary hover:text-magenta hover:bg-magenta/10 rounded-lg transition-all"
                              title={t('common.edit')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isVerified(user) ? (
                              <button
                                onClick={() => setConfirmModal({
                                  open: true,
                                  type: 'suspend',
                                  userId: user.id,
                                  userName: user.name
                                })}
                                className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-all"
                                title={t('admin.users.actions.suspend')}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmModal({
                                  open: true,
                                  type: 'activate',
                                  userId: user.id,
                                  userName: user.name
                                })}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title={t('admin.users.actions.activate')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmModal({
                                open: true,
                                type: 'delete',
                                userId: user.id,
                                userName: user.name
                              })}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                              title={t('common.delete')}
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

              {/* Mobile & Tablet Cards */}
              <div className="lg:hidden divide-y divide-gray-100">
                {users.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {user.role === 'INFLUENCER' && user.influencer?.profilePic ? (
                          <img
                            src={user.influencer.profilePic}
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                          />
                        ) : user.role === 'SALON' && user.salon?.profilePic ? (
                          <img
                            src={user.salon.profilePic}
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-100"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-magenta to-pink-500 flex items-center justify-center ring-2 ring-border">
                            <span className="text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            {user.role === 'SALON' && user.salon?.businessName && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{user.salon.businessName}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => setUserFormModal({ open: true, user })}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isVerified(user) ? (
                              <button
                                onClick={() => setConfirmModal({
                                  open: true,
                                  type: 'suspend',
                                  userId: user.id,
                                  userName: user.name
                                })}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmModal({
                                  open: true,
                                  type: 'activate',
                                  userId: user.id,
                                  userName: user.name
                                })}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmModal({
                                open: true,
                                type: 'delete',
                                userId: user.id,
                                userName: user.name
                              })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'INFLUENCER' 
                              ? 'bg-pink-100 text-pink-700' 
                              : 'bg-magenta/10 text-magenta-dark'
                          }`}>
                            {user.role === 'INFLUENCER' ? t('common.influencer') : t('common.salon')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isVerified(user)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            </>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={userFormModal.open}
        onClose={() => setUserFormModal({ open: false })}
        onSubmit={handleUserFormSubmit}
        user={userFormModal.user}
        mode={userFormModal.user ? 'edit' : 'create'}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        {...getConfirmModalProps()}
      />
    </AdminLayout>
  );
};
