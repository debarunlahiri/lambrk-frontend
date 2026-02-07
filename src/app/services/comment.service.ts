import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  Comment,
  CommentResponse,
  CreateCommentDto,
  UpdateCommentDto,
  PaginatedResponse,
} from '../models/post.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/comments`;

  // Signals for reactive state management
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentComment = signal<Comment | null>(null);
  comments = signal<Comment[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * POST /api/comments
   * Create a new comment on a post, or reply to an existing comment
   */
  createComment(commentData: CreateCommentDto): Observable<CommentResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<CommentResponse>(this.apiUrl, commentData).pipe(
      tap((newComment) => {
        // Add to local state if needed
        const currentComments = this.comments();
        this.comments.set([newComment, ...currentComments]);
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
   * GET /api/comments/{commentId}
   * Get a single comment by ID
   */
  getComment(commentId: number): Observable<CommentResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<CommentResponse>(`${this.apiUrl}/${commentId}`).pipe(
      tap((comment) => {
        this.currentComment.set(comment);
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
   * GET /api/comments/post/{postId}
   * Get top-level comments for a post (paginated, sorted by score)
   */
  getPostComments(
    postId: number,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedResponse<CommentResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http
      .get<PaginatedResponse<CommentResponse>>(`${this.apiUrl}/post/${postId}`, { params })
      .pipe(
        tap((response) => {
          this.comments.set(response.content);
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
   * GET /api/comments/{commentId}/replies
   * Get direct replies to a specific comment
   */
  getCommentReplies(commentId: number): Observable<CommentResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<CommentResponse[]>(`${this.apiUrl}/${commentId}/replies`).pipe(
      tap(() => {
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
   * GET /api/comments/user/{userId}
   * Get all comments by a specific user (paginated, newest first)
   */
  getUserComments(
    userId: number,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedResponse<CommentResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http
      .get<PaginatedResponse<CommentResponse>>(`${this.apiUrl}/user/${userId}`, { params })
      .pipe(
        tap((response) => {
          this.comments.set(response.content);
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
   * PUT /api/comments/{commentId}
   * Edit a comment. Only the author can edit.
   */
  updateComment(commentId: number, content: string): Observable<CommentResponse> {
    this.loading.set(true);
    this.error.set(null);

    // Send raw string as request body
    return this.http
      .put<CommentResponse>(`${this.apiUrl}/${commentId}`, content, {
        headers: { 'Content-Type': 'text/plain' },
      })
      .pipe(
        tap((updatedComment) => {
          this.currentComment.set(updatedComment);
          // Update in local state
          const currentComments = this.comments();
          const index = currentComments.findIndex((c) => c.id === commentId);
          if (index !== -1) {
            currentComments[index] = updatedComment;
            this.comments.set([...currentComments]);
          }
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
   * DELETE /api/comments/{commentId}
   * Soft-delete a comment
   */
  deleteComment(commentId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${commentId}`).pipe(
      tap(() => {
        // Remove from local state
        const currentComments = this.comments();
        const filteredComments = currentComments.filter((c) => c.id !== commentId);
        this.comments.set(filteredComments);
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
   * GET /api/comments/search
   * Search comments by content
   */
  searchComments(
    query: string,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedResponse<CommentResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<PaginatedResponse<CommentResponse>>(`${this.apiUrl}/search`, { params })
      .pipe(
        tap((response) => {
          this.comments.set(response.content);
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
   * Vote on a comment (upvote/downvote)
   * Note: This endpoint is not in the provided API spec, but is commonly needed
   * You may need to adjust this based on your actual voting API
   */
  voteComment(
    commentId: number,
    voteType: 'UPVOTE' | 'DOWNVOTE' | null,
  ): Observable<CommentResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http
      .post<CommentResponse>(`${this.apiUrl}/${commentId}/vote`, { type: voteType })
      .pipe(
        tap((updatedComment) => {
          // Update in local state
          const currentComments = this.comments();
          const index = currentComments.findIndex((c) => c.id === commentId);
          if (index !== -1) {
            currentComments[index] = updatedComment;
            this.comments.set([...currentComments]);
          }
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
    this.comments.set([]);
    this.currentComment.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  /**
   * Error handler
   */
  private handleError(error: any): void {
    if (error.status === 400) {
      this.error.set('Validation failed. Please check your input.');
    } else if (error.status === 401) {
      this.error.set('You must be logged in to perform this action.');
    } else if (error.status === 403) {
      this.error.set('You do not have permission to perform this action.');
    } else if (error.status === 404) {
      this.error.set('Comment or post not found.');
    } else if (error.status === 422) {
      this.error.set('Content moderation violation.');
    } else if (error.status === 429) {
      this.error.set('Rate limit exceeded. Please try again later.');
    } else if (error.status === 503) {
      this.error.set('Service temporarily unavailable. Please try again later.');
    } else {
      this.error.set('An unexpected error occurred. Please try again.');
    }
  }
}
