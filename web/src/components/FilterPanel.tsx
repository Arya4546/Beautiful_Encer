import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';

export interface Filters {
  search: string;
  region: string;
  categories: string[];
  minFollowers: number;
  maxFollowers: number;
}

interface FilterPanelProps {
  onFilterChange: (filters: Filters) => void;
  availableCategories: string[];
  availableRegions: string[];
  isInfluencerSearch?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  availableCategories,
  availableRegions,
  isInfluencerSearch = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    region: '',
    categories: [],
    minFollowers: 0,
    maxFollowers: 1000000,
  });

  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchInput]);

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      region: '',
      categories: [],
      minFollowers: 0,
      maxFollowers: 1000000,
    });
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.region ? 1 : 0) +
    filters.categories.length +
    (filters.minFollowers > 0 ? 1 : 0) +
    (filters.maxFollowers < 1000000 ? 1 : 0);

  const followerRanges = [
    { label: 'Any', min: 0, max: 1000000 },
    { label: '1K - 10K', min: 1000, max: 10000 },
    { label: '10K - 50K', min: 10000, max: 50000 },
    { label: '50K - 100K', min: 50000, max: 100000 },
    { label: '100K - 500K', min: 100000, max: 500000 },
    { label: '500K+', min: 500000, max: 10000000 },
  ];

  return (
    <div className="bg-white border-b border-border sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
            <input
              type="text"
              placeholder={`Search ${isInfluencerSearch ? 'influencers' : 'salons'}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <FiX size={20} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isOpen
                ? 'bg-magenta text-white shadow-medium'
                : 'bg-background border border-border hover:border-magenta text-text-primary'
            }`}
          >
            <FiFilter size={20} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                isOpen ? 'bg-white text-magenta' : 'bg-magenta text-white'
              }`}>
                {activeFilterCount}
              </span>
            )}
            <FiChevronDown
              size={16}
              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Expanded Filters */}
        {isOpen && (
          <div className="mt-4 p-6 bg-background rounded-2xl border border-border space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Advanced Filters</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-magenta hover:underline font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Region Filter */}
            {isInfluencerSearch && availableRegions.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  Region
                </label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
                >
                  <option value="">All Regions</option>
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Categories Filter */}
            {availableCategories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((category) => {
                    const isSelected = filters.categories.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-magenta text-white shadow-medium'
                            : 'bg-white border border-border text-text-primary hover:border-magenta'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Follower Range Filter (for influencer search only) */}
            {isInfluencerSearch && (
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-3">
                  Follower Count
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {followerRanges.map((range) => {
                    const isSelected =
                      filters.minFollowers === range.min && filters.maxFollowers === range.max;
                    return (
                      <button
                        key={range.label}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            minFollowers: range.min,
                            maxFollowers: range.max,
                          })
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-magenta text-white shadow-medium'
                            : 'bg-white border border-border text-text-primary hover:border-magenta'
                        }`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
