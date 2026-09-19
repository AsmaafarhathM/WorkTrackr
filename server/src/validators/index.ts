import { z } from 'zod';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createClientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters'),
  email: z.string().email('Valid client email is required'),
  company: z.string().min(2, 'Company name is required'),
});

export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  company: z.string().min(2).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  clientId: z.string().uuid('Valid client ID is required'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime('Due date must be a valid ISO datetime'),
  projectId: z.string().uuid('Valid project ID is required'),
  assignedToId: z.string().uuid('Valid user ID is required').optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().uuid().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: 'Status must be TODO, IN_PROGRESS, IN_REVIEW, or DONE' }),
  }),
});

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  projectId: z.string().uuid().optional(),
  assignedToId: z.union([z.string().uuid(), z.literal('unassigned')]).optional(),
  search: z.string().optional(),
  isOverdue: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
});
