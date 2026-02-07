// ── Subreddit API models (matches /api/subreddits/* responses) ──

export interface SubredditCreator {
  id: number;
  username: string;
}

export interface SubredditResponse {
  id: number;
  name: string;
  title: string;
  description: string | null;
  sidebarText: string | null;
  headerImageUrl: string | null;
  iconImageUrl: string | null;
  isPublic: boolean;
  isRestricted: boolean;
  isOver18: boolean;
  memberCount: number;
  subscriberCount: number;
  activeUserCount: number;
  createdBy: SubredditCreator;
  createdAt: string;
  updatedAt: string;
  isUserSubscribed: boolean;
  isUserModerator: boolean;
}

export interface CreateSubredditDto {
  name: string;
  title: string;
  description?: string;
  sidebarText?: string;
  isPublic?: boolean;
  isRestricted?: boolean;
  isOver18?: boolean;
}

export interface UpdateSubredditDto {
  title?: string;
  description?: string;
  sidebarText?: string;
  headerImageUrl?: string;
  iconImageUrl?: string;
  isPublic?: boolean;
  isRestricted?: boolean;
  isOver18?: boolean;
}

export interface PaginatedSubredditsResponse {
  content: SubredditResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Validation helpers
export function validateSubredditName(name: string): string | null {
  if (!name || name.length < 3 || name.length > 21) {
    return 'Subreddit name must be between 3 and 21 characters';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return 'Subreddit name can only contain letters, numbers, and underscores';
  }
  return null;
}

export function validateSubredditTitle(title: string): string | null {
  if (!title || title.trim().length === 0) {
    return 'Title is required';
  }
  if (title.length > 100) {
    return 'Title must be 100 characters or less';
  }
  return null;
}
