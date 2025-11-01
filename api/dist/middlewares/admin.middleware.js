import { Role } from '@prisma/client';
/**
 * Admin Authorization Middleware
 * Ensures user has ADMIN role
 * Must be used after protect middleware
 */
export const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }
    if (user.role !== Role.ADMIN) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }
    next();
};
