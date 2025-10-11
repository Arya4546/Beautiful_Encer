import React, { useState, useEffect, useRef } from 'react';
import { FiUserPlus, FiCheck, FiClock, FiX, FiMessageSquare } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import connectionService, { type ConnectionRequest } from '../services/connection.service';
import { toast } from '../utils/toast.util';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';

export const RequestsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'accepted'>('incoming');
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch requests on component mount and tab change
  useEffect(() => {
    setRequests([]);
    setPage(1);
    setHasMore(true);
    fetchRequests(1);
  }, [activeTab]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) {
      fetchRequests(page);
    }
  }, [page]);

  const fetchRequests = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await connectionService.getRequests(activeTab, pageNum, 20);
      
      if (pageNum === 1) {
        setRequests(response.data);
      } else {
        setRequests((prev) => [...prev, ...response.data]);
      }
      
      setHasMore(response.pagination.hasMore);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load requests', {
        key: `fetch-error-${activeTab}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await connectionService.acceptRequest(requestId);
      toast.success('Request accepted successfully!', { key: `accept-${requestId}` });
      // Refresh the list
      setRequests([]);
      setPage(1);
      fetchRequests(1);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept request', {
        key: `accept-error-${requestId}`,
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await connectionService.rejectRequest(requestId);
      toast.success('Request rejected', { key: `reject-${requestId}` });
      // Refresh the list
      setRequests([]);
      setPage(1);
      fetchRequests(1);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject request', {
        key: `reject-error-${requestId}`,
      });
    }
  };

  const handleWithdrawRequest = async (requestId: string) => {
    try {
      await connectionService.withdrawRequest(requestId);
      toast.success('Request withdrawn', { key: `withdraw-${requestId}` });
      // Refresh the list
      setRequests([]);
      setPage(1);
      fetchRequests(1);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to withdraw request', {
        key: `withdraw-error-${requestId}`,
      });
    }
  };

  const tabs = [
    { id: 'incoming', label: 'Incoming', icon: FiUserPlus },
    { id: 'outgoing', label: 'Outgoing', icon: FiClock },
    { id: 'accepted', label: 'Connections', icon: FiCheck },
  ] as const;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      {/* Header */}
      <div className="bg-white border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-text-primary">Connection Requests</h1>
          <p className="mt-2 text-text-secondary">Manage your network connections</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-magenta border-b-2 border-magenta'
                      : 'text-text-secondary hover:text-text-primary border-b-2 border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && page === 1 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-magenta border-t-transparent"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">
              {activeTab === 'incoming' ? '📬' : activeTab === 'outgoing' ? '📤' : '🤝'}
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              {activeTab === 'incoming' ? 'No incoming requests' : activeTab === 'outgoing' ? 'No outgoing requests' : 'No connections yet'}
            </h3>
            <p className="text-text-secondary">
              {activeTab === 'incoming'
                ? 'You don\'t have any pending requests to respond to'
                : activeTab === 'outgoing'
                ? 'You haven\'t sent any connection requests yet'
                : 'Start connecting with other users to build your network'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                activeTab={activeTab}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                onWithdraw={handleWithdrawRequest}
              />
            ))}

            {/* Loading more */}
            {loading && page > 1 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-magenta border-t-transparent"></div>
              </div>
            )}

            {/* Intersection Observer Target */}
            <div ref={observerTarget} className="h-10" />

            {/* End of Results */}
            {!hasMore && requests.length > 0 && (
              <div className="text-center py-8 text-text-secondary">
                You've reached the end! 🎉
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

// Request Card Component
interface RequestCardProps {
  request: ConnectionRequest;
  activeTab: 'incoming' | 'outgoing' | 'accepted';
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onWithdraw: (requestId: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, activeTab, onAccept, onReject, onWithdraw }) => {
  // Determine which user to show (other than current user)
  const currentUserId = useAuthStore.getState().user?.id;
  const isIncoming = request.receiver.id === currentUserId;

  const otherUser = isIncoming ? request.sender : request.receiver;
  const profilePic = otherUser.influencer?.profilePic || otherUser.salon?.profilePic;
  const displayName = otherUser.role === 'SALON'
    ? (otherUser.salon?.businessName || otherUser.name)
    : otherUser.name;

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-border p-6 hover:shadow-medium transition-all duration-300">
      <div className="flex items-start space-x-4">
        {/* Profile Picture */}
        <div className="relative w-16 h-16 flex-shrink-0">
          {profilePic ? (
            <img
              src={profilePic}
              alt={displayName}
              className="w-full h-full rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-xl font-bold border-2 border-border">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Status Badge */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            request.status === 'PENDING' ? 'bg-amber-500' :
            request.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {request.status === 'PENDING' ? <FiClock size={12} /> :
             request.status === 'ACCEPTED' ? <FiCheck size={12} /> : <FiX size={12} />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary truncate">
                {displayName}
              </h3>
              <p className="text-sm text-text-secondary truncate">{otherUser.email}</p>
              {request.message && (
                <div className="mt-2 flex items-start gap-2">
                  <FiMessageSquare size={16} className="text-magenta flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary italic">"{request.message}"</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {activeTab === 'incoming' && request.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => onAccept(request.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <FiCheck size={16} />
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(request.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <FiX size={16} />
                    Reject
                  </button>
                </>
              )}

              {activeTab === 'outgoing' && request.status === 'PENDING' && (
                <button
                  onClick={() => onWithdraw(request.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <FiX size={16} />
                  Withdraw
                </button>
              )}

              {activeTab === 'accepted' && (
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-medium flex items-center gap-2">
                  <FiCheck size={16} />
                  Connected
                </div>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-text-tertiary mt-2">
            {new Date(request.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
