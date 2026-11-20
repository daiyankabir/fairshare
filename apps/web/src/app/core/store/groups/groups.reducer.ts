import { createReducer, on, Action } from '@ngrx/store';
import * as GroupsActions from './groups.actions';
import { GroupState } from './groups.actions';

export const initialGroupState: GroupState = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null
};

export const groupsReducer = createReducer(
  initialGroupState,
  on(GroupsActions.loadGroups, state => ({ ...state, loading: true, error: null })),
  on(GroupsActions.loadGroupsSuccess, (state, { groups }) => ({
    ...state,
    groups,
    loading: false,
    error: null
  })),
  on(GroupsActions.loadGroupsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(GroupsActions.loadGroup, state => ({ ...state, loading: true, error: null })),
  on(GroupsActions.loadGroupSuccess, (state, { group }) => ({
    ...state,
    currentGroup: group,
    loading: false,
    error: null
  })),
  on(GroupsActions.loadGroupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(GroupsActions.createGroup, state => ({ ...state, loading: true, error: null })),
  on(GroupsActions.createGroupSuccess, (state, { group }) => ({
    ...state,
    groups: [...state.groups, group],
    loading: false,
    error: null
  })),
  on(GroupsActions.createGroupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(GroupsActions.updateGroup, state => ({ ...state, loading: true, error: null })),
  on(GroupsActions.updateGroupSuccess, (state, { group }) => ({
    ...state,
    groups: state.groups.map(g => g.id === group.id ? group : g),
    currentGroup: state.currentGroup?.id === group.id ? group : state.currentGroup,
    loading: false,
    error: null
  })),
  on(GroupsActions.updateGroupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(GroupsActions.deleteGroup, state => ({ ...state, loading: true, error: null })),
  on(GroupsActions.deleteGroupSuccess, (state, { id }) => ({
    ...state,
    groups: state.groups.filter(g => g.id !== id),
    currentGroup: state.currentGroup?.id === id ? null : state.currentGroup,
    loading: false,
    error: null
  })),
  on(GroupsActions.deleteGroupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(GroupsActions.archiveGroup, state => ({ ...state, loading: true, error: null })),
  on(GroupsActions.archiveGroupSuccess, (state, { group }) => ({
    ...state,
    groups: state.groups.map(g => g.id === group.id ? group : g),
    currentGroup: state.currentGroup?.id === group.id ? group : state.currentGroup,
    loading: false,
    error: null
  })),
  on(GroupsActions.archiveGroupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(GroupsActions.clearError, state => ({ ...state, error: null })),
  on(GroupsActions.setCurrentGroup, (state, { group }) => ({
    ...state,
    currentGroup: group
  }))
);

export function reducer(state: GroupState | undefined, action: Action): GroupState {
  return groupsReducer(state, action);
}