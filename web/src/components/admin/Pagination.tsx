import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  const { t } = useTranslation();
  const [jumpPage, setJumpPage] = useState('');

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0);

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-white">
      {/* Results info */}
      {totalItems && itemsPerPage && (
        <div className="text-sm text-text-secondary order-2 lg:order-1">
          {t('admin.common.showing')} <span className="font-semibold text-text-primary">{startItem}</span> {t('admin.common.to')}{' '}
          <span className="font-semibold text-text-primary">{endItem}</span> {t('admin.common.of')}{' '}
          <span className="font-semibold text-text-primary">{totalItems}</span> {t('admin.common.results')}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 order-1 lg:order-2">
        {/* Jump to page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary whitespace-nowrap">{t('admin.pagination.goTo')}:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="#"
            className="w-16 px-3 py-1.5 border border-border rounded-lg text-center text-sm focus:ring-2 focus:ring-magenta focus:border-transparent transition-all"
          />
          <button
            onClick={handleJumpToPage}
            disabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > totalPages}
            className="px-3 py-1.5 bg-background-tertiary text-text-secondary rounded-lg text-sm font-medium hover:bg-magenta/10 hover:text-magenta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('admin.pagination.go')}
          </button>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-border text-text-secondary hover:bg-background-tertiary hover:text-magenta disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={t('admin.pagination.first')}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-border text-text-secondary hover:bg-background-tertiary hover:text-magenta disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={t('common.previous')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          <div className="hidden sm:flex gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-text-tertiary">
                    •••
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[36px] h-[36px] px-3 rounded-lg font-medium text-sm transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-magenta to-pink-500 text-white shadow-soft scale-105'
                      : 'text-text-secondary hover:bg-background-tertiary border border-border hover:border-magenta/30'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Current page indicator (mobile) */}
          <div className="sm:hidden px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg bg-background-tertiary">
            {currentPage} / {totalPages}
          </div>

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-border text-text-secondary hover:bg-background-tertiary hover:text-magenta disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={t('common.next')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-border text-text-secondary hover:bg-background-tertiary hover:text-magenta disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={t('admin.pagination.last')}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
