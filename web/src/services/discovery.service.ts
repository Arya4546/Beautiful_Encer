import axiosInstance from '../lib/axios';
import type { InfluencerWithDetails, SalonWithDetails, PaginationMeta } from '../types';

export interface DiscoveryFilters {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  categories?: string[];
}

export interface DiscoveryResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

class DiscoveryService {
  /**
   * Get influencers for salon dashboard
   */
  async getInfluencers(filters: DiscoveryFilters = {}): Promise<DiscoveryResponse<InfluencerWithDetails>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.region) params.append('region', filters.region);
    if (filters.categories && filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }

    const response = await axiosInstance.get(`/discovery/influencers?${params.toString()}`);
    return response.data;
  }

  /**
   * Get salons for influencer dashboard
   */
  async getSalons(filters: DiscoveryFilters = {}): Promise<DiscoveryResponse<SalonWithDetails>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.categories && filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }

    const response = await axiosInstance.get(`/discovery/salons?${params.toString()}`);
    return response.data;
  }

  /**
   * Get available regions
   */
  async getRegions(): Promise<string[]> {
    const response = await axiosInstance.get('/discovery/regions');
    return response.data.data;
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<string[]> {
    const response = await axiosInstance.get('/discovery/categories');
    return response.data.data;
  }
}

export default new DiscoveryService();
