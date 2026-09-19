import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { presenceManager } from '../websocket/presence';
import { AuthUser } from '../types';

export class DashboardService {
  async getDashboardData(user: AuthUser) {
    if (user.role === Role.ADMIN) {
      return this.getAdminDashboard();
    } else if (user.role === Role.PROJECT_MANAGER) {
      return this.getPmDashboard(user);
    } else {
      return this.getDevDashboard(user);
    }
  }

  private async getAdminDashboard() {
    const [
      totalProjects,
      totalClients,
      totalUsers,
      tasksByStatusRaw,
      overdueTaskCount,
      globalActivity,
      allTasksCount,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.client.count(),
      prisma.user.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.task.count({
        where: {
          isOverdue: true,
          status: { not: TaskStatus.DONE },
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          task: { select: { id: true, taskNumber: true, title: true, status: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count(),
    ]);

    const tasksByStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    tasksByStatusRaw.forEach((item) => {
      tasksByStatus[item.status] = item._count.status;
    });

    return {
      role: Role.ADMIN,
      totalProjects,
      totalClients,
      totalUsers,
      totalTasks: allTasksCount,
      tasksByStatus,
      overdueTaskCount,
      liveOnlineUsers: presenceManager.getOnlineCount(),
      onlineUserIds: presenceManager.getOnlineUserIds(),
      recentActivity: globalActivity,
    };
  }

  private async getPmDashboard(user: AuthUser) {
    const [
      ownProjects,
      tasksByPriorityRaw,
      tasksByStatusRaw,
      upcomingDueDates,
      overdueTasksCount,
      ownProjectActivity,
    ] = await Promise.all([
      prisma.project.findMany({
        where: { ownerId: user.id },
        include: {
          client: { select: { name: true, company: true } },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { project: { ownerId: user.id } },
        _count: { priority: true },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { ownerId: user.id } },
        _count: { status: true },
      }),
      prisma.task.findMany({
        where: {
          project: { ownerId: user.id },
          status: { not: TaskStatus.DONE },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: {
          assignedTo: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({
        where: {
          project: { ownerId: user.id },
          isOverdue: true,
          status: { not: TaskStatus.DONE },
        },
      }),
      prisma.activityLog.findMany({
        where: { project: { ownerId: user.id } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          task: { select: { id: true, taskNumber: true, title: true, status: true } },
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const tasksByPriority: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    tasksByPriorityRaw.forEach((item) => {
      tasksByPriority[item.priority] = item._count.priority;
    });

    const tasksByStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    tasksByStatusRaw.forEach((item) => {
      tasksByStatus[item.status] = item._count.status;
    });

    return {
      role: Role.PROJECT_MANAGER,
      projects: ownProjects,
      totalProjects: ownProjects.length,
      tasksByPriority,
      tasksByStatus,
      overdueTaskCount: overdueTasksCount,
      upcomingDueDates,
      recentActivity: ownProjectActivity,
    };
  }

  private async getDevDashboard(user: AuthUser) {
    const [assignedTasks, relevantActivity] = await Promise.all([
      prisma.task.findMany({
        where: { assignedToId: user.id },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.activityLog.findMany({
        where: { task: { assignedToId: user.id } },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          task: { select: { id: true, taskNumber: true, title: true, status: true } },
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const tasksByStatus = {
      TODO: assignedTasks.filter((t) => t.status === TaskStatus.TODO).length,
      IN_PROGRESS: assignedTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      IN_REVIEW: assignedTasks.filter((t) => t.status === TaskStatus.IN_REVIEW).length,
      DONE: assignedTasks.filter((t) => t.status === TaskStatus.DONE).length,
    };

    const overdueCount = assignedTasks.filter(
      (t) => t.isOverdue && t.status !== TaskStatus.DONE
    ).length;

    return {
      role: Role.DEVELOPER,
      assignedTasks,
      totalAssigned: assignedTasks.length,
      tasksByStatus,
      overdueTaskCount: overdueCount,
      recentActivity: relevantActivity,
    };
  }
}

export const dashboardService = new DashboardService();
