import { Fragment, type RefObject } from 'react';
import { Eye, EyeSlash, ArrowUUpLeft, ArrowUUpRight, ArrowsClockwise, Shuffle, Gradient, MagicWand, SpeakerHigh, Palette, Camera, Gif, FloppyDisk, Circle, Play, Stop, Rewind, FastForward, ArrowClockwise, Infinity as InfinityIcon } from '@phosphor-icons/react';
import { Kbd } from './Kbd';
import { Switch, SwitchTrack } from './Switch';
import { TOUCH_GESTURES, KEY_GESTURES } from '../constants/gestureGuide';
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC } from '../constants/autoShuffle';
import { autoShuffleSliderMax, autoShuffleSecToSlider, autoShuffleSliderToSec, formatAutoShuffleInterval } from '../utils/autoShuffle';
import { motionSensorsSupported } from '../utils/motionPermission';

export function AboutPanel({
  isMobile, railRect, dialogRef, onClose,
  isAutoShuffleOn, setIsAutoShuffleOn, autoShuffleIntervalSec, setAutoShuffleIntervalSec,
  shakeEnabled, tiltEnabled, toggleMotion, motionDenied,
}: {
  isMobile: boolean;
  railRect: { top: number; left: number; right: number; bottom: number; width: number; height: number } | null;
  dialogRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  isAutoShuffleOn: boolean; setIsAutoShuffleOn: (updater: (prev: boolean) => boolean) => void;
  autoShuffleIntervalSec: number; setAutoShuffleIntervalSec: (sec: number) => void;
  shakeEnabled: boolean; tiltEnabled: boolean; toggleMotion: (kind: 'shake' | 'tilt') => void; motionDenied: boolean;
}) {
  return (
    <div className="absolute inset-0 pointer-events-auto z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="About wāv"
        className={
          isMobile
            ? 'wav-mobile absolute bg-wav-surface rounded-none max-w-sm max-h-[80vh] overflow-y-auto text-white shadow-2xl w-[calc(100%-3rem)] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none'
            : 'absolute bg-wav-surface rounded-none max-w-sm overflow-y-auto text-white shadow-2xl outline-none'
        }
        style={isMobile ? undefined : (railRect
          ? { left: railRect.right, top: railRect.top, height: window.innerHeight - railRect.top }
          : { top: 16, left: 16 })}
      >
        {/* Same title bar as the drawers and popouts. */}
        <div
          className="sticky top-0 z-10 flex items-center justify-center bg-wav-surface border-b border-wav-line-strong"
          style={isMobile ? { padding: '6px 12px' } : { padding: '7.8px 15.6px' }}
        >
          <span className="text-white font-semibold" style={{ fontSize: isMobile ? 15 : 19.5 }}>About</span>
        </div>
        <div className="p-8 pt-6">
        <div className="flex flex-col gap-4 text-sm text-wav-text-2 leading-relaxed">
          <p><strong>wāv</strong> is a gradient-based, user-friendly art creation environment with audio visualization capabilities.</p>
          <p><strong>wāv</strong> artwork can dynamically react, creating a mesmerizing display of colors, patterns, and shapes that synchronize with the music.</p>
          <p><strong>wāv</strong> uses advanced algorithms to analyze the audio signal and generate visuals that respond to the beat, rhythm, and character of the music.</p>
          <p>Whether performing live music or theater, planning an art installation, or simply enjoying your favorite tunes at home, <strong>wāv</strong> can transform your audio experience into a spectacle.</p>
        </div>

        <div className="flex flex-col gap-8 text-sm text-wav-text-2 leading-relaxed mt-8">
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Rail</p>
            <p>Click the <strong>wāv</strong> mark at the top of the rail for this About screen.</p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Rail buttons</p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Shuffle weight="regular" className="w-4 h-4 shrink-0" /> Shuffle — remix everything at once: gradient, colors, and effects</span><Kbd label="Shift+W" /></p>
            <button
              onClick={() => setIsAutoShuffleOn(prev => !prev)}
              className="flex items-center justify-between gap-2 text-left"
              aria-pressed={isAutoShuffleOn}
            >
              <span className="flex items-center gap-2"><InfinityIcon weight="regular" className="w-4 h-4 shrink-0" /> Auto Shuffle — remix every {formatAutoShuffleInterval(autoShuffleIntervalSec)}</span>
              <span className="flex items-center gap-2">
                <Kbd label="⌥⇧W" />
                <SwitchTrack on={isAutoShuffleOn} />
              </span>
            </button>
            {/* Auto Shuffle interval — log-scale slider (see
                autoShuffleSecToSlider/autoShuffleSliderToSec) so 1s-3600s
                are all reachable with useful precision, plus a direct
                number input for typing an exact value. Adjustable
                whether Auto Shuffle is currently on or off. */}
            <div className="flex items-center gap-2 pl-6">
              <input
                type="range"
                min={0}
                max={autoShuffleSliderMax}
                value={autoShuffleSecToSlider(autoShuffleIntervalSec)}
                onChange={(e) => setAutoShuffleIntervalSec(autoShuffleSliderToSec(Number(e.target.value)))}
                className="flex-1"
                aria-label="Auto Shuffle interval"
              />
              <input
                type="number"
                min={AUTO_SHUFFLE_MIN_SEC}
                max={AUTO_SHUFFLE_MAX_SEC}
                value={autoShuffleIntervalSec}
                onChange={(e) => setAutoShuffleIntervalSec(Number(e.target.value))}
                className="text-[10px] text-white w-12 text-right bg-wav-hover border border-wav-line rounded px-1"
                aria-label="Auto Shuffle interval in seconds"
              />
              <span className="text-[10px] text-wav-text-3 shrink-0">sec</span>
            </div>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Camera weight="regular" className="w-4 h-4 shrink-0" /> Save PNG — save the current frame as an 8K image shaped like your screen; the button opens the save and embed options, S saves right away</span><Kbd label="S" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Circle weight="regular" className="w-4 h-4 shrink-0" /> Record — capture video of the live animation; the button opens size and length</span><Kbd label="V" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Gif weight="regular" className="w-4 h-4 shrink-0" /> GIF — start/stop recording an animated GIF</span><Kbd label="Shift+S" /></p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Keyboard only</p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Play weight="regular" className="w-4 h-4 shrink-0" /><Stop weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Play / stop — start or stop all motion and audio reactivity</span><Kbd label="Space" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Rewind weight="regular" className="w-4 h-4 shrink-0" /><FastForward weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Slower / faster — adjust playback speed</span><Kbd label="[ / ]" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowClockwise weight="regular" className="w-4 h-4 shrink-0" /> Reverse — flip the rotation direction</span><Kbd label="D" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Eye weight="regular" className="w-4 h-4 shrink-0" /> Hide or show the control rail</span><Kbd label="H" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><EyeSlash weight="regular" className="w-4 h-4 shrink-0" /> Copy Display link — open it for live/projector output with no UI</span><Kbd label="Shift+P" /></p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Tabs</p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Gradient weight="regular" className="w-4 h-4 shrink-0" /> Gradient — choose the base pattern and tune its sliders</span><Kbd label="G" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><MagicWand weight="regular" className="w-4 h-4 shrink-0" /> Effects — layer on effects; toggle Multi to stack several at once</span><Kbd label="F" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><SpeakerHigh weight="regular" className="w-4 h-4 shrink-0" /> Audio — connect a microphone or audio file so the artwork reacts to sound</span><Kbd label="A" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Palette weight="regular" className="w-4 h-4 shrink-0" /> Color — pick, generate or extract a color palette</span><Kbd label="C" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><FloppyDisk weight="regular" className="w-4 h-4 shrink-0" /> Presets — save the current look by name and reload it anytime</span><Kbd label="P" /></p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Touch gestures</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              {TOUCH_GESTURES.map(([k, v]) => (
                <Fragment key={k}>
                  <span className="text-white font-medium whitespace-nowrap">{k}</span>
                  <span>{v}</span>
                </Fragment>
              ))}
            </div>
            <p className="text-xs text-wav-text-3">Flicks are quick, mostly horizontal swipes; slower sideways drags do nothing.</p>
            {motionSensorsSupported() && (
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-white font-medium">Motion</p>
                {([
                  { kind: 'shake' as const, label: 'Shake to Shuffle', on: shakeEnabled },
                  { kind: 'tilt' as const, label: 'Tilt to rotate', on: tiltEnabled },
                ]).map(m => (
                  <div key={m.kind} className="flex items-center justify-between gap-2">
                    <span>{m.label}</span>
                    <Switch on={m.on} onChange={() => toggleMotion(m.kind)} label={m.label} />
                  </div>
                ))}
                {motionDenied && <p className="text-xs text-wav-error">Motion access was blocked. Allow it in your browser settings, then try again.</p>}
                <p className="text-xs text-wav-text-3">Phones only. iPhones ask permission the first time. Tilt measures from how you hold the phone when you turn it on.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Arrows and keys</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              {KEY_GESTURES.map(([k, v]) => (
                <Fragment key={k}>
                  <span className="flex"><Kbd label={k} /></span>
                  <span>{v}</span>
                </Fragment>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">Randomizing</p>
            <p>Five ways to randomize, from smallest to biggest change:</p>
            <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Nudge</span> — a small drift in color, angle, and zoom. Never changes the gradient type or which effects are active.</span><Kbd label="W" /></p>
            <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Effects</span> — reshuffles which effects are active and their sliders. Gradient type and colors stay put.</span><Kbd label="Shift+F" /></p>
            <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Gradient</span> — reshuffles the gradient type and its sliders. Effects and colors stay put.</span><Kbd label="Shift+G" /></p>
            <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Shuffle Audio Controls</span> — reshuffles sensitivity, band multipliers, beat-sync toggles, and Modulation bindings (scoped to the current gradient and active effects). Gradient, effects, and colors stay put.</span><Kbd label="Shift+A" /></p>
            <p className="flex items-center justify-between gap-2"><span><span className="text-white font-semibold">Remix</span> — click Shuffle to randomize everything at once: gradient, colors, and effects.</span><Kbd label="Shift+W" /></p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-white">More shortcuts</p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowUUpLeft weight="regular" className="w-4 h-4 shrink-0" /><ArrowUUpRight weight="regular" className="w-4 h-4 shrink-0 -ml-1" /> Undo / redo — step backward or forward</span><Kbd label="⌘Z / ⌘⇧Z" /></p>
            <p className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ArrowsClockwise weight="regular" className="w-4 h-4 shrink-0" /> Reset to defaults</span><Kbd label="Shift+R" /></p>
            <p className="flex items-center justify-between gap-2"><span>On a touch screen: swipe left to Shuffle, right to Undo</span><Kbd label="← →" /></p>
            <p className="flex items-center justify-between gap-2"><span>Toggle Multi-FX mode</span><Kbd label="M" /></p>
            <p className="flex items-center justify-between gap-2"><span>Next / previous Look for the current gradient</span><Kbd label="L" /></p>
            <p className="flex items-center justify-between gap-2"><span>Close the active tab / this panel</span><Kbd label="Esc" /></p>
            <p className="flex items-center justify-between gap-2"><span>Toggle this cheat sheet</span><Kbd label="?" /></p>
            <p className="text-xs text-wav-text-3">Shortcuts are disabled while a text field is focused.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
