import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface PresetData {
  gradientColors: ColorRGB[];
  gradientAngle: number;
  gradientType: string | null;
  zoom: number;
  activeEffects: string[];
  kaleidoscopeSegments: number;
  twistAmount: number;
  pixelSize: number;
  triangleSize: number;
  chromaticOffset: number;
  fisheyeStrength: number;
  tileCount: number;
  grainIntensity: number;
  blurMotionAmount: number;
  blurMotionDirection: number;
  blurGaussianAmount: number;
  blurRadialAmount: number;
  posterizeLevels: number;
  halftoneSize: number;
  halftoneMove: boolean;
  vignetteStrength: number;
  colorShiftHue: number;
  submittedAIPrompt: string;
  baseAIColors: ColorRGB[] | null;
}

export interface SavedPreset {
  name: string;
  data: PresetData;
}

export interface UsePresetsParams {
  getCurrentState: () => PresetData;
  applyPresetData: (data: PresetData) => void;
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

  // Load presets — localStorage first (reliable), then Firebase (sync)
  useEffect(() => {
    const local = localStorage.getItem('gradientPresets');
    if (local) {
      try { setSavedPresets(JSON.parse(local)); } catch {}
    }
    signInAnonymously(auth).then(async (cred) => {
      const snap = await getDocs(collection(db, 'users', cred.user.uid, 'presets'));
      if (!snap.empty) {
        const presets = snap.docs.map((d: any) => d.data()) as SavedPreset[];
        setSavedPresets(presets);
        localStorage.setItem('gradientPresets', JSON.stringify(presets));
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
      name: name.trim(),
      data: getCurrentState(),
    };
    const newPresets = [...savedPresets, preset];
    setSavedPresets(newPresets);
    localStorage.setItem('gradientPresets', JSON.stringify(newPresets));
    if (auth.currentUser) {
      await setDoc(
        doc(collection(db, 'users', auth.currentUser.uid, 'presets'), String(newPresets.length - 1)),
        newPresets[newPresets.length - 1]
      );
    }
  };

  // Load preset
  const loadPreset = (preset: SavedPreset) => {
    applyPresetData(preset.data);
    setIsPresetModalOpen(false);
  };

  // Delete preset
  const deletePreset = async (index: number) => {
    const newPresets = savedPresets.filter((_, i) => i !== index);
    setSavedPresets(newPresets);
    localStorage.setItem('gradientPresets', JSON.stringify(newPresets));
    if (auth.currentUser) {
      const presetsRef = collection(db, 'users', auth.currentUser.uid, 'presets');
      const snap = await getDocs(presetsRef);
      snap.docs.forEach(d => deleteDoc(d.ref));
      newPresets.forEach((p, i) => setDoc(doc(presetsRef, String(i)), p));
    }
  };

  // Rename preset
  const renamePreset = async (index: number, newName: string) => {
    if (!newName.trim()) return;
    const newPresets = savedPresets.map((p, i) => i === index ? { ...p, name: newName.trim() } : p);
    setSavedPresets(newPresets);
    localStorage.setItem('gradientPresets', JSON.stringify(newPresets));
    if (auth.currentUser) {
      const presetsRef = collection(db, 'users', auth.currentUser.uid, 'presets');
      const snap = await getDocs(presetsRef);
      snap.docs.forEach(d => deleteDoc(d.ref));
      newPresets.forEach((p, i) => setDoc(doc(presetsRef, String(i)), p));
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
    localStorage.setItem('gradientPresets', JSON.stringify(newPresets));
    if (auth.currentUser) {
      const presetsRef = collection(db, 'users', auth.currentUser.uid, 'presets');
      const snap = await getDocs(presetsRef);
      snap.docs.forEach(d => deleteDoc(d.ref));
      newPresets.forEach((p, i) => setDoc(doc(presetsRef, String(i)), p));
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
