import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import adminService from '../../services/admin.service';
import { showToast } from '../../utils/toast';
import { format } from 'date-fns';

export const AdminActivityLogs: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [pagination.page, search, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getActivityLogs({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        action: actionFilter || undefined,
      });
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      showToast.error(t('admin.activityLogs.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('admin.activityLogs.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.activityLogs.allLogs')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.activityLogs.search')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('admin.activityLogs.filters.all')}</option>
              <option value="USER_SUSPENDED">{t('admin.activityLogs.actions.userSuspended')}</option>
              <option value="USER_ACTIVATED">{t('admin.activityLogs.actions.userActivated')}</option>
              <option value="USER_DELETED">{t('admin.activityLogs.actions.userDeleted')}</option>
              <option value="CONNECTION_DELETED">{t('admin.activityLogs.actions.connectionDeleted')}</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('admin.common.noData')}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.activityLogs.table.action')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.activityLogs.table.description')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.activityLogs.table.target')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.activityLogs.table.date')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.activityLogs.table.ip')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary bg-opacity-10 text-primary">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{log.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.targetUserName && (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{log.targetUserName}</div>
                              <div className="text-xs text-gray-500">{log.targetUserEmail}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary bg-opacity-10 text-primary">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{log.description}</p>
                    {log.targetUserName && (
                      <p className="text-xs text-gray-500">{log.targetUserName}</p>
                    )}
                  </div>
                ))}
              </div>

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
                    className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('admin.common.previous')}
                  </button>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
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
