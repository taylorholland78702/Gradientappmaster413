import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '../testUtils/renderHook';
import { usePopoutAnchor } from './usePopoutAnchor';

const rail = (rect: Partial<DOMRect> = {}) => {
  const el = document.createElement('nav');
  el.getBoundingClientRect = () => ({ top: 100, left: 0, right: 60, bottom: 500, width: 60, height: 400, x: 0, y: 100, toJSON() {}, ...rect }) as DOMRect;
  return el;
};

function setup(over: { isMobile?: boolean; activeTab?: string | null } = {}) {
  const setActiveTab = vi.fn(); const setIsAboutOpen = vi.fn();
  const hook = renderHook(usePopoutAnchor, {
    panelRef: { current: rail() }, isMobile: over.isMobile ?? false, activeTab: (over.activeTab ?? null) as never, setActiveTab, setIsAboutOpen,
  } as never);
  return { hook, setActiveTab, setIsAboutOpen };
}

describe('usePopoutAnchor', () => {
  it('opens beside the rail on desktop, level with the button for Auto Shuffle', () => {
    const { hook } = setup();
    const trigger = document.createElement('button');
    trigger.getBoundingClientRect = () => ({ top: 220, bottom: 250 }) as DOMRect;
    hook.act(() => hook.current.openAutoShufflePopover(trigger));
    expect(hook.current.popoverMode).toBe('autoShuffle');
    expect(hook.current.autoShufflePopoverAnchor).toMatchObject({ top: 220, left: 60, width: 240 });
    hook.unmount();
  });

  it('Save & share and Record grow upward from their button', () => {
    const { hook } = setup();
    const trigger = document.createElement('button');
    trigger.getBoundingClientRect = () => ({ top: 400, bottom: window.innerHeight - 20 }) as DOMRect;
    hook.act(() => hook.current.openExportPopover(trigger));
    expect(hook.current.popoverMode).toBe('export');
    expect(hook.current.autoShufflePopoverAnchor).toMatchObject({ bottom: 20, left: 60 });
    hook.unmount();
  });

  it('on mobile it opens full width above the bottom bar', () => {
    const { hook } = setup({ isMobile: true });
    hook.act(() => hook.current.openRecordPopover());
    expect(hook.current.autoShufflePopoverAnchor).toMatchObject({ left: 0, width: window.innerWidth, bottom: window.innerHeight - 100 });
    hook.unmount();
  });

  it('pressing the same button again closes it; another button swaps the popout', () => {
    const { hook } = setup();
    hook.act(() => hook.current.openExportPopover());
    hook.act(() => hook.current.openRecordPopover());
    expect(hook.current.popoverMode).toBe('record');
    expect(hook.current.autoShufflePopoverAnchor).not.toBeNull();
    hook.act(() => hook.current.openRecordPopover());
    expect(hook.current.autoShufflePopoverAnchor).toBeNull();
    hook.unmount();
  });

  it('opening a popout closes the drawer and About; opening About closes the popout', () => {
    const { hook, setActiveTab, setIsAboutOpen } = setup();
    hook.act(() => hook.current.openExportPopover());
    expect(setActiveTab).toHaveBeenCalledWith(null);
    expect(setIsAboutOpen).toHaveBeenCalledWith(false);
    hook.act(() => hook.current.openAboutPanel());
    expect(hook.current.autoShufflePopoverAnchor).toBeNull();
    expect(setIsAboutOpen).toHaveBeenLastCalledWith(true);
    hook.unmount();
  });

  it('a mousedown outside closes the popout, one on the trigger does not', () => {
    const { hook } = setup();
    const trigger = document.createElement('button'); document.body.appendChild(trigger);
    trigger.getBoundingClientRect = () => ({ top: 10, bottom: 20 }) as DOMRect;
    hook.act(() => hook.current.openAutoShufflePopover(trigger));
    // In the app this is the portaled popout element.
    const popout = document.createElement('div'); document.body.appendChild(popout);
    hook.current.autoShufflePopoverRef.current = popout;
    hook.act(() => { popout.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
    expect(hook.current.autoShufflePopoverAnchor).not.toBeNull();
    hook.act(() => { trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
    expect(hook.current.autoShufflePopoverAnchor).not.toBeNull();
    hook.act(() => { document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
    expect(hook.current.autoShufflePopoverAnchor).toBeNull();
    hook.unmount();
  });

  it('opening a tab drawer closes the popout and About', () => {
    const setActiveTab = vi.fn(); const setIsAboutOpen = vi.fn();
    const props = { panelRef: { current: rail() }, isMobile: false, activeTab: null as string | null, setActiveTab, setIsAboutOpen };
    const hook = renderHook(usePopoutAnchor, props as never);
    hook.act(() => hook.current.openExportPopover());
    setIsAboutOpen.mockClear();
    hook.rerender({ ...props, activeTab: 'audio' } as never);
    expect(hook.current.autoShufflePopoverAnchor).toBeNull();
    expect(setIsAboutOpen).toHaveBeenCalledWith(false);
    hook.unmount();
  });
});
