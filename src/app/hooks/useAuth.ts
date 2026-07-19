import { useCallback, useEffect, useState } from 'react';
import { getFirebase } from '../../firebase';
import type { Auth, User, AuthError } from 'firebase/auth';

// Copies presets + folder metadata from an anonymous session's UID over to
// a newly-linked/signed-in permanent account's UID. Only needed on the
// "email already in use" fallback path below — the happy path
// (linkWithCredential succeeding) keeps the same UID and needs no
// migration at all. Merges rather than overwrites so it's safe to call
// even when the target account already has its own presets from a
// previous device.
async function migratePresets(oldUid: string, newUid: string) {
  if (oldUid === newUid) return;
  try {
    const { db } = await getFirebase();
    const { collection, doc, getDoc, getDocs, setDoc } = await import('firebase/firestore');
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
  console.error('wāv auth error:', err);
  const code = (err as AuthError)?.code || '';
  switch (code) {
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
    default:
      return 'Something went wrong — please try again.';
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [auth, setAuth] = useState<Auth | null>(null);

  // Single owner of Firebase Auth's sign-in lifecycle: establishes an
  // anonymous session on first load if nothing else is signed in yet, and
  // otherwise just mirrors whatever account (anonymous or email/password)
  // is currently active. usePresets reads `user`'s uid from this hook
  // rather than calling signInAnonymously itself, so there's only ever one
  // place initiating sign-in.
  //
  // The Firebase SDK (~470KB) is dynamically imported here rather than at
  // module load — presets already work fully offline via localStorage (see
  // usePresets.ts), so nothing needs this bundle synchronously on first
  // paint. Deferred via requestIdleCallback (falling back to a short
  // setTimeout where unsupported, e.g. Safari) so it starts shortly after
  // the initial gradient render rather than competing with it, while still
  // landing well before a user could plausibly reach the Presets tab.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      const [{ auth: authInstance }, { onAuthStateChanged, signInAnonymously }] = await Promise.all([
        getFirebase(),
        import('firebase/auth'),
      ]);
      if (cancelled) return;
      setAuth(authInstance);
      unsubscribe = onAuthStateChanged(authInstance, (u) => {
        if (!u) {
          signInAnonymously(authInstance).catch((err) => {
            console.error('Anonymous sign-in failed:', err);
          });
          return; // onAuthStateChanged fires again once the anonymous user lands
        }
        setUser(u);
        setAuthReady(true);
      });
    };

    const idle = (cb: () => void) =>
      typeof requestIdleCallback === 'function' ? requestIdleCallback(cb) : setTimeout(cb, 200);
    const cancelIdle = (id: number) =>
      typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id);

    const handle = idle(() => { init(); });
    return () => {
      cancelled = true;
      cancelIdle(handle as number);
      unsubscribe?.();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError('');
    setAuthBusy(true);
    try {
      const { auth: authInstance } = await getFirebase();
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const anonUid = authInstance.currentUser?.isAnonymous ? authInstance.currentUser.uid : null;
      await signInWithEmailAndPassword(authInstance, email, password);
      if (anonUid) await migratePresets(anonUid, authInstance.currentUser!.uid);
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
      const { auth: authInstance } = await getFirebase();
      const {
        EmailAuthProvider, linkWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword,
      } = await import('firebase/auth');
      if (authInstance.currentUser?.isAnonymous) {
        const anonUid = authInstance.currentUser.uid;
        const cred = EmailAuthProvider.credential(email, password);
        try {
          await linkWithCredential(authInstance.currentUser, cred);
          return; // same uid retained — no migration needed
        } catch (err) {
          const code = (err as AuthError).code;
          if (code === 'auth/email-already-in-use') {
            await signInWithEmailAndPassword(authInstance, email, password);
            await migratePresets(anonUid, authInstance.currentUser!.uid);
            return;
          }
          throw err;
        }
      }
      await createUserWithEmailAndPassword(authInstance, email, password);
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    // onAuthStateChanged detects the null user and re-establishes a fresh
    // anonymous session automatically — presets are still saved locally in
    // this browser via localStorage even while signed out.
  }, [auth]);

  const clearAuthError = useCallback(() => setAuthError(''), []);

  return {
    user,
    uid: user?.uid ?? null,
    isAnonymous: user?.isAnonymous ?? true,
    authReady,
    authBusy,
    authError,
    clearAuthError,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
  };
}
