/**
 * Utility function to proxy Instagram images through our backend
 * This solves CORS issues when loading Instagram CDN images
 */
export const getProxiedImageUrl = (originalUrl: string | null | undefined): string => {
  if (!originalUrl) {
    return '/placeholder-avatar.png'; // Default placeholder
  }

  // If it's already a local URL or data URL, return as is
  if (originalUrl.startsWith('/') || originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return originalUrl;
  }

  // If it's an Instagram CDN URL, proxy it through our backend
  const instagramCDNDomains = ['cdninstagram.com', 'fbcdn.net', 'scontent'];
  const needsProxy = instagramCDNDomains.some(domain => originalUrl.includes(domain));

  if (needsProxy) {
    // VITE_API_BASE_URL already includes /api/v1, so just append the route
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    return `${apiBaseUrl}/proxy/image?url=${encodeURIComponent(originalUrl)}`;
  }

  return originalUrl;
};

/**
 * Check if an image URL needs proxying
 */
export const needsImageProxy = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const instagramCDNDomains = ['cdninstagram.com', 'fbcdn.net', 'scontent'];
  return instagramCDNDomains.some(domain => url.includes(domain));
};
