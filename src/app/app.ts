import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { WebSocketService } from './services/websocket.service';
import { ErrorNotificationsComponent } from './components/error-notifications/error-notifications.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    ErrorNotificationsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private wsService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Connect to WebSocket when authenticated
    if (this.authService.isAuthenticated()) {
      this.wsService.connect();
    }

    // Subscribe to auth changes to connect/disconnect WebSocket
    this.authService.isAuthenticated;

    // Handle WebSocket notifications
    this.wsService.notifications$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (notification) => {
        console.log('New notification:', notification);
        // Could show a toast/snackbar here
      },
    });

    // Handle system announcements
    this.wsService.announcements$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (announcement) => {
        console.log('System announcement:', announcement);
        // Could show a modal for critical announcements
      },
    });

    // Handle karma updates
    this.wsService.karmaUpdates$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (karma) => {
        console.log('Karma updated:', karma);
        // Could show a toast with karma change
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }

  onLogout(): void {
    this.wsService.disconnect();
    this.authService.logout();
  }
}
