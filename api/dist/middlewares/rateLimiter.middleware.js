import rateLimit from 'express-rate-limit';
/**
 * General API rate limiter
 * 1000 requests per 15 minutes per IP (very generous for normal browsing)
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 900;
        res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please slow down and try again later.',
            retryAfter,
        });
    },
});
/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login/signup attempts per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes',
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 900;
        res.status(429).json({
            error: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many failed authentication attempts. Please try again later.',
            retryAfter,
        });
    },
});
/**
 * Social media API rate limiter
 * 10 requests per 15 minutes per user
 * Prevents excessive API calls to Instagram/TikTok
 */
export const socialMediaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each user to 10 social media requests per windowMs
    message: {
        error: 'Too many social media requests, please try again later.',
        retryAfter: '15 minutes',
    },
    keyGenerator: (req) => {
        // Rate limit by user ID instead of IP for authenticated requests
        return req.user?.userId || req.ip || 'unknown';
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 900;
        res.status(429).json({
            error: 'SOCIAL_MEDIA_RATE_LIMIT_EXCEEDED',
            message: 'You are making too many social media requests. Please wait a moment and try again.',
            retryAfter,
            hint: 'Data syncs automatically every 24 hours. Manual syncing should be used sparingly.',
        });
    },
    skip: (req) => {
        // Skip rate limiting for automated cron jobs
        return req.headers['x-cron-job-key'] === process.env.CRON_JOB_SECRET;
    },
});
/**
 * File upload rate limiter
 * 20 uploads per hour per user
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each user to 20 uploads per hour
    message: {
        error: 'Too many file uploads, please try again later.',
        retryAfter: '1 hour',
    },
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'unknown';
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 3600;
        res.status(429).json({
            error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
            message: 'You have exceeded the file upload limit. Please try again later.',
            retryAfter,
        });
    },
});
/**
 * Chat/messaging rate limiter
 * 100 messages per 5 minutes per user
 */
export const chatLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Limit each user to 100 messages per 5 minutes
    message: {
        error: 'Too many messages sent, please slow down.',
        retryAfter: '5 minutes',
    },
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'unknown';
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 300;
        res.status(429).json({
            error: 'CHAT_RATE_LIMIT_EXCEEDED',
            message: 'You are sending messages too quickly. Please slow down.',
            retryAfter,
        });
    },
});
/**
 * Connection request rate limiter
 * 50 connection requests per day per user
 */
export const connectionLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 50, // Limit each user to 50 connection requests per day
    message: {
        error: 'Daily connection request limit reached.',
        retryAfter: '24 hours',
    },
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'unknown';
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 86400;
        res.status(429).json({
            error: 'CONNECTION_RATE_LIMIT_EXCEEDED',
            message: 'You have reached your daily limit for connection requests. Please try again tomorrow.',
            retryAfter,
        });
    },
});
