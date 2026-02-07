import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  RecommendationRequest,
  RecommendationResponse,
  RecommendationType,
} from '../models/recommendation.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecommendationService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/recommendations`;

  // Signals for reactive state management
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentRecommendations = signal<RecommendationResponse | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * POST /api/recommendations
   * Get personalized recommendations using ML-based analysis
   */
  getRecommendations(request: RecommendationRequest): Observable<RecommendationResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<RecommendationResponse>(this.apiUrl, request).pipe(
      tap((response) => {
        this.currentRecommendations.set(response);
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
   * GET /api/recommendations/posts/{userId}
   * Get post recommendations for a specific user
   */
  getPostRecommendations(
    userId: number,
    options?: {
      limit?: number;
      excludeSubreddits?: string[];
      excludeUsers?: string[];
      includeNSFW?: boolean;
      includeOver18?: boolean;
      contextSubredditId?: string;
      contextPostId?: string;
    },
  ): Observable<RecommendationResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (options?.limit) params = params.set('limit', options.limit.toString());
    if (options?.excludeSubreddits?.length) {
      params = params.set('excludeSubreddits', options.excludeSubreddits.join(','));
    }
    if (options?.excludeUsers?.length) {
      params = params.set('excludeUsers', options.excludeUsers.join(','));
    }
    if (options?.includeNSFW !== undefined) {
      params = params.set('includeNSFW', options.includeNSFW.toString());
    }
    if (options?.includeOver18 !== undefined) {
      params = params.set('includeOver18', options.includeOver18.toString());
    }
    if (options?.contextSubredditId) {
      params = params.set('contextSubredditId', options.contextSubredditId);
    }
    if (options?.contextPostId) {
      params = params.set('contextPostId', options.contextPostId);
    }

    return this.http.get<RecommendationResponse>(`${this.apiUrl}/posts/${userId}`, { params }).pipe(
      tap((response) => {
        this.currentRecommendations.set(response);
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
   * GET /api/recommendations/subreddits/{userId}
   * Get subreddit recommendations for a user
   */
  getSubredditRecommendations(
    userId: number,
    options?: {
      limit?: number;
      excludeSubreddits?: string[];
      includeNSFW?: boolean;
      includeOver18?: boolean;
    },
  ): Observable<RecommendationResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (options?.limit) params = params.set('limit', options.limit.toString());
    if (options?.excludeSubreddits?.length) {
      params = params.set('excludeSubreddits', options.excludeSubreddits.join(','));
    }
    if (options?.includeNSFW !== undefined) {
      params = params.set('includeNSFW', options.includeNSFW.toString());
    }
    if (options?.includeOver18 !== undefined) {
      params = params.set('includeOver18', options.includeOver18.toString());
    }

    return this.http
      .get<RecommendationResponse>(`${this.apiUrl}/subreddits/${userId}`, { params })
      .pipe(
        tap((response) => {
          this.currentRecommendations.set(response);
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
   * GET /api/recommendations/users/{userId}
   * Get user recommendations (similar users to follow)
   */
  getUserRecommendations(
    userId: number,
    options?: {
      limit?: number;
      excludeUsers?: string[];
    },
  ): Observable<RecommendationResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (options?.limit) params = params.set('limit', options.limit.toString());
    if (options?.excludeUsers?.length) {
      params = params.set('excludeUsers', options.excludeUsers.join(','));
    }

    return this.http.get<RecommendationResponse>(`${this.apiUrl}/users/${userId}`, { params }).pipe(
      tap((response) => {
        this.currentRecommendations.set(response);
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
   * GET /api/recommendations/comments/{userId}
   * Get comment recommendations
   */
  getCommentRecommendations(
    userId: number,
    limit: number = 20,
  ): Observable<RecommendationResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<RecommendationResponse>(`${this.apiUrl}/comments/${userId}`, { params })
      .pipe(
        tap((response) => {
          this.currentRecommendations.set(response);
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
   * GET /api/recommendations/context/{userId}
   * Get contextual recommendations based on current context
   */
  getContextualRecommendations(
    userId: number,
    options?: {
      contextSubredditId?: string;
      contextPostId?: string;
      type?: RecommendationType;
      limit?: number;
    },
  ): Observable<RecommendationResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (options?.contextSubredditId) {
      params = params.set('contextSubredditId', options.contextSubredditId);
    }
    if (options?.contextPostId) {
      params = params.set('contextPostId', options.contextPostId);
    }
    if (options?.type) {
      params = params.set('type', options.type.toLowerCase());
    }
    if (options?.limit) {
      params = params.set('limit', options.limit.toString());
    }

    return this.http
      .get<RecommendationResponse>(`${this.apiUrl}/context/${userId}`, { params })
      .pipe(
        tap((response) => {
          this.currentRecommendations.set(response);
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
   * GET /api/recommendations/trending
   * Get trending recommendations for all users
   */
  getTrendingRecommendations(
    type: RecommendationType = 'POSTS',
    limit: number = 20,
  ): Observable<RecommendationResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('type', type.toLowerCase()).set('limit', limit.toString());

    return this.http.get<RecommendationResponse>(`${this.apiUrl}/trending`, { params }).pipe(
      tap((response) => {
        this.currentRecommendations.set(response);
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
    this.currentRecommendations.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  /**
   * Error handler
   */
  private handleError(error: any): void {
    if (error.status === 400) {
      this.error.set('Invalid recommendation request. Please check your parameters.');
    } else if (error.status === 401) {
      this.error.set('You must be logged in to get recommendations.');
    } else if (error.status === 404) {
      this.error.set('User not found.');
    } else if (error.status === 429) {
      this.error.set('Too many requests. Please try again in a minute.');
    } else if (error.status === 503) {
      this.error.set('Recommendation service is temporarily unavailable.');
    } else {
      this.error.set('Failed to load recommendations. Please try again.');
    }
  }
}
