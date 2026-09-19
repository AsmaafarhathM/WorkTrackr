import { Response, NextFunction } from 'express';
import { taskService } from '../services/taskService';
import { AuthenticatedRequest, TaskFilterParams } from '../types';
import { runOverdueTaskCheck } from '../jobs/overdueTaskJob';

export class TaskController {
  async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as TaskFilterParams;
      const tasks = await taskService.getTasks(filters, req.user!);
      res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getTaskById(req.params.id, req.user!);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.createTask(req.body, req.user!);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body, req.user!);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const task = await taskService.updateTaskStatus(req.params.id, status, req.user!);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await taskService.deleteTask(req.params.id, req.user!);
      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async triggerOverdueCheck(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const count = await runOverdueTaskCheck();
      res.status(200).json({
        success: true,
        message: `Overdue check executed manually. Flagged ${count} tasks as overdue.`,
        flaggedCount: count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
