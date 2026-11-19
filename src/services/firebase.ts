import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type UserCredential } from 'firebase/auth';

/**
 * Firebase configuration for the Roost project (roost-82903).
 * Uses the same project as the Android app — the web client ID is the
 * OAuth 2.0 "Web client" from google-services.json (client_type: 3).
 */
const firebaseConfig = {
  apiKey: 'AIzaSyD3YH7grGwJ3hxcFqYtPhlNQJB-7xB7fw0',
  authDomain: 'roost-82903.firebaseapp.com',
  projectId: 'roost-82903',
  storageBucket: 'roost-82903.firebasestorage.app',
  messagingSenderId: '1085731102031',
  appId: '1:1085731102031:android:be35d872c26bc5258c393a',
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

/**
 * Google sign-in via Firebase popup.
 *
 * Mirrors the Android flow:
 *   1. User picks their Google account (popup)
 *   2. Firebase mints a Firebase ID token
 *   3. We return the Firebase ID token for exchange with our backend
 *
 * The backend endpoint POST /api/auth/google expects: { idToken: <firebaseIdToken> }
 */
export async function firebaseGoogleSignIn(): Promise<{
  firebaseIdToken: string;
  displayName: string | null;
  email: string | null;
  cancelled?: boolean;
}> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  let result: UserCredential;
  try {
    result = await signInWithPopup(auth, provider);
  } catch (err: unknown) {
    const firebaseErr = err as { code?: string };
    if (
      firebaseErr.code === 'auth/popup-closed-by-user' ||
      firebaseErr.code === 'auth/cancelled-popup-request'
    ) {
      return { firebaseIdToken: '', displayName: null, email: null, cancelled: true };
    }
    throw err;
  }

  const firebaseIdToken = await result.user.getIdToken(true);
  if (!firebaseIdToken) {
    throw new Error('Firebase did not return an ID token.');
  }

  return {
    firebaseIdToken,
    displayName: result.user.displayName,
    email: result.user.email,
  };
}

/**
 * Sign out from Firebase (best-effort, used during logout).
 */
export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Best-effort — doesn't block app-level logout
  }
}

export { auth };
