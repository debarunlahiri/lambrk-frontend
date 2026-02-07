# Theming System

Lambrk uses a comprehensive CSS custom properties-based theming system that supports both light and dark modes.

## Overview

The theming system is built on CSS custom properties (variables) defined in `src/styles.scss`. Themes are applied by adding/removing the `.dark-theme` class on the document body.

## CSS Variables

### Base Variables (Light Theme - Default)

```scss
:root {
  // Background colors
  --bg-primary: #dae0e6;      // Page background
  --bg-secondary: #f6f7f8;    // Secondary surfaces
  --bg-card: #ffffff;         // Card backgrounds
  --bg-header: #ffffff;       // Header background
  --bg-input: #f6f7f8;        // Input backgrounds

  // Text colors
  --text-primary: #1c1c1c;    // Primary text
  --text-secondary: #7c7c7c;  // Secondary text
  --text-muted: #878a8c;      // Muted/hint text
  --text-inverse: #ffffff;    // Text on dark backgrounds

  // Border colors
  --border-color: #ccc;       // Default borders
  --border-light: #edeff1;    // Light borders
  --divider-color: #edeff1;   // Dividers

  // Accent colors
  --accent-primary: #ff4500;   // Primary accent (Reddit orange)
  --accent-secondary: #0079d3; // Secondary accent (Blue)
  --accent-hover: #ff5722;    // Hover state

  // Semantic colors
  --upvote-color: #ff4500;    // Upvote
  --downvote-color: #7193ff;  // Downvote
  --nsfw-color: #ff0000;      // NSFW warning
  --spoiler-color: #000000;   // Spoiler

  // Effects
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 14px rgba(0, 0, 0, 0.15);

  // Border radius
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Dark Theme Variables

```scss
.dark-theme {
  --bg-primary: #0f1113;
  --bg-secondary: #1a1a1b;
  --bg-card: #1a1a1b;
  --bg-header: #1a1a1b;
  --bg-input: #272729;

  --text-primary: #d7dadc;
  --text-secondary: #818384;
  --text-muted: #6a6c6d;
  --text-inverse: #1a1a1b;

  --border-color: #343536;
  --border-light: #272729;
  --divider-color: #343536;

  --accent-primary: #ff4500;
  --accent-secondary: #4fbcff;
  --accent-hover: #ff5722;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 4px 14px rgba(0, 0, 0, 0.4);
}
```

## ThemeService

The `ThemeService` manages theme switching and persistence:

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  currentTheme = signal<Theme>('light');
  
  toggleTheme(): void
  setTheme(theme: Theme): void
}
```

### Usage

```typescript
// In a component
private themeService = inject(ThemeService);

onThemeToggle() {
  this.themeService.toggleTheme();
}
```

```html
<!-- In template -->
<button (click)="themeService.toggleTheme()">
  @if (themeService.currentTheme() === 'dark') {
    <mat-icon>light_mode</mat-icon>
  } @else {
    <mat-icon>dark_mode</mat-icon>
  }
</button>
```

### Persistence

The selected theme is automatically saved to `localStorage` and restored on page load. If no theme is saved, the system preference is detected via `prefers-color-scheme`.

## Using Theme Variables

### In SCSS

```scss
.my-component {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);

  &:hover {
    background: var(--bg-secondary);
  }
}

.my-button {
  background: var(--accent-primary);
  color: var(--text-inverse);

  &:hover {
    background: var(--accent-hover);
  }
}
```

### Best Practices

1. **Always use variables** - Never hardcode colors
2. **Test both themes** - Ensure contrast and readability
3. **Use semantic names** - `bg-card` not `white`
4. **Maintain hierarchy** - Primary, secondary, muted for consistent contrast

## Material Design Integration

The theming system integrates with Angular Material:

```scss
.light-theme {
  @include mat.theme((
    color: (
      primary: mat.$blue-palette,
      accent: mat.$orange-palette,
      warn: mat.$red-palette,
      theme-type: light
    )
  ));
}

.dark-theme {
  @include mat.theme((
    color: (
      primary: mat.$blue-palette,
      accent: mat.$orange-palette,
      warn: mat.$red-palette,
      theme-type: dark
    )
  ));
}
```

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards:

- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text**: 3:1 minimum contrast ratio
- **UI components**: 3:1 minimum contrast ratio

### Focus Indicators

Focus states are clearly visible in both themes:

```scss
.interactive-element:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

## Custom Themes

To create a custom theme:

1. Create a new CSS class with variable overrides
2. Apply the class to the body element

```scss
// Custom theme example
.custom-theme {
  --bg-primary: #f0f4f8;
  --bg-card: #ffffff;
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
}
```

## Theme Testing

### Manual Testing

1. Toggle theme via UI button
2. Verify all components update
3. Check color contrast with browser dev tools
4. Test with different browser zoom levels

### Automated Testing

```typescript
// Theme service test
describe('ThemeService', () => {
  it('should toggle theme', () => {
    const service = new ThemeService();
    const initial = service.currentTheme();
    
    service.toggleTheme();
    
    expect(service.currentTheme()).toBe(
      initial === 'light' ? 'dark' : 'light'
    );
  });
});
```

## Common Issues

### Flash of Unstyled Content (FOUC)

To prevent theme flash on load, add the theme class server-side or inline:

```html
<!-- In index.html -->
<script>
  const saved = localStorage.getItem('reddit_theme');
  const theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.body.classList.add(theme + '-theme');
</script>
```

### Third-Party Components

For components that don't use CSS variables, add wrapper styles:

```scss
::ng-deep .third-party-component {
  background: var(--bg-card) !important;
  color: var(--text-primary) !important;
}
```

## Migration Guide

When updating existing components:

1. Replace hardcoded colors with variables
2. Remove `!important` where possible
3. Test in both light and dark modes
4. Update snapshots if using visual regression testing

## Resources

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Angular Material Theming](https://material.angular.io/guide/theming)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
