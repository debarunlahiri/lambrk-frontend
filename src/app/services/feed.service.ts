import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import {
  FeedResponse,
  FeedQueryParams,
  FeedPostRequest,
} from '../models/feed.model';

@Injectable({
  providedIn: 'root',
})
export class FeedService {
  private http = inject(HttpClient);
  private baseUrl = '/api/feed';

  // State signals
  posts = signal<FeedResponse['posts']>([]);
  suggestedUsers = signal<FeedResponse['suggestedUsers']>([]);
  algorithmInfo = signal<FeedResponse['algorithmInfo'] | null>(null);
  totalAvailable = signal<number>(0);
  hasMore = signal<boolean>(false);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  /**
   * Get personalized feed with query parameters
   */
  getFeed(params: FeedQueryParams = {}): Observable<FeedResponse> {
    this.loading.set(true);
    this.error.set(null);

    let httpParams = new HttpParams();

    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.sortBy !== undefined) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.includeNsfw !== undefined) {
      httpParams = httpParams.set('includeNsfw', params.includeNsfw.toString());
    }
    if (params.fromFollowingOnly !== undefined) {
      httpParams = httpParams.set(
        'fromFollowingOnly',
        params.fromFollowingOnly.toString()
      );
    }
    if (params.timeDecayFactor !== undefined) {
      httpParams = httpParams.set(
        'timeDecayFactor',
        params.timeDecayFactor.toString()
      );
    }

    return this.http
      .get<FeedResponse>(this.baseUrl, { params: httpParams })
      .pipe(
        tap((response) => this.updateState(response)),
        catchError((err) => {
          this.error.set(err.message || 'Failed to load feed');
          this.loading.set(false);
          throw err;
        })
      );
  }

  /**
   * Get personalized feed with POST request (advanced filtering)
   */
  getFeedWithFilters(request: FeedPostRequest): Observable<FeedResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<FeedResponse>(this.baseUrl, request).pipe(
      tap((response) => this.updateState(response)),
      catchError((err) => {
        this.error.set(err.message || 'Failed to load feed');
        this.loading.set(false);
        throw err;
      })
    );
  }

  /**
   * Get hot/trending posts
   */
  getHotPosts(limit: number = 20): Observable<FeedResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<FeedResponse>(`${this.baseUrl}/hot`, { params })
      .pipe(
        tap((response) => this.updateState(response)),
        catchError((err) => {
          this.error.set(err.message || 'Failed to load hot posts');
          this.loading.set(false);
          throw err;
        })
      );
  }

  /**
   * Get new posts (chronological)
   */
  getNewPosts(limit: number = 20): Observable<FeedResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<FeedResponse>(`${this.baseUrl}/new`, { params })
      .pipe(
        tap((response) => this.updateState(response)),
        catchError((err) => {
          this.error.set(err.message || 'Failed to load new posts');
          this.loading.set(false);
          throw err;
        })
      );
  }

  /**
   * Get top posts
   */
  getTopPosts(
    limit: number = 20,
    timePeriod: 'all' | 'day' | 'week' | 'month' | 'year' = 'all'
  ): Observable<FeedResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('limit', limit.toString());
    if (timePeriod !== 'all') {
      params = params.set('timePeriod', timePeriod);
    }

    return this.http
      .get<FeedResponse>(`${this.baseUrl}/top`, { params })
      .pipe(
        tap((response) => this.updateState(response)),
        catchError((err) => {
          this.error.set(err.message || 'Failed to load top posts');
          this.loading.set(false);
          throw err;
        })
      );
  }

  /**
   * Discover new content from unsubscribed subreddits
   */
  getDiscoverFeed(limit: number = 20): Observable<FeedResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<FeedResponse>(`${this.baseUrl}/discover`, { params })
      .pipe(
        tap((response) => this.updateState(response)),
        catchError((err) => {
          this.error.set(err.message || 'Failed to load discover feed');
          this.loading.set(false);
          throw err;
        })
      );
  }

  /**
   * Update state signals from response
   */
  private updateState(response: FeedResponse): void {
    this.posts.set(response.posts);
    this.suggestedUsers.set(response.suggestedUsers);
    this.algorithmInfo.set(response.algorithmInfo);
    this.totalAvailable.set(response.totalAvailable);
    this.hasMore.set(response.hasMore);
    this.loading.set(false);
    this.error.set(null);
  }

  /**
   * Clear feed state
   */
  clearFeed(): void {
    this.posts.set([]);
    this.suggestedUsers.set([]);
    this.algorithmInfo.set(null);
    this.totalAvailable.set(0);
    this.hasMore.set(false);
    this.error.set(null);
  }
}
