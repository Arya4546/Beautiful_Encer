import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, MapPin } from 'lucide-react';
import { REGIONS, POPULAR_REGIONS, getRegionByCode } from '../../constants/regions';
import type { Region } from '../../constants/regions';

interface RegionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select your region',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedRegion = getRegionByCode(value);
  const popularRegions = POPULAR_REGIONS.map((code: string) => getRegionByCode(code)).filter(Boolean) as Region[];

  const filteredRegions = REGIONS.filter((region: Region) =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    region.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (region: Region) => {
    onChange(region.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between transition-colors ${
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-border focus:ring-magenta/50'
        } ${isOpen ? 'ring-2 ring-magenta/50' : ''}`}
      >
        <div className="flex items-center space-x-2">
          <MapPin size={18} className="text-gray-400" />
          {selectedRegion ? (
            <>
              <span className="text-2xl">{selectedRegion.flag}</span>
              <span className="text-text-primary">{selectedRegion.name}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-lg shadow-lg max-h-[400px] overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-border sticky top-0 bg-white">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search regions..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-magenta/50 text-sm"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[320px]">
            {/* Popular Regions */}
            {!searchQuery && popularRegions.length > 0 && (
              <div className="p-2 border-b border-border">
                <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Popular</p>
                {popularRegions.map((region) => (
                  <button
                    key={region.code}
                    type="button"
                    onClick={() => handleSelect(region)}
                    className={`w-full px-3 py-2 flex items-center space-x-3 hover:bg-magenta/5 rounded-lg transition-colors ${
                      value === region.code ? 'bg-magenta/10' : ''
                    }`}
                  >
                    <span className="text-2xl">{region.flag}</span>
                    <span className="flex-1 text-left text-sm text-text-primary">{region.name}</span>
                    {value === region.code && <Check size={16} className="text-magenta" />}
                  </button>
                ))}
              </div>
            )}

            {/* All Regions */}
            <div className="p-2">
              {!searchQuery && <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">All Regions</p>}
              {filteredRegions.length > 0 ? (
                filteredRegions.map((region: Region) => (
                  <button
                    key={region.code}
                    type="button"
                    onClick={() => handleSelect(region)}
                    className={`w-full px-3 py-2 flex items-center space-x-3 hover:bg-magenta/5 rounded-lg transition-colors ${
                      value === region.code ? 'bg-magenta/10' : ''
                    }`}
                  >
                    <span className="text-2xl">{region.flag}</span>
                    <span className="flex-1 text-left text-sm text-text-primary">{region.name}</span>
                    {value === region.code && <Check size={16} className="text-magenta" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  No regions found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
