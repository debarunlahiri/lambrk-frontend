import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';

interface Notification {
  id: number;
  type: 'comment' | 'reply' | 'upvote' | 'award' | 'follow' | 'message';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  avatar?: string;
  username?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTabsModule,
    MatMenuModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  activeFilter = signal<'all' | 'unread'>('all');

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    // Mock notifications - in a real app, this would be an API call
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'comment',
        title: 'New comment on your post',
        message: 'john_doe commented on your post "Angular Best Practices"',
        link: '/post/123',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        username: 'john_doe',
      },
      {
        id: 2,
        type: 'reply',
        title: 'Reply to your comment',
        message: 'jane_smith replied to your comment',
        link: '/post/456',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        username: 'jane_smith',
      },
      {
        id: 3,
        type: 'upvote',
        title: 'Your post is trending',
        message: 'Your post "TypeScript Tips" received 100 upvotes',
        link: '/post/789',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 4,
        type: 'award',
        title: 'You received an award',
        message: 'Someone gave your post a Gold award!',
        link: '/post/789',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        id: 5,
        type: 'follow',
        title: 'New follower',
        message: 'dev_master started following you',
        link: '/user/dev_master',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        username: 'dev_master',
      },
    ];

    this.notifications.set(mockNotifications);
    this.updateUnreadCount();
  }

  get filteredNotifications(): Notification[] {
    const all = this.notifications();
    if (this.activeFilter() === 'unread') {
      return all.filter((n) => !n.isRead);
    }
    return all;
  }

  markAsRead(notificationId: number): void {
    const notifications = this.notifications();
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n,
    );
    this.notifications.set(updated);
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const notifications = this.notifications();
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    this.notifications.set(updated);
    this.updateUnreadCount();
  }

  deleteNotification(notificationId: number): void {
    const notifications = this.notifications();
    const updated = notifications.filter((n) => n.id !== notificationId);
    this.notifications.set(updated);
    this.updateUnreadCount();
  }

  clearAll(): void {
    this.notifications.set([]);
    this.updateUnreadCount();
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.activeFilter.set(filter);
  }

  private updateUnreadCount(): void {
    const count = this.notifications().filter((n) => !n.isRead).length;
    this.unreadCount.set(count);
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      comment: 'comment',
      reply: 'reply',
      upvote: 'arrow_upward',
      award: 'emoji_events',
      follow: 'person_add',
      message: 'mail',
    };
    return icons[type] || 'notifications';
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
}
