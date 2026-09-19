import { api } from './api';
import { Client } from '../types';

export const clientService = {
  async getClients(): Promise<Client[]> {
    const response = await api.get('/clients');
    return response.data.data;
  },

  async getClientById(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}`);
    return response.data.data;
  },

  async createClient(data: { name: string; email: string; company: string }): Promise<Client> {
    const response = await api.post('/clients', data);
    return response.data.data;
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const response = await api.put(`/clients/${id}`, data);
    return response.data.data;
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
