import React, { useState, useMemo } from 'react';
import { FloppyDisk, PencilSimple, Minus, FolderSimple, FolderPlus, CaretDown, Plus, LinkSimple, Check, SignOut } from '@phosphor-icons/react';
import { encodePresetData } from '../utils/presetShare';

interface Preset {
  id: string;
  name: string;
  data: unknown;
  folder?: string;
}

// Kept minimal/local rather than importing firebase's User type here — this
// panel only ever reads these three fields.
interface AuthUser {
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

const UNCATEGORIZED = 'Uncategorized';

interface PresetsPanelProps {
  isMobile: boolean;
  isPresetsDropdownOpen: boolean;
  openNewPresetSignal: number;
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
  savePresetWithName: (name: string) => void | Promise<void>;
  movePresetToFolder: (id: string, folder: string) => void;
  addFolder: (name: string) => void;
  renameFolder: (oldName: string, newName: string) => void;
  deleteFolder: (name: string) => void;
  authUser: AuthUser | null;
  isAnonymous: boolean;
  authBusy: boolean;
  authError: string;
  clearAuthError: () => void;
  signInWithEmail: (email: string, password: string) => void;
  signUpWithEmail: (email: string, password: string) => void;
  signOutUser: () => void;
  // Reports whether the "name this new preset" field is open, so the parent
  // can pause Auto Shuffle for that window — otherwise a running Auto
  // Shuffle keeps randomizing state out from under the user while they're
  // still typing the name, and the preset that gets saved doesn't match
  // what they saw when they clicked "+".
  onAddingPresetChange?: (isAdding: boolean) => void;
}

const PresetsPanelInner: React.FC<PresetsPanelProps> = ({
  isMobile,
  openNewPresetSignal,
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
  authUser,
  isAnonymous,
  authBusy,
  authError,
  clearAuthError,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  onAddingPresetChange,
}) => {
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitEmailForm = () => {
    if (!email.trim() || !password) return;
    if (emailMode === 'signup') signUpWithEmail(email.trim(), password);
    else signInWithEmail(email.trim(), password);
  };

  const [newPresetName, setNewPresetName] = useState('');
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  // Jump straight to the "new preset name" field when triggered externally
  // (the collapsed header's "+" button), instead of just landing on the tab
  // and leaving the user to find + click "Preset" themselves. Guarded to 0
  // so a normal tab-open (signal still at its initial value) doesn't also
  // auto-open the field.
  React.useEffect(() => {
    if (openNewPresetSignal > 0) setIsAddingPreset(true);
  }, [openNewPresetSignal]);
  React.useEffect(() => {
    onAddingPresetChange?.(isAddingPreset);
  }, [isAddingPreset, onAddingPresetChange]);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renamingFolderValue, setRenamingFolderValue] = useState('');
  const [draggingPresetId, setDraggingPresetId] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [savedPresetId, setSavedPresetId] = useState<string | null>(null);

  // Encode the preset's full state snapshot directly into the URL (no
  // backend round-trip — this app doesn't control its own Firestore
  // security rules from the client, so a new public collection can't be
  // assumed safe/readable by other users). Whoever opens the link gets the
  // exact same look via the ?preset= param handled in InteractiveGradient.
  const handleCopyLink = (preset: Preset) => {
    const encoded = encodePresetData(preset.data);
    const url = `${window.location.origin}${window.location.pathname}?preset=${encoded}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLinkId(preset.id);
    setTimeout(() => setCopiedLinkId(prev => (prev === preset.id ? null : prev)), 2000);
  };

  const handleUpdatePreset = (id: string) => {
    updatePreset(id);
    setSavedPresetId(id);
    setTimeout(() => setSavedPresetId(prev => (prev === id ? null : prev)), 1200);
  };

  const confirmAdd = async () => {
    const name = newPresetName.trim();
    setNewPresetName('');
    if (name) {
      // Keep isAddingPreset (and therefore the paused Auto Shuffle) true
      // through the actual async save, not just until the name is
      // submitted — otherwise Auto Shuffle could resume and randomize
      // state again while the Firestore write is still in flight.
      await savePresetWithName(name);
    }
    setIsAddingPreset(false);
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
    return folders.map(folder => ({
      folder,
      items: [...groups.get(folder)!].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [savedPresets, folderNames]);

  return (
    <div className="w-full bg-black/20 border border-white/8 rounded-lg overflow-hidden">
      {/* Sign-in — anonymous sessions already save presets, but only in
          this browser; signing in with email lets the same presets follow
          you across devices. */}
      <div className="border-b border-white/10 px-3 py-1.5">
        {authUser && !isAnonymous ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/80 truncate">
              Signed in as <span className="text-white font-semibold">{authUser.displayName || authUser.email}</span>
            </span>
            <button
              onClick={signOutUser}
              className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white transition-colors flex-shrink-0"
              title="Sign out"
            >
              <SignOut weight="regular" className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-white/50 leading-snug">
              Login to save presets across devices.
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => { setEmailMode('signin'); clearAuthError(); }}
                  className={`px-2 py-0.5 rounded ${emailMode === 'signin' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setEmailMode('signup'); clearAuthError(); }}
                  className={`px-2 py-0.5 rounded ${emailMode === 'signup' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  Sign up
                </button>
              </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full box-border px-2 py-1.5 text-xs bg-black/30 border border-white/15 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitEmailForm(); }}
                  placeholder="Password"
                  className="w-full box-border px-2 py-1.5 text-xs bg-black/30 border border-white/15 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                />
                <button
                  onClick={submitEmailForm}
                  disabled={authBusy || !email.trim() || !password}
                  className="px-3 py-1.5 text-xs bg-white text-black rounded font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailMode === 'signup' ? 'Create account' : 'Sign in'}
                </button>
            </div>
            {authError && (
              <p className="text-[10px] text-red-300 leading-snug">{authError}</p>
            )}
          </div>
        )}
      </div>

      {/* Add row — a single "+" trigger with a small menu, or whichever
          input it opened. Merged from two always-visible rows into one so
          the list isn't permanently pushed down by two "new..." prompts. */}
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
            className="flex-1 min-w-0 px-3 py-1.5 text-[10px] bg-transparent text-white placeholder-white/60 focus:outline-none"
          />
          {newFolderName.trim() && (
            <button
              onClick={confirmAddFolder}
              className="px-2 py-1.5 text-[10px] text-white hover:bg-white/15 transition-colors flex-shrink-0 font-semibold"
            >
              Save
            </button>
          )}
          <button
            onClick={cancelAddFolder}
            className="px-2 py-1.5 text-[10px] text-white/40 hover:bg-white/15 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ) : isAddingPreset ? (
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
            className="flex-1 min-w-0 px-3 py-1.5 text-[10px] bg-transparent text-white placeholder-white/60 focus:outline-none"
          />
          {newPresetName.trim() && (
            <button
              onClick={confirmAdd}
              className="px-2 py-1.5 text-[10px] text-white hover:bg-white/15 transition-colors flex-shrink-0 font-semibold"
            >
              Save
            </button>
          )}
          <button
            onClick={cancelAdd}
            className="px-2 py-1.5 text-[10px] text-white/40 hover:bg-white/15 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-stretch border-b border-white/10">
          <button
            onClick={() => setIsAddingPreset(true)}
            className="flex items-center justify-center gap-1 flex-1 px-3 py-1.5 text-[10px] text-white/70 hover:text-white hover:bg-white/15 transition-colors font-semibold"
          >
            <Plus weight="regular" className="w-3.5 h-3.5" />
            Preset
          </button>
          <div className="w-px bg-white/10" />
          <button
            onClick={() => setIsAddingFolder(true)}
            className="flex items-center justify-center gap-1 flex-1 px-3 py-1.5 text-[10px] text-white/70 hover:text-white hover:bg-white/15 transition-colors font-semibold"
          >
            <FolderPlus weight="regular" className="w-3.5 h-3.5" />
            Folder
          </button>
        </div>
      )}

      {/* Saved presets list, grouped by folder */}
      {savedPresets.length === 0 && !isAddingPreset && grouped.length === 0 ? (
        <div className="px-3 py-1.5 text-[10px] text-white/50 italic">No saved presets</div>
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
                    className="flex-1 min-w-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/20 text-white focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                  >
                    <FolderSimple weight="regular" className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{folder}</span>
                    <span className="text-white/30">{items.length}</span>
                    <CaretDown weight="regular" className={`w-3 h-3 flex-shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
                {!isUncategorized && renamingFolder !== folder && (
                  <div className={`flex items-center transition-opacity flex-shrink-0 ${isMobile ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingFolder(folder); setRenamingFolderValue(folder); }}
                      className="px-1.5 py-1 text-white/50 hover:text-white/80 hover:bg-white/15 transition-colors flex-shrink-0"
                      title="Rename folder"
                      aria-label="Rename folder"
                    >
                      <PencilSimple weight="regular" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFolder(folder); }}
                      className="px-1.5 py-1 text-white/50 hover:text-red-400 hover:bg-white/15 transition-colors flex-shrink-0"
                      title="Delete folder (presets move to Uncategorized)"
                      aria-label="Delete folder (presets move to Uncategorized)"
                    >
                      <Minus weight="regular" className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                      className="flex-1 px-3 py-1 text-[10px] bg-black/20 text-white focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      onDoubleClick={(e) => { e.stopPropagation(); setRenamingPresetId(preset.id); setRenamingPresetValue(preset.name); }}
                      title="Click to load, double-click to rename"
                      className="flex-1 min-w-0 px-3 py-1 text-[10px] text-white hover:bg-white/15 text-left transition-colors font-semibold truncate"
                    >
                      {preset.name}
                    </button>
                  )}
                  <div className={`flex items-center transition-opacity flex-shrink-0 ${copiedLinkId === preset.id ? 'opacity-100' : isMobile ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(preset); }}
                    className={`px-1.5 py-1 hover:bg-white/15 transition-colors flex-shrink-0 ${copiedLinkId === preset.id ? 'text-green-400' : 'text-white/50 hover:text-white/80'}`}
                    title={copiedLinkId === preset.id ? 'Link copied!' : 'Copy shareable link'}
                    aria-label={copiedLinkId === preset.id ? 'Link copied!' : 'Copy shareable link'}
                  >
                    {copiedLinkId === preset.id
                      ? <Check weight="bold" className="w-3.5 h-3.5" />
                      : <LinkSimple weight="regular" className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdatePreset(preset.id); }}
                    className={`px-1.5 py-1 hover:bg-white/15 transition-colors flex-shrink-0 ${savedPresetId === preset.id ? 'text-green-400' : 'text-white/50 hover:text-white/80'}`}
                    title={savedPresetId === preset.id ? 'Saved!' : 'Save current settings to this preset'}
                    aria-label={savedPresetId === preset.id ? 'Saved!' : 'Save current settings to this preset'}
                  >
                    {savedPresetId === preset.id
                      ? <Check weight="bold" className="w-3.5 h-3.5" />
                      : <FloppyDisk weight="regular" className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                    className="px-1.5 py-1 text-white/50 hover:text-red-400 hover:bg-white/15 transition-colors flex-shrink-0"
                    title="Delete preset"
                    aria-label="Delete preset"
                  >
                    <Minus weight="regular" className="w-3.5 h-3.5" />
                  </button>
                  </div>
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
