import { Router } from 'express';
import { Role } from '@prisma/client';
import { clientController } from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { createClientSchema, updateClientSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);

// Only Admin can create, update, or delete clients
router.post(
  '/',
  authorizeRoles(Role.ADMIN),
  validateBody(createClientSchema),
  clientController.createClient
);

router.put(
  '/:id',
  authorizeRoles(Role.ADMIN),
  validateBody(updateClientSchema),
  clientController.updateClient
);

router.delete(
  '/:id',
  authorizeRoles(Role.ADMIN),
  clientController.deleteClient
);

export default router;
