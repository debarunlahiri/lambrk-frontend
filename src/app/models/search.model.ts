// ── Search API models (matches /api/search/* responses) ──

export type SearchType = 'ALL' | 'POSTS' | 'COMMENTS' | 'USERS' | 'SUBREDDITS';
export type SearchSort = 'RELEVANCE' | 'NEW' | 'HOT' | 'TOP' | 'CONTROVERSIAL';
export type SearchTimeFilter = 'ALL' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface SearchRequest {
  query: string;
  type?: SearchType;
  sort?: SearchSort;
  timeFilter?: SearchTimeFilter;
  subreddits?: string[];
  flairs?: string[];
  includeNSFW?: boolean;
  includeOver18?: boolean;
  minScore?: number;
  minComments?: number;
  minVotes?: number;
  page?: number;
  size?: number;
}

export interface SearchPost {
  id: number;
  title: string;
  content: string | null;
  author: {
    id: number;
    username: string;
  };
  subreddit: {
    id: number;
    name: string;
  };
  score: number;
  commentCount: number;
  createdAt: string;
}

export interface SearchComment {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
  };
  postId: number;
  score: number;
  createdAt: string;
}

export interface SearchUser {
  id: number;
  username: string;
  displayName: string;
  karma: number;
  isActive: boolean;
  isVerified: boolean;
}

export interface SearchSubreddit {
  id: number;
  name: string;
  title: string;
  description: string;
  memberCount: number;
  isUserSubscribed: boolean;
}

export interface SearchMetadata {
  query: string;
  type: SearchType;
  sort: SearchSort;
  timeFilter: SearchTimeFilter;
  totalResults: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  searchTimeMs: number;
  suggestions: string[];
}

export interface SearchResponse {
  posts: SearchPost[];
  comments: SearchComment[];
  users: SearchUser[];
  subreddits: SearchSubreddit[];
  metadata: SearchMetadata;
}

// Helper functions
export function getTimeFilterLabel(filter: SearchTimeFilter): string {
  const labels: Record<SearchTimeFilter, string> = {
    ALL: 'All Time',
    HOUR: 'Past Hour',
    DAY: 'Past 24 Hours',
    WEEK: 'Past Week',
    MONTH: 'Past Month',
    YEAR: 'Past Year',
  };
  return labels[filter];
}

export function getSortLabel(sort: SearchSort): string {
  const labels: Record<SearchSort, string> = {
    RELEVANCE: 'Most Relevant',
    NEW: 'Newest',
    HOT: 'Hot',
    TOP: 'Top',
    CONTROVERSIAL: 'Controversial',
  };
  return labels[sort];
}

export function getTypeLabel(type: SearchType): string {
  const labels: Record<SearchType, string> = {
    ALL: 'All',
    POSTS: 'Posts',
    COMMENTS: 'Comments',
    USERS: 'Users',
    SUBREDDITS: 'Communities',
  };
  return labels[type];
}
