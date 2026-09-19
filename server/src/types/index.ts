import { Request } from 'express';
import { Role, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface JwtTokenPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueFrom?: string;
  dueTo?: string;
  projectId?: string;
  assignedToId?: string;
  search?: string;
  isOverdue?: boolean;
}

export interface ActivityChangeDetails {
  fromStatus?: TaskStatus | string;
  toStatus?: TaskStatus | string;
  taskTitle?: string;
  userName?: string;
  assignedToName?: string;
  [key: string]: any;
}

export interface SocketData {
  user: AuthUser;
}
