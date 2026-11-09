import { ChoiceChips } from './choice';
import { REDUCED_FLASH_MAX_INTENSITY } from '../hooks/useShuffleIntensity';

// The Shuffle intensity popout: how calm or wild every shuffle runs. It applies to the Shuffle buttons and to Auto Shuffle alike.
export const INTENSITY_PRESETS = [
  { id: 0.2, label: 'Calm', title: 'Slow, quiet looks with few effects' },
  { id: 0.5, label: 'Lively', title: 'The usual mix' },
  { id: 0.85, label: 'Wild', title: 'Fast, busy looks with many effects' },
] as const;

export const intensityName = (v: number) => (v < 0.34 ? 'Calm' : v < 0.67 ? 'Lively' : 'Wild');

export function IntensityPopout({ shuffleIntensity, setShuffleIntensity, reduceFlash }: {
  shuffleIntensity: number; setShuffleIntensity: (v: number) => void;
  reduceFlash: boolean;
}) {
  const preset = INTENSITY_PRESETS.find(p => Math.abs(p.id - shuffleIntensity) < 0.08)?.id ?? -1;
  return (<>
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
  </>);
}
