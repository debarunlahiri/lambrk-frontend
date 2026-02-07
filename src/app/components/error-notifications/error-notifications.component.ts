import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ErrorHandlerService, ErrorNotification } from '../../services/error-handler.service';

@Component({
  selector: 'app-error-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './error-notifications.component.html',
  styleUrl: './error-notifications.component.scss'
})
export class ErrorNotificationsComponent {
  errorHandler = inject(ErrorHandlerService);

  // Computed signal for notifications
  notifications = computed(() => this.errorHandler.notifications());

  // Group notifications by type for better organization
  errorNotifications = computed(() => 
    this.notifications().filter(n => n.type === 'error')
  );
  
  warningNotifications = computed(() => 
    this.notifications().filter(n => n.type === 'warning')
  );
  
  infoNotifications = computed(() => 
    this.notifications().filter(n => n.type === 'info')
  );

  removeNotification(id: string): void {
    this.errorHandler.removeNotification(id);
  }

  clearAll(): void {
    this.errorHandler.clearNotifications();
  }

  getIcon(type: 'error' | 'warning' | 'info'): string {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  hasFieldErrors(notification: ErrorNotification): boolean {
    return !!notification.fieldErrors && Object.keys(notification.fieldErrors).length > 0;
  }

  getFieldErrors(notification: ErrorNotification): Array<{ field: string; message: string }> {
    if (!notification.fieldErrors) return [];
    return Object.entries(notification.fieldErrors).map(([field, message]) => ({ field, message }));
  }

  hasViolationCategories(notification: ErrorNotification): boolean {
    return !!notification.violationCategories && notification.violationCategories.length > 0;
  }

  getViolationCategories(notification: ErrorNotification): string[] {
    return notification.violationCategories || [];
  }

  formatViolationCategory(category: string): string {
    // Convert snake_case to Title Case
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}
