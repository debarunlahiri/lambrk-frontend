import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserResponse, PaginatedUsersResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/users`;

  // Signals for reactive state management
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentUser = signal<UserResponse | null>(null);
  users = signal<UserResponse[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * GET /api/users/{userId}
   * Get user profile by ID
   */
  getUserById(userId: number): Observable<UserResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<UserResponse>(`${this.apiUrl}/${userId}`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * GET /api/users/username/{username}
   * Get user profile by username
   */
  getUserByUsername(username: string): Observable<UserResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<UserResponse>(`${this.apiUrl}/username/${username}`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * GET /api/users/me
   * Get currently authenticated user's profile
   */
  getMe(): Observable<UserResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * GET /api/users/top
   * Get users with highest karma
   */
  getTopUsers(page: number = 0, size: number = 20): Observable<PaginatedUsersResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedUsersResponse>(`${this.apiUrl}/top`, { params }).pipe(
      tap((response) => {
        this.users.set(response.content);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * GET /api/users/search
   * Search users by username or display name
   */
  searchUsers(
    query: string,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedUsersResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedUsersResponse>(`${this.apiUrl}/search`, { params }).pipe(
      tap((response) => {
        this.users.set(response.content);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * DELETE /api/users/{userId}
   * Delete user account (admin only)
   */
  deleteUser(userId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${userId}`).pipe(
      tap(() => {
        // Remove from local list
        const current = this.users();
        this.users.set(current.filter((u) => u.id !== userId));
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Utility: Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Utility: Reset all state
   */
  resetState(): void {
    this.currentUser.set(null);
    this.users.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  /**
   * Error handler
   */
  private handleError(error: any): void {
    if (error.status === 403) {
      this.error.set('You do not have permission to perform this action.');
    } else if (error.status === 404) {
      this.error.set('User not found.');
    } else {
      this.error.set('An error occurred. Please try again.');
    }
  }
}
