import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiFilter, FiUserPlus, FiCheck, FiClock, FiX } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import discoveryService from '../services/discovery.service';
import { toast } from '../utils/toast.util';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const isInfluencer = currentUser?.role === 'INFLUENCER';
  const isSalon = currentUser?.role === 'SALON';

  useEffect(() => {
    fetchUsers(1);
  }, []);

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
      fetchUsers(page);
    }
  }, [page]);

  const fetchUsers = async (pageNum: number) => {
    setLoading(true);
    try {
      let response;
      let transformedUsers: User[] = [];

      if (isSalon) {
        response = await discoveryService.getInfluencers({ page: pageNum, limit: 12, search: searchTerm });
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
        response = await discoveryService.getSalons({ page: pageNum, limit: 12, search: searchTerm });
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
      toast.error(error.response?.data?.error || 'Failed to load users', { key: 'fetch-users-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setUsers([]);
    setPage(1);
    setHasMore(true);
    fetchUsers(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Discover {isSalon ? 'Influencers' : 'Salons'}
          </h1>
          <p className="text-text-secondary text-lg">
            Connect with talented {isSalon ? 'influencers' : 'beauty salons'} and grow your network
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary" size={20} />
              <input
                type="text"
                placeholder={`Search ${isSalon ? 'influencers' : 'salons'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-white text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-4 bg-magenta text-white rounded-2xl font-semibold hover:bg-magenta-dark transition-all shadow-soft hover:shadow-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Users Grid */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
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

      <BottomNav />
    </div>
  );
};

// User Card Component
interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const { connectionStatus, loading, sendRequest, withdrawRequest } = useConnectionStatus(user.id);

  const profilePic = user.influencer?.profilePic || user.salon?.profilePic;
  const displayName = user.role === 'SALON' 
    ? (user.salon?.businessName || user.name)
    : user.name;
  const bio = user.influencer?.bio || user.salon?.description;
  const categories = user.influencer?.categories || user.salon?.preferredCategories || [];

  const handleConnectionAction = async () => {
    if (connectionStatus.status === 'none') {
      await sendRequest();
    } else if (connectionStatus.status === 'sent') {
      await withdrawRequest();
    }
  };

  const getButtonConfig = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return {
          text: 'Connected',
          icon: FiCheck,
          className: 'bg-green-500 text-white cursor-default',
          disabled: true,
        };
      case 'sent':
        return {
          text: 'Pending',
          icon: FiClock,
          className: 'bg-amber-500 text-white hover:bg-red-500',
          disabled: false,
        };
      case 'received':
        return {
          text: 'Respond',
          icon: FiUserPlus,
          className: 'bg-blue-500 text-white hover:bg-blue-600',
          disabled: false,
        };
      default:
        return {
          text: 'Connect',
          icon: FiUserPlus,
          className: 'bg-magenta text-white hover:bg-magenta-dark',
          disabled: false,
        };
    }
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  return (
    <div className="bg-white rounded-3xl shadow-soft hover:shadow-large border border-border overflow-hidden transition-all duration-300 group">
      {/* Profile Image */}
      <div className="relative h-48 bg-gradient-to-br from-magenta-light to-magenta overflow-hidden">
        {profilePic ? (
          <img
            src={profilePic}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Role Badge */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-magenta">
          {user.role === 'INFLUENCER' ? '✨ Influencer' : '💼 Salon'}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-text-primary mb-2 truncate">
          {displayName}
        </h3>
        
        {bio && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
            {bio}
          </p>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.slice(0, 3).map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-background-tertiary text-magenta text-xs font-medium rounded-full"
              >
                {category}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="px-3 py-1 bg-background-tertiary text-text-tertiary text-xs font-medium rounded-full">
                +{categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Connect Button */}
        <button
          onClick={handleConnectionAction}
          disabled={buttonConfig.disabled || loading}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${buttonConfig.className} ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <ButtonIcon size={18} />
              {buttonConfig.text}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
