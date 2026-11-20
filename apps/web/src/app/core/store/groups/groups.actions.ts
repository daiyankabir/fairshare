import { createAction, props } from '@ngrx/store';

export interface Group {
  id: string;
  name: string;
  defaultCurrency: string;
  coverEmoji: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  myRole?: string;
  isGuest?: boolean;
  _count?: { expenses: number; memberships: number; settlements: number };
  memberships?: Array<any>;
}

export interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  loading: boolean;
  error: string | null;
}

export const loadGroups = createAction('[Groups] Load Groups');
export const loadGroupsSuccess = createAction('[Groups] Load Groups Success', props<{ groups: Group[] }>());
export const loadGroupsFailure = createAction('[Groups] Load Groups Failure', props<{ error: string }>());

export const loadGroup = createAction('[Groups] Load Group', props<{ id: string }>());
export const loadGroupSuccess = createAction('[Groups] Load Group Success', props<{ group: Group }>());
export const loadGroupFailure = createAction('[Groups] Load Group Failure', props<{ error: string }>());

export const createGroup = createAction('[Groups] Create Group', props<{ name: string; defaultCurrency: string; coverEmoji?: string; ownerName?: string }>());
export const createGroupSuccess = createAction('[Groups] Create Group Success', props<{ group: Group }>());
export const createGroupFailure = createAction('[Groups] Create Group Failure', props<{ error: string }>());

export const updateGroup = createAction('[Groups] Update Group', props<{ id: string; changes: Partial<Group> }>());
export const updateGroupSuccess = createAction('[Groups] Update Group Success', props<{ group: Group }>());
export const updateGroupFailure = createAction('[Groups] Update Group Failure', props<{ error: string }>());

export const deleteGroup = createAction('[Groups] Delete Group', props<{ id: string }>());
export const deleteGroupSuccess = createAction('[Groups] Delete Group Success', props<{ id: string }>());
export const deleteGroupFailure = createAction('[Groups] Delete Group Failure', props<{ error: string }>());

export const archiveGroup = createAction('[Groups] Archive Group', props<{ id: string; isArchived: boolean }>());
export const archiveGroupSuccess = createAction('[Groups] Archive Group Success', props<{ group: Group }>());
export const archiveGroupFailure = createAction('[Groups] Archive Group Failure', props<{ error: string }>());

export const clearError = createAction('[Groups] Clear Error');
export const setCurrentGroup = createAction('[Groups] Set Current Group', props<{ group: Group | null }>());