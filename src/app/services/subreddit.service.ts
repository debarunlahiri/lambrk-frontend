import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  SubredditResponse,
  CreateSubredditDto,
  UpdateSubredditDto,
  PaginatedSubredditsResponse,
} from '../models/subreddit.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SubredditService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/subreddits`;

  // Signals for reactive state management
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentSubreddit = signal<SubredditResponse | null>(null);
  subreddits = signal<SubredditResponse[]>([]);
  userSubscriptions = signal<SubredditResponse[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * POST /api/subreddits
   * Create a new subreddit
   */
  createSubreddit(data: CreateSubredditDto): Observable<SubredditResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<SubredditResponse>(this.apiUrl, data).pipe(
      tap((subreddit) => {
        this.currentSubreddit.set(subreddit);
        // Add to local list
        const current = this.subreddits();
        this.subreddits.set([subreddit, ...current]);
        // Add to subscriptions
        const subs = this.userSubscriptions();
        this.userSubscriptions.set([subreddit, ...subs]);
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
   * GET /api/subreddits/{subredditId}
   * Get subreddit by ID
   */
  getSubreddit(subredditId: number): Observable<SubredditResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<SubredditResponse>(`${this.apiUrl}/${subredditId}`).pipe(
      tap((subreddit) => {
        this.currentSubreddit.set(subreddit);
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
   * GET /api/subreddits/r/{name}
   * Get subreddit by name
   */
  getSubredditByName(name: string): Observable<SubredditResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<SubredditResponse>(`${this.apiUrl}/r/${name}`).pipe(
      tap((subreddit) => {
        this.currentSubreddit.set(subreddit);
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
   * GET /api/subreddits/trending
   * Get trending subreddits
   */
  getTrendingSubreddits(
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedSubredditsResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedSubredditsResponse>(`${this.apiUrl}/trending`, { params }).pipe(
      tap((response) => {
        this.subreddits.set(response.content);
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
   * GET /api/subreddits
   * Get all public subreddits
   */
  getAllSubreddits(page: number = 0, size: number = 20): Observable<PaginatedSubredditsResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedSubredditsResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this.subreddits.set(response.content);
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
   * GET /api/subreddits/search
   * Search subreddits
   */
  searchSubreddits(
    query: string,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedSubredditsResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedSubredditsResponse>(`${this.apiUrl}/search`, { params }).pipe(
      tap((response) => {
        this.subreddits.set(response.content);
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
   * PUT /api/subreddits/{subredditId}
   * Update subreddit (moderator only)
   */
  updateSubreddit(subredditId: number, data: UpdateSubredditDto): Observable<SubredditResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.put<SubredditResponse>(`${this.apiUrl}/${subredditId}`, data).pipe(
      tap((subreddit) => {
        this.currentSubreddit.set(subreddit);
        // Update in local list
        const current = this.subreddits();
        const index = current.findIndex((s) => s.id === subredditId);
        if (index !== -1) {
          current[index] = subreddit;
          this.subreddits.set([...current]);
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
   * POST /api/subreddits/{subredditId}/subscribe
   * Subscribe to subreddit
   */
  subscribe(subredditId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<void>(`${this.apiUrl}/${subredditId}/subscribe`, {}).pipe(
      tap(() => {
        // Update current subreddit
        const current = this.currentSubreddit();
        if (current && current.id === subredditId) {
          this.currentSubreddit.set({
            ...current,
            isUserSubscribed: true,
            subscriberCount: current.subscriberCount + 1,
            memberCount: current.memberCount + 1,
          });
        }
        // Update in list
        const subreddits = this.subreddits();
        const index = subreddits.findIndex((s) => s.id === subredditId);
        if (index !== -1) {
          subreddits[index] = {
            ...subreddits[index],
            isUserSubscribed: true,
            subscriberCount: subreddits[index].subscriberCount + 1,
            memberCount: subreddits[index].memberCount + 1,
          };
          this.subreddits.set([...subreddits]);
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
   * POST /api/subreddits/{subredditId}/unsubscribe
   * Unsubscribe from subreddit
   */
  unsubscribe(subredditId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<void>(`${this.apiUrl}/${subredditId}/unsubscribe`, {}).pipe(
      tap(() => {
        // Update current subreddit
        const current = this.currentSubreddit();
        if (current && current.id === subredditId) {
          this.currentSubreddit.set({
            ...current,
            isUserSubscribed: false,
            subscriberCount: Math.max(0, current.subscriberCount - 1),
            memberCount: Math.max(0, current.memberCount - 1),
          });
        }
        // Update in list
        const subreddits = this.subreddits();
        const index = subreddits.findIndex((s) => s.id === subredditId);
        if (index !== -1) {
          subreddits[index] = {
            ...subreddits[index],
            isUserSubscribed: false,
            subscriberCount: Math.max(0, subreddits[index].subscriberCount - 1),
            memberCount: Math.max(0, subreddits[index].memberCount - 1),
          };
          this.subreddits.set([...subreddits]);
        }
        // Remove from subscriptions
        const subs = this.userSubscriptions();
        this.userSubscriptions.set(subs.filter((s) => s.id !== subredditId));
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
   * GET /api/subreddits/user/subscriptions
   * Get user's subscribed subreddits
   */
  getUserSubscriptions(): Observable<SubredditResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<SubredditResponse[]>(`${this.apiUrl}/user/subscriptions`).pipe(
      tap((subscriptions) => {
        this.userSubscriptions.set(subscriptions);
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
    this.currentSubreddit.set(null);
    this.subreddits.set([]);
    this.userSubscriptions.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  /**
   * Error handler
   */
  private handleError(error: any): void {
    if (error.status === 400) {
      this.error.set('Invalid subreddit data. Please check your input.');
    } else if (error.status === 401) {
      this.error.set('You must be logged in to perform this action.');
    } else if (error.status === 403) {
      this.error.set('You do not have permission to modify this subreddit.');
    } else if (error.status === 404) {
      this.error.set('Subreddit not found.');
    } else if (error.status === 409) {
      this.error.set('A subreddit with this name already exists.');
    } else {
      this.error.set('An error occurred. Please try again.');
    }
  }
}
