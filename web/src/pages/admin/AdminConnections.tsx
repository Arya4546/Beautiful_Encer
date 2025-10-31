import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import adminService from '../../services/admin.service';
import { showToast } from '../../utils/toast';
import { format } from 'date-fns';

export const AdminConnections: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadConnections();
  }, [pagination.page, search, statusFilter]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await adminService.getConnections({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setConnections(response.data);
      setPagination(response.pagination);
    } catch (error) {
      showToast.error(t('admin.connections.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (connectionId: string) => {
    if (!window.confirm(t('admin.connections.confirmDelete'))) return;

    try {
      await adminService.deleteConnection(connectionId);
      showToast.success(t('admin.connections.success.deleted'));
      loadConnections();
    } catch (error) {
      showToast.error(t('admin.connections.error.deleteFailed'));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('admin.connections.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.connections.allConnections')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.connections.search')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('admin.connections.filters.all')}</option>
              <option value="PENDING">{t('common.pending')}</option>
              <option value="ACCEPTED">{t('common.connected')}</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('admin.common.noData')}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.connections.table.sender')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.connections.table.receiver')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.connections.table.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.connections.table.date')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('admin.connections.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {connections.map((conn) => (
                      <tr key={conn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{conn.sender.name}</div>
                          <div className="text-xs text-gray-500">{conn.sender.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{conn.receiver.name}</div>
                          <div className="text-xs text-gray-500">{conn.receiver.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            conn.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            conn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {conn.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(conn.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDelete(conn.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200">
                {connections.map((conn) => (
                  <div key={conn.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{conn.sender.name} → {conn.receiver.name}</p>
                        <p className="text-xs text-gray-500">{format(new Date(conn.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                      <button onClick={() => handleDelete(conn.id)} className="text-red-600 p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                      conn.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      conn.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {conn.status}
                    </span>
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
