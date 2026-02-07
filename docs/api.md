# API Documentation

This document details the API integration for the Lambrk application.

## Base URL

```
http://localhost:8080/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Refresh

When the access token expires (401 response), the AuthInterceptor automatically attempts to refresh using the stored refresh token.

## REST Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/register` | Create new account |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate tokens |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | Get paginated posts |
| GET | `/posts/{id}` | Get single post |
| POST | `/posts` | Create new post |
| PUT | `/posts/{id}` | Update post |
| DELETE | `/posts/{id}` | Delete post |
| GET | `/posts/hot` | Get hot posts |
| GET | `/posts/new` | Get new posts |
| GET | `/posts/top` | Get top posts |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/comments/post/{postId}` | Get comments for post |
| POST | `/comments` | Create comment |
| PUT | `/comments/{id}` | Update comment |
| DELETE | `/comments/{id}` | Delete comment |

### Subreddits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subreddits` | List all subreddits |
| GET | `/subreddits/{name}` | Get subreddit by name |
| POST | `/subreddits` | Create subreddit |
| PUT | `/subreddits/{id}` | Update subreddit |
| POST | `/subreddits/{id}/subscribe` | Subscribe |
| POST | `/subreddits/{id}/unsubscribe` | Unsubscribe |

### Votes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/votes/post/{id}` | Vote on post |
| POST | `/votes/comment/{id}` | Vote on comment |
| DELETE | `/votes/post/{id}` | Remove vote |
| DELETE | `/votes/comment/{id}` | Remove vote |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search posts, comments, users |
| GET | `/search/suggestions` | Get search suggestions |

### Admin (ADMIN role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/actions` | Perform admin action |
| POST | `/admin/ban-user/{userId}` | Ban user |
| POST | `/admin/suspend-user/{userId}` | Suspend user |
| POST | `/admin/delete-post/{postId}` | Delete post |
| POST | `/admin/delete-comment/{commentId}` | Delete comment |
| POST | `/admin/lock-post/{postId}` | Lock post |
| POST | `/admin/quarantine-post/{postId}` | Quarantine post |
| GET | `/admin/actions` | Get admin action history |
| GET | `/admin/actions/active` | Get active actions |

## WebSocket API

### Connection

```
ws://localhost:8080/ws
```

### STOMP Topics

#### User-specific topics

- `/user/{username}/queue/notifications` - Personal notifications
- `/user/{username}/queue/karma` - Karma updates
- `/user/{username}/queue/votes` - Vote updates on user's content
- `/user/{username}/queue/posts` - Updates to user's posts
- `/user/{username}/queue/comments` - Updates to user's comments

#### Public topics

- `/topic/posts/{postId}` - Real-time post updates
- `/topic/posts/{postId}/comments` - New comments on post
- `/topic/subreddits/{subredditId}` - Subreddit updates
- `/topic/announcements` - System announcements
- `/topic/user-status/{username}` - User online status

### Message Types

```typescript
interface WebSocketNotification {
  type: 'POST_REPLY' | 'COMMENT_REPLY' | 'MENTION' | 'MESSAGE';
  title: string;
  message: string;
  targetId: number;
  targetType: 'POST' | 'COMMENT' | 'USER';
  createdAt: string;
  read: boolean;
}

interface WebSocketPostUpdate {
  id: number;
  score: number;
  commentCount: number;
  upvoteCount: number;
  downvoteCount: number;
  viewCount: number;
  awardCount: number;
}

interface WebSocketKarmaUpdate {
  userId: number;
  change: number;
  newTotal: number;
  reason: string;
}

interface WebSocketVoteUpdate {
  targetId: number;
  targetType: 'POST' | 'COMMENT';
  voteType: 'UPVOTE' | 'DOWNVOTE' | null;
  newScore: number;
  userVote: string | null;
}
```

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |
| 503 | Service Unavailable |

## Rate Limiting

API endpoints are rate-limited:

- **Anonymous**: 100 requests per 15 minutes
- **Authenticated**: 1000 requests per 15 minutes
- **Admin actions**: 100 actions per minute

Rate limit headers included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Page number (0-indexed) |
| size | int | 20 | Items per page |
| sort | string | createdAt | Sort field |
| direction | string | desc | Sort direction (asc/desc) |

### Pagination Response

```json
{
  "content": [...],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "timestamp": "2026-02-07T15:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/posts",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## Services

### AuthService

```typescript
class AuthService {
  login(credentials: LoginCredentials): Observable<AuthResponse>
  register(data: RegisterData): Observable<AuthResponse>
  logout(): void
  refreshToken(): Observable<AuthResponse>
  isAuthenticated(): boolean
  currentUser(): User | null
}
```

### PostService

```typescript
class PostService {
  getPosts(page: number, size: number): Observable<PostListResponse>
  getPost(id: number): Observable<Post>
  createPost(data: CreatePostRequest): Observable<Post>
  updatePost(id: number, data: UpdatePostRequest): Observable<Post>
  deletePost(id: number): Observable<void>
  getHotPosts(page: number, size: number): Observable<PostListResponse>
  getNewPosts(page: number, size: number): Observable<PostListResponse>
  getTopPosts(page: number, size: number): Observable<PostListResponse>
  votePost(id: number, voteType: VoteType | null): Observable<Post>
}
```

### WebSocketService

```typescript
class WebSocketService {
  connect(): void
  disconnect(): void
  subscribeToPost(postId: number): void
  subscribeToSubreddit(subredditId: number): void
  subscribeToAnnouncements(): void
  
  // Observables
  notifications$: Observable<WebSocketNotification>
  postUpdates$: Observable<WebSocketPostUpdate>
  commentUpdates$: Observable<WebSocketCommentUpdate>
  karmaUpdates$: Observable<WebSocketKarmaUpdate>
  voteUpdates$: Observable<WebSocketVoteUpdate>
  announcements$: Observable<WebSocketSystemAnnouncement>
}
```

## Interceptors

### AuthInterceptor

Automatically adds Bearer token to requests and handles 401 responses by refreshing tokens.

### ErrorInterceptor

Handles HTTP errors and transforms them into user-friendly messages.

## Testing

Use the mock API for development:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  wsEndpoint: 'ws://localhost:8080/ws',
  mockApi: true // Enable mock responses
};
```
