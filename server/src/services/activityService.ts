import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AuthUser } from '../types';

export class ActivityService {
  async getActivities(user: AuthUser, limit = 20) {
    let whereClause: any = {};

    if (user.role === Role.ADMIN) {
      whereClause = {};
    } else if (user.role === Role.PROJECT_MANAGER) {
      whereClause = {
        project: {
          ownerId: user.id,
        },
      };
    } else if (user.role === Role.DEVELOPER) {
      whereClause = {
        task: {
          assignedToId: user.id,
        },
      };
    }

    return prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        task: {
          select: { id: true, taskNumber: true, title: true, status: true, assignedToId: true },
        },
        project: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });
  }
}

export const activityService = new ActivityService();
