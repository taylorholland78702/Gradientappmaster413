import { Switch } from './Switch';
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC, AUTO_SHUFFLE_SCOPES, type AutoShuffleScope } from '../constants/autoShuffle';
import { ChoiceChips } from './choice';
import { autoShuffleSliderMax, autoShuffleSecToSlider, autoShuffleSliderToSec } from '../utils/autoShuffle';

// The Auto Shuffle popout: on/off, interval slider and what to change.
export function AutoShufflePopout({
  isAutoShuffleOn, setIsAutoShuffleOn, autoShuffleIntervalSec, setAutoShuffleIntervalSec,
  autoShuffleScope, setAutoShuffleScope,
}: {
  isAutoShuffleOn: boolean; setIsAutoShuffleOn: (updater: (prev: boolean) => boolean) => void;
  autoShuffleIntervalSec: number; setAutoShuffleIntervalSec: (sec: number) => void;
  autoShuffleScope: AutoShuffleScope; setAutoShuffleScope: (scope: AutoShuffleScope) => void;
}) {
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
