import jwt from 'jsonwebtoken';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
};
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, ACCESS_SECRET);
    }
    catch (error) {
        return null;
    }
};
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, REFRESH_SECRET);
    }
    catch (error) {
        return null;
    }
};
