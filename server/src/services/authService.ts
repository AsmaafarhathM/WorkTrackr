import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiryDate, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { AuthUser } from '../types';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = generateAccessToken(authUser);
    const refreshToken = generateRefreshToken(authUser);

    // Save refresh token in database for rotation/revocation tracking
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiryDate(),
      },
    });

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    if (!token) {
      throw new UnauthorizedError('Refresh token is required');
    }

    // Verify token validity
    let decoded: { id: string; email: string };
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Check in database
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!dbToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    if (dbToken.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (new Date() > dbToken.expiresAt) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    const authUser: AuthUser = {
      id: dbToken.user.id,
      email: dbToken.user.email,
      name: dbToken.user.name,
      role: dbToken.user.role,
    };

    // Issue new tokens & rotate refresh token
    const newAccessToken = generateAccessToken(authUser);
    const newRefreshToken = generateRefreshToken(authUser);

    // Revoke old token and save new token
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: authUser.id,
          expiresAt: getRefreshTokenExpiryDate(),
        },
      }),
    ]);

    return {
      user: authUser,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(token?: string) {
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
