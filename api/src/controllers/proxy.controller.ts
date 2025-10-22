import { Request, Response } from 'express';
import axios from 'axios';

/**
 * Proxy controller to handle CORS issues with external image URLs
 * This allows us to fetch Instagram images through our backend
 */
class ProxyController {
  /**
   * Proxy Instagram images to avoid CORS errors
   * GET /api/proxy/image?url=<encoded_image_url>
   */
  async proxyImage(req: Request, res: Response) {
    try {
      const { url } = req.query;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      // Validate URL is from Instagram CDN
      const allowedDomains = [
        'cdninstagram.com',
        'fbcdn.net',
        'instagram.com',
        'scontent'
      ];

      const isValidDomain = allowedDomains.some(domain => url.includes(domain));
      if (!isValidDomain) {
        return res.status(403).json({ error: 'URL not from allowed domain' });
      }

      // Fetch the image
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        timeout: 10000, // 10 second timeout
      });

      // Get content type from response or default to jpeg
      const contentType = response.headers['content-type'] || 'image/jpeg';

      // Set cache headers for better performance
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      });

      res.send(response.data);
    } catch (error: any) {
      console.error('Error proxying image:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to load image' 
      });
    }
  }
}

export default new ProxyController();
