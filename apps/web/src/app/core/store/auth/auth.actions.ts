import { createAction, props } from '@ngrx/store';

export const login = createAction('[Auth] Login', props<{ email: string; password: string }>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: { id: string; email: string; name: string; defaultCurrency: string; avatarColor?: string }; token: string }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

export const register = createAction('[Auth] Register', props<{ email: string; password: string; name: string }>());
export const registerSuccess = createAction('[Auth] Register Success', props<{ user: { id: string; email: string; name: string; defaultCurrency: string; avatarColor?: string }; token: string }>());
export const registerFailure = createAction('[Auth] Register Failure', props<{ error: string }>());

export const claimGuest = createAction('[Auth] Claim Guest', props<{ email: string; password: string; guestToken: string }>());
export const claimGuestSuccess = createAction('[Auth] Claim Guest Success', props<{ user: { id: string; email: string; name: string; defaultCurrency: string; avatarColor?: string }; token: string }>());
export const claimGuestFailure = createAction('[Auth] Claim Guest Failure', props<{ error: string }>());

export const logout = createAction('[Auth] Logout');

export const updateProfile = createAction('[Auth] Update Profile', props<{ updates: Partial<{ id: string; email: string; name: string; defaultCurrency: string; avatarColor?: string }> }>());

export const loadFromStorage = createAction('[Auth] Load From Storage', props<{ user: { id: string; email: string; name: string; defaultCurrency: string; avatarColor?: string } | null; token: string | null }>());

export const clearError = createAction('[Auth] Clear Error');