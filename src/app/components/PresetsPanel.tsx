import React, { useState, useEffect } from 'react';
import { Save, Pencil, Minus } from 'lucide-react';

interface Preset {
  name: string;
  data: unknown;
}

interface PresetsPanelProps {
  isPresetsDropdownOpen: boolean;
  savedPresets: Preset[];
  renamingPresetIndex: number | null;
  renamingPresetValue: string;
  setIsPresetsDropdownOpen: (open: boolean) => void;
  setRenamingPresetIndex: (index: number | null) => void;
  setRenamingPresetValue: (value: string) => void;
  loadPreset: (preset: Preset) => void;
  deletePreset: (index: number) => void;
  renamePreset: (index: number, newName: string) => void;
  updatePreset: (index: number) => void;
  savePresetWithName: (name: string) => void;
}

const PresetsPanelInner: React.FC<PresetsPanelProps> = ({
  savedPresets,
  renamingPresetIndex,
  renamingPresetValue,
  setRenamingPresetIndex,
  setRenamingPresetValue,
  loadPreset,
  deletePreset,
  renamePreset,
  updatePreset,
  savePresetWithName,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [isAddingPreset, setIsAddingPreset] = useState(true);

  // Show the new-preset input whenever the panel mounts
  useEffect(() => {
    setIsAddingPreset(true);
    setNewPresetName('');
  }, []);

  const confirmAdd = () => {
    if (newPresetName.trim()) {
      savePresetWithName(newPresetName.trim());
    }
    setIsAddingPreset(false);
    setNewPresetName('');
  };

  const cancelAdd = () => {
    setIsAddingPreset(false);
    setNewPresetName('');
  };

  const handleLoadPreset = (preset: Preset) => {
    setIsAddingPreset(false);
    setNewPresetName('');
    loadPreset(preset);
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-sm border border-white/8 rounded-lg overflow-hidden mb-0.5">
      {/* New preset input — shown on open, dismissed on load or explicit cancel */}
      {isAddingPreset && (
        <div className="flex items-center border-b border-white/10">
          <input
            autoFocus
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAdd();
              if (e.key === 'Escape') cancelAdd();
            }}
            placeholder="New preset name..."
            className="flex-1 px-4 py-2 text-xs bg-transparent text-white placeholder-white/30 focus:outline-none"
          />
          {newPresetName.trim() && (
            <button
              onClick={confirmAdd}
              className="px-3 py-2 text-xs text-green-400 hover:bg-white/15 transition-colors flex-shrink-0 font-semibold"
            >
              Save
            </button>
          )}
          <button
            onClick={cancelAdd}
            className="px-3 py-2 text-xs text-white/40 hover:bg-white/15 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Saved presets list */}
      {savedPresets.length === 0 && !isAddingPreset ? (
        <div className="px-4 py-2 text-xs text-white/50 italic">No saved presets</div>
      ) : (
        savedPresets.map((preset, index) => (
          <div key={index} className="flex items-center w-full group border-t border-white/5 first:border-t-0">
            {renamingPresetIndex === index ? (
              <input
                autoFocus
                value={renamingPresetValue}
                onChange={(e) => setRenamingPresetValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { renamePreset(index, renamingPresetValue); setRenamingPresetIndex(null); }
                  if (e.key === 'Escape') setRenamingPresetIndex(null);
                }}
                onBlur={() => { if (renamingPresetValue.trim()) renamePreset(index, renamingPresetValue); setRenamingPresetIndex(null); }}
                className="flex-1 px-4 py-2 text-xs bg-white/5 text-white focus:outline-none"
              />
            ) : (
              <button
                onClick={() => handleLoadPreset(preset)}
                className="flex-1 px-4 py-2 text-xs text-white hover:bg-white/15 text-left transition-colors font-semibold truncate"
              >
                {preset.name}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); updatePreset(index); }}
              className="px-2 py-2 text-white/50 hover:text-green-400 hover:bg-white/15 transition-colors flex-shrink-0"
              title="Save current settings to this preset"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRenamingPresetIndex(index); setRenamingPresetValue(preset.name); }}
              className="px-2 py-2 text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors flex-shrink-0"
              title="Rename preset"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deletePreset(index); }}
              className="px-2 py-2 text-white/50 hover:text-red-400 hover:bg-white/15 transition-colors flex-shrink-0"
              title="Delete preset"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export const PresetsPanel = React.memo(PresetsPanelInner);
