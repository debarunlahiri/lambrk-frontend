import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  AdminActionRequest,
  AdminActionResponse,
  AdminActionListResponse,
  AdminBanUserRequest,
  AdminSuspendUserRequest,
  AdminDeletePostRequest,
  AdminDeleteCommentRequest,
  AdminLockPostRequest,
  AdminQuarantinePostRequest,
  AdminRemoveModeratorRequest,
  AdminAddModeratorRequest,
} from '../models/admin.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/admin`;

  // Signals for state management
  actions = signal<AdminActionListResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * POST /api/admin/actions
   * Perform any administrative action
   */
  performAction(action: AdminActionRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/actions`, action).pipe(
      tap((response) => {
        this.loading.set(false);
        return response;
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/admin/ban-user/{userId}
   * Ban a user permanently or temporarily
   */
  banUser(userId: number, request: AdminBanUserRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('reason', request.reason)
      .set('permanent', request.permanent?.toString() ?? 'false')
      .set('notifyUser', request.notifyUser?.toString() ?? 'true');

    if (request.durationDays) {
      params = params.set('durationDays', request.durationDays.toString());
    }

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/ban-user/${userId}`, null, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/admin/suspend-user/{userId}
   * Suspend a user temporarily
   */
  suspendUser(userId: number, request: AdminSuspendUserRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('reason', request.reason)
      .set('durationDays', request.durationDays.toString())
      .set('notifyUser', request.notifyUser?.toString() ?? 'true');

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/suspend-user/${userId}`, null, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/admin/delete-post/{postId}
   * Delete a post (soft delete)
   */
  deletePost(postId: number, request: AdminDeletePostRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('reason', request.reason)
      .set('notifyUser', request.notifyUser?.toString() ?? 'true');

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/delete-post/${postId}`, null, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/admin/delete-comment/{commentId}
   * Delete a comment (soft delete)
   */
  deleteComment(commentId: number, request: AdminDeleteCommentRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('reason', request.reason)
      .set('notifyUser', request.notifyUser?.toString() ?? 'true');

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/delete-comment/${commentId}`, null, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/admin/lock-post/{postId}
   * Lock a post to prevent new comments
   */
  lockPost(postId: number, request: AdminLockPostRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('reason', request.reason)
      .set('permanent', request.permanent?.toString() ?? 'false')
      .set('notifyUser', request.notifyUser?.toString() ?? 'true');

    if (request.durationDays) {
      params = params.set('durationDays', request.durationDays.toString());
    }

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/lock-post/${postId}`, null, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/admin/quarantine-post/{postId}
   * Quarantine a post (mark as 18+ content)
   */
  quarantinePost(postId: number, request: AdminQuarantinePostRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('reason', request.reason)
      .set('notifyUser', request.notifyUser?.toString() ?? 'true');

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/quarantine-post/${postId}`, null, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/admin/remove-moderator/{userId}
   * Remove moderator privileges from a user
   */
  removeModerator(userId: number, request: AdminRemoveModeratorRequest): Observable<AdminActionResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('reason', request.reason)
      .set('notifyUser', request.notifyUser?.toString() ?? 'true');

    return this.http.post<AdminActionResponse>(`${this.apiUrl}/remove-moderator/${userId}`, null, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/admin/actions
   * Get all admin actions (paginated)
   */
  getActions(page: number = 0, size: number = 20): Observable<AdminActionListResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AdminActionListResponse>(`${this.apiUrl}/actions`, { params }).pipe(
      tap((response) => {
        this.actions.set(response);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/admin/actions/user/{userId}
   * Get admin actions performed by a specific admin
   */
  getActionsByAdmin(userId: number, page: number = 0, size: number = 20): Observable<AdminActionListResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AdminActionListResponse>(`${this.apiUrl}/actions/user/${userId}`, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/admin/actions/active
   * Get currently active admin actions (not expired)
   */
  getActiveActions(page: number = 0, size: number = 20): Observable<AdminActionListResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AdminActionListResponse>(`${this.apiUrl}/actions/active`, { params }).pipe(
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Error handler
   */
  private handleError(error: any): void {
    if (error.status === 400) {
      this.error.set('Invalid action parameters. Please check your input.');
    } else if (error.status === 401) {
      this.error.set('You must be logged in to perform this action.');
    } else if (error.status === 403) {
      this.error.set('You do not have admin privileges to perform this action.');
    } else if (error.status === 404) {
      this.error.set('Target not found.');
    } else if (error.status === 429) {
      this.error.set('Rate limit exceeded. Please try again later.');
    } else if (error.status === 503) {
      this.error.set('Admin service temporarily unavailable. Please try again later.');
    } else {
      this.error.set('An unexpected error occurred. Please try again.');
    }
  }
}
