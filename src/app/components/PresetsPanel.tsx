import React, { useState, useEffect, useMemo } from 'react';
import { FloppyDisk, PencilSimple, Minus, FolderSimple, FolderPlus, CaretDown } from '@phosphor-icons/react';

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
  folderNames: string[];
  setIsPresetsDropdownOpen: (open: boolean) => void;
  setRenamingPresetId: (id: string | null) => void;
  setRenamingPresetValue: (value: string) => void;
  loadPreset: (preset: Preset) => void;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, newName: string) => void;
  updatePreset: (id: string) => void;
  savePresetWithName: (name: string) => void;
  movePresetToFolder: (id: string, folder: string) => void;
  addFolder: (name: string) => void;
  renameFolder: (oldName: string, newName: string) => void;
  deleteFolder: (name: string) => void;
}

const PresetsPanelInner: React.FC<PresetsPanelProps> = ({
  savedPresets,
  renamingPresetId,
  renamingPresetValue,
  folderNames,
  setRenamingPresetId,
  setRenamingPresetValue,
  loadPreset,
  deletePreset,
  renamePreset,
  updatePreset,
  savePresetWithName,
  movePresetToFolder,
  addFolder,
  renameFolder,
  deleteFolder,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [isAddingPreset, setIsAddingPreset] = useState(true);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renamingFolderValue, setRenamingFolderValue] = useState('');
  const [draggingPresetId, setDraggingPresetId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

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

  const confirmAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
    }
    setIsAddingFolder(false);
    setNewFolderName('');
  };

  const cancelAddFolder = () => {
    setIsAddingFolder(false);
    setNewFolderName('');
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

  const commitFolderRename = (oldName: string) => {
    if (renamingFolderValue.trim() && renamingFolderValue.trim() !== oldName) {
      renameFolder(oldName, renamingFolderValue);
    }
    setRenamingFolder(null);
    setRenamingFolderValue('');
  };

  // Drag a preset row onto a folder header (or another preset within a
  // different folder) to move it there. Uses the native HTML5 DnD API —
  // dataTransfer carries the dragged preset's id so the actual move still
  // goes through movePresetToFolder's id-based lookup, same as the
  // folder-icon button, not any index-based shortcut.
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingPresetId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDraggingPresetId(null);
    setDragOverFolder(null);
  };

  const handleFolderDragOver = (e: React.DragEvent, folder: string) => {
    if (!draggingPresetId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolder !== folder) setDragOverFolder(folder);
  };

  const handleFolderDrop = (e: React.DragEvent, folder: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingPresetId;
    if (id) movePresetToFolder(id, folder === UNCATEGORIZED ? '' : folder);
    setDraggingPresetId(null);
    setDragOverFolder(null);
  };

  // Group presets by folder, preserving each folder's first-seen order;
  // Uncategorized always sorts last so named folders stay up top. Folders
  // with no presets in them yet (or any more) still show up, sourced from
  // folderNames, so they stay manageable instead of vanishing.
  const grouped = useMemo(() => {
    const groups = new Map<string, Preset[]>();
    folderNames.forEach(name => { if (!groups.has(name)) groups.set(name, []); });
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
  }, [savedPresets, folderNames]);

  return (
    <div className="w-full bg-black/20 border border-white/8 rounded-lg overflow-hidden">
      {/* New folder row — either the "+ New Folder" trigger or its input */}
      {isAddingFolder ? (
        <div className="flex items-center border-b border-white/10">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmAddFolder();
              if (e.key === 'Escape') cancelAddFolder();
            }}
            placeholder="New folder name..."
            className="flex-1 min-w-0 px-4 py-2 text-xs bg-transparent text-white placeholder-white/60 focus:outline-none"
          />
          {newFolderName.trim() && (
            <button
              onClick={confirmAddFolder}
              className="px-3 py-2 text-xs text-white hover:bg-white/15 transition-colors flex-shrink-0 font-semibold"
            >
              Save
            </button>
          )}
          <button
            onClick={cancelAddFolder}
            className="px-3 py-2 text-xs text-white/40 hover:bg-white/15 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingFolder(true)}
          className="flex items-center gap-1.5 w-full px-4 py-2 text-xs text-white/70 hover:text-white hover:bg-white/15 transition-colors border-b border-white/10 font-semibold"
        >
          <FolderPlus weight="regular" className="w-4 h-4" />
          New Folder
        </button>
      )}

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
      {savedPresets.length === 0 && !isAddingPreset && grouped.length === 0 ? (
        <div className="px-4 py-2 text-xs text-white/50 italic">No saved presets</div>
      ) : (
        grouped.map(({ folder, items }) => {
          const isCollapsed = collapsedFolders.has(folder);
          const isUncategorized = folder === UNCATEGORIZED;
          const isDropTarget = dragOverFolder === folder;
          return (
            <div key={folder} className="border-t border-white/5 first:border-t-0">
              <div
                onDragOver={(e) => handleFolderDragOver(e, folder)}
                onDragLeave={() => setDragOverFolder(prev => prev === folder ? null : prev)}
                onDrop={(e) => handleFolderDrop(e, folder)}
                className={`flex items-center w-full group transition-colors ${isDropTarget ? 'bg-white/20 ring-1 ring-inset ring-white/40' : ''}`}
              >
                {renamingFolder === folder ? (
                  <input
                    autoFocus
                    value={renamingFolderValue}
                    onChange={(e) => setRenamingFolderValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitFolderRename(folder);
                      if (e.key === 'Escape') { setRenamingFolder(null); setRenamingFolderValue(''); }
                    }}
                    onBlur={() => commitFolderRename(folder)}
                    className="flex-1 min-w-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-black/20 text-white focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                  >
                    <FolderSimple weight="regular" className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{folder}</span>
                    <span className="text-white/30">{items.length}</span>
                    <CaretDown weight="regular" className={`w-3 h-3 flex-shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
                {!isUncategorized && renamingFolder !== folder && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingFolder(folder); setRenamingFolderValue(folder); }}
                      className="px-2 py-1.5 text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors flex-shrink-0"
                      title="Rename folder"
                    >
                      <PencilSimple weight="regular" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFolder(folder); }}
                      className="px-2 py-1.5 text-white/50 hover:text-red-400 hover:bg-white/15 transition-colors flex-shrink-0"
                      title="Delete folder (presets move to Uncategorized)"
                    >
                      <Minus weight="regular" className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              {!isCollapsed && items.map((preset) => (
                <div
                  key={preset.id}
                  draggable={renamingPresetId !== preset.id}
                  onDragStart={(e) => handleDragStart(e, preset.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center w-full group border-t border-white/5 cursor-grab active:cursor-grabbing ${draggingPresetId === preset.id ? 'opacity-40' : ''}`}
                >
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
                  ) : (
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 min-w-0 px-4 py-2 text-xs text-white hover:bg-white/15 text-left transition-colors font-semibold truncate"
                    >
                      {preset.name}
                    </button>
                  )}
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
