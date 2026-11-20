import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../store/auth/auth.store';
import { Router } from '@angular/router';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authStore = inject(AuthStore);
  const router = inject(Router);
  
  return next(req).pipe(
    catchError(error => {
      let message = 'An unexpected error occurred';
      
      if (error.status === 0) {
        message = 'Network error. Please check your connection.';
      } else if (error.status === 400) {
        message = error.error?.message || 'Invalid request';
      } else if (error.status === 401) {
        message = 'Session expired. Please sign in again.';
        authStore.logout();
      } else if (error.status === 403) {
        message = 'You do not have permission to perform this action.';
      } else if (error.status === 404) {
        message = 'Resource not found.';
      } else if (error.status === 409) {
        message = error.error?.message || 'Conflict detected. Please refresh and try again.';
      } else if (error.status === 422) {
        message = error.error?.message || 'Validation failed.';
      } else if (error.status >= 500) {
        message = 'Server error. Please try again later.';
      }
      
      snackBar.open(message, 'Dismiss', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
      
      return throwError(() => error);
    })
  );
};