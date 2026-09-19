import { api } from './api';
import { User, Role } from '../types';

export const userService = {
  async getUsers(role?: Role): Promise<User[]> {
    const params = role ? { role } : {};
    const response = await api.get('/users', { params });
    return response.data.data;
  },
};
