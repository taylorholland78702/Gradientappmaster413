import { Switch } from './Switch';
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC, AUTO_SHUFFLE_SCOPES, type AutoShuffleScope } from '../constants/autoShuffle';
import { ChoiceChips } from './choice';
import { MOODS } from '../constants/shuffleTaste';
import { shuffleLearning } from '../utils/shuffleLearning';
import { setShuffleMood, useShuffleMood, type MoodChoice } from '../utils/shuffleMood';
import { autoShuffleSliderMax, autoShuffleSecToSlider, autoShuffleSliderToSec, formatAutoShuffleInterval } from '../utils/autoShuffle';

const MOOD_HINTS: Record<string, string> = {
  calm: 'Slow, gentle, few effects', soft: 'Slow, hazy, no heavy effects', cinematic: 'Even pace, vignette, grain and glow',
  bold: 'Faster, stronger effects, symmetry', dense: 'Busier, larger pattern scale', glitchy: 'Fast, broken-signal effects',
};

// The Auto Shuffle popout: on/off, interval slider, what to change, and quick interval presets.
export function AutoShufflePopout({
  isAutoShuffleOn, setIsAutoShuffleOn, autoShuffleIntervalSec, setAutoShuffleIntervalSec,
  autoShuffleScope, setAutoShuffleScope,
}: {
  isAutoShuffleOn: boolean; setIsAutoShuffleOn: (updater: (prev: boolean) => boolean) => void;
  autoShuffleIntervalSec: number; setAutoShuffleIntervalSec: (sec: number) => void;
  autoShuffleScope: AutoShuffleScope; setAutoShuffleScope: (scope: AutoShuffleScope) => void;
}) {
  const mood = useShuffleMood();
  return (<>
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
        <input
          type="number"
          min={AUTO_SHUFFLE_MIN_SEC}
          max={AUTO_SHUFFLE_MAX_SEC}
          value={autoShuffleIntervalSec}
          onChange={(e) => setAutoShuffleIntervalSec(Number(e.target.value))}
          className="wav-slider-value text-[10px] w-12 text-right rounded px-1 text-white bg-wav-field border border-wav-line"
          aria-label="Auto Shuffle interval in seconds"
        />
      </div>
      <ChoiceChips
        ariaLabel="What Auto Shuffle changes"
        options={AUTO_SHUFFLE_SCOPES.map(o => ({ id: o.id, label: o.label, title: o.hint }))}
        value={autoShuffleScope}
        onChange={setAutoShuffleScope}
      />
      <ChoiceChips
        ariaLabel="Auto Shuffle interval presets"
        options={[5, 15, 60, 300].map(sec => ({ id: sec, label: formatAutoShuffleInterval(sec) }))}
        value={autoShuffleIntervalSec}
        onChange={setAutoShuffleIntervalSec}
      />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-wav-text-2">Shuffle mood</span>
        <ChoiceChips
          ariaLabel="Shuffle mood"
          options={[{ id: 'any' as MoodChoice, label: 'Any', title: 'Each shuffle picks its own mood' }, ...MOODS.map(m => ({ id: m.id as MoodChoice, label: m.id[0].toUpperCase() + m.id.slice(1), title: MOOD_HINTS[m.id] }))]}
          value={mood}
          onChange={setShuffleMood}
        />
        <button
          onClick={() => shuffleLearning.clear()}
          className="self-start text-[10px] text-wav-text-3 hover:text-white transition-all"
          title="Shuffle leans toward what you keep and away from what you undo straight away. This forgets that."
        >Forget what Shuffle learned</button>
      </div>
      <p className="text-[10px] text-wav-text-3">Remix every {formatAutoShuffleInterval(autoShuffleIntervalSec)}</p>
  </>);
}
