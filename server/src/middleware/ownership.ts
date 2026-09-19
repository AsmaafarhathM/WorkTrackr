import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';

/**
 * Ensures user has permission to manage (update/delete) a project.
 * Admin can manage any project. PM can only manage projects they created.
 * Developers cannot manage projects.
 */
export const checkProjectManageAccess = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role === Role.ADMIN) return next();

    const projectId = req.params.projectId || req.params.id;
    if (!projectId) return next();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (req.user.role === Role.PROJECT_MANAGER && project.ownerId !== req.user.id) {
      throw new ForbiddenError('You can only manage projects that you created');
    }

    if (req.user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot modify project settings');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Ensures user has permission to view a project.
 * Admin: all projects.
 * PM: only projects they created.
 * Developer: projects where they have an assigned task.
 */
export const checkProjectViewAccess = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role === Role.ADMIN) return next();

    const projectId = req.params.projectId || req.params.id;
    if (!projectId) return next();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          select: { assignedToId: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (req.user.role === Role.PROJECT_MANAGER) {
      if (project.ownerId !== req.user.id) {
        throw new ForbiddenError('You do not have permission to access this project');
      }
      return next();
    }

    if (req.user.role === Role.DEVELOPER) {
      const hasAssignedTask = project.tasks.some(
        (t) => t.assignedToId === req.user!.id
      );
      if (!hasAssignedTask) {
        throw new ForbiddenError('You do not have access to this project');
      }
      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Ensures user has permission to view a task.
 * Admin: all tasks.
 * PM: tasks belonging to their owned projects.
 * Developer: ONLY tasks assigned to them.
 */
export const checkTaskViewAccess = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role === Role.ADMIN) return next();

    const taskId = req.params.taskId || req.params.id;
    if (!taskId) return next();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { ownerId: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (req.user.role === Role.PROJECT_MANAGER) {
      if (task.project.ownerId !== req.user.id) {
        throw new ForbiddenError('You can only view tasks from projects you manage');
      }
      return next();
    }

    if (req.user.role === Role.DEVELOPER) {
      if (task.assignedToId !== req.user.id) {
        throw new ForbiddenError('You can only view tasks assigned to you');
      }
      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Ensures user has permission to update task status.
 * Admin: any task.
 * PM: any task in their owned project.
 * Developer: ONLY tasks assigned to them.
 */
export const checkTaskStatusUpdateAccess = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role === Role.ADMIN) return next();

    const taskId = req.params.taskId || req.params.id;
    if (!taskId) return next();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { ownerId: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (req.user.role === Role.PROJECT_MANAGER) {
      if (task.project.ownerId !== req.user.id) {
        throw new ForbiddenError('You can only update tasks in projects you own');
      }
      return next();
    }

    if (req.user.role === Role.DEVELOPER) {
      if (task.assignedToId !== req.user.id) {
        throw new ForbiddenError('You can only update the status of tasks assigned to you');
      }
      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
};
