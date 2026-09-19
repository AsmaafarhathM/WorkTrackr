import { Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { AuthenticatedRequest } from '../types';

export class ProjectController {
  async getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projects = await projectService.getProjects(req.user!);
      res.status(200).json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.getProjectById(req.params.id, req.user!);
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.createProject(req.body, req.user!);
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.updateProject(req.params.id, req.body, req.user!);
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await projectService.deleteProject(req.params.id, req.user!);
      res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
