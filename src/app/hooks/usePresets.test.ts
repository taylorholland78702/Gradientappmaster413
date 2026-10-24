import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '../testUtils/renderHook';
import { usePresets } from './usePresets';
import * as notifyModule from '../utils/notify';

const base = () => ({ getCurrentState: () => ({}), applyPresetData: vi.fn(), uid: null });

describe('usePresets (local storage path)', () => {
  let notify: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { localStorage.clear(); notify = vi.spyOn(notifyModule, 'notify').mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('loads stored presets and gives older ones an id', () => {
    localStorage.setItem('gradientPresets', JSON.stringify([{ name: 'Old', data: { zoom: 1 } }, { id: 'x', name: 'New', data: {} }]));
    const h = renderHook(usePresets, base());
    expect(h.current.savedPresets.map(p => p.name)).toEqual(['Old', 'New']);
    expect(h.current.savedPresets.every(p => !!p.id)).toBe(true);
    expect(h.current.savedPresets[1].id).toBe('x');
    h.unmount();
  });

  it('does not crash when local storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
    const h = renderHook(usePresets, base());
    expect(h.current.savedPresets).toEqual([]);
    h.unmount();
  });

  it('tells the user when the stored presets are corrupted, and keeps the data', () => {
    localStorage.setItem('gradientPresets', '{not json');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const h = renderHook(usePresets, base());
    expect(h.current.savedPresets).toEqual([]);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('gradientPresets')).toBe('{not json');
    h.unmount();
  });

  it('asks for a name instead of saving an empty one', async () => {
    const h = renderHook(usePresets, base());
    await h.act(async () => { await h.current.savePreset(); });
    expect(notify).toHaveBeenCalledWith('Please enter a preset name');
    expect(h.current.savedPresets).toEqual([]);
    h.unmount();
  });

  it('saves a named preset to local storage', async () => {
    const h = renderHook(usePresets, { ...base(), getCurrentState: () => ({ zoom: 2 }) });
    await h.act(async () => { await h.current.savePresetWithName('Mine'); });
    expect(h.current.savedPresets.map(p => p.name)).toEqual(['Mine']);
    expect(JSON.parse(localStorage.getItem('gradientPresets')!)[0].data.zoom).toBe(2);
    h.unmount();
  });

  it('a preset that cannot be applied shows a notice instead of crashing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const p = { ...base(), applyPresetData: vi.fn(() => { throw new Error('bad'); }) };
    const h = renderHook(usePresets, p);
    h.act(() => h.current.loadPreset({ id: '1', name: 'Broken', data: {} } as never));
    expect(notify).toHaveBeenCalledTimes(1);
    h.unmount();
  });
});
