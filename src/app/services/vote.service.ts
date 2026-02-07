import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { VotePostRequest, VoteCommentRequest, VoteType, VoteResult } from '../models/post.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VoteService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/votes`;

  constructor(private http: HttpClient) {}

  /**
   * POST /api/votes/post
   * Vote on a post (upvote/downvote). Toggle-based:
   * - First vote → creates the vote
   * - Same vote again → removes the vote (toggle off)
   * - Opposite vote → flips the vote direction
   */
  votePost(postId: number, voteType: VoteType | null): Observable<VoteResult> {
    const request: VotePostRequest = {
      voteType: voteType ?? 'UPVOTE', // API requires a type even when removing
      postId,
      commentId: null,
    };

    return this.http.post<void>(`${this.apiUrl}/post`, request).pipe(
      tap(() => {
        // API returns 200 OK with empty body
        // Calculate the new state based on current vote action
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
      // Map empty response to VoteResult - actual values will be calculated by the caller
      map(() => ({
        success: true,
        postId,
        newScore: 0, // Will be calculated by PostService based on action
        newUpvoteCount: 0,
        newDownvoteCount: 0,
        userVote: voteType,
      }))
    );
  }

  /**
   * POST /api/votes/comment
   * Vote on a comment. Same toggle behavior as post votes.
   */
  voteComment(commentId: number, voteType: VoteType | null): Observable<VoteResult> {
    const request: VoteCommentRequest = {
      voteType: voteType ?? 'UPVOTE',
      postId: null,
      commentId,
    };

    return this.http.post<void>(`${this.apiUrl}/comment`, request).pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
      map(() => ({
        success: true,
        commentId,
        newScore: 0,
        newUpvoteCount: 0,
        newDownvoteCount: 0,
        userVote: voteType,
      }))
    );
  }
}
