import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SharedMaterialModule } from '../../shared/shared-material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PostService } from '../../services/post.service';
import { FeedService } from '../../services/feed.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { FormatNumberPipe, TimeAgoPipe } from '../../pipes/format.pipes';
import { FeedPost, SuggestedUser } from '../../models/feed.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedMaterialModule,
    FormatNumberPipe,
    TimeAgoPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  postService = inject(PostService);
  feedService = inject(FeedService);
  authService = inject(AuthService);
  private wsService = inject(WebSocketService);

  searchControl = new FormControl('');
  selectedSort = signal<'algorithm' | 'hot' | 'new' | 'top'>('algorithm');
  currentPage = signal<number>(1);
  showAlgorithmInfo = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadFeed();
    this.setupWebSocketSubscriptions();

    // Wire up search with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        if (query && query.trim().length > 0) {
          this.postService.searchPosts(query.trim(), 0, 20).subscribe();
        } else {
          this.loadFeed();
        }
      });
  }

  private setupWebSocketSubscriptions(): void {
    // Subscribe to post updates (score, comment count, etc.)
    this.wsService.postUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (update) => {
        const currentPosts = this.feedService.posts();
        const index = currentPosts.findIndex((p) => p.id === update.id);
        if (index !== -1) {
          // Update the post with new values
          currentPosts[index] = {
            ...currentPosts[index],
            score: update.score,
            commentCount: update.commentCount,
            upvoteCount: update.upvoteCount,
            downvoteCount: update.downvoteCount,
            viewCount: update.viewCount,
          };
          this.feedService.posts.set([...currentPosts]);
        }
      },
    });

    // Subscribe to vote updates for real-time vote feedback
    this.wsService.voteUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (vote) => {
        if (vote.targetType === 'POST') {
          const currentPosts = this.feedService.posts();
          const index = currentPosts.findIndex((p) => p.id === vote.targetId);
          if (index !== -1) {
            currentPosts[index] = {
              ...currentPosts[index],
              score: vote.newScore,
              userInteraction: {
                ...currentPosts[index].userInteraction,
                hasUpvoted: vote.userVote === 'UPVOTE',
                hasDownvoted: vote.userVote === 'DOWNVOTE',
              },
            };
            this.feedService.posts.set([...currentPosts]);
          }
        }
      },
    });

    // Subscribe to karma updates for current user
    this.wsService.karmaUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (karma) => {
        this.snackBar.open(`Karma ${karma.change >= 0 ? '+' : ''}${karma.change}: ${karma.reason}`, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFeed(): void {
    const sort = this.selectedSort();
    const limit = 20;

    switch (sort) {
      case 'hot':
        this.feedService.getHotPosts(limit).subscribe();
        break;
      case 'new':
        this.feedService.getNewPosts(limit).subscribe();
        break;
      case 'top':
        this.feedService.getTopPosts(limit).subscribe();
        break;
      case 'algorithm':
      default:
        this.feedService.getFeed({ limit, sortBy: 'algorithm' }).subscribe();
        break;
    }
  }

  onSortChange(sort: 'algorithm' | 'hot' | 'new' | 'top'): void {
    this.selectedSort.set(sort);
    this.currentPage.set(1);
    this.loadFeed();
  }

  onVote(post: FeedPost, voteType: 'upvote' | 'downvote'): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    // Convert to API format
    const apiVoteType = voteType === 'upvote' ? 'UPVOTE' : 'DOWNVOTE';
    // If already voted the same way, remove vote
    const finalVote = post.userInteraction.hasUpvoted && voteType === 'upvote'
      ? null
      : post.userInteraction.hasDownvoted && voteType === 'downvote'
      ? null
      : apiVoteType;

    this.postService.votePost(post.id, finalVote).subscribe();
  }

  toggleAlgorithmInfo(): void {
    this.showAlgorithmInfo.update(v => !v);
  }

  getUserVoteStatus(post: FeedPost): string | null {
    if (post.userInteraction.hasUpvoted) return 'UPVOTE';
    if (post.userInteraction.hasDownvoted) return 'DOWNVOTE';
    return null;
  }

  onClearSearch(): void {
    this.searchControl.setValue('');
  }

  onCreatePost(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/create-post' },
      });
      return;
    }
    this.router.navigate(['/create-post']);
  }

  refreshFeed(): void {
    this.currentPage.set(1);
    this.loadFeed();
  }

  loadMore(): void {
    this.currentPage.update((p) => p + 1);
    // TODO: Implement pagination with feed API
    this.loadFeed();
  }
}
