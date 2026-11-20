import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/groups',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'join/:token',
    loadComponent: () => import('./features/auth/join-group/join-group.component').then(m => m.JoinGroupComponent)
  },
  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-list/group-list.component').then(m => m.GroupListComponent)
  },
  {
    path: 'groups/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-form/group-form.component').then(m => m.GroupFormComponent)
  },
  {
    path: 'groups/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/group-detail/group-detail.component').then(m => m.GroupDetailComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/groups/group-dashboard/group-dashboard.component').then(m => m.GroupDashboardComponent) },
      { path: 'expenses', loadComponent: () => import('./features/expenses/expense-list/expense-list.component').then(m => m.ExpenseListComponent) },
      { path: 'expenses/new', loadComponent: () => import('./features/expenses/expense-form/expense-form.component').then(m => m.ExpenseFormComponent) },
      { path: 'expenses/:expenseId', loadComponent: () => import('./features/expenses/expense-detail/expense-detail.component').then(m => m.ExpenseDetailComponent) },
      { path: 'balances', loadComponent: () => import('./features/balances/balance-view/balance-view.component').then(m => m.BalanceViewComponent) },
      { path: 'settlements', loadComponent: () => import('./features/balances/settlement-list/settlement-list.component').then(m => m.SettlementListComponent) },
      { path: 'settings', loadComponent: () => import('./features/groups/group-settings/group-settings.component').then(m => m.GroupSettingsComponent) },
      { path: 'members', loadComponent: () => import('./features/groups/group-members/group-members.component').then(m => m.GroupMembersComponent) }
    ]
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: '/groups'
  }
];