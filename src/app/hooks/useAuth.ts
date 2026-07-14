import { useCallback, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../../firebase';
import {
  onAuthStateChanged, signInAnonymously, signOut,
  signInWithRedirect, linkWithRedirect, getRedirectResult, signInWithCredential,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  EmailAuthProvider, GoogleAuthProvider, linkWithCredential,
  type User, type AuthError,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

// Google sign-in uses a full-page redirect rather than a popup: Google's own
// OAuth pages set their own strict Cross-Origin-Opener-Policy, which severs
// the opener/popup relationship regardless of what this app's COOP header
// says, breaking Firebase's popup-based flow (surfaces as a spurious
// auth/popup-closed-by-user right after picking an account). Redirect
// sidesteps the popup/COOP interaction entirely. The anonymous uid has to be
// stashed across the full-page navigation so migratePresets can still run
// once the user lands back here signed in.
const PENDING_ANON_UID_KEY = 'wav_pending_anon_uid_for_migration';

// Copies presets + folder metadata from an anonymous session's UID over to
// a newly-linked/signed-in permanent account's UID. Only needed on the
// "credential already in use" / "email already in use" fallback paths below
// — the happy path (linkWithPopup/linkWithCredential succeeding) keeps the
// same UID and needs no migration at all. Merges rather than overwrites so
// it's safe to call even when the target account already has its own
// presets from a previous device.
async function migratePresets(oldUid: string, newUid: string) {
  if (oldUid === newUid) return;
  try {
    const [presetsSnap, folderDoc, targetFolderDoc] = await Promise.all([
      getDocs(collection(db, 'users', oldUid, 'presets')),
      getDoc(doc(db, 'users', oldUid, 'meta', 'presetFolders')),
      getDoc(doc(db, 'users', newUid, 'meta', 'presetFolders')),
    ]);
    const writes: Promise<void>[] = [];
    presetsSnap.forEach((d) => {
      writes.push(setDoc(doc(db, 'users', newUid, 'presets', d.id), d.data(), { merge: true }));
    });
    if (folderDoc.exists()) {
      const incoming: string[] = folderDoc.data().names ?? [];
      const existing: string[] = targetFolderDoc.exists() ? (targetFolderDoc.data().names ?? []) : [];
      const merged = [...new Set([...existing, ...incoming])];
      writes.push(setDoc(doc(db, 'users', newUid, 'meta', 'presetFolders'), { names: merged }));
    }
    await Promise.all(writes);
  } catch (err) {
    // A failed migration must not block the sign-in itself — the user is
    // now on their real account either way; worst case a handful of
    // anonymous-session presets don't follow them (they're still sitting
    // under the old anonymous UID in Firestore, just not merged in).
    console.error('Failed to migrate anonymous presets to signed-in account:', err);
  }
}

function friendlyAuthError(err: unknown): string {
  // Log unconditionally, including for the codes we show a soft/empty
  // message for below — "popup closed" can mean the user actually
  // dismissed it, but it can also be Firebase's SDK closing the popup
  // itself after a failed handoff (bad OAuth client config, blocked
  // storage, etc.), which looks identical from here. The console is the
  // only place that distinction survives.
  console.error('wāv auth error:', err);
  const code = (err as AuthError)?.code || '';
  switch (code) {
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/popup-closed-by-user':
      return "Sign-in closed before finishing — if you didn't close it yourself, check the browser console for the real error and let the developer know.";
    case 'auth/email-already-in-use':
      return 'That email already has an account — try signing in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-email':
      return 'Incorrect email or password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/operation-not-allowed':
      return "This sign-in method isn't enabled yet.";
    case 'auth/user-not-found':
      return 'No account found for that email.';
    case 'auth/unauthorized-domain':
      return "This site isn't authorized for sign-in yet — add it in Firebase Console under Authentication > Settings > Authorized domains.";
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup — allow popups for this site and try again.';
    default:
      return 'Something went wrong — please try again.';
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  // Single owner of Firebase Auth's sign-in lifecycle: establishes an
  // anonymous session on first load if nothing else is signed in yet, and
  // otherwise just mirrors whatever account (anonymous, Google, or
  // email/password) is currently active. usePresets reads `user`'s uid from
  // this hook rather than calling signInAnonymously itself, so there's only
  // ever one place initiating sign-in.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        signInAnonymously(auth).catch((err) => {
          console.error('Anonymous sign-in failed:', err);
        });
        return; // onAuthStateChanged fires again once the anonymous user lands
      }
      setUser(u);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Completes the Google redirect flow after the full-page round trip. Runs
  // once on mount; a no-op (resolves to null) on every load that wasn't
  // preceded by signInWithGoogle's redirect.
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        const pendingAnonUid = localStorage.getItem(PENDING_ANON_UID_KEY);
        localStorage.removeItem(PENDING_ANON_UID_KEY);
        if (result && pendingAnonUid && pendingAnonUid !== result.user.uid) {
          await migratePresets(pendingAnonUid, result.user.uid);
        }
      })
      .catch(async (err) => {
        const pendingAnonUid = localStorage.getItem(PENDING_ANON_UID_KEY);
        localStorage.removeItem(PENDING_ANON_UID_KEY);
        const code = (err as AuthError).code;
        if (code === 'auth/credential-already-in-use') {
          const cred = GoogleAuthProvider.credentialFromError(err as AuthError);
          if (cred) {
            try {
              const result = await signInWithCredential(auth, cred);
              if (pendingAnonUid && pendingAnonUid !== result.user.uid) {
                await migratePresets(pendingAnonUid, result.user.uid);
              }
              return;
            } catch (err2) {
              setAuthError(friendlyAuthError(err2));
              return;
            }
          }
        }
        setAuthError(friendlyAuthError(err));
      });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError('');
    setAuthBusy(true);
    try {
      if (auth.currentUser?.isAnonymous) {
        localStorage.setItem(PENDING_ANON_UID_KEY, auth.currentUser.uid);
        await linkWithRedirect(auth.currentUser, googleProvider);
      } else {
        await signInWithRedirect(auth, googleProvider);
      }
      // Execution doesn't continue past here in practice — the line above
      // navigates the whole page away to Google. getRedirectResult (above)
      // picks up the result on the next load.
    } catch (err) {
      setAuthError(friendlyAuthError(err));
      setAuthBusy(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError('');
    setAuthBusy(true);
    try {
      const anonUid = auth.currentUser?.isAnonymous ? auth.currentUser.uid : null;
      await signInWithEmailAndPassword(auth, email, password);
      if (anonUid) await migratePresets(anonUid, auth.currentUser!.uid);
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError('');
    setAuthBusy(true);
    try {
      if (auth.currentUser?.isAnonymous) {
        const anonUid = auth.currentUser.uid;
        const cred = EmailAuthProvider.credential(email, password);
        try {
          await linkWithCredential(auth.currentUser, cred);
          return; // same uid retained — no migration needed
        } catch (err) {
          const code = (err as AuthError).code;
          if (code === 'auth/email-already-in-use') {
            await signInWithEmailAndPassword(auth, email, password);
            await migratePresets(anonUid, auth.currentUser!.uid);
            return;
          }
          throw err;
        }
      }
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    // onAuthStateChanged detects the null user and re-establishes a fresh
    // anonymous session automatically — presets are still saved locally in
    // this browser via localStorage even while signed out.
  }, []);

  const clearAuthError = useCallback(() => setAuthError(''), []);

  return {
    user,
    uid: user?.uid ?? null,
    isAnonymous: user?.isAnonymous ?? true,
    authReady,
    authBusy,
    authError,
    clearAuthError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
  };
}
