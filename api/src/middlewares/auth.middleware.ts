import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.service.js';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  req.user = payload;
  next();
};

// Alias for consistency with other routes
export const authenticateToken = protect;
