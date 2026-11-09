import { describe, it, expect, vi } from 'vitest';
import { useRef, useState } from 'react';
import { renderHook } from '../testUtils/renderHook';
import { useUndoRedo, lookThumbOf } from './useUndoRedo';
import type { Snapshot } from './snapshotTypes';

// A live "document" the hook snapshots and restores, standing in for the whole app state.
function setup(opts: { thumbs?: boolean } = {}) {
  const live = { value: 0 };
  let history = 0;
  const refs: { undo: { current: Snapshot[] } } = { undo: { current: [] } };
  const applied: Snapshot[] = [];
  const hook = renderHook(() => {
    const undoStackRef = useRef<Snapshot[]>([]);
    const undoIndexRef = useRef(-1);
    const redoStackRef = useRef<Snapshot[]>([]);
    refs.undo = undoStackRef;
    const [, setUndoDepth] = useState(0);
    const [, setRedoDepth] = useState(0);
    return useUndoRedo({
      buildSnapshot: () => ({ zoom: live.value }),
      applySnapshot: (s) => { applied.push(s); live.value = s.zoom ?? 0; },
      undoStackRef, undoIndexRef, setUndoDepth, redoStackRef, setRedoDepth,
      ...(opts.thumbs ? { captureThumb: () => `thumb-${live.value}` } : {}),
      onHistoryChange: () => { history++; },
    } as never);
  }, undefined);
  return { live, applied, hook, historyChanges: () => history, undoStackRef: () => refs.undo.current };
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

describe('jumping back through the look history', () => {
  const save = (live: { value: number }, hook: ReturnType<typeof setup>['hook'], values: number[]) => {
    for (const v of values) { live.value = v; hook.current.saveCurrentState(); }
  };

  it('goes straight to an earlier look, and redo walks forward through the looks it passed', () => {
    const { live, hook } = setup();
    save(live, hook, [1, 2, 3, 4]);      // looks 1-4 saved, as each was left
    live.value = 5;                        // now showing look 5
    hook.act(() => hook.current.jumpToLook(1));
    expect(live.value).toBe(2);
    for (const expected of [3, 4, 5]) { hook.act(() => hook.current.redoLastChange()); expect(live.value).toBe(expected); }
    hook.act(() => hook.current.redoLastChange());
    expect(live.value).toBe(5);            // nothing further forward
    hook.unmount();
  });

  it('undo after a jump continues from the look before the one jumped to', () => {
    const { live, hook } = setup();
    save(live, hook, [1, 2, 3]); live.value = 4;
    hook.act(() => hook.current.jumpToLook(2));
    expect(live.value).toBe(3);
    hook.act(() => hook.current.undoLastChange());
    expect(live.value).toBe(2);
    hook.unmount();
  });

  it('jumping to the most recent saved look is the same as one undo', () => {
    const { live, hook } = setup();
    save(live, hook, [1, 2]); live.value = 3;
    hook.act(() => hook.current.jumpToLook(1));
    expect(live.value).toBe(2);
    hook.act(() => hook.current.redoLastChange());
    expect(live.value).toBe(3);
    hook.unmount();
  });

  it('ignores an index that is not in the history', () => {
    const { live, applied, hook } = setup();
    save(live, hook, [1, 2]); live.value = 3;
    hook.act(() => hook.current.jumpToLook(5));
    hook.act(() => hook.current.jumpToLook(-1));
    expect(applied).toEqual([]);
    expect(live.value).toBe(3);
    hook.unmount();
  });

  it('keeps a picture with each saved look and tells the view when the history changes', () => {
    const { live, hook, historyChanges, undoStackRef } = setup({ thumbs: true });
    save(live, hook, [7, 8]);
    expect(undoStackRef().map(s => lookThumbOf(s))).toEqual(['thumb-7', 'thumb-8']);
    const before = historyChanges();
    hook.act(() => hook.current.undoLastChange());
    hook.act(() => hook.current.jumpToLook(0));
    expect(historyChanges()).toBeGreaterThan(before);
    hook.unmount();
  });
});
