import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export class UserController {
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as Role | undefined;
      const users = await prisma.user.findMany({
        where: role ? { role } : {},
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
