import { Infinity as InfinityIcon } from '@phosphor-icons/react';
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC, AUTO_SHUFFLE_SCOPES, type AutoShuffleScope } from '../constants/autoShuffle';
import { ChoiceChips } from './choice';
import { autoShuffleSliderMax, autoShuffleSecToSlider, autoShuffleSliderToSec, formatAutoShuffleInterval } from '../utils/autoShuffle';

// The Auto Shuffle popout: on/off, interval slider, what to change, and quick interval presets.
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
        <span className="text-xs flex items-center gap-2 text-white"><InfinityIcon weight="regular" className="w-4 h-4 shrink-0" /> Auto Shuffle</span>
        <button
          onClick={() => setIsAutoShuffleOn(prev => !prev)}
          aria-pressed={isAutoShuffleOn}
          aria-label={isAutoShuffleOn ? 'Turn off Auto Shuffle' : 'Turn on Auto Shuffle'}
          className="relative inline-flex w-8 h-[18px] rounded-full transition-colors shrink-0"
          style={{ backgroundColor: isAutoShuffleOn ? '#ffffff' : 'rgba(255, 255, 255, 0.15)' }}
        >
          <span
            className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-transform"
            style={{ backgroundColor: isAutoShuffleOn ? '#000000' : '#ffffff', transform: isAutoShuffleOn ? 'translateX(18px)' : 'translateX(2px)' }}
          />
        </button>
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
          className="text-[10px] w-12 text-right rounded px-1 text-white"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
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
      <p className="text-[10px] text-white/50">Remix every {formatAutoShuffleInterval(autoShuffleIntervalSec)}</p>
  </>);
}
