import { Infinity as InfinityIcon } from '@phosphor-icons/react';
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC, AUTO_SHUFFLE_SCOPES, type AutoShuffleScope } from '../constants/autoShuffle';
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
      <div className="flex gap-1" role="group" aria-label="What Auto Shuffle changes">
        {AUTO_SHUFFLE_SCOPES.map(o => (
          <button
            key={o.id}
            onClick={() => setAutoShuffleScope(o.id)}
            aria-pressed={autoShuffleScope === o.id}
            title={o.hint}
            className="flex-1 py-1 text-[10px] transition-all"
            style={autoShuffleScope === o.id
              ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 }
              : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
          >{o.label}</button>
        ))}
      </div>
      <div className="flex gap-1" role="group" aria-label="Auto Shuffle interval presets">
        {[5, 15, 60, 300].map(sec => (
          <button
            key={sec}
            onClick={() => setAutoShuffleIntervalSec(sec)}
            aria-pressed={autoShuffleIntervalSec === sec}
            className="flex-1 py-1 text-[10px] transition-all"
            style={autoShuffleIntervalSec === sec
              ? { backgroundColor: '#ffffff', color: '#000000', fontWeight: 700 }
              : { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
          >{formatAutoShuffleInterval(sec)}</button>
        ))}
      </div>
      <p className="text-[10px] text-white/50">Remix every {formatAutoShuffleInterval(autoShuffleIntervalSec)}</p>
  </>);
}
