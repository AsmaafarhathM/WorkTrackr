import { api } from './api';
import { Task, TaskFilters, TaskStatus } from '../types';

export const taskService = {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.dueFrom) params.append('dueFrom', filters.dueFrom);
      if (filters.dueTo) params.append('dueTo', filters.dueTo);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.search) params.append('search', filters.search);
      if (filters.isOverdue !== undefined && filters.isOverdue !== '') {
        params.append('isOverdue', String(filters.isOverdue));
      }
    }

    const response = await api.get('/tasks', { params });
    return response.data.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  async createTask(data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: string;
    dueDate: string;
    projectId: string;
    assignedToId?: string | null;
  }): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data.data;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data;
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async triggerOverdueCheck(): Promise<{ flaggedCount: number; message: string }> {
    const response = await api.post('/tasks/actions/trigger-overdue');
    return response.data;
  },
};
