import { verifyAccessToken } from '../services/jwt.service.js';
import { prisma } from '../lib/prisma.js';
export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);
        if (!payload) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        // Fetch user with salon/influencer data
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
                salon: true,
                influencer: true,
            },
        });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }
        // Attach user data to request
        req.user = {
            userId: user.id,
            role: user.role,
            salon: user.salon || undefined,
            influencer: user.influencer || undefined,
        };
        next();
    }
    catch (error) {
        console.error('[Auth Middleware] Error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
// Alias for consistency with other routes
export const authenticateToken = protect;
