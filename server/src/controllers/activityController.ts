import { Response, NextFunction } from 'express';
import { activityService } from '../services/activityService';
import { AuthenticatedRequest } from '../types';

export class ActivityController {
  async getActivities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const activities = await activityService.getActivities(req.user!, limit);
      res.status(200).json({ success: true, count: activities.length, data: activities });
    } catch (error) {
      next(error);
    }
  }

  async getRecentMissed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Strictly loads 20 latest events from PostgreSQL, authorized for the user
      const activities = await activityService.getActivities(req.user!, 20);
      res.status(200).json({ success: true, count: activities.length, data: activities });
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
