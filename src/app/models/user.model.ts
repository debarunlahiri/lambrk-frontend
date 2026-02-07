// ── User API models (matches /api/users/* responses) ──

export interface UserResponse {
  id: number;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  karma: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsersResponse {
  content: UserResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Helper functions
export function getKarmaLevel(karma: number): {
  level: string;
  color: string;
  icon: string;
} {
  if (karma >= 10000) {
    return { level: 'Legendary', color: '#ffd700', icon: 'military_tech' };
  } else if (karma >= 5000) {
    return { level: 'Expert', color: '#c0c0c0', icon: 'stars' };
  } else if (karma >= 1000) {
    return { level: 'Veteran', color: '#cd7f32', icon: 'workspace_premium' };
  } else if (karma >= 100) {
    return { level: 'Active', color: '#4caf50', icon: 'verified' };
  } else {
    return { level: 'Newcomer', color: '#9e9e9e', icon: 'person' };
  }
}

export function formatKarma(karma: number): string {
  if (karma >= 1_000_000) return (karma / 1_000_000).toFixed(1) + 'M';
  if (karma >= 1_000) return (karma / 1_000).toFixed(1) + 'k';
  return karma.toString();
}
