import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SharedMaterialModule } from '../../shared/shared-material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Post } from '../../models/post.model';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { FormatNumberPipe, TimeAgoPipe } from '../../pipes/format.pipes';

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
  authService = inject(AuthService);
  private wsService = inject(WebSocketService);

  searchControl = new FormControl('');
  selectedSort = signal<string>('hot');
  currentPage = signal<number>(1);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadPosts();
    this.setupWebSocketSubscriptions();

    // Wire up search with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        if (query && query.trim().length > 0) {
          this.postService.searchPosts(query.trim(), 0, 20).subscribe();
        } else {
          this.loadPosts();
        }
      });
  }

  private setupWebSocketSubscriptions(): void {
    // Subscribe to post updates (score, comment count, etc.)
    this.wsService.postUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (update) => {
        const currentPosts = this.postService.posts();
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
            awardCount: update.awardCount,
          };
          this.postService.posts.set([...currentPosts]);
        }
      },
    });

    // Subscribe to vote updates for real-time vote feedback
    this.wsService.voteUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (vote) => {
        if (vote.targetType === 'POST') {
          const currentPosts = this.postService.posts();
          const index = currentPosts.findIndex((p) => p.id === vote.targetId);
          if (index !== -1) {
            currentPosts[index] = {
              ...currentPosts[index],
              score: vote.newScore,
              userVote: vote.userVote,
            };
            this.postService.posts.set([...currentPosts]);
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

  loadPosts(): void {
    const page = this.currentPage() - 1; // API uses 0-based indexing
    const sort = this.selectedSort();

    if (sort === 'hot') {
      this.postService.getHotPosts(page, 20).subscribe();
    } else if (sort === 'new') {
      this.postService.getNewPosts(page, 20).subscribe();
    } else if (sort === 'top') {
      this.postService.getTopPosts(page, 20).subscribe();
    }
  }

  onSortChange(sort: string): void {
    this.selectedSort.set(sort);
    this.currentPage.set(1);
    this.loadPosts();
  }

  onVote(post: Post, voteType: 'upvote' | 'downvote'): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    // Convert to API format
    const apiVoteType = voteType === 'upvote' ? 'UPVOTE' : 'DOWNVOTE';
    // If already voted the same way, remove vote
    const finalVote = post.userVote === apiVoteType ? null : apiVoteType;

    this.postService.votePost(post.id, finalVote).subscribe();
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
    this.loadPosts();
  }

  loadMore(): void {
    this.currentPage.update((p) => p + 1);
    this.loadPosts();
  }
}
