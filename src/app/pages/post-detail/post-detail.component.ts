import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedMaterialModule } from '../../shared/shared-material.module';
import { CommentListComponent } from '../../components/comment-list/comment-list.component';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { Post } from '../../models/post.model';
import { TimeAgoPipe } from '../../pipes/format.pipes';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    SharedMaterialModule,
    CommentListComponent,
    TimeAgoPipe,
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private wsService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  postId = Number(this.route.snapshot.paramMap.get('id')) || 0;
  post = signal<Post | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  currentUserId = signal<number | undefined>(undefined);

  ngOnInit(): void {
    this.loadPost();
    this.loadCurrentUser();
    this.setupWebSocketSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.unsubscribeFromPost(this.postId);
  }

  private setupWebSocketSubscriptions(): void {
    // Subscribe to post-specific updates
    this.wsService.subscribeToPost(this.postId);

    // Listen for post updates
    this.wsService.postUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (update) => {
        if (update.id === this.postId && this.post()) {
          this.post.update((current) => {
            if (!current) return null;
            return {
              ...current,
              score: update.score,
              commentCount: update.commentCount,
              upvoteCount: update.upvoteCount,
              downvoteCount: update.downvoteCount,
              viewCount: update.viewCount,
              awardCount: update.awardCount,
            };
          });
        }
      },
    });

    // Listen for vote updates on this post
    this.wsService.voteUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (vote) => {
        if (vote.targetId === this.postId && vote.targetType === 'POST' && this.post()) {
          this.post.update((current) => {
            if (!current) return null;
            return {
              ...current,
              score: vote.newScore,
              userVote: vote.userVote,
            };
          });
        }
      },
    });
  }

  loadPost(): void {
    if (!this.postId) {
      this.error.set('Invalid post ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.postService.getPost(this.postId).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading post:', err);
        this.error.set('Failed to load post. Please try again.');
        this.loading.set(false);
      },
    });
  }

  loadCurrentUser(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.currentUserId.set(user.id);
    }
  }

  votePost(voteType: 'upvote' | 'downvote'): void {
    if (!this.post()) return;

    const currentPost = this.post()!;
    const apiVoteType = voteType === 'upvote' ? 'UPVOTE' : 'DOWNVOTE';
    const finalVote = currentPost.userVote === apiVoteType ? null : apiVoteType;

    this.postService.votePost(currentPost.id, finalVote).subscribe({
      next: (updatedPost) => {
        this.post.set(updatedPost);
      },
      error: (err) => {
        console.error('Error voting on post:', err);
      },
    });
  }
}
