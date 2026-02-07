# System Architecture

This document describes the architecture of the Lambrk application.

## Overview

Lambrk is a single-page application (SPA) built with Angular 20+ using modern patterns including standalone components, signals for state management, and real-time WebSocket communication.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │ Components  │  │     Services      │  │
│  │             │  │             │  │                   │  │
│  │ /home       │  │ Home        │  │ AuthService       │  │
│  │ /post/:id   │  │ PostDetail  │  │ PostService       │  │
│  │ /r/:name    │  │ Subreddit   │  │ CommentService    │  │
│  │ /user/:name │  │ UserProfile │  │ WebSocketService  │  │
│  │ /search     │  │ Search      │  │ ...               │  │
│  │ /admin      │  │ Admin       │  │                   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│           │              │                    │              │
│           └──────────────┴────────────────────┘              │
│                          │                                   │
│           ┌──────────────┴────────────────────┐              │
│           │          HTTP Client               │              │
│           │   (Interceptors: Auth, Error)    │              │
│           └──────────────┬────────────────────┘              │
│                          │                                   │
│           ┌──────────────┴────────────────────┐              │
│           │       WebSocket Client           │              │
│           │      (STOMP over SockJS)         │              │
│           └──────────────┬────────────────────┘              │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   REST API  │  │  WebSocket  │  │     Services      │  │
│  │   (Spring)  │  │    (STOMP)  │  │                   │  │
│  │             │  │             │  │ Auth Service      │  │
│  │ /api/auth   │  │ /ws         │  │ Post Service      │  │
│  │ /api/posts  │  │             │  │ Comment Service   │  │
│  │ /api/admin  │  │ Topics:     │  │ Vote Service      │  │
│  │ ...         │  │ /user/{id}  │  │ Search Service    │  │
│  │             │  │ /topic/...  │  │ Admin Service     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Layer Structure

```
Presentation Layer (UI)
├── Pages (Route components)
├── Components (Reusable UI)
└── Pipes (Data transformation)

Business Logic Layer
├── Services (API calls, business logic)
├── Guards (Route protection)
└── Interceptors (HTTP middleware)

Data Layer
├── Models (TypeScript interfaces)
├── State (Angular Signals)
└── Environments (Configuration)
```

### Key Design Patterns

#### 1. Standalone Components

All components are standalone (no NgModules):

```typescript
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedMaterialModule],
  template: `...`,
  styles: [`...`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent { }
```

#### 2. Signal-Based State Management

State is managed using Angular Signals:

```typescript
export class PostService {
  posts = signal<Post[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  loadPosts() {
    this.loading.set(true);
    this.http.get<Post[]>('/api/posts').subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
```

#### 3. Dependency Injection

Services are injected using the `inject()` function:

```typescript
export class HomeComponent {
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private router = inject(Router);
}
```

### State Flow

```
User Action
    │
    ▼
Component (signals.update)
    │
    ▼
Service (API call)
    │
    ▼
Server (response)
    │
    ▼
Service (signals.set)
    │
    ▼
Component (auto-updates via signals)
    │
    ▼
UI (re-renders)
```

## Backend Integration

### REST API

- Base URL: `/api`
- JSON request/response format
- JWT Bearer token authentication
- Standard HTTP status codes

### WebSocket

- Endpoint: `/ws`
- Protocol: STOMP over WebSocket with SockJS fallback
- Topics:
  - User-specific: `/user/{username}/queue/*`
  - Public: `/topic/*`

### Interceptors

1. **AuthInterceptor**: Adds Bearer token, handles 401/403
2. **ErrorInterceptor**: Global error handling, retry logic

## Component Hierarchy

```
App (root)
├── ErrorNotifications (global)
├── RouterOutlet
│   ├── Home
│   │   ├── CreatePostCard
│   │   ├── SortBar
│   │   ├── SearchCard
│   │   ├── PostCard (list)
│   │   │   ├── VotingSection
│   │   │   └── PostActions
│   │   └── Sidebar
│   ├── PostDetail
│   │   ├── PostContent
│   │   └── CommentList
│   │       └── CommentItem (recursive)
│   ├── Subreddit
│   │   ├── SubredditHeader
│   │   └── PostCard (list)
│   ├── UserProfile
│   │   ├── ProfileHeader
│   │   └── PostCard (list)
│   ├── Search
│   │   └── SearchResults
│   ├── Admin
│   │   ├── ActionForm
│   │   └── AuditLog
│   └── Auth (login/register/reset)
└── UserMenu (global)
```

## Service Layer

### Core Services

| Service | Responsibility |
|---------|---------------|
| AuthService | Authentication, token management |
| PostService | Post CRUD, voting |
| CommentService | Comment CRUD |
| SubredditService | Community management |
| SearchService | Search functionality |
| WebSocketService | Real-time communication |
| ThemeService | Theme switching |
| AdminService | Admin actions |

### Service Communication

Services communicate via:
1. **Method calls**: Direct service injection
2. **Signals**: Shared state
3. **Observables**: Async operations (WebSocket, HTTP)

## Routing

### Route Structure

```typescript
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'posts/:id', component: PostDetailComponent },
  { path: 'r/:name', component: SubredditComponent },
  { path: 'user/:username', component: UserProfileComponent },
  { path: 'search', component: SearchComponent },
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [adminGuard]
  },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  }
];
```

### Lazy Loading

Feature modules are lazy-loaded for better performance:

```typescript
{
  path: 'admin',
  loadComponent: () => import('./pages/admin/admin.component')
    .then(m => m.AdminComponent),
  canActivate: [adminGuard]
}
```

## State Management Strategy

### Local State (Component)

- Form inputs
- UI toggles
- Temporary selections

### Shared State (Services)

- Current user
- Post lists
- Notifications
- Theme preference

### Server State (HTTP/WebSocket)

- Post content
- Comments
- Votes
- Real-time updates

## Performance Optimizations

1. **OnPush Change Detection**: Reduces unnecessary checks
2. **Lazy Loading**: Code splitting by route
3. **Virtual Scrolling**: For long lists
4. **Image Optimization**: `NgOptimizedImage` directive
5. **Signal-based Reactivity**: Fine-grained updates
6. **Memoization**: `computed()` for derived values

## Security Considerations

### Client-Side

1. **XSS Protection**: Angular's built-in sanitization
2. **CSRF Protection**: Double-submit cookie pattern
3. **Input Validation**: Reactive forms with validators
4. **Route Guards**: Role-based access control

### Communication

1. **HTTPS**: All API calls encrypted
2. **JWT**: Short-lived access tokens
3. **Token Refresh**: Automatic refresh on expiry
4. **Secure Storage**: Tokens in httpOnly cookies (optional)

## Error Handling

### Global Error Handler

```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error) {
    console.error('Global error:', error);
    // Send to error tracking service
  }
}
```

### HTTP Error Interceptor

```typescript
export const errorInterceptorFn: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retry(2),
    catchError(handleHttpError)
  );
};
```

## Testing Strategy

### Unit Tests

- Test services in isolation (mock HTTP)
- Test components with TestBed
- Use signals for predictable state

### Integration Tests

- Test component + service interactions
- Test routing with RouterTestingModule
- Mock WebSocket for real-time features

### E2E Tests

- Critical user flows (login, create post, vote)
- Accessibility with axe-core
- Cross-browser testing

## Deployment

### Build Configurations

```bash
# Development
ng build --configuration development

# Production
ng build --configuration production
```

### Production Optimizations

1. AOT Compilation
2. Tree Shaking
3. Bundle optimization
4. Source map generation (optional)

## Monitoring

### Client-Side Metrics

- Page load time
- Component render time
- API response time
- Error rates

### Tools

- Angular DevTools
- Browser DevTools Performance tab
- Custom performance markers

## Future Considerations

### Scalability

1. Module Federation for micro-frontends
2. Service Workers for offline support
3. Server-Side Rendering (SSR) for SEO

### Features

1. Progressive Web App (PWA)
2. Push Notifications
3. Advanced caching strategies
4. AI-powered content recommendations

## Resources

- [Angular Architecture Guide](https://angular.io/guide/architecture)
- [Angular Signals](https://angular.io/guide/signals)
- [Standalone Components](https://angular.io/guide/standalone-components)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
