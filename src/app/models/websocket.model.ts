// ── WebSocket API models (matches WebSocket API specification) ──

export type WebSocketNotificationType =
  | 'COMMENT_REPLY'
  | 'POST_REPLY'
  | 'MENTION'
  | 'UPVOTE'
  | 'DOWNVOTE'
  | 'AWARD'
  | 'FOLLOW'
  | 'SUBREDDIT_SUBSCRIBE'
  | 'MOD_INVITE'
  | 'SYSTEM';

export interface WebSocketNotification {
  id: number;
  type: WebSocketNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  senderUsername?: string;
  senderAvatarUrl?: string;
}

export interface WebSocketPostUpdate {
  id: number;
  title?: string;
  score: number;
  commentCount: number;
  upvoteCount: number;
  downvoteCount: number;
  viewCount: number;
  awardCount: number;
  updatedAt: string;
  isArchived?: boolean;
  isLocked?: boolean;
}

export interface WebSocketCommentUpdate {
  id: number;
  content?: string;
  score: number;
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  awardCount: number;
  updatedAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  isRemoved?: boolean;
}

export interface WebSocketKarmaUpdate {
  userId: number;
  newKarma: number;
  change: number;
  reason: 'post_upvote' | 'post_downvote' | 'comment_upvote' | 'comment_downvote' | 'award';
}

export interface WebSocketVoteUpdate {
  targetId: number;
  targetType: 'POST' | 'COMMENT';
  voteType: 'UPVOTE' | 'DOWNVOTE' | null;
  newScore: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
}

export interface WebSocketSystemAnnouncement {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  link?: string;
}

export interface WebSocketSubredditUpdate {
  subredditId: number;
  name: string;
  memberCount: number;
  subscriberCount: number;
  activeUserCount: number;
  updateType: 'NEW_POST' | 'HOT_POST' | 'TRENDING' | 'ANNOUNCEMENT';
  postId?: number;
  postTitle?: string;
}

export interface WebSocketUserStatus {
  username: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

// ── Connection message types ──

export interface WebSocketConnectMessage {
  timestamp: number;
}

export interface WebSocketSubscribeMessage {
  postId?: number;
  subredditId?: number;
  username?: string;
}

// ── Topic patterns ──

export const USER_TOPICS = {
  connected: (username: string) => `/user/${username}/queue/connected`,
  notifications: (username: string) => `/user/${username}/queue/notifications`,
  karma: (username: string) => `/user/${username}/queue/karma`,
  votes: (username: string) => `/user/${username}/queue/votes`,
  posts: (username: string) => `/user/${username}/queue/posts`,
  comments: (username: string) => `/user/${username}/queue/comments`,
} as const;

export const PUBLIC_TOPICS = {
  post: (postId: number) => `/topic/posts/${postId}`,
  postComments: (postId: number) => `/topic/posts/${postId}/comments`,
  subreddit: (subredditId: number) => `/topic/subreddits/${subredditId}`,
  announcements: '/topic/announcements',
  userStatus: (username: string) => `/topic/user-status/${username}`,
} as const;

// ── WebSocket connection states ──

export type WebSocketConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export interface WebSocketConnectionEvent {
  state: WebSocketConnectionState;
  timestamp: number;
  error?: string;
  reconnectAttempt?: number;
}
