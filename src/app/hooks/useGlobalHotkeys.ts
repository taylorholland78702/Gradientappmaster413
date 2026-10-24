import { useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import { GRADIENT_LOOKS, type GradientLook } from '../constants/gradientLooks';
import type { GradientType } from '../constants/gradientEffects';

type Action = () => void;
type TabId = 'gradients' | 'effects' | 'audio' | 'color' | 'presets';
type Anchor = { top?: number; bottom?: number; left: number; width: number; height?: number } | null;

export interface GlobalHotkeyParams {
  shuffleAudiovisuals: Action; gradientTypeRef: MutableRefObject<GradientType>;
  undoLastChange: Action; redoLastChange: Action; shuffleGradientType: Action; randomizeEffects: Action;
  exportAsPNG: Action; resetToDefaults: Action; toggleVCRRecording: Action; toggleVCRPlayback: Action;
  toggleDisplayWindow: Action; toggleGifRecording: Action; goBack: Action; goForward: Action;
  evolveWithFactor: (factor: number) => void;
  applyGradientLook: (look: GradientLook) => void;
  setActiveTab: Dispatch<SetStateAction<TabId | null>>; activeTab: TabId | null;
  setIsControlsVisible: Dispatch<SetStateAction<boolean>>; isControlsVisible: boolean;
  setVcrPlaybackSpeed: Dispatch<SetStateAction<number>>;
  setRotationDirection: Dispatch<SetStateAction<'clockwise' | 'counter'>>;
  setIsMultiFxMode: Dispatch<SetStateAction<boolean>>;
  isAboutOpen: boolean; setIsAboutOpen: Dispatch<SetStateAction<boolean>>;
  setIsAutoShuffleOn: Dispatch<SetStateAction<boolean>>;
  autoShufflePopoverAnchor: Anchor; setAutoShufflePopoverAnchor: Dispatch<SetStateAction<Anchor>>;
}

// Global keyboard shortcuts. Moved out of InteractiveGradient unchanged; the handlers and flags it
// reacts to come in as one object and keep the same effect dependencies.
export function useGlobalHotkeys(p: GlobalHotkeyParams) {
  const { shuffleAudiovisuals, gradientTypeRef, undoLastChange, redoLastChange, shuffleGradientType, randomizeEffects, setActiveTab, setIsControlsVisible, exportAsPNG, resetToDefaults, toggleVCRRecording, toggleVCRPlayback, setVcrPlaybackSpeed, setRotationDirection, evolveWithFactor, setIsMultiFxMode, isAboutOpen, setIsAboutOpen, activeTab, isControlsVisible, toggleDisplayWindow, setIsAutoShuffleOn, toggleGifRecording, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, applyGradientLook, goBack, goForward } = p;
  // Which Look the L key lands on next, per press (not tied to which chip is highlighted).
  const lookIndexRef = useRef(-1);

  // Global hotkeys. Bare letters (no Cmd/Ctrl/Alt) so nothing collides with
  // browser shortcuts; suppressed while typing in any text field so letters
  // like "g" or "f" still type normally there.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoLastChange(); else undoLastChange();
        return;
      }
      // e.code (physical key), not e.key — Option remaps e.key to a
      // different character on Mac (e.g. Option+W -> "∑"), so the 'w'
      // string comparison never matched with Alt held.
      if (e.altKey && e.shiftKey && e.code === 'KeyW') {
        e.preventDefault();
        setIsAutoShuffleOn(prev => !prev);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goForward();
          break;
        case 'g': case 'G':
          e.preventDefault();
          if (e.shiftKey) shuffleGradientType();
          else setActiveTab(prev => prev === 'gradients' ? null : 'gradients');
          break;
        case 'f': case 'F':
          e.preventDefault();
          if (e.shiftKey) randomizeEffects();
          else setActiveTab(prev => prev === 'effects' ? null : 'effects');
          break;
        case 'a': case 'A':
          e.preventDefault();
          if (e.shiftKey) shuffleAudiovisuals();
          else setActiveTab(prev => prev === 'audio' ? null : 'audio');
          break;
        case 'c': case 'C':
          e.preventDefault();
          setActiveTab(prev => prev === 'color' ? null : 'color');
          break;
        case 'p': case 'P':
          e.preventDefault();
          if (e.shiftKey) toggleDisplayWindow();
          else setActiveTab(prev => prev === 'presets' ? null : 'presets');
          break;
        case 'h': case 'H':
          e.preventDefault();
          if (IS_DISPLAY_MODE) break;
          // Simple 2-state toggle now — the rail's icon-only look already
          // serves the role the old separate "collapsed pill" state used
          // to (previously a 3-state cycle: full panel -> pill -> hidden).
          setIsControlsVisible(v => !v);
          break;
        case 's': case 'S':
          e.preventDefault();
          if (e.shiftKey) toggleGifRecording(); else exportAsPNG();
          break;
        case 'r': case 'R':
          // Reset-to-defaults wipes the whole current look — every other
          // destructive-ish shortcut in the app (Shift+W remix, Shift+P
          // display toggle, etc.) already requires a modifier; this was the
          // one exception, sitting on a bare unmodified letter key.
          if (e.shiftKey) {
            e.preventDefault();
            resetToDefaults();
          }
          break;
        case 'v': case 'V':
          e.preventDefault();
          toggleVCRRecording();
          break;
        case ' ':
          e.preventDefault();
          toggleVCRPlayback();
          break;
        case '[':
          e.preventDefault();
          setVcrPlaybackSpeed(prev => {
            if (prev > 2) return prev - 1;
            if (prev === 2) return 1;
            if (prev === 1) return 0.5;
            return prev;
          });
          break;
        case ']':
          e.preventDefault();
          setVcrPlaybackSpeed(prev => {
            if (prev >= 2) return Math.min(10, prev + 1);
            if (prev >= 1) return 2;
            return 1;
          });
          break;
        case 'd': case 'D':
          e.preventDefault();
          setRotationDirection(prev => prev === 'clockwise' ? 'counter' : 'clockwise');
          break;
        case 'w': case 'W':
          e.preventDefault();
          evolveWithFactor(e.shiftKey ? 1 : 0.15);
          break;
        case 'm': case 'M':
          e.preventDefault();
          setIsMultiFxMode(prev => !prev);
          break;
        case 'l': case 'L': {
          // Step through the current gradient's Looks (Shift goes back).
          const looks = GRADIENT_LOOKS[gradientTypeRef.current as GradientType];
          if (!looks?.length) break;
          e.preventDefault();
          lookIndexRef.current = (lookIndexRef.current + (e.shiftKey ? looks.length - 1 : 1)) % looks.length;
          applyGradientLook(looks[lookIndexRef.current]);
          break;
        }
        case '?':
          e.preventDefault();
          setIsAboutOpen(prev => !prev);
          break;
        case 'Escape':
          if (isAboutOpen) { e.preventDefault(); setIsAboutOpen(false); }
          else if (autoShufflePopoverAnchor) { e.preventDefault(); setAutoShufflePopoverAnchor(null); }
          else if (activeTab) { e.preventDefault(); setActiveTab(null); }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    undoLastChange, redoLastChange, shuffleGradientType, randomizeEffects,
    setActiveTab, setIsControlsVisible, exportAsPNG, resetToDefaults,
    toggleVCRRecording, toggleVCRPlayback, setVcrPlaybackSpeed, setRotationDirection,
    evolveWithFactor, setIsMultiFxMode, isAboutOpen, setIsAboutOpen, activeTab,
    isControlsVisible, toggleDisplayWindow, setIsAutoShuffleOn, toggleGifRecording,
    autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, applyGradientLook, goBack, goForward,
  ]);
}
