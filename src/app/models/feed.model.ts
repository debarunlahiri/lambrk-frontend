export interface FeedPost {
  id: number;
  title: string;
  content: string;
  url: string | null;
  postType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK';
  thumbnailUrl: string | null;
  flairText: string | null;
  isSpoiler: boolean;
  isOver18: boolean;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  viewCount: number;
  algorithmScore: number;
  reasons: string[];
  author: FeedUser;
  subreddit: FeedSubreddit;
  createdAt: string;
  userInteraction: UserInteraction;
}

export interface FeedUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  karma: number;
  isVerified: boolean;
  type: 'REGULAR' | 'INFLUENCER' | 'VERIFIED' | 'NEW_USER' | 'MODERATOR' | 'ADMIN';
}

export interface FeedSubreddit {
  id: number;
  name: string;
  title: string;
  iconImageUrl: string | null;
  isUserSubscribed: boolean;
}

export interface UserInteraction {
  hasUpvoted: boolean;
  hasDownvoted: boolean;
  hasCommented: boolean;
  hasViewed: boolean;
  isSaved: boolean;
  isHidden: boolean;
  viewCount: number;
  lastInteractionAt: string | null;
}

export interface SuggestedUser {
  id: number;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  karma: number;
  isVerified: boolean;
  type: 'REGULAR' | 'INFLUENCER' | 'VERIFIED' | 'NEW_USER' | 'MODERATOR' | 'ADMIN';
  relevanceScore: number;
  reasons: string[];
  mutualSubreddits: number;
  commonInterests: string[];
}

export interface AlgorithmInfo {
  sortMethod: string;
  timeDecayFactor: number;
  freshnessHours: number;
  factorsConsidered: string[];
  processingTimeMs: number;
}

export interface FeedResponse {
  posts: FeedPost[];
  suggestedUsers: SuggestedUser[];
  algorithmInfo: AlgorithmInfo;
  totalAvailable: number;
  hasMore: boolean;
}

export interface FeedQueryParams {
  limit?: number;
  sortBy?: 'algorithm' | 'hot' | 'new' | 'top';
  includeNsfw?: boolean;
  fromFollowingOnly?: boolean;
  timeDecayFactor?: number;
}

export interface FeedPostRequest {
  limit?: number;
  sortBy?: 'algorithm' | 'hot' | 'new' | 'top';
  postTypes?: ('TEXT' | 'IMAGE' | 'VIDEO' | 'LINK')[];
  includeNsfw?: boolean;
  includeFromFollowingOnly?: boolean;
  timeDecayFactor?: number;
}
