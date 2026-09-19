import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/errors';

export class ClientService {
  async getClients() {
    return prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }

  async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { tasks: true } },
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }

  async createClient(data: { name: string; email: string; company: string }) {
    return prisma.client.create({
      data,
    });
  }

  async updateClient(id: string, data: { name?: string; email?: string; company?: string }) {
    await this.getClientById(id);
    return prisma.client.update({
      where: { id },
      data,
    });
  }

  async deleteClient(id: string) {
    await this.getClientById(id);
    return prisma.client.delete({
      where: { id },
    });
  }
}

export const clientService = new ClientService();
