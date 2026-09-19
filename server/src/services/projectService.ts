import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthUser } from '../types';

export class ProjectService {
  async getProjects(user: AuthUser) {
    let whereClause: any = {};

    if (user.role === Role.ADMIN) {
      whereClause = {};
    } else if (user.role === Role.PROJECT_MANAGER) {
      whereClause = { ownerId: user.id };
    } else if (user.role === Role.DEVELOPER) {
      whereClause = {
        tasks: {
          some: { assignedToId: user.id },
        },
      };
    }

    return prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, company: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
  }

  async getProjectById(id: string, user: AuthUser) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
        tasks: {
          where: user.role === Role.DEVELOPER ? { assignedToId: user.id } : {},
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Role boundary verification
    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only access projects you created');
    }

    if (user.role === Role.DEVELOPER) {
      const hasTask = await prisma.task.findFirst({
        where: { projectId: id, assignedToId: user.id },
      });
      if (!hasTask) {
        throw new ForbiddenError('You do not have access to this project');
      }
    }

    return project;
  }

  async createProject(data: { name: string; description?: string; clientId: string }, user: AuthUser) {
    // Only Admin and PM can create
    if (user.role !== Role.ADMIN && user.role !== Role.PROJECT_MANAGER) {
      throw new ForbiddenError('Only Administrators and Project Managers can create projects');
    }

    // Check client exists
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        ownerId: user.id, // Project belongs to the creator
      },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateProject(
    id: string,
    data: { name?: string; description?: string; clientId?: string },
    user: AuthUser
  ) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.ownerId !== user.id) {
      throw new ForbiddenError('You can only update projects that you created');
    }

    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot modify project settings');
    }

    return prisma.project.update({
      where: { id },
      data,
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async deleteProject(id: string, user: AuthUser) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && existing.ownerId !== user.id) {
      throw new ForbiddenError('You can only delete projects that you created');
    }

    if (user.role === Role.DEVELOPER) {
      throw new ForbiddenError('Developers cannot delete projects');
    }

    return prisma.project.delete({
      where: { id },
    });
  }
}

export const projectService = new ProjectService();
