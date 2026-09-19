import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { AuthenticatedRequest } from '../types';

export class DashboardController {
  async getDashboardData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getDashboardData(req.user!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
