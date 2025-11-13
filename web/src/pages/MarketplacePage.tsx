import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiX, FiMapPin, FiClock, FiDollarSign, 
  FiTag, FiCalendar, FiEye, FiFileText, FiTrendingUp 
} from 'react-icons/fi';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../store/authStore';
import { usePublicProjects, useCategories, usePopularTags } from '../hooks/useMarketplace';
import { type Project, type ProjectFilters, type ProjectType, type ProjectStatus } from '../services/marketplace.service';

// Project Type Badge Component
const ProjectTypeBadge: React.FC<{ type: ProjectType }> = ({ type }) => {
  const { t } = useTranslation();
  
  const typeColors: Record<ProjectType, string> = {
    'SPONSORED_POST': 'bg-blue-100 text-blue-700',
    'PRODUCT_REVIEW': 'bg-purple-100 text-purple-700',
    'BRAND_AMBASSADOR': 'bg-pink-100 text-pink-700',
    'EVENT_COVERAGE': 'bg-red-100 text-red-700',
    'TUTORIAL_VIDEO': 'bg-orange-100 text-orange-700',
    'UNBOXING': 'bg-green-100 text-green-700',
    'GIVEAWAY': 'bg-indigo-100 text-indigo-700',
    'COLLABORATION': 'bg-teal-100 text-teal-700',
    'STORE_VISIT': 'bg-yellow-100 text-yellow-700',
    'OTHER': 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
      {t(`marketplace.projectTypes.${type.toLowerCase().replace('_', '')}`)}
    </span>
  );
};

// Project Card Component
const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
  const { t } = useTranslation();
  
  const formatBudget = (budget?: number) => {
    if (!budget) return t('marketplace.filters.budgetNotSpecified');
    return `¥${budget.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-soft hover:shadow-medium transition-all cursor-pointer p-6 border border-border"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
            {project.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <ProjectTypeBadge type={project.projectType} />
            {project.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                <FiTag size={12} className="mr-1" />
                {project.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-4 line-clamp-3">
        {project.description}
      </p>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center text-sm text-text-secondary">
          <FiDollarSign size={16} className="mr-2 text-magenta" />
          <span>{formatBudget(project.budget)}</span>
        </div>
        
        {project.location && (
          <div className="flex items-center text-sm text-text-secondary">
            <FiMapPin size={16} className="mr-2 text-magenta" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        {project.applicationDeadline && (
          <div className="flex items-center text-sm text-text-secondary">
            <FiCalendar size={16} className="mr-2 text-magenta" />
            <span>{formatDate(project.applicationDeadline)}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-text-secondary">
          <FiFileText size={16} className="mr-2 text-magenta" />
          <span>{project.applicationCount || 0} {t('marketplace.projectCard.applications')}</span>
        </div>
      </div>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-background-secondary text-text-secondary"
            >
              #{tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-background-secondary text-text-secondary">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center">
          {project.salon?.profilePic ? (
            <img
              src={project.salon.profilePic}
              alt={project.salon.businessName || 'Salon'}
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-magenta to-magenta-dark flex items-center justify-center text-white text-sm font-semibold mr-2">
              {project.salon?.businessName?.charAt(0) || 'S'}
            </div>
          )}
          <span className="text-sm font-medium text-text-primary">
            {project.salon?.businessName || t('marketplace.projectCard.unknownSalon')}
          </span>
        </div>
        
        <div className="flex items-center text-xs text-text-tertiary">
          <FiEye size={14} className="mr-1" />
          {project.viewCount || 0}
        </div>
      </div>
    </div>
  );
};

// Filter Sidebar Component
const FilterSidebar: React.FC<{
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onClose: () => void;
  isOpen: boolean;
}> = ({ filters, onFiltersChange, onClose, isOpen }) => {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const { data: popularTags } = usePopularTags();

  const projectTypes: ProjectType[] = [
    'SPONSORED_POST',
    'PRODUCT_REVIEW',
    'BRAND_AMBASSADOR',
    'EVENT_COVERAGE',
    'TUTORIAL_VIDEO',
    'UNBOXING',
    'GIVEAWAY',
    'COLLABORATION',
    'STORE_VISIT',
    'OTHER',
  ];

  const handleFilterChange = (key: keyof ProjectFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Filter Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen w-80 bg-white border-r border-border overflow-y-auto z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary flex items-center">
              <FiFilter className="mr-2" />
              {t('marketplace.filters.title')}
            </h2>
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-background-secondary rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.filters.search')}
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" size={18} />
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={t('marketplace.filters.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.filters.category')}
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
            >
              <option value="">{t('marketplace.filters.allCategories')}</option>
              {categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Project Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.filters.projectType')}
            </label>
            <select
              value={filters.projectType || ''}
              onChange={(e) => handleFilterChange('projectType', e.target.value as ProjectType || undefined)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
            >
              <option value="">{t('marketplace.filters.allTypes')}</option>
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`marketplace.projectTypes.${type.toLowerCase().replace('_', '')}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.filters.budget')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  value={filters.minBudget || ''}
                  onChange={(e) => handleFilterChange('minBudget', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={t('marketplace.filters.min')}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={filters.maxBudget || ''}
                  onChange={(e) => handleFilterChange('maxBudget', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={t('marketplace.filters.max')}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('marketplace.filters.location')}
            </label>
            <input
              type="text"
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
              placeholder={t('marketplace.filters.locationPlaceholder')}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
            />
          </div>

          {/* Tags */}
          {popularTags && popularTags.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('marketplace.filters.popularTags')}
              </label>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tagObj) => {
                  const isSelected = filters.tags?.includes(tagObj.tag);
                  return (
                    <button
                      key={tagObj.tag}
                      onClick={() => {
                        const newTags = isSelected
                          ? filters.tags?.filter((t) => t !== tagObj.tag)
                          : [...(filters.tags || []), tagObj.tag];
                        handleFilterChange('tags', newTags && newTags.length > 0 ? newTags : undefined);
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-magenta text-white'
                          : 'bg-background-secondary text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      #{tagObj.tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          <button
            onClick={() =>
              onFiltersChange({
                search: undefined,
                category: undefined,
                projectType: undefined,
                minBudget: undefined,
                maxBudget: undefined,
                location: undefined,
                tags: undefined,
              })
            }
            className="w-full px-4 py-2 text-sm font-medium text-magenta border border-magenta rounded-lg hover:bg-magenta hover:text-white transition-colors"
          >
            {t('marketplace.filters.clearAll')}
          </button>
        </div>
      </div>
    </>
  );
};

// Main Marketplace Page Component
export const MarketplacePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [page, setPage] = useState(1);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch projects with filters
  const { data, isLoading, isFetching, refetch } = usePublicProjects(filters);

  const projects = data?.data || [];
  const pagination = data?.pagination;

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination?.hasMore && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [pagination?.hasMore, isFetching]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/marketplace/projects/${projectId}`);
  };

  const handleFiltersChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length;

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />
      <Sidebar />
      
      <div className="md:ml-64 pt-16 pb-20 md:pb-6">
        <div className="flex">
          {/* Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClose={() => setFilterSidebarOpen(false)}
            isOpen={filterSidebarOpen}
          />

          {/* Main Content */}
          <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-text-primary mb-2">
                    {t('marketplace.title')}
                  </h1>
                  <p className="text-text-secondary">
                    {t('marketplace.subtitle')}
                  </p>
                </div>
                
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setFilterSidebarOpen(true)}
                  className="md:hidden flex items-center px-4 py-2 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors"
                >
                  <FiFilter className="mr-2" />
                  {t('marketplace.filters.title')}
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white text-magenta rounded-full text-xs font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Stats */}
              {pagination && (
                <div className="flex items-center gap-6 text-sm text-text-secondary">
                  <div className="flex items-center">
                    <FiFileText className="mr-2" />
                    <span>
                      {pagination.total} {t('marketplace.stats.projects')}
                    </span>
                  </div>
                  {activeFiltersCount > 0 && (
                    <div className="flex items-center">
                      <FiFilter className="mr-2" />
                      <span>
                        {activeFiltersCount} {t('marketplace.stats.filtersActive')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Projects Grid */}
            {isLoading && page === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-soft p-6 border border-border animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 rounded mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project: Project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => handleProjectClick(project.id)}
                    />
                  ))}
                </div>

                {/* Load More Observer */}
                {pagination?.hasMore && (
                  <div ref={observerTarget} className="mt-8 text-center">
                    {isFetching && (
                      <div className="inline-flex items-center text-magenta">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-magenta mr-2" />
                        <span>{t('common.loading')}</span>
                      </div>
                    )}
                  </div>
                )}

                {!pagination?.hasMore && projects.length > 0 && (
                  <div className="mt-8 text-center text-text-tertiary">
                    {t('marketplace.noMoreProjects')}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <FiFileText size={64} className="mx-auto text-text-tertiary mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {t('marketplace.emptyState.title')}
                </h3>
                <p className="text-text-secondary">
                  {activeFiltersCount > 0
                    ? t('marketplace.emptyState.noResults')
                    : t('marketplace.emptyState.noProjects')}
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => setFilters({})}
                    className="mt-4 px-6 py-2 bg-magenta text-white rounded-lg hover:bg-magenta-dark transition-colors"
                  >
                    {t('marketplace.filters.clearAll')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
