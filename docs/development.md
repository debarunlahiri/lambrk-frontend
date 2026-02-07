# Development Guidelines

This document outlines the coding standards and best practices for the Lambrk project.

## Table of Contents

1. [TypeScript Best Practices](#typescript-best-practices)
2. [Angular Best Practices](#angular-best-practices)
3. [Component Patterns](#component-patterns)
4. [State Management](#state-management)
5. [Testing Guidelines](#testing-guidelines)

## TypeScript Best Practices

- Use strict type checking (`strict: true` in tsconfig.json)
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when the type is uncertain
- Use interfaces for object shapes and types for unions/aliases
- Leverage TypeScript's utility types (Pick, Omit, Partial, etc.)

### Example

```typescript
// Good
interface User {
  id: number;
  username: string;
}

type UserUpdate = Partial<User>;

// Bad
const user: any = { id: 1, name: 'John' };
```

## Angular Best Practices

### Component Structure

- Always use **standalone components** (no NgModules)
- Do NOT set `standalone: true` in decorators (it's the default in Angular v20+)
- Use `ChangeDetectionStrategy.OnPush` for better performance
- Keep components small and focused on a single responsibility
- Prefer inline templates for small components (< 10 lines)
- Use external templates/styles for larger components

### Modern Angular Features

- Use **signals** for state management (`signal()`, `computed()`, `effect()`)
- Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives
- Use `input()` and `output()` functions instead of decorators
- Do NOT use `ngClass` or `ngStyle`; use class/style bindings instead
- Do NOT use `@HostBinding` or `@HostListener`; use the `host` object in `@Component`

### Example Component

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card" [class.active]="isActive()">
      <h3>{{ user().name }}</h3>
      <button (click)="onSelect()">Select</button>
    </div>
  `,
  styles: [`
    .user-card { padding: 16px; }
    .active { border: 2px solid blue; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selected]': 'isSelected()'
  }
})
export class UserCardComponent {
  user = input.required<User>();
  isActive = input<boolean>(false);
  select = output<User>();
  
  isSelected = computed(() => this.user().id === selectedUserId());
  
  onSelect() {
    this.select.emit(this.user());
  }
}
```

## Component Patterns

### Presentational vs Container Components

**Presentational Components**
- Receive data via inputs
- Emit events via outputs
- No service dependencies
- Reusable across the app

**Container Components**
- Connect to services
- Manage state
- Pass data to presentational components
- Handle side effects

### Example

```typescript
// Container Component
@Component({
  selector: 'app-user-list-container',
  template: `
    @if (users(); as userList) {
      @for (user of userList; track user.id) {
        <app-user-card 
          [user]="user" 
          (select)="onUserSelect($event)"
        />
      }
    }
  `
})
export class UserListContainerComponent {
  private userService = inject(UserService);
  users = toSignal(this.userService.getUsers());
  
  onUserSelect(user: User) {
    // Handle selection
  }
}
```

## State Management

### Signal-Based State

Use Angular Signals for all component state:

```typescript
export class PostComponent {
  // Simple signals
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Input signals
  post = input.required<Post>();
  
  // Computed signals
  canEdit = computed(() => 
    this.authService.currentUser()?.id === this.post().authorId
  );
  
  // Updating state
  loadData() {
    this.loading.set(true);
    this.dataService.getData().subscribe({
      next: (data) => {
        this.data.set(data);
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

### State Transformations

Keep state transformations pure and predictable:

```typescript
// Good: Pure transformation
updateScore(delta: number) {
  this.score.update(current => current + delta);
}

// Bad: Mutating state
updateScore(delta: number) {
  const score = this.score();
  score.value += delta; // Don't mutate!
  this.score.set(score);
}
```

## Testing Guidelines

### Unit Tests

- Test component logic, not the DOM
- Mock services and dependencies
- Test signal-based state changes
- Use Angular Testing Utilities

### Example Test

```typescript
describe('UserCardComponent', () => {
  let component: UserCardComponent;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UserCardComponent]
    });
    
    const fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('user', { id: 1, name: 'John' });
    fixture.detectChanges();
  });
  
  it('should emit select event', () => {
    const spy = jest.spyOn(component.select, 'emit');
    component.onSelect();
    expect(spy).toHaveBeenCalledWith({ id: 1, name: 'John' });
  });
});
```

### E2E Tests

- Test critical user flows
- Use Playwright or Cypress
- Test accessibility with axe-core

## Accessibility Requirements

All components MUST:

1. Pass all AXE checks
2. Follow WCAG AA minimums
3. Support keyboard navigation
4. Have proper focus management
5. Include appropriate ARIA attributes
6. Meet color contrast ratios (4.5:1 for normal text, 3:1 for large text)

## Code Style

### Naming Conventions

- Components: `feature-type.component.ts` (e.g., `user-list.component.ts`)
- Services: `feature.service.ts` (e.g., `auth.service.ts`)
- Interfaces: `PascalCase` (e.g., `UserProfile`)
- Types: `PascalCase` with `Type` suffix (e.g., `UserRoleType`)
- Enums: `PascalCase` (e.g., `PostStatus`)
- Signals: `camelCase` (e.g., `isLoading`)
- Constants: `SCREAMING_SNAKE_CASE`

### File Organization

```
src/app/
├── components/           # Shared components
├── pages/              # Route pages
│   ├── feature/
│   │   ├── components/ # Feature-specific components
│   │   └── *.component.ts
├── services/           # Business logic
├── models/             # Types and interfaces
├── guards/             # Route guards
├── interceptors/       # HTTP interceptors
├── pipes/              # Custom pipes
└── utils/              # Helper functions
```

## Performance Guidelines

1. Use `OnPush` change detection
2. Lazy load feature routes
3. Use `NgOptimizedImage` for images
4. Avoid heavy computations in templates
5. Use `computed()` for derived state
6. Clean up subscriptions with `takeUntilDestroyed()`

## Security Guidelines

1. Sanitize all user input
2. Use built-in Angular XSS protection
3. Validate data on both client and server
4. Store sensitive data securely
5. Use HTTPS for all API calls
6. Implement proper CORS policies
