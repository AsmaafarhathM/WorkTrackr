import jwt from 'jsonwebtoken';
import { AuthUser, JwtTokenPayload } from '../types';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRATION || '7d';

export const generateAccessToken = (user: AuthUser): string => {
  const payload: JwtTokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN as any });
};

export const generateRefreshToken = (user: AuthUser): string => {
  return jwt.sign({ id: user.id, email: user.email }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): JwtTokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtTokenPayload;
};

export const verifyRefreshToken = (token: string): { id: string; email: string } => {
  return jwt.verify(token, REFRESH_SECRET) as { id: string; email: string };
};

export const getRefreshTokenExpiryDate = (): Date => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
};
