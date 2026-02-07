import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { unauthGuard } from './guards/unauth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Reddit Frontend - Home',
  },
  {
    path: 'r/:subreddit',
    loadComponent: () =>
      import('./pages/subreddit/subreddit.component').then((m) => m.SubredditComponent),
    title: 'Subreddit',
  },
  {
    path: 'posts/:id',
    loadComponent: () =>
      import('./pages/post-detail/post-detail.component').then((m) => m.PostDetailComponent),
    title: 'Post Details',
  },
  {
    path: 'create-post',
    loadComponent: () =>
      import('./pages/create-post/create-post.component').then((m) => m.CreatePostComponent),
    canActivate: [authGuard],
    title: 'Create Post',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
        canActivate: [unauthGuard],
        title: 'Login',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register.component').then((m) => m.RegisterComponent),
        canActivate: [unauthGuard],
        title: 'Register',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
        canActivate: [unauthGuard],
        title: 'Forgot Password',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
        canActivate: [unauthGuard],
        title: 'Reset Password',
      },
    ],
  },
  {
    path: 'user/:username',
    loadComponent: () =>
      import('./pages/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
    title: 'User Profile',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
    title: 'Settings',
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent),
    title: 'Search',
  },
  {
    path: 'messages',
    loadComponent: () =>
      import('./pages/messages/messages.component').then((m) => m.MessagesComponent),
    canActivate: [authGuard],
    title: 'Messages',
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/notifications/notifications.component').then((m) => m.NotificationsComponent),
    canActivate: [authGuard],
    title: 'Notifications',
  },
  {
    path: 'recommendations',
    loadComponent: () =>
      import('./pages/recommendations/recommendations').then((m) => m.RecommendationsComponent),
    canActivate: [authGuard],
    title: 'Recommendations',
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    title: 'Admin',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Page Not Found',
  },
];
