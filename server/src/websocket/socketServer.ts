import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { presenceManager } from './presence';
import { logger } from '../utils/logger';
import { AuthUser } from '../types';

let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user as AuthUser;
      next();
    } catch (err: any) {
      logger.warn(`Socket auth error: ${err.message}`);
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as AuthUser;
    logger.info(`WebSocket connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    // Join personal room
    socket.join(`user:${user.id}`);

    // Role-specific room joining
    if (user.role === Role.ADMIN) {
      socket.join('admin-room');
    } else if (user.role === Role.PROJECT_MANAGER) {
      // Join rooms for all projects owned by this PM
      const ownedProjects = await prisma.project.findMany({
        where: { ownerId: user.id },
        select: { id: true },
      });
      ownedProjects.forEach((p) => {
        socket.join(`project:${p.id}`);
      });
    } else if (user.role === Role.DEVELOPER) {
      // Developers join rooms for projects they have tasks in
      const tasks = await prisma.task.findMany({
        where: { assignedToId: user.id },
        select: { projectId: true },
      });
      const projectIds = Array.from(new Set(tasks.map((t) => t.projectId)));
      projectIds.forEach((pid) => {
        socket.join(`project:${pid}`);
      });
    }

    // Track presence
    const isFirstConnection = presenceManager.addSocket(user.id, socket.id);
    const onlineCount = presenceManager.getOnlineCount();

    // Broadcast updated presence count to Admins and all connected clients
    io?.emit('presence:count', { onlineCount, userIds: presenceManager.getOnlineUserIds() });

    if (isFirstConnection) {
      logger.info(`User ${user.name} is now online (Total online: ${onlineCount})`);
    }

    // Client requests missed events upon reconnection
    socket.on('activity:request_recent', async (callback) => {
      try {
        const activities = await getRecentActivitiesForUser(user);
        if (typeof callback === 'function') {
          callback({ success: true, data: activities });
        } else {
          socket.emit('activity:recent', activities);
        }
      } catch (err: any) {
        logger.error(`Error fetching recent activities for socket: ${err.message}`);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    socket.on('disconnect', () => {
      const isCompletelyOffline = presenceManager.removeSocket(user.id, socket.id);
      const currentOnlineCount = presenceManager.getOnlineCount();

      io?.emit('presence:count', {
        onlineCount: currentOnlineCount,
        userIds: presenceManager.getOnlineUserIds(),
      });

      if (isCompletelyOffline) {
        logger.info(`User ${user.name} went offline (Total online: ${currentOnlineCount})`);
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }
  return io;
};

/**
 * Retrieves latest 20 database activity records authorized for this specific user role.
 * Directly queries PostgreSQL - never uses in-memory cache.
 */
export const getRecentActivitiesForUser = async (user: AuthUser, limit = 20) => {
  let whereClause: any = {};

  if (user.role === Role.ADMIN) {
    // Admin sees all
    whereClause = {};
  } else if (user.role === Role.PROJECT_MANAGER) {
    // PM sees activities for projects they own
    whereClause = {
      project: {
        ownerId: user.id,
      },
    };
  } else if (user.role === Role.DEVELOPER) {
    // Developer sees activities for tasks assigned to them
    whereClause = {
      task: {
        assignedToId: user.id,
      },
    };
  }

  const activities = await prisma.activityLog.findMany({
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

  return activities;
};

/**
 * Emits an activity record strictly to authorized connected users.
 * ADMIN: receives via 'admin-room'
 * PROJECT_MANAGER: receives via 'user:${ownerId}'
 * DEVELOPER: receives via 'user:${assignedToId}'
 */
export const emitActivityCreated = (
  activity: any,
  projectOwnerId: string,
  assignedToId?: string | null
) => {
  if (!io) return;

  // 1. Emit to Admins
  io.to('admin-room').emit('activity:new', activity);

  // 2. Emit to the PM who owns the project
  if (projectOwnerId) {
    io.to(`user:${projectOwnerId}`).emit('activity:new', activity);
  }

  // 3. Emit to the assigned Developer (if different from PM/Admin)
  if (assignedToId && assignedToId !== projectOwnerId) {
    io.to(`user:${assignedToId}`).emit('activity:new', activity);
  }
};

/**
 * Emits a real-time notification to a specific user.
 */
export const emitNotificationCreated = (userId: string, notification: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
};

/**
 * Emits an updated unread notification count to a specific user.
 */
export const emitNotificationCount = (userId: string, unreadCount: number) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:count', { unreadCount });
};
