# Lambrk

A modern, real-time Reddit-like social platform built with Angular 20+ and TypeScript.

## Features

- **Real-time Updates**: WebSocket integration for live notifications, karma updates, and post interactions
- **Dark/Light Mode**: Full theme support with CSS variables
- **Responsive Design**: Mobile-first approach with Material Design
- **JWT Authentication**: Secure login/registration with token refresh
- **Voting System**: Upvote/downvote posts and comments with real-time sync
- **Admin Panel**: Complete moderation tools (ban, suspend, delete, lock, quarantine)
- **Search**: Full-text search with filters and suggestions
- **Modern Angular**: Standalone components, signals, and native control flow

## Tech Stack

- **Framework**: Angular 20+ (standalone components)
- **Language**: TypeScript 5+
- **UI Library**: Angular Material
- **State Management**: Angular Signals
- **Real-time**: STOMP over WebSocket with SockJS
- **HTTP**: Angular HttpClient with interceptors
- **Styling**: SCSS with CSS custom properties

## Project Structure

```
reddit-frontend/
├── src/
│   ├── app/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   │   ├── auth/          # Login, Register, Forgot Password
│   │   │   ├── home/          # Feed
│   │   │   ├── post-detail/   # Post view with comments
│   │   │   ├── subreddit/     # Community pages
│   │   │   ├── user-profile/  # User profiles
│   │   │   ├── search/        # Search results
│   │   │   ├── admin/         # Admin dashboard
│   │   │   └── ...
│   │   ├── services/          # API services
│   │   ├── models/            # TypeScript interfaces
│   │   ├── pipes/             # Custom pipes
│   │   ├── guards/            # Route guards
│   │   ├── interceptors/      # HTTP interceptors
│   │   └── utils/             # Helper functions
│   ├── environments/          # Environment configs
│   └── styles.scss            # Global styles with themes
├── docs/                       # Documentation
├── .windsurf/                  # IDE rules
└── angular.json               # Angular CLI config
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd reddit-frontend

# Install dependencies
npm install

# Start development server
ng serve
```

The app will be available at `http://localhost:4200`.

### Build

```bash
# Development build
ng build --configuration development

# Production build
ng build --configuration production
```

## Configuration

### Environment Variables

Create `src/environments/environment.local.ts` for local development:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  wsEndpoint: 'ws://localhost:8080/ws'
};
```

## Features Documentation

### Authentication

- JWT-based authentication with access and refresh tokens
- Automatic token refresh on 401 responses
- Protected routes with role-based guards

### WebSocket Real-time Features

- Live notifications
- Karma updates
- Post/comment vote updates
- System announcements
- User status updates

### Theming

The app supports light and dark modes with CSS custom properties:

```scss
// Light theme (default)
--bg-primary: #dae0e6;
--bg-card: #ffffff;
--text-primary: #1c1c1c;

// Dark theme
--bg-primary: #0f1113;
--bg-card: #1a1a1b;
--text-primary: #d7dadc;
```

Toggle theme via the sun/moon icon in the header.

### Admin Actions

Available to users with ADMIN role:

- **BAN_USER**: Permanent or temporary ban
- **SUSPEND_USER**: Temporary suspension
- **DELETE_POST/COMMENT**: Soft delete
- **LOCK_POST/COMMENT**: Prevent new comments
- **QUARANTINE**: Mark as 18+ content
- **REMOVE_MODERATOR**: Revoke mod privileges

## API Integration

### REST Endpoints

- `/api/auth/**` - Authentication (login, register, refresh)
- `/api/posts/**` - Posts CRUD and voting
- `/api/comments/**` - Comments CRUD
- `/api/subreddits/**` - Communities
- `/api/votes/**` - Voting system
- `/api/search/**` - Search functionality
- `/api/admin/**` - Admin actions (ADMIN only)

### WebSocket Topics

- `/user/{username}/queue/notifications` - Personal notifications
- `/topic/posts/{postId}` - Post updates
- `/topic/announcements` - System-wide announcements

## Development Guidelines

See [docs/development.md](docs/development.md) for:
- Coding standards
- Component patterns
- State management best practices
- Testing guidelines

## Contributing

1. Follow the [Windsurf guidelines](.windsurf/rules/guidelines.md)
2. Use standalone components
3. Prefer signals over observables for state
4. Ensure WCAG AA accessibility compliance
5. Write clean, typed TypeScript

## License

MIT
