import { useState } from 'react';
import { ClockCounterClockwise } from '@phosphor-icons/react';

export interface FilmstripLook { index: number; thumb: string | null }

const KEY = 'wavFilmstripOpen';
const readOpen = (): boolean => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } };

// The last few looks as small pictures along the bottom of the canvas, oldest to newest, ending with the one on screen.
// Pressing one goes back to it in a single step (redo walks forward again), instead of undoing one look at a time.
export function LookFilmstrip({ looks, nowThumb, onJump, isMobile }: {
  looks: FilmstripLook[];
  nowThumb: string | null;
  onJump: (index: number) => void;
  isMobile: boolean;
}) {
  const [open, setOpenState] = useState(readOpen);
  const setOpen = (v: boolean) => { setOpenState(v); try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* not saved */ } };
  if (looks.length === 0) return null;
  const thumbCls = 'h-[30px] w-[48px] shrink-0 object-cover rounded-[3px] border border-wav-line-strong bg-wav-field';
  return (
    <div
      role="group"
      aria-label="Recent looks"
      className="fixed z-[20] flex items-center gap-1 px-1.5 py-1 rounded-[8px] bg-wav-surface backdrop-blur-md border border-wav-line-strong max-w-[calc(100vw-16px)] overflow-x-auto"
      style={isMobile
        ? { left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)' }
        : { left: 'calc(50% + 30px)', transform: 'translateX(-50%)', bottom: 12 }}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-pressed={open}
        aria-label={open ? 'Hide recent looks' : 'Show recent looks'}
        title={open ? 'Hide recent looks' : 'Recent looks'}
        className="wav-choice w-7 h-[30px] flex items-center justify-center shrink-0 text-white hover:bg-wav-hover"
      >
        <ClockCounterClockwise weight="regular" className="w-4 h-4" />
      </button>
      {open && looks.map((l, i) => (
        <button
          key={l.index}
          onClick={() => onJump(l.index)}
          title={`Go back ${looks.length - i} look${looks.length - i === 1 ? '' : 's'}`}
          aria-label={`Go back ${looks.length - i} look${looks.length - i === 1 ? '' : 's'}`}
          className="p-0 shrink-0 opacity-80 hover:opacity-100 focus-visible:opacity-100"
        >
          {l.thumb ? <img src={l.thumb} alt="" draggable={false} className={thumbCls} /> : <span className={`${thumbCls} block`} />}
        </button>
      ))}
      {open && (
        <span className="shrink-0 block rounded-[5px] border-2 border-white" aria-label="The look on screen now" title="On screen now">
          {nowThumb ? <img src={nowThumb} alt="" draggable={false} className={thumbCls} /> : <span className={`${thumbCls} block`} />}
        </span>
      )}
    </div>
  );
}
