import { Router } from 'express';
import { Role } from '@prisma/client';
import { taskController } from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { checkTaskStatusUpdateAccess, checkTaskViewAccess } from '../middleware/ownership';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskFilterSchema,
} from '../validators';

const router = Router();

router.use(authenticate);

// List tasks with URL query filters
router.get('/', validateQuery(taskFilterSchema), taskController.getTasks);

// Get single task by ID
router.get('/:id', checkTaskViewAccess, taskController.getTaskById);

// Create task (Admin, PM)
router.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validateBody(createTaskSchema),
  taskController.createTask
);

// Update general task fields (Admin, PM)
router.put(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validateBody(updateTaskSchema),
  taskController.updateTask
);

// Update task status (Admin, PM, or assigned Developer)
router.patch(
  '/:id/status',
  checkTaskStatusUpdateAccess,
  validateBody(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

// Delete task (Admin, PM)
router.delete(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  taskController.deleteTask
);

// Manual trigger for overdue background job (Admin or test automation)
router.post(
  '/actions/trigger-overdue',
  authorizeRoles(Role.ADMIN),
  taskController.triggerOverdueCheck
);

export default router;
