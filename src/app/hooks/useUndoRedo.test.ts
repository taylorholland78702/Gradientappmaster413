import { describe, it, expect, vi } from 'vitest';
import { useRef, useState } from 'react';
import { renderHook } from '../testUtils/renderHook';
import { useUndoRedo } from './useUndoRedo';
import type { Snapshot } from './snapshotTypes';

// A live "document" the hook snapshots and restores, standing in for the whole app state.
function setup() {
  const live = { value: 0 };
  const applied: Snapshot[] = [];
  const hook = renderHook(() => {
    const undoStackRef = useRef<Snapshot[]>([]);
    const undoIndexRef = useRef(-1);
    const redoStackRef = useRef<Snapshot[]>([]);
    const [, setUndoDepth] = useState(0);
    const [, setRedoDepth] = useState(0);
    return useUndoRedo({
      buildSnapshot: () => ({ zoom: live.value }),
      applySnapshot: (s) => { applied.push(s); live.value = s.zoom ?? 0; },
      undoStackRef, undoIndexRef, setUndoDepth, redoStackRef, setRedoDepth,
    } as never);
  }, undefined);
  return { live, applied, hook };
}

describe('useUndoRedo', () => {
  it('undo restores the state saved before the change, redo brings the change back', () => {
    const { live, hook } = setup();
    live.value = 1; hook.current.saveCurrentState();   // saved: 1
    live.value = 2;                                     // an unsaved edit on top
    hook.act(() => hook.current.undoLastChange());
    expect(live.value).toBe(1);
    hook.act(() => hook.current.redoLastChange());
    expect(live.value).toBe(2);
    hook.unmount();
  });

  it('undo with nothing saved does nothing', () => {
    const { live, applied, hook } = setup();
    hook.act(() => hook.current.undoLastChange());
    expect(applied).toEqual([]);
    expect(live.value).toBe(0);
    hook.unmount();
  });

  it('keeps only the last 10 states', () => {
    const { live, hook } = setup();
    for (let i = 1; i <= 15; i++) { live.value = i; hook.current.saveCurrentState(); }
    let steps = 0;
    const spy = vi.fn();
    for (let i = 0; i < 20; i++) { const before = live.value; hook.act(() => hook.current.undoLastChange()); if (live.value !== before) steps++; spy(); }
    expect(steps).toBeLessThanOrEqual(10);
    expect(steps).toBeGreaterThan(0);
    hook.unmount();
  });

  it('a new save drops redo history', () => {
    const { live, hook } = setup();
    live.value = 1; hook.current.saveCurrentState();
    live.value = 2;
    hook.act(() => hook.current.undoLastChange());
    live.value = 5; hook.current.saveCurrentState();
    const before = live.value;
    hook.act(() => hook.current.redoLastChange());
    expect(live.value).toBe(before);
    hook.unmount();
  });
});
