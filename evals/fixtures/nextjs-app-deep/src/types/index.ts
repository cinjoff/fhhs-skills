export type UserRole = 'admin' | 'editor' | 'viewer';

export type ApiAction = 'create' | 'update' | 'delete' | 'batch';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  lastActive: string;
}

export interface ApiResponse {
  data: Record<string, any>;
  error?: string;
  status: number;
}

export interface Metric {
  id: string;
  label: string;
  value: number;
  change: number;
  period: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string;
  };
}

export function getRolePermissions(role: UserRole): string[] {
  switch (role) {
    case 'admin':
      return ['read', 'write', 'delete', 'manage'];
    case 'editor':
      return ['read', 'write'];
  }
}

export function getActionLabel(action: ApiAction): string {
  switch (action) {
    case 'create':
      return 'Create New';
    case 'update':
      return 'Update Existing';
    case 'delete':
      return 'Delete Selected';
  }
}
