import { api } from './api';
import { ActivityLog } from '../types';

export const activityService = {
  async getActivities(limit = 20): Promise<ActivityLog[]> {
    const response = await api.get('/activity', { params: { limit } });
    return response.data.data;
  },

  async getRecentMissed(): Promise<ActivityLog[]> {
    const response = await api.get('/activity/recent');
    return response.data.data;
  },
};
