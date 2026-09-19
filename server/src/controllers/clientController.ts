import { Response, NextFunction } from 'express';
import { clientService } from '../services/clientService';
import { AuthenticatedRequest } from '../types';

export class ClientController {
  async getClients(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clients = await clientService.getClients();
      res.status(200).json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }

  async getClientById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const client = await clientService.getClientById(req.params.id);
      res.status(200).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async createClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const client = await clientService.createClient(req.body);
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async updateClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const client = await clientService.updateClient(req.params.id, req.body);
      res.status(200).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async deleteClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await clientService.deleteClient(req.params.id);
      res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
