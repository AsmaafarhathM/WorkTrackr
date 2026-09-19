import { api, setAccessToken } from './api';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken } = response.data.data;
    setAccessToken(accessToken);
    return { user, accessToken };
  },

  async refresh(): Promise<{ user: User; accessToken: string }> {
    const response = await api.post('/auth/refresh');
    const { user, accessToken } = response.data.data;
    setAccessToken(accessToken);
    return { user, accessToken };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
};
