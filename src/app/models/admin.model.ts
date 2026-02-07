// ── Admin API models (matches /api/admin/* responses) ──

export type AdminActionType =
  | 'BAN_USER'
  | 'SUSPEND_USER'
  | 'DELETE_POST'
  | 'DELETE_COMMENT'
  | 'LOCK_POST'
  | 'LOCK_COMMENT'
  | 'REMOVE_MODERATOR'
  | 'ADD_MODERATOR'
  | 'BAN_SUBREDDIT'
  | 'QUARANTINE_POST'
  | 'QUARANTINE_COMMENT';

export type AdminTargetType = 'User' | 'Post' | 'Comment' | 'Subreddit';

export interface AdminActionRequest {
  action: AdminActionType;
  targetId: number;
  reason: string;
  notes?: string;
  durationDays?: number | null;
  permanent?: boolean;
  notifyUser?: boolean;
}

export interface AdminActionResponse {
  actionId: number;
  action: AdminActionType;
  targetId: number;
  targetType: AdminTargetType;
  reason: string;
  notes?: string;
  performedBy: number;
  performedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  result: string;
}

export interface AdminBanUserRequest {
  reason: string;
  durationDays?: number;
  permanent?: boolean;
  notifyUser?: boolean;
}

export interface AdminSuspendUserRequest {
  reason: string;
  durationDays: number;
  notifyUser?: boolean;
}

export interface AdminDeletePostRequest {
  reason: string;
  notifyUser?: boolean;
}

export interface AdminDeleteCommentRequest {
  reason: string;
  notifyUser?: boolean;
}

export interface AdminLockPostRequest {
  reason: string;
  durationDays?: number;
  permanent?: boolean;
  notifyUser?: boolean;
}

export interface AdminQuarantinePostRequest {
  reason: string;
  notifyUser?: boolean;
}

export interface AdminRemoveModeratorRequest {
  reason: string;
  notifyUser?: boolean;
}

export interface AdminAddModeratorRequest {
  subredditId: number;
  reason?: string;
  notifyUser?: boolean;
}

// ── Admin Action List (Paginated) ──

export interface AdminActionListItem {
  actionId: number;
  action: AdminActionType;
  targetId: number;
  targetType: AdminTargetType;
  reason: string;
  performedBy: number;
  performedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

export interface AdminActionListResponse {
  content: AdminActionListItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
}

// ── Admin Dashboard Stats ──

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingReports: number;
  recentActions: AdminActionListItem[];
}

// ── Action Type Labels ──

export const ADMIN_ACTION_LABELS: Record<AdminActionType, string> = {
  BAN_USER: 'Ban User',
  SUSPEND_USER: 'Suspend User',
  DELETE_POST: 'Delete Post',
  DELETE_COMMENT: 'Delete Comment',
  LOCK_POST: 'Lock Post',
  LOCK_COMMENT: 'Lock Comment',
  REMOVE_MODERATOR: 'Remove Moderator',
  ADD_MODERATOR: 'Add Moderator',
  BAN_SUBREDDIT: 'Ban Subreddit',
  QUARANTINE_POST: 'Quarantine Post',
  QUARANTINE_COMMENT: 'Quarantine Comment',
};

// ── Action Type Descriptions ──

export const ADMIN_ACTION_DESCRIPTIONS: Record<AdminActionType, string> = {
  BAN_USER: 'Permanently or temporarily ban a user from the platform',
  SUSPEND_USER: 'Temporarily suspend a user for a specified duration',
  DELETE_POST: 'Soft delete a post (content remains in database)',
  DELETE_COMMENT: 'Soft delete a comment (content remains in database)',
  LOCK_POST: 'Prevent new comments on a post',
  LOCK_COMMENT: 'Prevent replies to a comment',
  REMOVE_MODERATOR: 'Remove moderator privileges from a user',
  ADD_MODERATOR: 'Grant moderator privileges to a user',
  BAN_SUBREDDIT: 'Ban an entire subreddit from the platform',
  QUARANTINE_POST: 'Mark post as age-restricted (18+) content',
  QUARANTINE_COMMENT: 'Mark comment as age-restricted (18+) content',
};

// ── Action requires duration ──

export const ACTION_REQUIRES_DURATION: AdminActionType[] = ['BAN_USER', 'SUSPEND_USER', 'LOCK_POST'];

// ── Action supports permanent ──

export const ACTION_SUPPORTS_PERMANENT: AdminActionType[] = ['BAN_USER', 'LOCK_POST'];
