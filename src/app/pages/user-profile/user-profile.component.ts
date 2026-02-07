import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { UserService } from '../../services/user.service';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { UserResponse, getKarmaLevel, formatKarma } from '../../models/user.model';
import { Post } from '../../models/post.model';

@Component({
  selector: 'app-user-profile',
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
    MatMenuModule,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private authService = inject(AuthService);

  username = signal<string>('');
  user = signal<UserResponse | null>(null);
  userPosts = signal<Post[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  isOwnProfile = signal<boolean>(false);
  activeTab = signal<number>(0);

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.username.set(username);
      this.loadUser(username);
      this.checkIfOwnProfile(username);
    }
  }

  loadUser(username: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUserByUsername(username).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.loadUserPosts(user.id);
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error.set('User not found');
        this.loading.set(false);
      },
    });
  }

  loadUserPosts(userId: number): void {
    this.postService.getUserPosts(userId, 0, 20).subscribe({
      next: (response) => {
        this.userPosts.set(response.content);
      },
      error: (err) => {
        console.error('Error loading user posts:', err);
      },
    });
  }

  checkIfOwnProfile(username: string): void {
    const currentUser = this.authService.currentUser();
    this.isOwnProfile.set(currentUser?.username === username);
  }

  navigateToPost(postId: number): void {
    this.router.navigate(['/posts', postId]);
  }

  navigateToSubreddit(name: string): void {
    this.router.navigate(['/r', name]);
  }

  editProfile(): void {
    this.router.navigate(['/settings']);
  }

  getKarmaLevel(karma: number) {
    return getKarmaLevel(karma);
  }

  formatKarma(karma: number): string {
    return formatKarma(karma);
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

  getMemberSince(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }
}
