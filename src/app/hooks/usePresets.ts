import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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

export interface UsePresetsParams {
  getCurrentState: () => PresetData;
  applyPresetData: (data: PresetData) => void;
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
  const { getCurrentState, applyPresetData } = params;

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

  // Load presets — localStorage first (reliable), then Firebase (sync).
  // Presets from before `id` existed get one assigned here so every
  // subsequent save/delete/rename can target its own doc directly instead
  // of the old "wipe the whole collection and rewrite it by array index"
  // approach, which raced with itself once there were enough presets that
  // the rewrite took long enough for another action to land mid-flight.
  useEffect(() => {
    const migrate = (list: SavedPreset[]): SavedPreset[] =>
      list.map(p => (p.id ? p : { ...p, id: genId() }));

    const local = localStorage.getItem('gradientPresets');
    if (local) {
      try {
        const parsed = migrate(JSON.parse(local));
        setSavedPresets(parsed);
        safeSetLocalStorage('gradientPresets', JSON.stringify(parsed));
      } catch {}
    }
    signInAnonymously(auth).then(async (cred) => {
      const snap = await getDocs(collection(db, 'users', cred.user.uid, 'presets'));
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
    });
  }, []);

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
    if (auth.currentUser) {
      // Writes only the new doc — no read-modify-write of the whole
      // collection, so this can't race with another save/delete/rename
      // that's still in flight.
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), preset.id), preset);
    }
  };

  // Load preset
  const loadPreset = (preset: SavedPreset) => {
    applyPresetData(preset.data);
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
    if (auth.currentUser) {
      // Firestore rejects `undefined` field values — omit the key entirely
      // when clearing a preset's folder rather than writing `folder: undefined`.
      const payload: SavedPreset = { ...updated };
      if (payload.folder === undefined) delete payload.folder;
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), existing.id), payload);
    }
  };

  return {
    // State
    isPresetModalOpen, setIsPresetModalOpen,
    presetName, setPresetName,
    savedPresets, setSavedPresets,
    renamingPresetId, setRenamingPresetId,
    renamingPresetValue, setRenamingPresetValue,
    isPresetsDropdownOpen, setIsPresetsDropdownOpen,
    // Functions
    savePreset,
    savePresetWithName,
    loadPreset,
    deletePreset,
    renamePreset,
    updatePreset,
    movePresetToFolder,
  };
}
