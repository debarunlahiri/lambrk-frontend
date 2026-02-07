import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { RecommendationService } from '../../services/recommendation.service';
import { AuthService } from '../../services/auth.service';
import {
  RecommendationResponse,
  RecommendationType,
  getConfidenceLevel,
} from '../../models/recommendation.model';

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
})
export class RecommendationsComponent implements OnInit {
  private recommendationService = inject(RecommendationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab = signal<number>(0);
  recommendations = signal<RecommendationResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const tab = this.activeTab();
    this.loading.set(true);
    this.error.set(null);

    if (tab === 0) {
      // Posts
      this.recommendationService.getPostRecommendations(user.id, { limit: 20 }).subscribe({
        next: (response) => {
          this.recommendations.set(response);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading post recommendations:', err);
          this.error.set('Failed to load recommendations');
          this.loading.set(false);
        },
      });
    } else if (tab === 1) {
      // Subreddits
      this.recommendationService.getSubredditRecommendations(user.id, { limit: 20 }).subscribe({
        next: (response) => {
          this.recommendations.set(response);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading subreddit recommendations:', err);
          this.error.set('Failed to load recommendations');
          this.loading.set(false);
        },
      });
    } else if (tab === 2) {
      // Users
      this.recommendationService.getUserRecommendations(user.id, { limit: 20 }).subscribe({
        next: (response) => {
          this.recommendations.set(response);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading user recommendations:', err);
          this.error.set('Failed to load recommendations');
          this.loading.set(false);
        },
      });
    } else if (tab === 3) {
      // Trending
      this.recommendationService.getTrendingRecommendations('POSTS', 20).subscribe({
        next: (response) => {
          this.recommendations.set(response);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading trending recommendations:', err);
          this.error.set('Failed to load recommendations');
          this.loading.set(false);
        },
      });
    }
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
    this.loadRecommendations();
  }

  getConfidenceLevel(confidence: number) {
    return getConfidenceLevel(confidence);
  }

  navigateToPost(postId: number): void {
    this.router.navigate(['/posts', postId]);
  }

  navigateToSubreddit(subredditName: string): void {
    this.router.navigate(['/r', subredditName]);
  }

  navigateToUser(username: string): void {
    this.router.navigate(['/user', username]);
  }

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toString();
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  }

  refresh(): void {
    this.loadRecommendations();
  }
}
