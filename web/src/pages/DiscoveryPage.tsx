import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUserPlus, FiCheck, FiClock, FiEye, FiMapPin, FiInstagram, FiActivity, FiUsers, FiStar, FiTrendingUp, FiHeart } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';
import discoveryService from '../services/discovery.service';
import connectionService, { type ConnectionStatus } from '../services/connection.service';
import { showToast } from '../utils/toast';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { FilterPanel, type Filters } from '../components/FilterPanel';
import { ProfileModal } from '../components/ProfileModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'INFLUENCER' | 'SALON';
  influencer?: {
    id: string;
    profilePic?: string;
    bio?: string;
    categories: string[];
    region?: string;
    socialMediaAccounts?: any[];
  };
  salon?: {
    id: string;
    businessName?: string;
    profilePic?: string;
    description?: string;
    preferredCategories?: string[];
  };
}

export const DiscoveryPage: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    region: '',
    categories: [],
    minFollowers: 0,
    maxFollowers: 1000000,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchKey = useRef<string>('');
  const lastSuccessfulFetch = useRef<number>(0);
  const isMountedRef = useRef(true);

  const isInfluencer = currentUser?.role === 'INFLUENCER';
  const isSalon = currentUser?.role === 'SALON';

  // Track component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isFetchingRef.current = false;
    };
  }, []);

  // Available filter options
  const availableCategories = ['Beauty', 'Fashion', 'Lifestyle', 'Fitness', 'Food', 'Travel', 'Tech', 'Gaming'];
  const availableRegions = ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe'];

  // Fetch users when filters change (with debounce for search)
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      const fetchKey = `${JSON.stringify(filters)}_1`;
      
      // Prevent duplicate fetches
      if (lastFetchKey.current === fetchKey || isFetchingRef.current) {
        return;
      }
      
      lastFetchKey.current = fetchKey;
      setUsers([]);
      setPage(1);
      setHasMore(true);
      fetchUsers(1, filters);
    }, filters.search ? 800 : 500); // Increased delays to prevent rate limiting

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [filters]);

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
      fetchUsers(page, filters);
    }
  }, [page]);

  const fetchUsers = async (pageNum: number, currentFilters: Filters) => {
    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('⏸️ Component unmounted, skipping fetch...');
      return;
    }
    
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      console.log('⏸️ Fetch already in progress, skipping...');
      return;
    }
    
    // Prevent requests within 1 second of last successful fetch (for page 1)
    if (pageNum === 1) {
      const timeSinceLastFetch = Date.now() - lastSuccessfulFetch.current;
      if (timeSinceLastFetch < 1000) {
        console.log('⏸️ Too soon after last fetch, skipping...');
        return;
      }
    }
    
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      let response;
      let transformedUsers: User[] = [];

      const filterParams = {
        page: pageNum,
        limit: 12,
        search: currentFilters.search || undefined,
        region: currentFilters.region || undefined,
        categories: currentFilters.categories.length > 0 ? currentFilters.categories : undefined,
        minFollowers: currentFilters.minFollowers > 0 ? currentFilters.minFollowers : undefined,
        maxFollowers: currentFilters.maxFollowers < 1000000 ? currentFilters.maxFollowers : undefined,
      };

      if (isSalon) {
        response = await discoveryService.getInfluencers(filterParams);
        transformedUsers = response.data.map((inf: any) => ({
          id: inf.user.id,
          name: inf.user.name,
          email: inf.user.email,
          role: 'INFLUENCER' as const,
          influencer: {
            id: inf.id,
            profilePic: inf.profilePic,
            bio: inf.bio,
            categories: inf.categories,
            region: inf.region,
            socialMediaAccounts: inf.socialMediaAccounts,
          },
        }));
      } else {
        response = await discoveryService.getSalons(filterParams);
        transformedUsers = response.data.map((salon: any) => ({
          id: salon.user.id,
          name: salon.user.name,
          email: salon.user.email,
          role: 'SALON' as const,
          salon: {
            id: salon.id,
            businessName: salon.businessName,
            profilePic: salon.profilePic,
            description: salon.description,
            preferredCategories: salon.preferredCategories,
          },
        }));
      }

      if (pageNum === 1) {
        setUsers(transformedUsers);
        setTotalCount(response.pagination.total || transformedUsers.length);
        lastSuccessfulFetch.current = Date.now(); // Track successful fetch
      } else {
        setUsers((prev) => [...prev, ...transformedUsers]);
      }

      setHasMore(response.pagination.hasMore);

      // Fetch connection statuses in bulk for new users
      if (transformedUsers.length > 0) {
        fetchConnectionStatuses(transformedUsers.map(u => u.id));
      }
    } catch (error: any) {
      console.error('❌ Discovery fetch error:', error);
      showToast.error(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchConnectionStatuses = async (userIds: string[]) => {
    try {
      const response = await connectionService.checkBulkConnectionStatus(userIds);
      const newStatuses = response.data;
      setConnectionStatuses(prev => ({ ...prev, ...newStatuses }));
      
      // Count connected users from all fetched statuses
      const allStatuses = { ...connectionStatuses, ...newStatuses };
      const connected = Object.values(allStatuses).filter(s => s.status === 'connected').length;
      setConnectedCount(connected);
    } catch (error) {
      console.error('Failed to fetch connection statuses:', error);
      // Silent fail - connection buttons will show default state
    }
  };

  const updateConnectionStatus = (userId: string, status: ConnectionStatus) => {
    setConnectionStatuses(prev => ({ ...prev, [userId]: status }));
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pt-16">
        {/* Premium Welcome Section with Stats */}
        <div className="bg-gradient-to-br from-magenta via-magenta-light to-purple text-white relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <FiStar className="text-yellow-300" size={18} />
                  <span className="text-sm font-semibold">
                    {isSalon ? t('discovery.premium.findInfluencers', 'Find Premium Influencers') : t('discovery.premium.findSalons', 'Discover Top Salons')}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                  {isSalon ? t('discovery.titleInfluencers') : t('discovery.title')}
                </h1>
                
                <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                  {isSalon 
                    ? t('discovery.subtitleInfluencers', 'Connect with talented nano and micro-influencers to grow your salon brand') 
                    : t('discovery.subtitle', 'Find the perfect salons for your next collaboration')}
                </p>
              </div>

              {/* Right Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <FiUsers className="text-white" size={24} />
                  </div>
                  <p className="text-3xl font-bold mb-1">{totalCount > 0 ? totalCount : users.length}</p>
                  <p className="text-sm text-white/80">{isSalon ? t('discovery.stats.influencers') : t('discovery.stats.salons')}</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <FiTrendingUp className="text-white" size={24} />
                  </div>
                  <p className="text-3xl font-bold mb-1">{connectedCount}</p>
                  <p className="text-sm text-white/80">{t('discovery.stats.connected')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          onFilterChange={handleFilterChange}
          availableCategories={availableCategories}
          availableRegions={availableRegions}
          isInfluencerSearch={isSalon}
        />

        {/* Users List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {/* Results Count & View Toggle */}
          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-magenta/10 to-purple/10 border border-magenta/20 rounded-xl px-4 py-2">
                  <p className="text-sm font-semibold text-magenta">
                    <span className="text-2xl font-bold">{totalCount > 0 ? totalCount : users.length}</span> {isSalon ? t('discovery.stats.influencers') : t('discovery.stats.salons')} {t('discovery.stats.found')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <FiTrendingUp size={16} />
                <span>{t('discovery.stats.sortedBy')}</span>
              </div>
            </div>
          )}

          {/* Users List */}
          {loading && page === 1 ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-magenta/20 border-t-magenta"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiUsers className="text-magenta" size={32} />
                </div>
              </div>
              <p className="mt-4 text-text-secondary font-medium">
                {t('discovery.loading', 'Discovering amazing profiles...')}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative inline-block mb-6">
                <div className="text-8xl">🔍</div>
                <div className="absolute -top-2 -right-2 bg-magenta text-white rounded-full p-2">
                  <FiUsers size={24} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-text-primary mb-3">
                {t('discovery.noResults', 'No results found')}
              </h3>
              <p className="text-text-secondary text-lg max-w-md mx-auto">
                {t('discovery.noResultsSubtitle', 'Try adjusting your filters or search criteria')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {users.map((user) => (
                  <UserListItem 
                    key={user.id} 
                    user={user} 
                    onViewProfile={() => setSelectedUserId(user.id)}
                    connectionStatus={connectionStatuses[user.id] || { status: 'none', requestId: null }}
                    onStatusChange={(status) => updateConnectionStatus(user.id, status)}
                  />
                ))}
              </div>

              {/* Loading more */}
              {loading && page > 1 && (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-magenta/20 border-t-magenta"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FiActivity className="text-magenta animate-pulse" size={20} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary font-medium">{t('discovery.loadingMore')}</p>
                </div>
              )}

              {/* Intersection Observer Target */}
              <div ref={observerTarget} className="h-10" />

              {/* End of Results */}
              {!hasMore && users.length > 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-magenta/5 to-purple/5 border-2 border-dashed border-magenta/30 rounded-2xl">
                    <FiCheck className="text-magenta" size={24} />
                    <div className="text-left">
                      <p className="text-lg font-bold text-text-primary">
                        {t('discovery.allLoaded', 'All caught up!')}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {t('discovery.endOfResults', "You've seen all available profiles")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileModal
          userId={selectedUserId}
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      <BottomNav />
    </div>
  );
};

// User List Item Component
interface UserListItemProps {
  user: User;
  onViewProfile: () => void;
  connectionStatus: ConnectionStatus;
  onStatusChange: (status: ConnectionStatus) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onViewProfile, connectionStatus, onStatusChange }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const profilePic = user.influencer?.profilePic || user.salon?.profilePic;
  const displayName = user.role === 'SALON' 
    ? (user.salon?.businessName || user.name)
    : user.name;
  const bio = user.influencer?.bio || user.salon?.description;
  const categories = user.influencer?.categories || user.salon?.preferredCategories || [];
  const region = user.influencer?.region;
  const socialAccounts = user.influencer?.socialMediaAccounts;

  const getTotalFollowers = () => {
    if (!socialAccounts || socialAccounts.length === 0) return null;
    const total = socialAccounts.reduce((sum, acc) => sum + (acc.followersCount || 0), 0);
    if (total >= 1000000) return `${(total / 1000000).toFixed(1)}M`;
    if (total >= 1000) return `${(total / 1000).toFixed(1)}K`;
    return total.toString();
  };

  const getEngagementRate = () => {
    if (!socialAccounts || socialAccounts.length === 0) return null;
    const avgEngagement = socialAccounts.reduce((sum, acc) => sum + (acc.engagementRate || 0), 0) / socialAccounts.length;
    return avgEngagement.toFixed(2);
  };

  const getSocialPlatforms = () => {
    if (!socialAccounts || socialAccounts.length === 0) return [];
    return socialAccounts.map(acc => acc.platform.toUpperCase());
  };

  const handleConnectionAction = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (connectionStatus.status === 'none') {
        await connectionService.sendRequest({ receiverId: user.id });
        onStatusChange({ status: 'sent' });
        showToast.success('Connection request sent!');
      } else if (connectionStatus.status === 'sent' && connectionStatus.requestId) {
        await connectionService.withdrawRequest(connectionStatus.requestId);
        onStatusChange({ status: 'none' });
        showToast.success('Request withdrawn');
      } else if (connectionStatus.status === 'received' && connectionStatus.requestId) {
        await connectionService.acceptRequest(connectionStatus.requestId);
        onStatusChange({ status: 'connected', requestId: connectionStatus.requestId });
        showToast.success('Request accepted!');
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.error || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const getActionButton = () => {
    if (loading) {
      return (
        <button disabled className="w-full px-6 py-3 bg-gray-100 rounded-xl cursor-not-allowed">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-magenta border-t-transparent"></div>
            <span className="text-sm font-semibold text-gray-400">{t('discovery.card.processing')}</span>
          </div>
        </button>
      );
    }

    switch (connectionStatus.status) {
      case 'connected':
        return (
          <button disabled className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl cursor-default shadow-soft border border-green-400">
            <div className="flex items-center justify-center gap-2">
              <FiCheck size={20} className="text-white" />
              <span className="text-sm font-bold text-white">{t('discovery.card.connected')}</span>
            </div>
          </button>
        );
      case 'sent':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="w-full px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-red-500 hover:to-red-600 rounded-xl transition-all shadow-soft hover:shadow-medium border border-amber-300 hover:border-red-400"
          >
            <div className="flex items-center justify-center gap-2">
              <FiClock size={20} className="text-white" />
              <span className="text-sm font-bold text-white">{t('discovery.card.pending')}</span>
            </div>
          </button>
        );
      case 'received':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all shadow-soft hover:shadow-medium border border-blue-400"
          >
            <div className="flex items-center justify-center gap-2">
              <FiUserPlus size={20} className="text-white" />
              <span className="text-sm font-bold text-white">{t('discovery.card.accept')}</span>
            </div>
          </button>
        );
      default:
        return (
          <button 
            onClick={handleConnectionAction} 
            className="w-full px-6 py-3 bg-gradient-to-r from-magenta via-magenta-light to-purple hover:from-magenta-dark hover:via-magenta hover:to-purple-dark rounded-xl transition-all shadow-soft hover:shadow-large border border-magenta/30"
          >
            <div className="flex items-center justify-center gap-2">
              <FiUserPlus size={20} className="text-white" />
              <span className="text-sm font-bold text-white">{t('discovery.card.connect')}</span>
            </div>
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-large border border-border p-6 transition-all duration-300 group relative overflow-hidden">
      {/* Premium Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-magenta/0 via-magenta/0 to-purple/0 group-hover:from-magenta/5 group-hover:via-magenta-light/5 group-hover:to-purple/5 transition-all duration-500 pointer-events-none"></div>
      
      <div className="relative flex flex-col md:flex-row gap-6">
        {/* Profile Picture Section */}
        <div className="flex-shrink-0 flex items-start gap-4 md:block">
          <div className="relative">
            {profilePic ? (
              <img
                src={profilePic}
                alt={displayName}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-magenta/20 group-hover:border-magenta/40 transition-all shadow-medium group-hover:shadow-large"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-magenta via-magenta-light to-purple flex items-center justify-center text-white text-3xl font-bold border-4 border-magenta/20 group-hover:border-magenta/40 transition-all shadow-medium">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Premium Badge for Featured Users */}
            {getTotalFollowers() && parseInt(getTotalFollowers()!.replace(/[^\d]/g, '')) > 10 && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-1.5 shadow-lg border-2 border-white">
                <FiStar className="text-white" size={14} />
              </div>
            )}
            
            {/* Role Badge */}
            <div className="absolute -bottom-2 -right-2 bg-white rounded-xl p-1.5 shadow-lg border-2 border-gray-100">
              <div className={`px-2 py-1 rounded-lg flex items-center justify-center text-xs font-bold ${
                user.role === 'INFLUENCER' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
              }`}>
                {user.role === 'INFLUENCER' ? `✨ ${t('discovery.card.influencer')}` : `💼 ${t('discovery.card.salon')}`}
              </div>
            </div>
          </div>

          {/* Social Platform Icons */}
          <div className="flex md:flex-col gap-2 mt-0 md:mt-3">
            {getSocialPlatforms().includes('INSTAGRAM') && (
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2 rounded-lg shadow-medium hover:shadow-large transition-all">
                <FiInstagram className="text-white" size={16} />
              </div>
            )}
            {getSocialPlatforms().includes('TIKTOK') && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-700 p-2 rounded-lg shadow-medium hover:shadow-large transition-all">
                <FaTiktok className="text-white" size={16} />
              </div>
            )}
          </div>
        </div>

        {/* User Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-1 truncate group-hover:text-magenta transition-colors">
                {displayName}
              </h3>
              {bio && (
                <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                  {bio}
                </p>
              )}
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.slice(0, 3).map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-gradient-to-r from-magenta/10 to-purple/10 hover:from-magenta/20 hover:to-purple/20 text-magenta text-xs font-semibold rounded-lg border border-magenta/20 transition-all"
                >
                  {category}
                </span>
              ))}
              {categories.length > 3 && (
                <span className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-text-tertiary text-xs font-semibold rounded-lg transition-all">
                  +{categories.length - 3} {t('discovery.card.more')}
                </span>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Region */}
            {region && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-magenta/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <FiMapPin className="text-magenta flex-shrink-0" size={16} />
                  <span className="text-xs text-text-tertiary font-medium">{t('discovery.card.location')}</span>
                </div>
                <p className="text-sm font-bold text-text-primary truncate">{region}</p>
              </div>
            )}

            {/* Followers */}
            {getTotalFollowers() && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-200 hover:border-pink-300 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <FiUsers className="text-pink-600 flex-shrink-0" size={16} />
                  <span className="text-xs text-pink-700 font-medium">{t('discovery.card.followers')}</span>
                </div>
                <p className="text-sm font-bold text-pink-800">{getTotalFollowers()}</p>
              </div>
            )}

            {/* Engagement Rate */}
            {getEngagementRate() && (
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-3 border border-green-200 hover:border-green-300 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <FiHeart className="text-green-600 flex-shrink-0" size={16} />
                  <span className="text-xs text-green-700 font-medium">{t('discovery.card.engagement')}</span>
                </div>
                <p className="text-sm font-bold text-green-800">{getEngagementRate()}%</p>
              </div>
            )}

            {/* Connection Status Indicator */}
            {connectionStatus.status === 'connected' && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <FiCheck className="text-green-600 flex-shrink-0" size={16} />
                  <span className="text-xs text-green-700 font-medium">{t('discovery.card.status')}</span>
                </div>
                <p className="text-sm font-bold text-green-800">{t('discovery.card.connected')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex md:flex-col gap-3 justify-end items-center md:items-end">
          {/* View Profile Button */}
          <button 
            onClick={onViewProfile}
            className="flex-1 md:flex-initial px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 rounded-xl transition-all group/view shadow-soft hover:shadow-medium border border-gray-200"
          >
            <div className="flex items-center justify-center gap-2">
              <FiEye size={20} className="text-text-secondary group-hover/view:text-magenta transition-colors" />
              <span className="text-sm font-semibold text-text-secondary group-hover/view:text-magenta transition-colors">
                {t('discovery.card.viewProfile')}
              </span>
            </div>
          </button>

          {/* Connection Action Button */}
          <div className="flex-1 md:flex-initial">
            {getActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
};
