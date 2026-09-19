import { prisma } from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { emitNotificationCount } from '../websocket/socketServer';

export class NotificationService {
  async getNotifications(userId: string, limit = 30) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        task: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            projectId: true,
          },
        },
      },
    });

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You can only modify your own notifications');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    const unreadCount = await this.getUnreadCount(userId);
    emitNotificationCount(userId, unreadCount);

    return {
      notification: updated,
      unreadCount,
    };
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    emitNotificationCount(userId, 0);

    return {
      unreadCount: 0,
    };
  }
}

export const notificationService = new NotificationService();
