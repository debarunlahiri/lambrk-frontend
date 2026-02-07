// ── Post API models (matches /api/posts/* responses) ──

export type PostType = 'TEXT' | 'LINK' | 'IMAGE' | 'VIDEO' | 'POLL';

export interface PostAuthor {
  id: number;
  username: string;
  displayName: string;
  karma: number;
}

export interface PostSubreddit {
  id: number;
  name: string;
  title: string;
}

export interface Post {
  id: number;
  title: string;
  content: string | null;
  url: string | null;
  postType: PostType;
  thumbnailUrl: string | null;
  flairText: string | null;
  flairCssClass: string | null;
  isSpoiler: boolean;
  isStickied: boolean;
  isLocked: boolean;
  isArchived: boolean;
  isOver18: boolean;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  viewCount: number;
  awardCount: number;
  author: PostAuthor;
  subreddit: PostSubreddit;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
}

export interface PostResponse extends Post {
  // Same as Post, this is the API response type
}

// ── Comment API models (matches /api/comments/* responses) ──

export interface CommentAuthor {
  id: number;
  username: string;
  displayName: string;
  karma: number;
}

export interface Comment {
  id: number;
  content: string;
  flairText: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  isRemoved: boolean;
  isCollapsed: boolean;
  isStickied: boolean;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  awardCount: number;
  depthLevel: number;
  author: CommentAuthor;
  postId: number;
  parentId: number | null;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
}

export interface CommentResponse extends Comment {
  // Same as Comment, this is the API response type
}

export interface Award {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Subreddit {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  banner: string;
  members: number;
  isNSFW: boolean;
  createdAt: Date;
  rules: Rule[];
  moderators: string[];
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  priority: number;
}

// ── Auth API models (matches /api/auth/* responses) ──

export interface ApiUser {
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

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // seconds (86 400 = 24 h)
  user: ApiUser;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

// ── Legacy aliases kept so the rest of the app still compiles ──

export type User = ApiUser;

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  nsfwEnabled: boolean;
  autoplayEnabled: boolean;
  showThumbnails: boolean;
  compactView: boolean;
  language: string;
}

// ── RFC 7807 Problem Details ──

export interface ProblemDetails {
  type: string; // URI identifying the error type
  title: string; // Short, human-readable summary
  status: number; // HTTP status code
  detail: string; // Human-readable explanation
  instance?: string; // URI of the specific occurrence
  timestamp: string; // ISO 8601 timestamp
  fieldErrors?: Record<string, string>; // Validation errors (400)
  violationCategories?: string[]; // Content moderation categories (422)
}

export type ErrorType =
  | 'validation'
  | 'bad-credentials'
  | 'access-denied'
  | 'unauthorized-action'
  | 'not-found'
  | 'duplicate'
  | 'content-moderation'
  | 'rate-limit'
  | 'bulkhead'
  | 'circuit-breaker'
  | 'internal';

export interface ApiError {
  problem: ProblemDetails;
  originalError?: any;
  isNetworkError: boolean;
}

// ── Error handling utilities ──

export const ERROR_TYPE_SLUGS: Record<number, ErrorType> = {
  400: 'validation',
  401: 'bad-credentials',
  403: 'access-denied',
  404: 'not-found',
  409: 'duplicate',
  422: 'content-moderation',
  429: 'rate-limit',
  503: 'circuit-breaker',
  500: 'internal',
};

export function isProblemDetails(obj: any): obj is ProblemDetails {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.status === 'number' &&
    typeof obj.detail === 'string' &&
    typeof obj.timestamp === 'string'
  );
}

export function extractErrorType(status: number, type?: string): ErrorType {
  // First try to extract from the type slug
  if (type) {
    const slug = type.split('/').pop();
    if (Object.values(ERROR_TYPE_SLUGS).includes(slug as ErrorType)) {
      return slug as ErrorType;
    }
  }

  // Fallback to status code mapping
  return ERROR_TYPE_SLUGS[status] || 'internal';
}

export interface Vote {
  postId?: string;
  commentId?: string;
  userId: string;
  type: 'upvote' | 'downvote';
}

// ── Vote API models (matches /api/votes/* requests) ──

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface VotePostRequest {
  voteType: VoteType;
  postId: number;
  commentId: null;
}

export interface VoteCommentRequest {
  voteType: VoteType;
  postId: null;
  commentId: number;
}

export interface VoteResult {
  success: boolean;
  postId?: number;
  commentId?: number;
  newScore: number;
  newUpvoteCount: number;
  newDownvoteCount: number;
  userVote: VoteType | null;
}

export interface CreatePostDto {
  title: string;
  content?: string | null;
  url?: string | null;
  postType: PostType;
  flairText?: string | null;
  flairCssClass?: string | null;
  isSpoiler: boolean;
  isOver18: boolean;
  subredditId: number;
}

export interface UpdatePostDto {
  title: string;
  content?: string | null;
  url?: string | null;
  postType: PostType;
  flairText?: string | null;
  flairCssClass?: string | null;
  isSpoiler: boolean;
  isOver18: boolean;
  subredditId: number;
}

export interface CreateCommentDto {
  content: string;
  postId: number;
  parentCommentId?: number | null;
}

export interface UpdateCommentDto {
  content: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
