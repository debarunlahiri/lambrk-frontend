import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandlerService } from '../services/error-handler.service';

/**
 * Functional error interceptor (Angular 15+).
 * Converts all HTTP errors to RFC 7807 Problem Details format
 * and forwards them to the ErrorHandlerService for centralized handling.
 */
export const errorInterceptorFn: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle through centralized error handler
      const errorHandler = new ErrorHandlerService();
      return errorHandler.handleError(error);
    })
  );
};
