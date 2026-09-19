import { Router } from 'express';
import { Role } from '@prisma/client';
import { projectController } from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { checkProjectManageAccess, checkProjectViewAccess } from '../middleware/ownership';
import { validateBody } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', projectController.getProjects);
router.get('/:id', checkProjectViewAccess, projectController.getProjectById);

// Admin and Project Manager can create projects
router.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validateBody(createProjectSchema),
  projectController.createProject
);

router.put(
  '/:id',
  checkProjectManageAccess,
  validateBody(updateProjectSchema),
  projectController.updateProject
);

router.delete('/:id', checkProjectManageAccess, projectController.deleteProject);

export default router;
