import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';

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
  setIsPresetModalOpen: (open: boolean) => void;
  setRenamingPresetIndex: (index: number | null) => void;
  setRenamingPresetValue: (value: string) => void;
  loadPreset: (preset: Preset) => void;
  deletePreset: (index: number) => void;
  renamePreset: (index: number, newName: string) => void;
  updatePreset: (index: number) => void;
}

const PresetsPanelInner: React.FC<PresetsPanelProps> = ({
  isPresetsDropdownOpen,
  savedPresets,
  renamingPresetIndex,
  renamingPresetValue,
  setIsPresetsDropdownOpen,
  setIsPresetModalOpen,
  setRenamingPresetIndex,
  setRenamingPresetValue,
  loadPreset,
  deletePreset,
  renamePreset,
  updatePreset,
}) => {
  return (
    <>
      {/* Presets Controls */}
      <div className="flex gap-[3.5px] w-full mb-0.5">
        <button
          onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
          className="flex-1 px-1.5 py-1.5 rounded-lg text-xs transition-all bg-white/8 backdrop-blur-sm text-white hover:bg-white/15 flex items-center justify-between font-semibold"
        >
          <span>Presets</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isPresetsDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => setIsPresetModalOpen(true)}
          className="w-[32px] px-1 py-1.5 rounded-lg text-xs transition-all bg-white/8 backdrop-blur-sm text-white hover:bg-white/15 font-semibold shadow-lg flex items-center justify-center"
          title="Add Preset"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Presets Dropdown Content */}
      {isPresetsDropdownOpen && (
        <div className="w-full bg-white/5 backdrop-blur-sm border border-white/8 rounded-lg overflow-hidden mb-0.5 max-h-[300px] overflow-y-auto">
          {savedPresets.length === 0 ? (
            <div className="px-4 py-2 text-xs text-white/50 italic">
              No saved presets
            </div>
          ) : (
            savedPresets.map((preset, index) => (
              <div key={index} className="flex items-center w-full group">
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
                    className="flex-1 px-4 py-2 text-xs bg-white/5 text-white focus:outline-none border-b border-purple-500"
                  />
                ) : (
                  <button
                    onClick={() => { loadPreset(preset); setIsPresetsDropdownOpen(false); }}
                    className="flex-1 px-4 py-2 text-xs text-white hover:bg-white/15 text-left transition-colors font-semibold truncate"
                  >
                    {preset.name}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updatePreset(index);
                  }}
                  className="px-2 py-2 text-white/30 hover:text-green-400 hover:bg-white/15 transition-colors text-xs flex-shrink-0"
                  title="Save current edits to this preset"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingPresetIndex(index);
                    setRenamingPresetValue(preset.name);
                  }}
                  className="px-2 py-2 text-white/30 hover:text-white/80 hover:bg-white/15 transition-colors text-xs flex-shrink-0"
                  title="Rename preset"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deletePreset(index); }}
                  className="px-2 py-2 text-white/50 hover:text-red-400 hover:bg-white/15 transition-colors text-sm font-bold flex-shrink-0"
                  title="Delete preset"
                >
                  −
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export const PresetsPanel = React.memo(PresetsPanelInner);
