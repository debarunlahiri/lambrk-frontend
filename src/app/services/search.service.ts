import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  SearchRequest,
  SearchResponse,
  SearchType,
  SearchSort,
  SearchTimeFilter,
} from '../models/search.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/search`;

  // Signals for reactive state management
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentResults = signal<SearchResponse | null>(null);
  suggestions = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  /**
   * POST /api/search
   * Advanced search across all content types with complex filtering
   */
  advancedSearch(request: SearchRequest): Observable<SearchResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<SearchResponse>(this.apiUrl, request).pipe(
      tap((response) => {
        this.currentResults.set(response);
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
   * GET /api/search/posts
   * Search posts only with filtering options
   */
  searchPosts(
    query: string,
    options?: {
      page?: number;
      size?: number;
      sort?: SearchSort;
      timeFilter?: SearchTimeFilter;
      subreddits?: string[];
      flairs?: string[];
      includeNSFW?: boolean;
      includeOver18?: boolean;
      minScore?: number;
      minComments?: number;
    },
  ): Observable<SearchResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('query', query);
    if (options?.page !== undefined) params = params.set('page', options.page.toString());
    if (options?.size !== undefined) params = params.set('size', options.size.toString());
    if (options?.sort) params = params.set('sort', options.sort);
    if (options?.timeFilter) params = params.set('timeFilter', options.timeFilter);
    if (options?.subreddits?.length)
      params = params.set('subreddits', options.subreddits.join(','));
    if (options?.flairs?.length) params = params.set('flairs', options.flairs.join(','));
    if (options?.includeNSFW !== undefined)
      params = params.set('includeNSFW', options.includeNSFW.toString());
    if (options?.includeOver18 !== undefined)
      params = params.set('includeOver18', options.includeOver18.toString());
    if (options?.minScore !== undefined)
      params = params.set('minScore', options.minScore.toString());
    if (options?.minComments !== undefined)
      params = params.set('minComments', options.minComments.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/posts`, { params }).pipe(
      tap((response) => {
        this.currentResults.set(response);
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
   * GET /api/search/comments
   * Search comments only
   */
  searchComments(
    query: string,
    options?: {
      page?: number;
      size?: number;
      sort?: SearchSort;
      timeFilter?: SearchTimeFilter;
      includeNSFW?: boolean;
      includeOver18?: boolean;
      minScore?: number;
    },
  ): Observable<SearchResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('query', query);
    if (options?.page !== undefined) params = params.set('page', options.page.toString());
    if (options?.size !== undefined) params = params.set('size', options.size.toString());
    if (options?.sort) params = params.set('sort', options.sort);
    if (options?.timeFilter) params = params.set('timeFilter', options.timeFilter);
    if (options?.includeNSFW !== undefined)
      params = params.set('includeNSFW', options.includeNSFW.toString());
    if (options?.includeOver18 !== undefined)
      params = params.set('includeOver18', options.includeOver18.toString());
    if (options?.minScore !== undefined)
      params = params.set('minScore', options.minScore.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/comments`, { params }).pipe(
      tap((response) => {
        this.currentResults.set(response);
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
   * GET /api/search/users
   * Search users by username or display name
   */
  searchUsers(
    query: string,
    options?: {
      page?: number;
      size?: number;
      sort?: SearchSort;
      minScore?: number;
    },
  ): Observable<SearchResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('query', query);
    if (options?.page !== undefined) params = params.set('page', options.page.toString());
    if (options?.size !== undefined) params = params.set('size', options.size.toString());
    if (options?.sort) params = params.set('sort', options.sort);
    if (options?.minScore !== undefined)
      params = params.set('minScore', options.minScore.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/users`, { params }).pipe(
      tap((response) => {
        this.currentResults.set(response);
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
   * GET /api/search/subreddits
   * Search subreddits by name, title, or description
   */
  searchSubreddits(
    query: string,
    options?: {
      page?: number;
      size?: number;
      sort?: SearchSort;
      includeNSFW?: boolean;
      includeOver18?: boolean;
    },
  ): Observable<SearchResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('query', query);
    if (options?.page !== undefined) params = params.set('page', options.page.toString());
    if (options?.size !== undefined) params = params.set('size', options.size.toString());
    if (options?.sort) params = params.set('sort', options.sort);
    if (options?.includeNSFW !== undefined)
      params = params.set('includeNSFW', options.includeNSFW.toString());
    if (options?.includeOver18 !== undefined)
      params = params.set('includeOver18', options.includeOver18.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/subreddits`, { params }).pipe(
      tap((response) => {
        this.currentResults.set(response);
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
   * GET /api/search/all
   * Search all content types
   */
  searchAll(
    query: string,
    options?: {
      page?: number;
      size?: number;
      sort?: SearchSort;
      timeFilter?: SearchTimeFilter;
    },
  ): Observable<SearchResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams().set('query', query);
    if (options?.page !== undefined) params = params.set('page', options.page.toString());
    if (options?.size !== undefined) params = params.set('size', options.size.toString());
    if (options?.sort) params = params.set('sort', options.sort);
    if (options?.timeFilter) params = params.set('timeFilter', options.timeFilter);

    return this.http.get<SearchResponse>(`${this.apiUrl}/all`, { params }).pipe(
      tap((response) => {
        this.currentResults.set(response);
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
   * GET /api/search/suggestions
   * Get search suggestions for autocomplete
   */
  getSuggestions(query: string, type: SearchType = 'POSTS'): Observable<string[]> {
    const params = new HttpParams().set('query', query).set('type', type.toLowerCase());

    return this.http.get<string[]>(`${this.apiUrl}/suggestions`, { params }).pipe(
      tap((suggestions) => {
        this.suggestions.set(suggestions);
      }),
      catchError((error) => {
        console.error('Error fetching suggestions:', error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * GET /api/search/trending
   * Get trending search terms
   */
  getTrending(page: number = 0, size: number = 20): Observable<SearchResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/trending`, { params }).pipe(
      tap((response) => {
        this.currentResults.set(response);
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
    this.currentResults.set(null);
    this.suggestions.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  /**
   * Error handler
   */
  private handleError(error: any): void {
    if (error.status === 400) {
      this.error.set('Invalid search parameters. Please check your input.');
    } else if (error.status === 401) {
      this.error.set('You must be logged in to search.');
    } else if (error.status === 429) {
      this.error.set('Too many search requests. Please try again in a minute.');
    } else if (error.status === 503) {
      this.error.set('Search service is temporarily unavailable.');
    } else {
      this.error.set('Search failed. Please try again.');
    }
  }
}
