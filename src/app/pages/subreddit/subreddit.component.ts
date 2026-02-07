import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedMaterialModule } from '../../shared/shared-material.module';
import { SubredditService } from '../../services/subreddit.service';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { SubredditResponse } from '../../models/subreddit.model';
import { Post } from '../../models/post.model';
import { FormatNumberPipe, TimeAgoPipe } from '../../pipes/format.pipes';

@Component({
  selector: 'app-subreddit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedMaterialModule,
    FormatNumberPipe,
    TimeAgoPipe,
  ],
  templateUrl: './subreddit.component.html',
  styleUrl: './subreddit.component.scss',
})
export class SubredditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subredditService = inject(SubredditService);
  private postService = inject(PostService);
  private authService = inject(AuthService);

  subredditName = signal<string>('');
  subreddit = signal<SubredditResponse | null>(null);
  posts = signal<Post[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  activeTab = signal<number>(0);
  sortBy = signal<'hot' | 'new' | 'top'>('hot');

  ngOnInit(): void {
    const name = this.route.snapshot.paramMap.get('subreddit');
    if (name) {
      this.subredditName.set(name);
      this.loadSubreddit(name);
      this.loadPosts();
    }
  }

  loadSubreddit(name: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.subredditService.getSubredditByName(name).subscribe({
      next: (subreddit) => {
        this.subreddit.set(subreddit);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subreddit:', err);
        this.error.set('Failed to load subreddit');
        this.loading.set(false);
      },
    });
  }

  loadPosts(): void {
    const subreddit = this.subreddit();
    if (!subreddit) return;

    const sort = this.sortBy();
    const subredditId = subreddit.id;

    if (sort === 'hot') {
      this.postService.getSubredditPosts(subredditId, 0, 20).subscribe({
        next: (response) => {
          this.posts.set(response.content);
        },
        error: (err) => {
          console.error('Error loading posts:', err);
        },
      });
    } else if (sort === 'new') {
      this.postService.getNewPosts(0, 20).subscribe({
        next: (response) => {
          // Filter by subreddit
          const filtered = response.content.filter((p) => p.subreddit.id === subredditId);
          this.posts.set(filtered);
        },
        error: (err) => {
          console.error('Error loading posts:', err);
        },
      });
    } else if (sort === 'top') {
      this.postService.getTopPosts(0, 20).subscribe({
        next: (response) => {
          // Filter by subreddit
          const filtered = response.content.filter((p) => p.subreddit.id === subredditId);
          this.posts.set(filtered);
        },
        error: (err) => {
          console.error('Error loading posts:', err);
        },
      });
    }
  }

  onSortChange(sort: 'hot' | 'new' | 'top'): void {
    this.sortBy.set(sort);
    this.loadPosts();
  }

  toggleSubscription(): void {
    const subreddit = this.subreddit();
    if (!subreddit) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (subreddit.isUserSubscribed) {
      this.subredditService.unsubscribe(subreddit.id).subscribe({
        next: () => {
          // Update local state
          this.subreddit.set({
            ...subreddit,
            isUserSubscribed: false,
            subscriberCount: Math.max(0, subreddit.subscriberCount - 1),
            memberCount: Math.max(0, subreddit.memberCount - 1),
          });
        },
        error: (err) => {
          console.error('Error unsubscribing:', err);
        },
      });
    } else {
      this.subredditService.subscribe(subreddit.id).subscribe({
        next: () => {
          // Update local state
          this.subreddit.set({
            ...subreddit,
            isUserSubscribed: true,
            subscriberCount: subreddit.subscriberCount + 1,
            memberCount: subreddit.memberCount + 1,
          });
        },
        error: (err) => {
          console.error('Error subscribing:', err);
        },
      });
    }
  }

  createPost(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.router.navigate(['/create-post'], {
      queryParams: { subreddit: this.subredditName() },
    });
  }

  navigateToPost(postId: number): void {
    this.router.navigate(['/posts', postId]);
  }
}
