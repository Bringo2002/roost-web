import { api, setAuthToken, getAuthToken } from './api';
import { firebaseGoogleSignIn, firebaseSignOut } from './firebase';
import type { AuthResponse } from '../types/user';

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Whether an auth response marks a brand-new account.
 * The backend returns this flag from AuthResponse.isNewUser(), which
 * Jackson serializes as `newUser` (JavaBeans naming strips the `is`),
 * not `isNewUser`. Accept both for compat.
 */
function isNewUserFlag(data: Record<string, unknown>): boolean {
  return data.isNewUser === true || data.newUser === true;
}

// ── Email/Password ───────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
    if (data?.token) {
      setAuthToken(data.token);
      return { success: true };
    }
    return { success: false, error: 'No token received' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
  }
}

export async function signup(name: string, email: string, password: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
  try {
    const data = await api.post<AuthResponse>('/api/auth/signup', { name, email, password });
    if (data?.token) {
      setAuthToken(data.token);
      return { success: true, isNewUser: true };
    }
    return { success: false, error: 'No token received' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Signup failed' };
  }
}

// ── Google Sign-In ───────────────────────────────────────────
// Mirrors the Android flow exactly:
//   1. Google identity → Firebase credential → Firebase ID token
//   2. POST /api/auth/google { idToken: firebaseIdToken }
//   3. Backend verifies Firebase token, creates/finds user, returns Roost JWT

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> {
  try {
    const googleResult = await firebaseGoogleSignIn();

    // User cancelled the popup
    if (googleResult.cancelled) {
      return { success: false };
    }

    // Exchange Firebase ID token with our backend (same as Android _exchangeGoogleToken)
    const data = await api.post<AuthResponse & Record<string, unknown>>('/api/auth/google', {
      idToken: googleResult.firebaseIdToken,
    });

    if (data?.token) {
      setAuthToken(data.token);
      return { success: true, isNewUser: isNewUserFlag(data) };
    }

    return { success: false, error: 'Google sign-in failed. No token received.' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Google sign-in failed. Please try again.',
    };
  }
}

// ── Token Management ─────────────────────────────────────────

export async function refreshToken(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const data = await api.post<AuthResponse>('/api/auth/refresh');
    if (data?.token) {
      setAuthToken(data.token);
      return true;
    }
  } catch { /* refresh failed */ }
  return false;
}

export function logout(): void {
  setAuthToken(null);
  // Best-effort Firebase sign-out (matches Android logout behavior)
  firebaseSignOut();
}

export function isLoggedIn(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export function getUserFromToken(): { email?: string; name?: string; sub?: string } | null {
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return {
    email: payload.sub as string | undefined,
    name: (payload.name || payload.userName) as string | undefined,
    sub: payload.sub as string | undefined,
  };
}
