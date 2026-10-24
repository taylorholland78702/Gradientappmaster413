import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '../testUtils/renderHook';
import { usePhotoUpload } from './usePhotoUpload';
import * as notifyModule from '../utils/notify';
import type { EffectType } from '../constants/gradientEffects';

// jsdom has no image decoding: this Image fires onload or onerror depending on what the test says the file is.
class FakeImage {
  static outcome: 'load' | 'error' = 'load';
  static size = { width: 100, height: 50 };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 0; height = 0;
  set src(_: string) {
    queueMicrotask(() => {
      if (FakeImage.outcome === 'load') { this.width = FakeImage.size.width; this.height = FakeImage.size.height; this.onload?.(); } else this.onerror?.();
    });
  }
}

const flush = () => new Promise(r => setTimeout(r, 0));

function setup(initial: EffectType[] = [], isMultiFxMode = false) {
  const state = { name: '', version: 0, effects: initial, image: { current: null as CanvasImageSource | null } };
  const hook = renderHook(() => usePhotoUpload({
    photoFileName: state.name,
    setPhotoFileName: (n: string) => { state.name = n; },
    setPhotoVersion: (u: (v: number) => number) => { state.version = u(state.version); },
    photoImageRef: state.image,
    setActiveEffects: (u: (p: EffectType[]) => EffectType[]) => { state.effects = u(state.effects); },
    isMultiFxMode,
  }), undefined);
  return { state, hook };
}

describe('usePhotoUpload', () => {
  let notify: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage);
    URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn();
    notify = vi.spyOn(notifyModule, 'notify').mockImplementation(() => {});
    FakeImage.outcome = 'load'; FakeImage.size = { width: 100, height: 50 };
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  const file = (name = 'a.png', type = 'image/png') => new File(['x'], name, { type });
  const pick = (hook: ReturnType<typeof setup>['hook'], f: File) =>
    hook.act(() => hook.current.handlePhotoFileChange({ target: { files: [f] } } as never));

  it('a readable image is kept and the Photo effect turns on', async () => {
    const { state, hook } = setup();
    pick(hook, file('sunset.png')); await flush();
    expect(state.image.current).not.toBeNull();
    expect(state.name).toBe('sunset.png');
    expect(state.version).toBe(1);
    expect(state.effects).toEqual(['photo']);
    hook.unmount();
  });

  it('in Multi-FX mode Photo is added next to the active effects', async () => {
    const { state, hook } = setup(['bloom'], true);
    pick(hook, file()); await flush();
    expect(state.effects).toEqual(['bloom', 'photo']);
    hook.unmount();
  });

  it('files that are not images are ignored', async () => {
    const { state, hook } = setup();
    pick(hook, file('notes.txt', 'text/plain')); await flush();
    expect(state.name).toBe('');
    expect(state.effects).toEqual([]);
    hook.unmount();
  });

  it('an unreadable image shows a notice, clears the name and turns Photo off', async () => {
    const { state, hook } = setup();
    FakeImage.outcome = 'error';
    pick(hook, file('fake.png')); await flush();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(state.name).toBe('');
    expect(state.image.current).toBeNull();
    expect(state.effects).toEqual([]);
    hook.unmount();
  });

  it('a failed upload keeps the previous photo and its name', async () => {
    const { state, hook } = setup();
    pick(hook, file('good.png')); await flush();
    hook.rerender();
    FakeImage.outcome = 'error';
    pick(hook, file('bad.png')); await flush();
    expect(state.name).toBe('good.png');
    expect(state.image.current).not.toBeNull();
    hook.unmount();
  });

  it('dropping a file anywhere on the window loads it', async () => {
    const { state, hook } = setup();
    const e = new Event('drop', { cancelable: true }) as Event & { dataTransfer?: unknown };
    e.dataTransfer = { files: [file('dropped.png')] };
    window.dispatchEvent(e); await flush();
    expect(state.name).toBe('dropped.png');
    expect(e.defaultPrevented).toBe(true);
    hook.unmount();
  });
});
