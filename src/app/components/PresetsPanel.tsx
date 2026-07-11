import React, { useState, useEffect, useMemo } from 'react';
import { FloppyDisk, PencilSimple, Minus, FolderSimple, CaretDown } from '@phosphor-icons/react';

interface Preset {
  id: string;
  name: string;
  data: unknown;
  folder?: string;
}

const UNCATEGORIZED = 'Uncategorized';

interface PresetsPanelProps {
  isPresetsDropdownOpen: boolean;
  savedPresets: Preset[];
  renamingPresetId: string | null;
  renamingPresetValue: string;
  setIsPresetsDropdownOpen: (open: boolean) => void;
  setRenamingPresetId: (id: string | null) => void;
  setRenamingPresetValue: (value: string) => void;
  loadPreset: (preset: Preset) => void;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, newName: string) => void;
  updatePreset: (id: string) => void;
  savePresetWithName: (name: string) => void;
  movePresetToFolder: (id: string, folder: string) => void;
}

const PresetsPanelInner: React.FC<PresetsPanelProps> = ({
  savedPresets,
  renamingPresetId,
  renamingPresetValue,
  setRenamingPresetId,
  setRenamingPresetValue,
  loadPreset,
  deletePreset,
  renamePreset,
  updatePreset,
  savePresetWithName,
  movePresetToFolder,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [isAddingPreset, setIsAddingPreset] = useState(true);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderDraft, setFolderDraft] = useState('');

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

  const toggleFolder = (folder: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const startEditingFolder = (id: string, current: string | undefined) => {
    setEditingFolderId(id);
    setFolderDraft(current ?? '');
  };

  const commitFolderEdit = (id: string) => {
    movePresetToFolder(id, folderDraft);
    setEditingFolderId(null);
    setFolderDraft('');
  };

  // Group presets by folder, preserving each folder's first-seen order;
  // Uncategorized always sorts last so named folders stay up top.
  const grouped = useMemo(() => {
    const groups = new Map<string, Preset[]>();
    savedPresets.forEach((preset) => {
      const key = preset.folder?.trim() || UNCATEGORIZED;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(preset);
    });
    const folders = [...groups.keys()].sort((a, b) => {
      if (a === UNCATEGORIZED) return 1;
      if (b === UNCATEGORIZED) return -1;
      return a.localeCompare(b);
    });
    return folders.map(folder => ({ folder, items: groups.get(folder)! }));
  }, [savedPresets]);

  return (
    <div className="w-full bg-black/20 border border-white/8 rounded-lg overflow-hidden">
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
            className="flex-1 min-w-0 px-4 py-2 text-xs bg-transparent text-white placeholder-white/60 focus:outline-none"
          />
          {newPresetName.trim() && (
            <button
              onClick={confirmAdd}
              className="px-3 py-2 text-xs text-white hover:bg-white/15 transition-colors flex-shrink-0 font-semibold"
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

      {/* Saved presets list, grouped by folder */}
      {savedPresets.length === 0 && !isAddingPreset ? (
        <div className="px-4 py-2 text-xs text-white/50 italic">No saved presets</div>
      ) : (
        grouped.map(({ folder, items }) => {
          const isCollapsed = collapsedFolders.has(folder);
          return (
            <div key={folder} className="border-t border-white/5 first:border-t-0">
              <button
                onClick={() => toggleFolder(folder)}
                className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <FolderSimple weight="regular" className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{folder}</span>
                <span className="text-white/30">{items.length}</span>
                <CaretDown weight="regular" className={`w-3 h-3 flex-shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              </button>
              {!isCollapsed && items.map((preset) => (
                <div key={preset.id} className="flex items-center w-full group border-t border-white/5">
                  {renamingPresetId === preset.id ? (
                    <input
                      autoFocus
                      value={renamingPresetValue}
                      onChange={(e) => setRenamingPresetValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { renamePreset(preset.id, renamingPresetValue); setRenamingPresetId(null); }
                        if (e.key === 'Escape') setRenamingPresetId(null);
                      }}
                      onBlur={() => { if (renamingPresetValue.trim()) renamePreset(preset.id, renamingPresetValue); setRenamingPresetId(null); }}
                      className="flex-1 px-4 py-2 text-xs bg-black/20 text-white focus:outline-none"
                    />
                  ) : editingFolderId === preset.id ? (
                    <input
                      autoFocus
                      value={folderDraft}
                      onChange={(e) => setFolderDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitFolderEdit(preset.id);
                        if (e.key === 'Escape') { setEditingFolderId(null); setFolderDraft(''); }
                      }}
                      onBlur={() => commitFolderEdit(preset.id)}
                      placeholder="Folder name (blank = Uncategorized)"
                      className="flex-1 px-4 py-2 text-xs bg-black/20 text-white placeholder-white/40 focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 min-w-0 px-4 py-2 text-xs text-white hover:bg-white/15 text-left transition-colors font-semibold truncate"
                    >
                      {preset.name}
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditingFolder(preset.id, preset.folder); }}
                    className="px-2 py-2 text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors flex-shrink-0"
                    title="Move to folder"
                  >
                    <FolderSimple weight="regular" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updatePreset(preset.id); }}
                    className="px-2 py-2 text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors flex-shrink-0"
                    title="Save current settings to this preset"
                  >
                    <FloppyDisk weight="regular" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenamingPresetId(preset.id); setRenamingPresetValue(preset.name); }}
                    className="px-2 py-2 text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors flex-shrink-0"
                    title="Rename preset"
                  >
                    <PencilSimple weight="regular" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                    className="px-2 py-2 text-white/50 hover:text-red-400 hover:bg-white/15 transition-colors flex-shrink-0"
                    title="Delete preset"
                  >
                    <Minus weight="regular" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};

export const PresetsPanel = React.memo(PresetsPanelInner);
