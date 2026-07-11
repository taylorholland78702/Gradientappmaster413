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
  const [renamingPresetIndex, setRenamingPresetIndex] = useState<number | null>(null);
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
        const presets = migrate(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
        setSavedPresets(presets);
        safeSetLocalStorage('gradientPresets', JSON.stringify(presets));
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

  // Delete preset
  const deletePreset = async (index: number) => {
    const target = savedPresets[index];
    const newPresets = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    if (auth.currentUser && target) {
      await deleteDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), target.id));
    }
  };

  // Rename preset
  const renamePreset = async (index: number, newName: string) => {
    if (!newName.trim()) return;
    const target = savedPresets[index];
    const updated = { ...target, name: newName.trim() };
    const newPresets = savedPresets.map((p, i) => i === index ? updated : p);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    if (auth.currentUser && target) {
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), target.id), updated);
    }
  };

  // Update preset
  const updatePreset = async (index: number) => {
    const existing = savedPresets[index];
    const updated: SavedPreset = {
      ...existing,
      data: getCurrentState(),
    };
    const newPresets = savedPresets.map((p, i) => i === index ? updated : p);
    setSavedPresets(newPresets);
    safeSetLocalStorage('gradientPresets', JSON.stringify(newPresets));
    if (auth.currentUser && existing) {
      await setDoc(doc(collection(db, 'users', auth.currentUser.uid, 'presets'), existing.id), updated);
    }
  };

  return {
    // State
    isPresetModalOpen, setIsPresetModalOpen,
    presetName, setPresetName,
    savedPresets, setSavedPresets,
    renamingPresetIndex, setRenamingPresetIndex,
    renamingPresetValue, setRenamingPresetValue,
    isPresetsDropdownOpen, setIsPresetsDropdownOpen,
    // Functions
    savePreset,
    savePresetWithName,
    loadPreset,
    deletePreset,
    renamePreset,
    updatePreset,
  };
}
