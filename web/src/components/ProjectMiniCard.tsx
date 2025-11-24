import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiCalendar, FiMapPin, FiDollarSign, FiEye, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  projectType: string;
  description: string;
  category?: string;
  budget: number;
  startDate: string;
  endDate: string;
  location?: string;
  tags: string[];
  viewCount: number;
  applicationCount: number;
  maxApplications?: number;
  applicationDeadline?: string;
  createdAt: string;
}

interface ProjectMiniCardProps {
  project: Project;
}

export const ProjectMiniCard: React.FC<ProjectMiniCardProps> = ({ project }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isJapanese = i18n.language === 'ja';

  const projectTypeLabels: Record<string, { en: string; ja: string }> = {
    SPONSORED_POST: { en: 'Sponsored Post', ja: 'スポンサード投稿' },
    PRODUCT_REVIEW: { en: 'Product Review', ja: '商品レビュー' },
    COLLABORATION: { en: 'Collaboration', ja: 'コラボレーション' },
    EVENT_COVERAGE: { en: 'Event Coverage', ja: 'イベント取材' },
    BRAND_AMBASSADOR: { en: 'Brand Ambassador', ja: 'ブランドアンバサダー' },
    OTHER: { en: 'Other', ja: 'その他' },
  };

  const getProjectTypeLabel = (type: string) => {
    const label = projectTypeLabels[type];
    return label ? (isJapanese ? label.ja : label.en) : type;
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(budget);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleClick = () => {
    navigate(`/marketplace/projects/${project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-3 md:p-4 border border-pink-200 hover:border-pink-400 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-semibold text-gray-900 truncate group-hover:text-pink-600 transition-colors">
            {project.title}
          </h4>
          <p className="text-xs text-pink-600 font-medium mt-0.5">
            {getProjectTypeLabel(project.projectType)}
          </p>
        </div>
        
        {/* Budget Badge */}
        <div className="flex-shrink-0 bg-white rounded-lg px-2 py-1 border border-pink-200">
          <p className="text-xs md:text-sm font-bold text-pink-600 whitespace-nowrap">
            {formatBudget(project.budget)}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">
        {project.description}
      </p>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-gray-500">
        {/* Date Range */}
        <div className="flex items-center gap-1">
          <FiCalendar size={12} className="flex-shrink-0" />
          <span className="truncate">
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </span>
        </div>

        {/* Location */}
        {project.location && (
          <div className="flex items-center gap-1">
            <FiMapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1">
            <FiEye size={12} />
            <span>{project.viewCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiUsers size={12} />
            <span>{project.applicationCount}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {project.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-white text-xs text-pink-600 rounded-full border border-pink-200"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
