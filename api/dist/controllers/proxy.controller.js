import axios from 'axios';
import http from 'http';
import https from 'https';
/**
 * Proxy controller to handle CORS issues with external image URLs
 * This allows us to fetch Instagram images through our backend
 */
class ProxyController {
    /**
     * Proxy Instagram images to avoid CORS errors
     * GET /api/proxy/image?url=<encoded_image_url>
     */
    async proxyImage(req, res) {
        try {
            const { url } = req.query;
            if (!url || typeof url !== 'string') {
                return res.status(400).json({ error: 'Image URL is required' });
            }
            // Parse and validate target URL
            let target;
            try {
                target = new URL(url);
            }
            catch {
                return res.status(400).json({ error: 'Invalid image URL' });
            }
            // Whitelist Instagram/Facebook/Twitter/YouTube/TikTok CDN hostnames by suffix
            const allowedHostSuffixes = [
                'cdninstagram.com',
                'fbcdn.net',
                'instagram.com',
                'twimg.com', // Twitter images
                'twitter.com', // Twitter profile images
                'pbs.twimg.com', // Twitter photo CDN
                'yt3.ggpht.com', // YouTube profile pictures
                'ytimg.com', // YouTube thumbnails
                'youtube.com', // YouTube images
                'i.ytimg.com', // YouTube thumbnails CDN
                'ggpht.com', // Google photos CDN (YouTube)
                'tiktokcdn.com', // TikTok CDN
                'tiktok.com', // TikTok images
                'ttwstatic.com', // TikTok static assets
                'musical.ly', // TikTok (legacy domain)
                'byteoversea.com', // TikTok international CDN
                'ibytedtos.com', // TikTok object storage
            ];
            const hostname = target.hostname.toLowerCase();
            const isAllowed = allowedHostSuffixes.some(suffix => hostname === suffix || hostname.endsWith(`.${suffix}`));
            if (!isAllowed) {
                return res.status(403).json({ error: 'URL not from allowed domain' });
            }
            // Configurable timeout with sane default
            const TIMEOUT_MS = Number(process.env.IMAGE_PROXY_TIMEOUT_MS) || 30000; // 30s default
            // Use keep-alive agents and stream the response to reduce memory and prevent stalls
            const axiosInstance = axios.create({
                timeout: TIMEOUT_MS,
                maxRedirects: 5,
                httpAgent: new http.Agent({ keepAlive: true }),
                httpsAgent: new https.Agent({ keepAlive: true }),
            });
            const upstream = await axiosInstance.get(target.toString(), {
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    // Dynamic referer based on hostname
                    'Referer': hostname.includes('twimg.com') || hostname.includes('twitter.com')
                        ? 'https://twitter.com/'
                        : hostname.includes('ytimg.com') || hostname.includes('ggpht.com') || hostname.includes('youtube.com')
                            ? 'https://www.youtube.com/'
                            : hostname.includes('tiktok') || hostname.includes('ttwstatic') || hostname.includes('bytedtos') || hostname.includes('musical.ly')
                                ? 'https://www.tiktok.com/'
                                : 'https://www.instagram.com/',
                },
            });
            // If upstream responded with an error status, forward it
            if (upstream.status >= 400) {
                return res.status(upstream.status).json({ error: 'Failed to load image' });
            }
            // Forward relevant headers
            const contentType = upstream.headers['content-type'] || 'image/jpeg';
            const contentLength = upstream.headers['content-length'];
            const cacheControl = upstream.headers['cache-control'] || 'public, max-age=86400'; // 24h
            res.set({
                'Content-Type': contentType,
                ...(contentLength ? { 'Content-Length': contentLength } : {}),
                'Cache-Control': cacheControl,
                'Access-Control-Allow-Origin': '*',
            });
            // Stream data to client
            upstream.data.on('error', (err) => {
                console.error('Error streaming proxied image:', err?.message || err);
                if (!res.headersSent) {
                    res.status(502).end();
                }
                else {
                    res.end();
                }
            });
            req.on('aborted', () => {
                try {
                    upstream.data.destroy();
                }
                catch { }
            });
            upstream.data.pipe(res);
        }
        catch (error) {
            const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '');
            console.error('Error proxying image:', {
                message: error?.message,
                code: error?.code,
                name: error?.name,
                status: error?.response?.status,
            });
            res.status(isTimeout ? 504 : (error.response?.status || 500)).json({
                error: isTimeout ? 'Image fetch timed out' : 'Failed to load image'
            });
        }
    }
}
export default new ProxyController();
