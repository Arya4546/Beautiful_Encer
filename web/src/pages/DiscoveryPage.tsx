import React, { useState, useEffect, useRef } from 'react';
import { FiUserPlus, FiCheck, FiClock, FiEye, FiMapPin, FiInstagram, FiActivity } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import discoveryService from '../services/discovery.service';
import { showToast } from '../utils/toast';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { FilterPanel, type Filters } from '../components/FilterPanel';
import { ProfileModal } from '../components/ProfileModal';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

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
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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

  const isInfluencer = currentUser?.role === 'INFLUENCER';
  const isSalon = currentUser?.role === 'SALON';

  // Available filter options
  const availableCategories = ['Beauty', 'Fashion', 'Lifestyle', 'Fitness', 'Food', 'Travel', 'Tech', 'Gaming'];
  const availableRegions = ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe'];

  // Fetch users when filters change
  useEffect(() => {
    setUsers([]);
    setPage(1);
    setHasMore(true);
    fetchUsers(1, filters);
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
      } else {
        setUsers((prev) => [...prev, ...transformedUsers]);
      }

      setHasMore(response.pagination.hasMore);
    } catch (error: any) {
      showToast.error(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pt-16">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-magenta/5 to-magenta-light/10 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Discover {isSalon ? 'Influencers' : 'Salons'}
            </h1>
            <p className="text-text-secondary">
              Connect with talented {isSalon ? 'influencers' : 'beauty salons'} and grow your network
            </p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">{/* Users List */}
          {loading && page === 1 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-magenta border-t-transparent"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">🔍</div>
              <h3 className="text-3xl font-bold text-text-primary mb-3">No users found</h3>
              <p className="text-text-secondary text-lg">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {users.map((user) => (
                  <UserListItem key={user.id} user={user} onViewProfile={() => setSelectedUserId(user.id)} />
                ))}
              </div>

              {/* Loading more */}
              {loading && page > 1 && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-magenta border-t-transparent"></div>
                </div>
              )}

              {/* Intersection Observer Target */}
              <div ref={observerTarget} className="h-10" />

              {/* End of Results */}
              {!hasMore && users.length > 0 && (
                <div className="text-center py-12 text-text-secondary text-lg">
                  You've reached the end! 🎉
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
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onViewProfile }) => {
  const { connectionStatus, loading, sendRequest, withdrawRequest, acceptRequest } = useConnectionStatus(user.id);

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

  const handleConnectionAction = async () => {
    if (connectionStatus.status === 'none') {
      await sendRequest();
    } else if (connectionStatus.status === 'sent') {
      await withdrawRequest();
    } else if (connectionStatus.status === 'received') {
      await acceptRequest();
    }
  };

  const getActionButton = () => {
    if (loading) {
      return (
        <button disabled className="p-3 bg-gray-100 rounded-xl cursor-not-allowed">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-magenta border-t-transparent"></div>
        </button>
      );
    }

    switch (connectionStatus.status) {
      case 'connected':
        return (
          <button disabled className="p-3 bg-green-100 rounded-xl cursor-default group relative">
            <FiCheck size={20} className="text-green-600" />
            <span className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Connected
            </span>
          </button>
        );
      case 'sent':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="p-3 bg-amber-100 hover:bg-red-100 rounded-xl transition-colors group relative"
          >
            <FiClock size={20} className="text-amber-600 group-hover:text-red-600" />
            <span className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Cancel Request
            </span>
          </button>
        );
      case 'received':
        return (
          <button 
            onClick={handleConnectionAction} 
            className="p-3 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors group relative"
          >
            <FiUserPlus size={20} className="text-blue-600" />
            <span className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Accept Request
            </span>
          </button>
        );
      default:
        return (
          <button 
            onClick={handleConnectionAction} 
            className="p-3 bg-gradient-to-r from-magenta to-magenta-dark hover:shadow-medium rounded-xl transition-all group relative"
          >
            <FiUserPlus size={20} className="text-white" />
            <span className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Send Request
            </span>
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-large border border-border p-4 md:p-6 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        {/* Profile Picture */}
        <div className="relative flex-shrink-0">
          {profilePic ? (
            <img
              src={profilePic}
              alt={displayName}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-magenta"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-2xl font-bold border-2 border-magenta">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Role Badge */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-medium">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              user.role === 'INFLUENCER' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {user.role === 'INFLUENCER' ? '✨' : '💼'}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-text-primary truncate">
                {displayName}
              </h3>
              {bio && (
                <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                  {bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats & Categories */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 2).map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-background-tertiary text-magenta text-xs font-medium rounded-lg"
                  >
                    {category}
                  </span>
                ))}
                {categories.length > 2 && (
                  <span className="px-2 py-1 bg-background-tertiary text-text-tertiary text-xs font-medium rounded-lg">
                    +{categories.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Region */}
            {region && (
              <div className="flex items-center gap-1 text-text-tertiary text-xs">
                <FiMapPin size={14} />
                <span>{region}</span>
              </div>
            )}

            {/* Followers */}
            {getTotalFollowers() && (
              <div className="flex items-center gap-1 text-text-tertiary text-xs">
                <FiInstagram size={14} />
                <span>{getTotalFollowers()} followers</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-2">
          {/* View Profile */}
          <button 
            onClick={onViewProfile}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group/view relative"
          >
            <FiEye size={20} className="text-text-secondary" />
            <span className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/view:opacity-100 transition-opacity whitespace-nowrap">
              View Profile
            </span>
          </button>

          {/* Connection Action */}
          {getActionButton()}
        </div>
      </div>
    </div>
  );
};
