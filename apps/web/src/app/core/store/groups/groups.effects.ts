import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';

import * as GroupsActions from './groups.actions';
import { environment } from '../../../../environments/environment';

@Injectable()
export class GroupsEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  loadGroups$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.loadGroups),
    exhaustMap(() =>
      this.http.get<{ groups: any[] }>(`${environment.apiUrl}/groups`).pipe(
        map(({ groups }) => GroupsActions.loadGroupsSuccess({ groups })),
        catchError(error => of(GroupsActions.loadGroupsFailure({ error: error.error?.message || 'Failed to load groups' })))
      )
    )
  ));

  loadGroup$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.loadGroup),
    exhaustMap(({ id }) =>
      this.http.get<any>(`${environment.apiUrl}/groups/${id}`).pipe(
        map(group => GroupsActions.loadGroupSuccess({ group })),
        catchError(error => of(GroupsActions.loadGroupFailure({ error: error.error?.message || 'Failed to load group' })))
      )
    )
  ));

  createGroup$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.createGroup),
    exhaustMap(({ name, defaultCurrency, coverEmoji, ownerName }) =>
      this.http.post<any>(`${environment.apiUrl}/groups`, { name, defaultCurrency, coverEmoji, ownerName }).pipe(
        map(group => GroupsActions.createGroupSuccess({ group })),
        catchError(error => of(GroupsActions.createGroupFailure({ error: error.error?.message || 'Failed to create group' })))
      )
    )
  ));

  createGroupSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.createGroupSuccess),
    tap(({ group }) => this.router.navigate(['/groups', group.id]))
  ), { dispatch: false });

  updateGroup$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.updateGroup),
    exhaustMap(({ id, changes }) =>
      this.http.patch<any>(`${environment.apiUrl}/groups/${id}`, changes).pipe(
        map(group => GroupsActions.updateGroupSuccess({ group })),
        catchError(error => of(GroupsActions.updateGroupFailure({ error: error.error?.message || 'Failed to update group' })))
      )
    )
  ));

  deleteGroup$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.deleteGroup),
    exhaustMap(({ id }) =>
      this.http.delete(`${environment.apiUrl}/groups/${id}`).pipe(
        map(() => GroupsActions.deleteGroupSuccess({ id })),
        catchError(error => of(GroupsActions.deleteGroupFailure({ error: error.error?.message || 'Failed to delete group' })))
      )
    )
  ));

  deleteGroupSuccess$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.deleteGroupSuccess),
    tap(() => this.router.navigate(['/groups']))
  ), { dispatch: false });

  archiveGroup$ = createEffect(() => this.actions$.pipe(
    ofType(GroupsActions.archiveGroup),
    exhaustMap(({ id, isArchived }) =>
      this.http.patch<any>(`${environment.apiUrl}/groups/${id}`, { isArchived }).pipe(
        map(group => GroupsActions.archiveGroupSuccess({ group })),
        catchError(error => of(GroupsActions.archiveGroupFailure({ error: error.error?.message || 'Failed to archive group' })))
      )
    )
  ));
}