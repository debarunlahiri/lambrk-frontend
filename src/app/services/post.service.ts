import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  Post,
  PostResponse,
  CreatePostDto,
  UpdatePostDto,
  PaginatedResponse,
  VoteType,
} from '../models/post.model';
import { VoteService } from './vote.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/posts`;
  private readonly voteService = inject(VoteService);

  // Signals for reactive state management
  posts = signal<Post[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  currentPost = signal<Post | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * POST /api/posts
   * Create a new post
   */
  createPost(postData: CreatePostDto): Observable<PostResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<PostResponse>(this.apiUrl, postData).pipe(
      tap((newPost) => {
        const currentPosts = this.posts();
        this.posts.set([newPost, ...currentPosts]);
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
   * GET /api/posts/{postId}
   * Get a single post by ID (increments view count)
   */
  getPost(postId: number): Observable<PostResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<PostResponse>(`${this.apiUrl}/${postId}`).pipe(
      tap((post) => {
        this.currentPost.set(post);
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
   * GET /api/posts/hot
   * Get hot posts sorted by score
   */
  getHotPosts(page: number = 0, size: number = 20): Observable<PaginatedResponse<PostResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedResponse<PostResponse>>(`${this.apiUrl}/hot`, { params }).pipe(
      tap((response) => {
        this.posts.set(response.content);
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
   * GET /api/posts/new
   * Get newest posts sorted by creation date
   */
  getNewPosts(page: number = 0, size: number = 20): Observable<PaginatedResponse<PostResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedResponse<PostResponse>>(`${this.apiUrl}/new`, { params }).pipe(
      tap((response) => {
        this.posts.set(response.content);
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
   * GET /api/posts/top
   * Get top posts sorted by score + comments
   */
  getTopPosts(page: number = 0, size: number = 20): Observable<PaginatedResponse<PostResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PaginatedResponse<PostResponse>>(`${this.apiUrl}/top`, { params }).pipe(
      tap((response) => {
        this.posts.set(response.content);
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
   * GET /api/posts/subreddit/{subredditId}
   * Get posts for a specific subreddit
   */
  getSubredditPosts(
    subredditId: number,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedResponse<PostResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http
      .get<PaginatedResponse<PostResponse>>(`${this.apiUrl}/subreddit/${subredditId}`, { params })
      .pipe(
        tap((response) => {
          this.posts.set(response.content);
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
   * GET /api/posts/user/{userId}
   * Get posts by a specific user
   */
  getUserPosts(
    userId: number,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedResponse<PostResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http
      .get<PaginatedResponse<PostResponse>>(`${this.apiUrl}/user/${userId}`, { params })
      .pipe(
        tap((response) => {
          this.posts.set(response.content);
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
   * GET /api/posts/search
   * Full-text search across post titles and content
   */
  searchPosts(
    query: string,
    page: number = 0,
    size: number = 20,
  ): Observable<PaginatedResponse<PostResponse>> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedResponse<PostResponse>>(`${this.apiUrl}/search`, { params }).pipe(
      tap((response) => {
        this.posts.set(response.content);
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
   * PUT /api/posts/{postId}
   * Update an existing post (only author can edit)
   */
  updatePost(postId: number, postData: UpdatePostDto): Observable<PostResponse> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.put<PostResponse>(`${this.apiUrl}/${postId}`, postData).pipe(
      tap((updatedPost) => {
        this.currentPost.set(updatedPost);
        // Update in local state
        const currentPosts = this.posts();
        const index = currentPosts.findIndex((p) => p.id === postId);
        if (index !== -1) {
          currentPosts[index] = updatedPost;
          this.posts.set([...currentPosts]);
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
   * DELETE /api/posts/{postId}
   * Delete a post (only author can delete)
   */
  deletePost(postId: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/${postId}`).pipe(
      tap(() => {
        // Remove from local state
        const currentPosts = this.posts();
        const filteredPosts = currentPosts.filter((p) => p.id !== postId);
        this.posts.set(filteredPosts);
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
   * GET /api/posts/stickied
   * Get stickied (pinned) posts
   */
  getStickiedPosts(subredditId?: number): Observable<PostResponse[]> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (subredditId) {
      params = params.set('subredditId', subredditId.toString());
    }

    return this.http.get<PostResponse[]>(`${this.apiUrl}/stickied`, { params }).pipe(
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
   * Vote on a post using the /api/votes/post endpoint.
   * Toggle-based voting: first vote creates, same vote removes, opposite vote flips.
   * API returns 200 OK with empty body, so we calculate new state client-side.
   */
  votePost(postId: number, voteType: VoteType | null): Observable<Post> {
    this.loading.set(true);
    this.error.set(null);

    // Get current post state for calculations
    const currentPost = this.posts().find((p) => p.id === postId) || this.currentPost();
    if (!currentPost) {
      return throwError(() => new Error('Post not found'));
    }

    const currentUserVote = currentPost.userVote;

    // Calculate the new state based on the voting action
    let newUserVote: VoteType | null;
    let scoreDelta = 0;
    let upvoteDelta = 0;
    let downvoteDelta = 0;

    if (voteType === null) {
      // Removing vote
      newUserVote = null;
      if (currentUserVote === 'UPVOTE') {
        scoreDelta = -1;
        upvoteDelta = -1;
      } else if (currentUserVote === 'DOWNVOTE') {
        scoreDelta = +1;
        downvoteDelta = -1;
      }
    } else if (currentUserVote === voteType) {
      // Toggle off: same vote clicked again
      newUserVote = null;
      if (voteType === 'UPVOTE') {
        scoreDelta = -1;
        upvoteDelta = -1;
      } else {
        scoreDelta = +1;
        downvoteDelta = -1;
      }
    } else if (currentUserVote === null) {
      // New vote
      newUserVote = voteType;
      if (voteType === 'UPVOTE') {
        scoreDelta = +1;
        upvoteDelta = +1;
      } else {
        scoreDelta = -1;
        downvoteDelta = +1;
      }
    } else {
      // Flip vote (opposite direction)
      newUserVote = voteType;
      if (voteType === 'UPVOTE') {
        // Was DOWNVOTE, now UPVOTE
        scoreDelta = +2;
        upvoteDelta = +1;
        downvoteDelta = -1;
      } else {
        // Was UPVOTE, now DOWNVOTE
        scoreDelta = -2;
        upvoteDelta = -1;
        downvoteDelta = +1;
      }
    }

    // Calculate new values
    const newScore = currentPost.score + scoreDelta;
    const newUpvoteCount = currentPost.upvoteCount + upvoteDelta;
    const newDownvoteCount = currentPost.downvoteCount + downvoteDelta;

    // Create updated post object
    const updatedPost: Post = {
      ...currentPost,
      score: newScore,
      upvoteCount: newUpvoteCount,
      downvoteCount: newDownvoteCount,
      userVote: newUserVote,
    };

    return this.voteService.votePost(postId, voteType).pipe(
      map(() => {
        // Update local state with calculated values
        const currentPosts = this.posts();
        const index = currentPosts.findIndex((p) => p.id === postId);
        if (index !== -1) {
          currentPosts[index] = updatedPost;
          this.posts.set([...currentPosts]);
        }
        if (this.currentPost()?.id === postId) {
          this.currentPost.set(updatedPost);
        }
        this.loading.set(false);
        return updatedPost;
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
    this.posts.set([]);
    this.currentPost.set(null);
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
      this.error.set('Post or subreddit not found.');
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
