/**
 * History Manager
 * Optimized undo/redo system for consolidated state
 */

export interface AppState {
  gradientType: string;
  gradientColors: Array<{ r: number; g: number; b: number }>;
  gradientConfig: Record<string, any>;
  effectParams: Record<string, any>;
  activeEffects: string[];
  timestamp: number;
}

export interface HistoryOptions {
  maxStates?: number;
  debounceMs?: number;
}

/**
 * History Manager with undo/redo support
 */
export class HistoryManager {
  private states: AppState[] = [];
  private currentIndex: number = -1;
  private maxStates: number;
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number;
  private lastState: AppState | null = null;
  
  constructor(options: HistoryOptions = {}) {
    this.maxStates = options.maxStates || 50;
    this.debounceMs = options.debounceMs || 300;
  }
  
  /**
   * Push a new state (with optional debouncing)
   */
  push(state: AppState, immediate: boolean = false): void {
    // Clear any pending debounced push
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Check if state actually changed
    if (this.lastState && this.statesEqual(this.lastState, state)) {
      return;
    }
    
    const doPush = () => {
      // Remove any states after current index (if we've undone)
      if (this.currentIndex < this.states.length - 1) {
        this.states = this.states.slice(0, this.currentIndex + 1);
      }
      
      // Add new state
      this.states.push(this.cloneState(state));
      this.lastState = this.cloneState(state);
      
      // Maintain max states limit
      if (this.states.length > this.maxStates) {
        this.states.shift();
      } else {
        this.currentIndex++;
      }
    };
    
    if (immediate) {
      doPush();
    } else {
      this.debounceTimer = setTimeout(doPush, this.debounceMs);
    }
  }
  
  /**
   * Undo to previous state
   */
  undo(): AppState | null {
    if (!this.canUndo()) {
      return null;
    }
    
    this.currentIndex--;
    const state = this.states[this.currentIndex];
    this.lastState = this.cloneState(state);
    return this.cloneState(state);
  }
  
  /**
   * Redo to next state
   */
  redo(): AppState | null {
    if (!this.canRedo()) {
      return null;
    }
    
    this.currentIndex++;
    const state = this.states[this.currentIndex];
    this.lastState = this.cloneState(state);
    return this.cloneState(state);
  }
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }
  
  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }
  
  /**
   * Get current state
   */
  getCurrentState(): AppState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.states.length) {
      return this.cloneState(this.states[this.currentIndex]);
    }
    return null;
  }
  
  /**
   * Clear all history
   */
  clear(): void {
    this.states = [];
    this.currentIndex = -1;
    this.lastState = null;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
  
  /**
   * Get history stats
   */
  getStats(): {
    totalStates: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return {
      totalStates: this.states.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
  
  /**
   * Deep clone a state
   */
  private cloneState(state: AppState): AppState {
    return JSON.parse(JSON.stringify(state));
  }
  
  /**
   * Check if two states are equal (shallow comparison)
   */
  private statesEqual(state1: AppState, state2: AppState): boolean {
    // Compare gradientType
    if (state1.gradientType !== state2.gradientType) return false;
    
    // Compare colors length
    if (state1.gradientColors.length !== state2.gradientColors.length) return false;
    
    // Compare colors (first and last only for performance)
    if (state1.gradientColors.length > 0) {
      const c1First = state1.gradientColors[0];
      const c2First = state2.gradientColors[0];
      if (c1First.r !== c2First.r || c1First.g !== c2First.g || c1First.b !== c2First.b) {
        return false;
      }
      
      const c1Last = state1.gradientColors[state1.gradientColors.length - 1];
      const c2Last = state2.gradientColors[state2.gradientColors.length - 1];
      if (c1Last.r !== c2Last.r || c1Last.g !== c2Last.g || c1Last.b !== c2Last.b) {
        return false;
      }
    }
    
    // Compare a few key config values
    if (state1.gradientConfig.angle !== state2.gradientConfig.angle) return false;
    if (state1.gradientConfig.zoom !== state2.gradientConfig.zoom) return false;
    
    // Compare active effects
    if (state1.activeEffects.length !== state2.activeEffects.length) return false;
    if (state1.activeEffects[0] !== state2.activeEffects[0]) return false;
    
    // States are similar enough
    return true;
  }
}

/**
 * Create state snapshot for history
 */
export function createStateSnapshot(
  gradientType: string,
  gradientColors: Array<{ r: number; g: number; b: number }>,
  gradientConfig: Record<string, any>,
  effectParams: Record<string, any>,
  activeEffects: string[]
): AppState {
  return {
    gradientType,
    gradientColors: JSON.parse(JSON.stringify(gradientColors)),
    gradientConfig: JSON.parse(JSON.stringify(gradientConfig)),
    effectParams: JSON.parse(JSON.stringify(effectParams)),
    activeEffects: [...activeEffects],
    timestamp: Date.now()
  };
}

/**
 * Apply state snapshot to component
 */
export function applyStateSnapshot(
  state: AppState,
  setters: {
    setGradientType: (type: string) => void;
    setGradientColors: (colors: Array<{ r: number; g: number; b: number }>) => void;
    setGradientConfig: (config: Record<string, any>) => void;
    setEffectParams: (params: Record<string, any>) => void;
    setActiveEffects: (effects: string[]) => void;
  }
): void {
  setters.setGradientType(state.gradientType);
  setters.setGradientColors(state.gradientColors);
  setters.setGradientConfig(state.gradientConfig);
  setters.setEffectParams(state.effectParams);
  setters.setActiveEffects(state.activeEffects);
}

/**
 * Export state to JSON
 */
export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Import state from JSON
 */
export function importState(json: string): AppState | null {
  try {
    const state = JSON.parse(json);
    
    // Validate required fields
    if (!state.gradientType || !state.gradientColors || !state.gradientConfig) {
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to import state:', error);
    return null;
  }
}

/**
 * Compress state for storage (removes redundant data)
 */
export function compressState(state: AppState): AppState {
  // Remove default values to save space
  const compressed = { ...state };
  
  // Remove empty arrays
  if (compressed.activeEffects.length === 0) {
    delete (compressed as any).activeEffects;
  }
  
  // Remove default effect params (value === 0 or default string)
  const compressedEffectParams: Record<string, any> = {};
  for (const [key, value] of Object.entries(compressed.effectParams)) {
    if (typeof value === 'number' && value !== 0) {
      compressedEffectParams[key] = value;
    } else if (typeof value === 'string' && !['monochrome', 'gaussian', 'floyd-steinberg', 'horizontal', 'circle'].includes(value)) {
      compressedEffectParams[key] = value;
    }
  }
  compressed.effectParams = compressedEffectParams;
  
  return compressed;
}

/**
 * Decompress state (restore default values)
 */
export function decompressState(
  compressed: AppState,
  defaults: {
    gradientConfig: Record<string, any>;
    effectParams: Record<string, any>;
  }
): AppState {
  return {
    ...compressed,
    gradientConfig: { ...defaults.gradientConfig, ...compressed.gradientConfig },
    effectParams: { ...defaults.effectParams, ...compressed.effectParams },
    activeEffects: compressed.activeEffects || []
  };
}

/**
 * Batch state changes for single history entry
 */
export class StateBatcher {
  private pendingChanges: Partial<AppState> = {};
  private commitTimer: NodeJS.Timeout | null = null;
  private commitDelay: number;
  
  constructor(commitDelay: number = 100) {
    this.commitDelay = commitDelay;
  }
  
  /**
   * Queue a state change
   */
  queueChange(changes: Partial<AppState>): void {
    this.pendingChanges = { ...this.pendingChanges, ...changes };
    
    // Reset commit timer
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
    }
    
    this.commitTimer = setTimeout(() => this.commit(), this.commitDelay);
  }
  
  /**
   * Commit batched changes immediately
   */
  commit(): void {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    
    if (Object.keys(this.pendingChanges).length > 0) {
      // Trigger commit callback
      this.onCommit(this.pendingChanges);
      this.pendingChanges = {};
    }
  }
  
  /**
   * Override this to handle commits
   */
  onCommit(changes: Partial<AppState>): void {
    // Override in implementation
  }
  
  /**
   * Cancel pending changes
   */
  cancel(): void {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    this.pendingChanges = {};
  }
}
