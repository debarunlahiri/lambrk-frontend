import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { ProblemDetails, ApiError, ErrorType, isProblemDetails, extractErrorType, ERROR_TYPE_SLUGS } from '../models/post.model';

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  fieldErrors?: Record<string, string>;
  violationCategories?: string[];
  timestamp: string;
  autoClose?: number; // milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  // Signals for reactive error state
  currentError = signal<ApiError | null>(null);
  notifications = signal<ErrorNotification[]>([]);

  // BehaviorSubject for RxJS patterns
  private errorSubject = new BehaviorSubject<ApiError | null>(null);
  error$ = this.errorSubject.asObservable();

  // Error counters for observability
  private errorCounts = new Map<string, number>();

  constructor() {
    // Initialize error counters
    Object.values(ERROR_TYPE_SLUGS).forEach(type => {
      this.errorCounts.set(type, 0);
    });
  }

  /**
   * Handle HTTP errors and convert them to ApiError format
   */
  handleError(error: HttpErrorResponse | Error): Observable<never> {
    const apiError = this.createApiError(error);

    // Update reactive state
    this.currentError.set(apiError);
    this.errorSubject.next(apiError);

    // Increment error counter
    const errorType = apiError.problem.type.split('/').pop() as ErrorType;
    this.incrementErrorCount(errorType);

    // Show user-friendly notification
    this.showNotification(apiError);

    // Log error for debugging
    this.logError(apiError);

    return throwError(() => apiError);
  }

  /**
   * Create ApiError from various error sources
   */
  private createApiError(error: HttpErrorResponse | Error): ApiError {
    if (error instanceof HttpErrorResponse) {
      // Check if it's a Problem Details response
      if (isProblemDetails(error.error)) {
        return {
          problem: error.error,
          originalError: error,
          isNetworkError: false
        };
      }

      // Convert regular HTTP error to Problem Details format
      return {
        problem: this.createProblemDetails(error),
        originalError: error,
        isNetworkError: false
      };
    }

    // Handle network/client errors
    return {
      problem: {
        type: 'https://api.reddit-frontend.com/errors/network',
        title: 'Network Error',
        status: 0,
        detail: error.message || 'Unable to connect to the server',
        timestamp: new Date().toISOString()
      },
      originalError: error,
      isNetworkError: true
    };
  }

  /**
   * Create Problem Details from regular HTTP error
   */
  private createProblemDetails(error: HttpErrorResponse): ProblemDetails {
    const status = error.status;
    const type = extractErrorType(status);

    return {
      type: `https://api.reddit-backend.com/errors/${type}`,
      title: this.getErrorMessage(type, status),
      status,
      detail: error.error?.message || error.message || this.getDefaultMessage(status),
      instance: error.url || undefined,
      timestamp: new Date().toISOString(),
      fieldErrors: error.error?.fieldErrors,
      violationCategories: error.error?.violationCategories
    };
  }

  /**
   * Get user-friendly error title based on type
   */
  private getErrorMessage(type: ErrorType, status: number): string {
    switch (type) {
      case 'validation':
        return 'Validation Error';
      case 'bad-credentials':
        return 'Authentication Failed';
      case 'access-denied':
        return 'Access Denied';
      case 'unauthorized-action':
        return 'Unauthorized Action';
      case 'not-found':
        return 'Resource Not Found';
      case 'duplicate':
        return 'Duplicate Resource';
      case 'content-moderation':
        return 'Content Moderation Violation';
      case 'rate-limit':
        return 'Rate Limit Exceeded';
      case 'bulkhead':
        return 'Service Busy';
      case 'circuit-breaker':
        return 'Service Unavailable';
      case 'internal':
        return 'Internal Server Error';
      default:
        return 'Error';
    }
  }

  /**
   * Get default error message
   */
  private getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return 'The request was invalid. Please check your input.';
      case 401:
        return 'You need to log in to perform this action.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'The resource already exists.';
      case 422:
        return 'The content violates our community guidelines.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 503:
        return 'The service is temporarily unavailable.';
      case 500:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  /**
   * Show user notification for the error
   */
  private showNotification(apiError: ApiError): void {
    const { problem } = apiError;

    // Skip notifications for 401 (handled by auth interceptor)
    if (problem.status === 401) {
      return;
    }

    const notification: ErrorNotification = {
      id: this.generateId(),
      type: this.getNotificationType(problem.status),
      title: problem.title,
      message: problem.detail,
      fieldErrors: problem.fieldErrors,
      violationCategories: problem.violationCategories,
      timestamp: problem.timestamp,
      autoClose: this.getAutoCloseTime(problem.status)
    };

    // Add to notifications list
    const current = this.notifications();
    this.notifications.set([...current, notification]);

    // Auto-remove after timeout
    if (notification.autoClose) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.autoClose);
    }
  }

  /**
   * Determine notification type based on status
   */
  private getNotificationType(status: number): 'error' | 'warning' | 'info' {
    if (status >= 500) return 'error';
    if (status === 422) return 'warning';
    if (status === 404) return 'info';
    return 'error';
  }

  /**
   * Get auto-close time based on error type
   */
  private getAutoCloseTime(status: number): number {
    // Critical errors stay longer
    if (status >= 500) return 10000;
    if (status === 429) return 8000;
    if (status === 422) return 6000;
    return 5000;
  }

  /**
   * Remove notification by ID
   */
  removeNotification(id: string): void {
    const current = this.notifications();
    this.notifications.set(current.filter(n => n.id !== id));
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.notifications.set([]);
  }

  /**
   * Get error counts for observability
   */
  getErrorCounts(): Record<string, number> {
    return Object.fromEntries(this.errorCounts.entries());
  }

  /**
   * Increment error counter
   */
  private incrementErrorCount(type: ErrorType): void {
    const current = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, current + 1);
  }

  /**
   * Generate unique ID for notifications
   */
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error for debugging
   */
  private logError(apiError: ApiError): void {
    const { problem, originalError } = apiError;

    console.group(`🚨 ${problem.title} (${problem.status})`);
    console.error('Problem Details:', problem);
    console.error('Original Error:', originalError);
    console.groupEnd();

    // In production, send to logging service
    // this.loggingService.logError(apiError);
  }

  /**
   * Reset error state (useful for testing or logout)
   */
  reset(): void {
    this.currentError.set(null);
    this.errorSubject.next(null);
    this.clearNotifications();

    // Reset counters
    Object.keys(this.errorCounts).forEach(key => {
      this.errorCounts.set(key as ErrorType, 0);
    });
  }
}

