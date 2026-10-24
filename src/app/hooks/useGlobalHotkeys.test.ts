import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../testUtils/renderHook';
import { useGlobalHotkeys, type GlobalHotkeyParams } from './useGlobalHotkeys';

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = window) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
};

function params(overrides: Partial<GlobalHotkeyParams> = {}): GlobalHotkeyParams {
  const fn = () => vi.fn();
  return {
    shuffleAudiovisuals: fn(), gradientTypeRef: { current: 'angle' },
    undoLastChange: fn(), redoLastChange: fn(), shuffleGradientType: fn(), randomizeEffects: fn(),
    exportAsPNG: fn(), resetToDefaults: fn(), toggleVCRRecording: fn(), toggleVCRPlayback: fn(),
    toggleDisplayWindow: fn(), toggleGifRecording: fn(), goBack: fn(), goForward: fn(),
    evolveWithFactor: fn(), applyGradientLook: fn(),
    setActiveTab: fn(), activeTab: null,
    setIsControlsVisible: fn(), isControlsVisible: true,
    setVcrPlaybackSpeed: fn(), setRotationDirection: fn(), setIsMultiFxMode: fn(),
    isAboutOpen: false, setIsAboutOpen: fn(),
    setIsAutoShuffleOn: fn(), autoShufflePopoverAnchor: null, setAutoShufflePopoverAnchor: fn(),
    ...overrides,
  } as GlobalHotkeyParams;
}

describe('useGlobalHotkeys', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('arrow keys step back and forward', () => {
    const p = params(); const h = renderHook(useGlobalHotkeys, p);
    press('ArrowLeft'); press('ArrowRight');
    expect(p.goBack).toHaveBeenCalledTimes(1);
    expect(p.goForward).toHaveBeenCalledTimes(1);
    h.unmount();
  });

  it('G toggles the Gradients tab, Shift+G shuffles the gradient type', () => {
    const p = params(); const h = renderHook(useGlobalHotkeys, p);
    press('g');
    const toggle = (p.setActiveTab as ReturnType<typeof vi.fn>).mock.calls[0][0] as (prev: string | null) => string | null;
    expect(toggle(null)).toBe('gradients');
    expect(toggle('gradients')).toBeNull();
    press('G', { shiftKey: true });
    expect(p.shuffleGradientType).toHaveBeenCalledTimes(1);
    h.unmount();
  });

  it('Shift+W remixes everything', () => {
    const p = params(); const h = renderHook(useGlobalHotkeys, p);
    press('W', { shiftKey: true });
    expect(p.evolveWithFactor).toHaveBeenCalledWith(1);
    h.unmount();
  });

  it('Ctrl+Z undoes and Ctrl+Shift+Z redoes', () => {
    const p = params(); const h = renderHook(useGlobalHotkeys, p);
    press('z', { ctrlKey: true });
    press('z', { ctrlKey: true, shiftKey: true });
    expect(p.undoLastChange).toHaveBeenCalledTimes(1);
    expect(p.redoLastChange).toHaveBeenCalledTimes(1);
    h.unmount();
  });

  it('Alt+Shift+W toggles Auto Shuffle (matched by physical key)', () => {
    const p = params(); const h = renderHook(useGlobalHotkeys, p);
    press('∑', { altKey: true, shiftKey: true, code: 'KeyW' });
    expect(p.setIsAutoShuffleOn).toHaveBeenCalledTimes(1);
    h.unmount();
  });

  it('ignores letters while typing in a text field', () => {
    const p = params(); const h = renderHook(useGlobalHotkeys, p);
    const input = document.createElement('input'); document.body.appendChild(input);
    press('g', {}, input);
    press('ArrowLeft', {}, input);
    expect(p.setActiveTab).not.toHaveBeenCalled();
    expect(p.goBack).not.toHaveBeenCalled();
    h.unmount();
  });

  it('Escape closes About first, then the popout, then the drawer', () => {
    const anchor = { left: 0, width: 1 };
    let p = params({ isAboutOpen: true, autoShufflePopoverAnchor: anchor, activeTab: 'audio' });
    let h = renderHook(useGlobalHotkeys, p);
    press('Escape');
    expect(p.setIsAboutOpen).toHaveBeenCalledWith(false);
    expect(p.setAutoShufflePopoverAnchor).not.toHaveBeenCalled();
    h.unmount();

    p = params({ autoShufflePopoverAnchor: anchor, activeTab: 'audio' }); h = renderHook(useGlobalHotkeys, p);
    press('Escape');
    expect(p.setAutoShufflePopoverAnchor).toHaveBeenCalledWith(null);
    expect(p.setActiveTab).not.toHaveBeenCalled();
    h.unmount();

    p = params({ activeTab: 'audio' }); h = renderHook(useGlobalHotkeys, p);
    press('Escape');
    expect(p.setActiveTab).toHaveBeenCalledWith(null);
    h.unmount();
  });

  it('stops listening after unmount', () => {
    const p = params(); const h = renderHook(useGlobalHotkeys, p);
    h.unmount();
    press('ArrowLeft');
    expect(p.goBack).not.toHaveBeenCalled();
  });
});
