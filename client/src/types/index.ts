export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_IN_REVIEW' | 'TASK_OVERDUE' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  createdAt?: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  ownerId: string;
  createdAt?: string;
  client?: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  projectId: string;
  assignedToId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  project?: {
    id: string;
    name: string;
    ownerId?: string;
    client?: {
      name: string;
    };
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ActivityLog {
  id: string;
  userId: string;
  taskId?: string | null;
  projectId: string;
  action: string;
  details?: any;
  message: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  task?: {
    id: string;
    taskNumber: number;
    title: string;
    status: TaskStatus;
    assignedToId?: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
    ownerId?: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  taskId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: {
    id: string;
    taskNumber: number;
    title: string;
    status: TaskStatus;
    projectId: string;
  } | null;
}

export interface TaskFilters {
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  dueFrom?: string;
  dueTo?: string;
  projectId?: string;
  search?: string;
  isOverdue?: boolean | '';
}

export interface AdminDashboardData {
  role: 'ADMIN';
  totalProjects: number;
  totalClients: number;
  totalUsers: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  overdueTaskCount: number;
  liveOnlineUsers: number;
  onlineUserIds: string[];
  recentActivity: ActivityLog[];
}

export interface PmDashboardData {
  role: 'PROJECT_MANAGER';
  projects: Project[];
  totalProjects: number;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
  overdueTaskCount: number;
  upcomingDueDates: Task[];
  recentActivity: ActivityLog[];
}

export interface DevDashboardData {
  role: 'DEVELOPER';
  assignedTasks: Task[];
  totalAssigned: number;
  tasksByStatus: Record<string, number>;
  overdueTaskCount: number;
  recentActivity: ActivityLog[];
}

export type DashboardData = AdminDashboardData | PmDashboardData | DevDashboardData;
