import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of, throwError, Subscription, timer } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { ApiUser, AuthResponse, LoginRequest, RegisterRequest, ErrorType } from '../models/post.model';
import { ErrorHandlerService } from './error-handler.service';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly TOKEN_KEY = 'reddit_access_token';
  private readonly REFRESH_TOKEN_KEY = 'reddit_refresh_token';
  private readonly USER_KEY = 'reddit_user';

  // ── Signals ──
  currentUser = signal<ApiUser | null>(null);
  isAuthenticated = signal<boolean>(false);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed
  userKarma = computed(() => this.currentUser()?.karma ?? 0);
  displayName = computed(() => {
    const u = this.currentUser();
    return u?.displayName ?? u?.username ?? '';
  });

  // ── RxJS state ──
  private authSubject = new BehaviorSubject<AuthResponse | null>(null);
  authState$ = this.authSubject.asObservable().pipe(
    distinctUntilChanged(),
    shareReplay(1)
  );

  private refreshSub?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {
    this.initializeAuth();
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  // ── Bootstrap from localStorage ──
  private initializeAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);

    if (token && userStr) {
      try {
        const user: ApiUser = JSON.parse(userStr);
        if (this.isTokenValid()) {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          this.authSubject.next({
            accessToken: token,
            refreshToken: localStorage.getItem(this.REFRESH_TOKEN_KEY) ?? '',
            tokenType: 'Bearer',
            expiresIn: 86400,
            user
          });
          this.scheduleTokenRefresh();
        } else {
          // Token expired – try a silent refresh
          this.refreshToken().subscribe({
            error: () => this.handleLogout()
          });
        }
      } catch {
        this.clearTokens();
      }
    }
  }

  // ── POST /api/auth/login ──
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        this.handleAuthSuccess(res);
        this.loading.set(false);
      }),
      catchError(err => {
        this.loading.set(false);

        // Handle through centralized error handler
        if (err.status === 401) {
          // Set specific auth error message for login
          this.error.set('Invalid username or password.');
        }

        return this.errorHandler.handleError(err);
      })
    );
  }

  // ── POST /api/auth/register ──
  register(data: RegisterRequest): Observable<AuthResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => {
        this.handleAuthSuccess(res);
        this.loading.set(false);
      }),
      catchError(err => {
        this.loading.set(false);

        // Handle through centralized error handler
        // Registration-specific error messages will be shown in the UI
        return this.errorHandler.handleError(err);
      })
    );
  }

  // ── POST /api/auth/refresh  (body = raw refresh-token string) ──
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/refresh`,
      refreshToken,
      { headers: { 'Content-Type': 'text/plain' } }
    ).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => {
        this.handleLogout();
        return this.errorHandler.handleError(err);
      })
    );
  }

  // ── Logout (client-side only – no server endpoint specified) ──
  logout(): void {
    this.handleLogout();
    this.router.navigate(['/auth/login']);
  }

  // ── JWT helpers ──
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  // ── Observable convenience methods ──
  getAuthState(): Observable<boolean> {
    return this.authState$.pipe(map(auth => !!auth));
  }

  getCurrentUser(): Observable<ApiUser | null> {
    return this.authState$.pipe(map(auth => auth?.user ?? null));
  }

  // ── Private helpers ──
  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));

    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
    this.authSubject.next(res);

    this.scheduleTokenRefresh(res.expiresIn);
  }

  private handleLogout(): void {
    this.clearTokens();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.authSubject.next(null);
    this.refreshSub?.unsubscribe();
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private scheduleTokenRefresh(expiresInSec: number = 86400): void {
    this.refreshSub?.unsubscribe();

    // Refresh 5 minutes before expiry
    const refreshMs = Math.max((expiresInSec - 300) * 1000, 60_000);

    this.refreshSub = timer(refreshMs).pipe(
      switchMap(() => this.refreshToken())
    ).subscribe({
      error: () => this.handleLogout()
    });
  }
}
