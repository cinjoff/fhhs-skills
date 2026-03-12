// Type definitions with strictness violations

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

export type ApiAction =
  | { kind: 'fetch'; url: string }
  | { kind: 'create'; url: string; body: Record<string, unknown> }
  | { kind: 'update'; url: string; id: string; body: Record<string, unknown> }
  | { kind: 'delete'; url: string; id: string }
  | { kind: 'batch'; actions: ApiAction[] };

// VIOLATION: Non-exhaustive switch on discriminated union — missing 'batch' case
export function describeAction(action: ApiAction): string {
  switch (action.kind) {
    case 'fetch':
      return `Fetching from ${action.url}`;
    case 'create':
      return `Creating at ${action.url}`;
    case 'update':
      return `Updating ${action.id} at ${action.url}`;
    case 'delete':
      return `Deleting ${action.id} at ${action.url}`;
    // Missing: case 'batch' — should handle batch actions
  }
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// VIOLATION: Non-exhaustive switch — missing 'pending' case
export function getStatusColor(status: UserStatus): string {
  switch (status) {
    case 'active':
      return 'green';
    case 'inactive':
      return 'gray';
    case 'suspended':
      return 'red';
    // Missing: case 'pending' — should return 'yellow'
  }
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}
