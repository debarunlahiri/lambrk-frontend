import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  template: `
    <div class="loading-container">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      <p>{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 20px;
      text-align: center;
    }
    p {
      margin-top: 16px;
      color: #7c7c7c;
      font-size: 14px;
    }
  `]
})
export class LoadingStateComponent {
  @Input() message = 'Loading...';
  @Input() diameter = 50;
}

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  template: `
    <mat-card class="error-card">
      <mat-icon class="error-icon">error_outline</mat-icon>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <button mat-raised-button color="primary" (click)="onRetry()">
        <mat-icon>refresh</mat-icon>
        {{ retryText }}
      </button>
    </mat-card>
  `,
  styles: [`
    .error-card {
      padding: 40px;
      text-align: center;
      max-width: 400px;
      margin: 24px auto;
    }
    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #d32f2f;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
    }
    p {
      color: #666;
      margin: 0 0 24px 0;
    }
    button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'Error';
  @Input() message = 'Something went wrong. Please try again.';
  @Input() retryText = 'Retry';
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      @if (showAction) {
        <button mat-raised-button color="primary" (click)="onAction()">
          <mat-icon>{{ actionIcon }}</mat-icon>
          {{ actionText }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }
    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #d7dadc;
      margin-bottom: 16px;
    }
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1b;
      margin: 0 0 8px 0;
    }
    p {
      font-size: 14px;
      color: #7c7c7c;
      margin: 0 0 24px 0;
    }
    button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No items';
  @Input() message = 'There are no items to display.';
  @Input() showAction = false;
  @Input() actionText = 'Create';
  @Input() actionIcon = 'add';
  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
