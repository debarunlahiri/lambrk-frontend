// ── Recommendation API models (matches /api/recommendations/* responses) ──

export type RecommendationType = 'POSTS' | 'SUBREDDITS' | 'USERS' | 'COMMENTS';

export interface RecommendationRequest {
  userId: number;
  type: RecommendationType;
  limit?: number;
  excludeSubreddits?: string[];
  excludeUsers?: string[];
  includeNSFW?: boolean;
  includeOver18?: boolean;
  contextSubredditId?: string;
  contextPostId?: string;
}

export interface RecommendedPost {
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

export interface RecommendedSubreddit {
  id: number;
  name: string;
  title: string;
  description: string;
  memberCount: number;
  isUserSubscribed: boolean;
  isUserModerator: boolean;
}

export interface RecommendedUser {
  id: number;
  username: string;
  displayName: string;
  karma: number;
  isActive: boolean;
  isVerified: boolean;
}

export interface RecommendedComment {
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

export interface RecommendationResponse {
  type: RecommendationType;
  posts: RecommendedPost[];
  subreddits: RecommendedSubreddit[];
  users: RecommendedUser[];
  comments: RecommendedComment[];
  explanation: string;
  confidence: number;
  factors: string[];
}

export interface ConfidenceLevel {
  level: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  label: string;
  color: string;
}

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) {
    return { level: 'very-high', label: 'Very High', color: '#4caf50' };
  } else if (confidence >= 0.7) {
    return { level: 'high', label: 'High', color: '#8bc34a' };
  } else if (confidence >= 0.5) {
    return { level: 'medium', label: 'Medium', color: '#ff9800' };
  } else if (confidence >= 0.3) {
    return { level: 'low', label: 'Low', color: '#ff5722' };
  } else {
    return { level: 'very-low', label: 'Very Low', color: '#f44336' };
  }
}
