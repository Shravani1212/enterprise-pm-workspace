export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  lastLoginAt?: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  version: number;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: number;
  projectId: number;
  user: User;
  projectRole: string;
  active: boolean;
  joinedAt: string;
}

export interface TaskStatus {
  id: number;
  projectId?: number;
  name: string;
  code: string;
  displayOrder: number;
  color: string;
  capacityLimit: number;
  active: boolean;
}

export interface Priority {
  id: number;
  name: string;
  code: string;
  level: number;
  color: string;
  active: boolean;
}

export interface Label {
  id: number;
  projectId?: number;
  name: string;
  code: string;
  color: string;
  active: boolean;
}

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  attachmentPath?: string;
  attachmentName?: string;
  attachmentType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignee?: User;
  createdBy: User;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours?: number;
  escalationLevel?: string;
  delayReason?: string;
  attachmentPath?: string;
  attachmentName?: string;
  attachmentType?: string;
  subtasks: Subtask[];
  labels: Label[];
  subtaskCount: number;
  completedSubtaskCount: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    status: number;
    error: string;
    message: string;
    path: string;
  };
  timestamp: string;
}

export type UserResponse = User;
export type ProjectResponse = Project;
export type TaskResponse = Task;
