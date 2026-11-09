import { Switch } from './Switch';
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC, AUTO_SHUFFLE_SCOPES, type AutoShuffleScope } from '../constants/autoShuffle';
import { ChoiceChips } from './choice';
import { REDUCED_FLASH_MAX_INTENSITY } from '../hooks/useShuffleIntensity';
import { autoShuffleSliderMax, autoShuffleSecToSlider, autoShuffleSliderToSec } from '../utils/autoShuffle';

// The Shuffle popout: how calm or wild every shuffle runs, then Auto Shuffle (on/off, interval slider and what to change).
// Intensity applies to the Shuffle buttons and to Auto Shuffle alike.
const INTENSITY_PRESETS = [
  { id: 0.2, label: 'Calm', title: 'Slow, quiet looks with few effects' },
  { id: 0.5, label: 'Lively', title: 'The usual mix' },
  { id: 0.85, label: 'Wild', title: 'Fast, busy looks with many effects' },
] as const;

const intensityName = (v: number) => (v < 0.34 ? 'Calm' : v < 0.67 ? 'Lively' : 'Wild');

export function AutoShufflePopout({
  isAutoShuffleOn, setIsAutoShuffleOn, autoShuffleIntervalSec, setAutoShuffleIntervalSec,
  autoShuffleScope, setAutoShuffleScope, shuffleIntensity, setShuffleIntensity, reduceFlash,
}: {
  isAutoShuffleOn: boolean; setIsAutoShuffleOn: (updater: (prev: boolean) => boolean) => void;
  autoShuffleIntervalSec: number; setAutoShuffleIntervalSec: (sec: number) => void;
  autoShuffleScope: AutoShuffleScope; setAutoShuffleScope: (scope: AutoShuffleScope) => void;
  shuffleIntensity: number; setShuffleIntensity: (v: number) => void;
  reduceFlash: boolean;
}) {
  const preset = INTENSITY_PRESETS.find(p => Math.abs(p.id - shuffleIntensity) < 0.08)?.id ?? -1;
  return (<>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-wav-text-2">Intensity</span>
          <span className="text-[10px] text-white">{intensityName(shuffleIntensity)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(shuffleIntensity * 100)}
          onChange={(e) => setShuffleIntensity(Number(e.target.value) / 100)}
          className="w-full"
          aria-label="Shuffle intensity"
        />
        <ChoiceChips
          ariaLabel="Shuffle intensity presets"
          options={INTENSITY_PRESETS.map(p => ({ id: p.id as number, label: p.label, title: p.title }))}
          value={preset}
          onChange={setShuffleIntensity}
        />
        <span className="text-[10px] text-wav-text-3">
          How fast, busy and bold every Shuffle runs, including Auto Shuffle.
          {reduceFlash && shuffleIntensity > REDUCED_FLASH_MAX_INTENSITY ? ' Held back while Reduce flashing is on.' : ''}
        </span>
      </div>
      <div className="h-px bg-wav-line-strong" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-wav-text-2">Remix automatically</span>
        <Switch on={isAutoShuffleOn} onChange={on => setIsAutoShuffleOn(() => on)} label={isAutoShuffleOn ? 'Turn off Auto Shuffle' : 'Turn on Auto Shuffle'} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={autoShuffleSliderMax}
          value={autoShuffleSecToSlider(autoShuffleIntervalSec)}
          onChange={(e) => setAutoShuffleIntervalSec(autoShuffleSliderToSec(Number(e.target.value)))}
          className="flex-1"
          aria-label="Auto Shuffle interval"
        />
        <label className="wav-slider-value flex items-center gap-1 text-[10px] rounded px-1 text-white bg-wav-field border border-wav-line">
          <input
            type="number"
            min={AUTO_SHUFFLE_MIN_SEC}
            max={AUTO_SHUFFLE_MAX_SEC}
            value={autoShuffleIntervalSec}
            onChange={(e) => setAutoShuffleIntervalSec(Number(e.target.value))}
            className="w-9 text-right bg-transparent text-white outline-none"
            aria-label="Auto Shuffle interval in seconds"
          />
          <span className="text-wav-text-2">sec</span>
        </label>
      </div>
      <ChoiceChips
        ariaLabel="What Auto Shuffle changes"
        options={AUTO_SHUFFLE_SCOPES.map(o => ({ id: o.id, label: o.label, title: o.hint }))}
        value={autoShuffleScope}
        onChange={setAutoShuffleScope}
      />
  </>);
}
