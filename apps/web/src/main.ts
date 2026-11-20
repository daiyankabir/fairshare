import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';
import { httpErrorInterceptor } from './app/core/interceptors/http-error.interceptor';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { authReducer } from './app/core/store/auth/auth.reducer';
import { groupsReducer } from './app/core/store/groups/groups.reducer';
import { expensesReducer } from './app/core/store/expenses/expenses.reducer';
import { AuthEffects } from './app/core/store/auth/auth.effects';
import { GroupsEffects } from './app/core/store/groups/groups.effects';
import { ExpensesEffects } from './app/core/store/expenses/expenses.effects';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, httpErrorInterceptor])
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideStore(),
    provideState({ name: 'auth', reducer: authReducer }),
    provideState({ name: 'groups', reducer: groupsReducer }),
    provideState({ name: 'expenses', reducer: expensesReducer }),
    provideEffects(AuthEffects, GroupsEffects, ExpensesEffects),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' }
    }
  ]
}).catch(err => console.error(err));