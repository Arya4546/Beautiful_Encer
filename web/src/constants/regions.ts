import countries from 'world-countries';

export interface Region {
  code: string;
  name: string;
  flag: string;
}

// Convert world-countries data to our format
export const REGIONS: Region[] = countries.map(country => ({
  code: country.cca2,
  name: country.name.common,
  flag: country.flag,
})).sort((a, b) => a.name.localeCompare(b.name));

// Popular regions for quick access
export const POPULAR_REGIONS = [
  'US', // United States
  'GB', // United Kingdom
  'CA', // Canada
  'AU', // Australia
  'IN', // India
  'DE', // Germany
  'FR', // France
  'JP', // Japan
  'BR', // Brazil
  'MX', // Mexico
];

export const getRegionByCode = (code: string): Region | undefined => {
  return REGIONS.find(region => region.code === code);
};

export const getRegionName = (code: string): string => {
  const region = getRegionByCode(code);
  return region ? region.name : code;
};
