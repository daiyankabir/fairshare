import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthStore } from './core/store/auth/auth.store';

describe('AppComponent with routing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideAnimations(),
        provideHttpClient(),
        // Mock AuthStore to return unauthenticated state
        {
          provide: AuthStore,
          useValue: {
            isAuthenticated: () => false,
            token: () => null,
            user: () => null,
            currentUserName: () => 'Guest',
            currentUserEmail: () => '',
            currentUserInitials: () => 'GU',
            currentUserColor: () => '#1976d2',
            currentUserCurrency: () => 'USD',
            isLoading: () => false,
            error: () => null,
            logout: () => {},
            clearError: () => {}
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render without throwing when mounted', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});