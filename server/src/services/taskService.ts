import { Role, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { AuthUser, TaskFilterParams } from '../types';
import { emitActivityCreated, emitNotificationCreated, emitNotificationCount } from '../websocket/socketServer';

const formatStatusLabel = (status: TaskStatus | string): string => {
  switch (status) {
    case TaskStatus.TODO:
      return 'To Do';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.IN_REVIEW:
      return 'In Review';
    case TaskStatus.DONE:
      return 'Done';
    default:
      return status;
  }
};

export class TaskService {
  async getTasks(filters: TaskFilterParams, user: AuthUser) {
    const where: any = {};

    // 1. Role Scoping
    if (user.role === Role.DEVELOPER) {
      where.assignedToId = user.id;
    } else if (user.role === Role.PROJECT_MANAGER) {
      where.project = {
        ownerId: user.id,
      };
    }

    // 2. Query Filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.assignedToId && user.role !== Role.DEVELOPER) {
      if (filters.assignedToId === 'unassigned') {
        where.assignedToId = null;
      } else {
        where.assignedToId = filters.assignedToId;
      }
    }

    if (filters.isOverdue !== undefined) {
      where.isOverdue = filters.isOverdue;
    }

    // Date Range Filters (dueFrom / dueTo)
    if (filters.dueFrom || filters.dueTo) {
      where.dueDate = {};
      if (filters.dueFrom) {
        where.dueDate.gte = new Date(filters.dueFrom);
      }
      if (filters.dueTo) {
        where.dueDate.lte = new Date(filters.dueTo);
      }
    }

    // Keyword Search
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.task.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      include: {
        project: {
          select: { id: true, name: true, ownerId: true, client: { select: { name: true } } },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getTaskById(id: string, user: AuthUser) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            client: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role boundaries
    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      throw new ForbiddenError('You can only view tasks assigned to you');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only view tasks in projects you created');
    }

    return task;
  }

  async createTask(
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate: string;
      projectId: string;
      assignedToId?: string | null;
    },
    user: AuthUser
  ) {
    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot create new tasks');
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only create tasks in projects you manage');
    }

    // Check assignee if provided
    let assignee = null;
    if (data.assignedToId) {
      assignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
      });
      if (!assignee) {
        throw new NotFoundError('Assigned user not found');
      }
    }

    const dueDateObj = new Date(data.dueDate);
    const isOverdue = dueDateObj < new Date() && data.status !== TaskStatus.DONE;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.TODO,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: dueDateObj,
        isOverdue,
        projectId: data.projectId,
        assignedToId: data.assignedToId,
      },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // 1. Create Activity record
    const activity = await prisma.activityLog.create({
      data: {
        userId: user.id,
        taskId: task.id,
        projectId: task.projectId,
        action: 'TASK_CREATED',
        details: {
          taskTitle: task.title,
          assignedToName: assignee?.name || 'Unassigned',
        },
        message: `${user.name} created Task #${task.taskNumber} ("${task.title}")${
          assignee ? ` and assigned it to ${assignee.name}` : ''
        }`,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        task: { select: { id: true, taskNumber: true, title: true, status: true, assignedToId: true } },
        project: { select: { id: true, name: true, ownerId: true } },
      },
    });

    // Emit WebSocket event to authorized listeners
    emitActivityCreated(activity, project.ownerId, task.assignedToId);

    // 2. If assigned to developer, trigger Notification
    if (task.assignedToId) {
      const notification = await prisma.notification.create({
        data: {
          userId: task.assignedToId,
          taskId: task.id,
          type: NotificationType.TASK_ASSIGNED,
          title: 'New Task Assigned',
          message: `You have been assigned to Task #${task.taskNumber} ("${task.title}") in "${project.name}".`,
        },
      });

      emitNotificationCreated(task.assignedToId, notification);
      const unread = await prisma.notification.count({
        where: { userId: task.assignedToId, isRead: false },
      });
      emitNotificationCount(task.assignedToId, unread);
    }

    return task;
  }

  async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string;
      assignedToId?: string | null;
    },
    user: AuthUser
  ) {
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { project: true, assignedTo: true },
    });

    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only modify tasks in projects you created');
    }

    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot modify general task settings');
    }

    const previousAssigneeId = existing.assignedToId;

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) {
      updateData.dueDate = new Date(data.dueDate);
      if (updateData.status !== TaskStatus.DONE && updateData.dueDate < new Date()) {
        updateData.isOverdue = true;
      }
    }
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify new assignee if assignment changed
    if (
      data.assignedToId &&
      data.assignedToId !== previousAssigneeId &&
      data.assignedToId !== user.id
    ) {
      const notification = await prisma.notification.create({
        data: {
          userId: data.assignedToId,
          taskId: updatedTask.id,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: `You were assigned to Task #${updatedTask.taskNumber} ("${updatedTask.title}").`,
        },
      });

      emitNotificationCreated(data.assignedToId, notification);
      const unread = await prisma.notification.count({
        where: { userId: data.assignedToId, isRead: false },
      });
      emitNotificationCount(data.assignedToId, unread);
    }

    return updatedTask;
  }

  /**
   * Updates task status, creates persistent database ActivityLog,
   * creates notifications (e.g. IN_REVIEW to PM), and emits real-time WebSocket event.
   */
  async updateTaskStatus(id: string, newStatus: TaskStatus, user: AuthUser) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role checks
    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      throw new ForbiddenError('You can only update tasks assigned to you');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only update tasks in projects you manage');
    }

    const oldStatus = task.status;
    if (oldStatus === newStatus) {
      return task;
    }

    // Database transaction: update status, create activity log
    const [updatedTask, activity] = await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: {
          status: newStatus,
          // If moving to DONE, clear overdue flag
          isOverdue: newStatus === TaskStatus.DONE ? false : task.isOverdue,
        },
        include: {
          project: { select: { id: true, name: true, ownerId: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          taskId: task.id,
          projectId: task.projectId,
          action: 'STATUS_CHANGE',
          details: {
            fromStatus: oldStatus,
            toStatus: newStatus,
            taskTitle: task.title,
            userName: user.name,
          },
          message: `${user.name} moved Task #${task.taskNumber} from ${formatStatusLabel(
            oldStatus
          )} → ${formatStatusLabel(newStatus)}`,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          task: { select: { id: true, taskNumber: true, title: true, status: true, assignedToId: true } },
          project: { select: { id: true, name: true, ownerId: true } },
        },
      }),
    ]);

    // WebSocket real-time broadcast strictly to authorized listeners
    emitActivityCreated(activity, task.project.ownerId, task.assignedToId);

    // Notification rule: If Developer moves owned task to IN_REVIEW -> notify Project Manager
    if (newStatus === TaskStatus.IN_REVIEW) {
      const pmId = task.project.ownerId;
      // Only notify PM if the updater is not the PM themselves
      if (pmId !== user.id) {
        const pmNotification = await prisma.notification.create({
          data: {
            userId: pmId,
            taskId: task.id,
            type: NotificationType.TASK_IN_REVIEW,
            title: 'Task Ready for Review',
            message: `${user.name} submitted Task #${task.taskNumber} ("${task.title}") for review in "${task.project.name}".`,
          },
        });

        emitNotificationCreated(pmId, pmNotification);
        const unread = await prisma.notification.count({
          where: { userId: pmId, isRead: false },
        });
        emitNotificationCount(pmId, unread);
      }
    }

    return updatedTask;
  }

  async deleteTask(id: string, user: AuthUser) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot delete tasks');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only delete tasks in projects you created');
    }

    return prisma.task.delete({
      where: { id },
    });
  }
}

export const taskService = new TaskService();
