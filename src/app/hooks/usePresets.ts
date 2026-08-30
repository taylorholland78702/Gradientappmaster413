import { useState, useEffect } from 'react';
import { getFirebase } from '../../firebase';

// Firestore (and its `db`/`auth.currentUser` dependency) is loaded lazily —
// presets already work fully offline via localStorage below, so nothing in
// this file needs the ~470KB Firebase SDK on first paint. Every call site
// that touches Firestore awaits this first; after the first call it
// resolves off getFirebase()'s cached promise plus Vite's module cache, so
// there's no real cost to calling it repeatedly.
async function firestore() {
  const [{ db, auth }, mod] = await Promise.all([getFirebase(), import('firebase/firestore')]);
  return { db, auth, ...mod };
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

// A preset is now a full app-state snapshot (the same shape produced by
// InteractiveGradient's buildSnapshot/applySnapshot, used for undo/redo) —
// every gradient/effect parameter, not just the ~20 fields from before most
// of the app's sliders existed. Left loose here since this hook doesn't need
// to know the exact shape, only that it's a JSON-serializable object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PresetData = Record<string, any>;

export interface SavedPreset {
  // Stable identity, independent of array position — the Firestore doc ID.
  // Presets saved before this field existed get one assigned on first load
  // (see the migration in the load effect below).
  id: string;
  name: string;
  data: PresetData;
  // Free-text folder tag for grouping in the Presets panel. Presets saved
  // before this field existed simply have no folder and show under
  // "Uncategorized" — no migration needed since it's optional.
  folder?: string;
}

// applySnapshot's own `??`/`||` fallbacks only cover a field being missing
// (null/undefined) — they let a field that's *present but garbage* (NaN,
// Infinity, from a hand-edited or partially-corrupted preset) straight
// through, which can throw later during React's render pass or the canvas
// draw loop, well outside loadPreset's own try/catch below (that call stack
// has already returned by the time the throw happens). Stripping non-finite
// numbers here — before they ever reach applySnapshot — turns them back
// into "missing", so the existing fallbacks handle them the normal way.
function sanitizePresetData(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(sanitizePresetData);
  if (data === null || typeof data !== 'object') return data;
  const out: PresetData = {};
  for (const [key, value] of Object.entries(data as PresetData)) {
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    out[key] = sanitizePresetData(value);
  }
  return out;
}

export interface UsePresetsParams {
  getCurrentState: () => PresetData;
  applyPresetData: (data: PresetData) => void;
  // The signed-in Firebase Auth uid (anonymous or permanent) to load/save
  // presets under — owned by useAuth, not this hook. Changes when the user
  // signs in/links a permanent account or signs out, at which point this
  // hook re-fetches presets for the new uid.
  uid: string | null;
}

const genId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// localStorage has a hard ~5-10MB per-origin quota shared with everything
// else this app stores there (rated results, etc.), and full-state preset
// snapshots add up. Every write used to be unguarded — a QuotaExceededError
// threw silently after React state had already been updated, so the UI kept
// showing the preset as "saved" while the persisted copy silently never
// wrote, and it vanished on next reload. This surfaces that failure instead
// of hiding it.
function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error(`Failed to persist ${key} to localStorage:`, err);
    alert(
      "Couldn't save — your browser's local storage is full. " +
      'Try deleting a few old presets (or rated results) and saving again.'
    );
    return false;
  }
}

export function usePresets(params: UsePresetsParams) {
  const { getCurrentState, applyPresetData, uid } = params;

  // State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  // Keyed by stable preset id, not array position — the array's order isn't
  // guaranteed stable (see the load effect below: localStorage's order and
  // Firestore's order can differ, and Firestore's async fetch can replace
  // the array between when a row renders and when a button on it is
  // clicked). An index captured in a click handler's closure could end up
  // pointing at a different preset than the one the user actually clicked;
  // this bit us for real once already (a preset was deleted by accident).
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renamingPresetValue, setRenamingPresetValue] = useState('');
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState(false);
  // Incremented (never just toggled — a click while the panel is already
  // open and the field already showing still needs to re-trigger it) each
  // time something wants to jump straight to the "new preset name" input
  // instead of just opening the Presets tab, e.g. the collapsed header's "+"
  // button. PresetsPanel watches this via an effect.
  const [openNewPresetSignal, setOpenNewPresetSignal] = useState(0);
  // Explicit list of folder names — kept separate from the folder tags on
  // individual presets so an empty folder (just created, or emptied out by
  // moving its last preset elsewhere) still shows up and can be renamed or
  // deleted rather than silently disappearing.
  const [folderNames, setFolderNames] = useState<string[]>([]);

  // Load presets — localStorage first (reliable), then Firebase (sync).
  // Presets from before `id` existed get one assigned here so every
  // subsequent save/delete/rename can target its own doc directly instead
  // of the old "wipe the whole collection and rewrite it by array index"
  // approach, which raced with itself once there were enough presets that
  // the rewrite took long enough for another action to land mid-flight.
  //
  // Re-runs whenever `uid` changes — not just on mount — since sign-in/
  // sign-out/account-linking (see useAuth) switches which Firestore
  // collection presets live under without remounting this hook.
  useEffect(() => {
    const migrate = (list: SavedPreset[]): SavedPreset[] =>
      list.map(p => (p.id ? p : { ...p, id: genId() }));

    const local = localStorage.getItem('gradientPresets');
    if (local) {
      try {
        const parsed = migrate(JSON.parse(local));
        setSavedPresets(parsed);
        safeSetLocalStorage('gradientPresets', JSON.stringify(parsed));
      } catch (err) {
        // Was dev-only console.warn — in production, a corrupted
        // gradientPresets entry (partial write, manual localStorage edit,
        // an extension) made every saved preset vanish with zero
        // indication anything went wrong. Surfacing it doesn't recover the
        // data, but at least tells the user what happened instead of just
        // "my presets are all gone" with no explanation.
        console.error('Failed to parse stored gradientPresets:', err);
        alert(
          "Couldn't load your saved presets — the saved data looks corrupted. " +
          "They haven't been deleted, but can't be read right now."
        );
      }
    }
    const localFolders = localStorage.getItem('gradientPresetFolders');
    if (localFolders) {
      try { setFolderNames(JSON.parse(localFolders)); } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to parse stored gradientPresetFolders:', err);
      }
    }

    if (!uid) return;

    (async () => {
      const { db, collection, doc, getDoc, getDocs } = await firestore();
      const snap = await getDocs(collection(db, 'users', uid, 'presets'));
      if (!snap.empty) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fromFirestore = migrate(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        // getDocs returns docs sorted by document ID, not creation order —
        // reorder to match whatever's already on screen (from localStorage)
        // so this async update doesn't silently reshuffle the list under a
        // user who's mid-click on a row.
        setSavedPresets(prevOrder => {
          const byId = new Map(fromFirestore.map(p => [p.id, p]));
          const ordered = prevOrder.map(p => byId.get(p.id)).filter((p): p is SavedPreset => !!p);
          const seen = new Set(ordered.map(p => p.id));
          const appended = fromFirestore.filter(p => !seen.has(p.id));
          const presets = [...ordered, ...appended];
          safeSetLocalStorage('gradientPresets', JSON.stringify(presets));
          return presets;
        });
      }

      const folderDoc = await getDoc(doc(db, 'users', uid, 'meta', 'presetFolders'));
      const fromFirestoreFolders: string[] = folderDoc.exists() ? (folderDoc.data().names ?? []) : [];
      setFolderNames(prev => {
        // Union with whatever's already showing (localStorage) rather than
        // replacing outright, same reasoning as the presets merge above.
        const merged = [...new Set([...prev, ...fromFirestoreFolders])];
        safeSetLocalStorage('gradientPresetFolders', JSON.stringify(merged));
        return merged;
      });
    })();
  }, [uid]);

  // Any folder tag present on a preset but missing from the explicit
  // folderNames list (e.g. data saved before folder management existed)
  // should still show up as a manageable folder rather than a dangling tag.
  const allFolderNames = [...new Set([
    ...folderNames,
    ...savedPresets.map(p => p.folder).filter((f): f is string => !!f),
  ])];

  const persistFolderNames = async (names: string[]) => {
    setFolderNames(names);
    safeSetLocalStorage('gradientPresetFolders', JSON.stringify(names));
    const { db, auth, doc, setDoc } = await firestore();
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'meta', 'presetFolders'), { names });
    }
  };

  // Save preset
  const savePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }
    await savePresetWithName(presetName.trim());
    setPresetName('');
    setIsPresetModalOpen(false);
  };

  const savePresetWithName = async (name: string) => {
    if (!name.trim()) return;
    const preset: SavedPreset = {
      id: genId(),
      name: name.trim(),
      data: getCurrentState(),
    };
    const newPresets = [...savedPresets, preset];
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    const { db, auth, collection, doc, setDoc } = await firestore();
    if (auth.currentUser) {
      // Writes only the new doc — no read-modify-write of the whole
      // collection, so this can't race with another save/delete/rename
      // that's still in flight.
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), preset.id), preset);
    }
  };

  // Load preset. applyPresetData had no error handling — a malformed
  // preset.data (corrupted localStorage, a preset saved before a field was
  // removed/renamed) could throw synchronously and fall through to the
  // top-level ErrorBoundary, which silently remounts for 300ms with no
  // message; if the offending preset was still selected after remounting,
  // that could repeat indefinitely with no way for the user to know what's
  // wrong. Catching it here means a bad preset just fails to load instead.
  const loadPreset = (preset: SavedPreset) => {
    try {
      applyPresetData(sanitizePresetData(preset.data) as PresetData);
    } catch (err) {
      console.error('Failed to load preset:', err);
      alert(`Couldn't load "${preset.name}" — this preset's data looks corrupted.`);
      return;
    }
    setIsPresetModalOpen(false);
  };

  // Delete preset — keyed by stable id, not array position (see the note
  // by renamingPresetId above for why position isn't safe to use here).
  // Firestore's deleteDoc has no undo, so this is a hard confirm, not a
  // dismissible toast — a real preset was lost to a bug that triggered
  // this path without any user-visible delete click, so the confirmation
  // is the actual safety net now, not just UX friction.
  const deletePreset = async (id: string) => {
    const target = savedPresets.find(p => p.id === id);
    if (!target) return;
    if (!window.confirm(`Delete preset "${target.name}"? This can't be undone.`)) return;
    const newPresets = savedPresets.filter(p => p.id !== id);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    const { db, auth, collection, doc, deleteDoc } = await firestore();
    if (auth.currentUser) {
      await deleteDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), target.id));
    }
  };

  // Rename preset
  const renamePreset = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    const target = savedPresets.find(p => p.id === id);
    if (!target) return;
    const updated = { ...target, name: newName.trim() };
    const newPresets = savedPresets.map(p => p.id === id ? updated : p);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    const { db, auth, collection, doc, setDoc } = await firestore();
    if (auth.currentUser) {
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), target.id), updated);
    }
  };

  // Update preset
  const updatePreset = async (id: string) => {
    const existing = savedPresets.find(p => p.id === id);
    if (!existing) return;
    const updated: SavedPreset = {
      ...existing,
      data: getCurrentState(),
    };
    const newPresets = savedPresets.map(p => p.id === id ? updated : p);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    const { db, auth, collection, doc, setDoc } = await firestore();
    if (auth.currentUser) {
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), existing.id), updated);
    }
  };

  // Move preset into a folder (empty/whitespace-only clears it back to Uncategorized)
  const movePresetToFolder = async (id: string, folder: string) => {
    const existing = savedPresets.find(p => p.id === id);
    if (!existing) return;
    const trimmed = folder.trim();
    const updated: SavedPreset = { ...existing, folder: trimmed || undefined };
    const newPresets = savedPresets.map(p => p.id === id ? updated : p);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    const { db, auth, collection, doc, setDoc } = await firestore();
    if (auth.currentUser) {
      // Firestore rejects `undefined` field values — omit the key entirely
      // when clearing a preset's folder rather than writing `folder: undefined`.
      const payload: SavedPreset = { ...updated };
      if (payload.folder === undefined) delete payload.folder;
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), existing.id), payload);
    }
    if (trimmed && !folderNames.includes(trimmed)) {
      await persistFolderNames([...folderNames, trimmed]);
    }
  };

  // Create an empty folder — shows up in the panel immediately, before any
  // preset is moved into it.
  const addFolder = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || allFolderNames.includes(trimmed)) return;
    await persistFolderNames([...folderNames, trimmed]);
  };

  // Rename a folder — relabels the folder itself and every preset tagged
  // with it. Id-based, like every other preset write here, so a mid-flight
  // reorder can't cause it to touch the wrong preset.
  const renameFolder = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    const affected = savedPresets.filter(p => p.folder === oldName);
    const newPresets = savedPresets.map(p => p.folder === oldName ? { ...p, folder: trimmed } : p);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    const { db, auth, collection, doc, setDoc } = await firestore();
    if (auth.currentUser) {
      await Promise.all(affected.map(p =>
        setDoc(doc(collection(db, 'users', auth.currentUser!.uid, 'presets'), p.id), { ...p, folder: trimmed })
      ));
    }
    await persistFolderNames(folderNames.filter(f => f !== oldName).concat(trimmed));
  };

  // Delete a folder — this only ever clears the folder tag on its presets
  // (they land back in Uncategorized), never the presets themselves. After
  // the earlier incident where an indexing bug deleted real presets, this
  // function deliberately has no code path that can call deletePreset or
  // deleteDoc on a presets/* document.
  const deleteFolder = async (name: string) => {
    if (!window.confirm(`Delete folder "${name}"? Its presets will move to Uncategorized — they won't be deleted.`)) return;
    const affected = savedPresets.filter(p => p.folder === name);
    const newPresets = savedPresets.map(p => {
      if (p.folder !== name) return p;
      const { folder, ...rest } = p;
      return rest;
    });
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    const { db, auth, collection, doc, setDoc } = await firestore();
    if (auth.currentUser) {
      await Promise.all(affected.map(p => {
        const { folder, ...rest } = p;
        return setDoc(doc(collection(db, 'users', auth.currentUser!.uid, 'presets'), p.id), rest);
      }));
    }
    await persistFolderNames(folderNames.filter(f => f !== name));
  };

  return {
    // State
    isPresetModalOpen, setIsPresetModalOpen,
    presetName, setPresetName,
    savedPresets, setSavedPresets,
    renamingPresetId, setRenamingPresetId,
    renamingPresetValue, setRenamingPresetValue,
    isPresetsDropdownOpen, setIsPresetsDropdownOpen,
    openNewPresetSignal, setOpenNewPresetSignal,
    folderNames: allFolderNames,
    // Functions
    savePreset,
    savePresetWithName,
    loadPreset,
    deletePreset,
    renamePreset,
    updatePreset,
    movePresetToFolder,
    addFolder,
    renameFolder,
    deleteFolder,
  };
}
