import { useContext, type ReactNode } from 'react';
import { useLearn, ModCategoryCtx, BAND_COLORS, BAND_LABELS } from './LearnContext';
import { resolveParam } from '../utils/modResolve';
import { percentRange, toPercent, fromPercent } from '../utils/sliderScale';

// One slider row for every panel: a fixed label column, a flexible track and a fixed value box, so
// tracks start at the same x and end at the same x whichever tab the row is in.
// A slider that moves in fractions shows 0-100 (see utils/sliderScale.ts); the value it reads and writes keeps its real units.
// Sizes: label 4.75rem (a long label wraps to two lines), value 3rem. Mobile sizing comes from .wav-mobile rules in index.css.
export function SliderRow({ label, title, param: paramProp, value, onChange, onNumberChange, min, max, step, children }: {
  label: ReactNode;
  title?: string;
  // The audio setting this slider drives, when its label cannot say so (the styled gradients' two shape sliders).
  param?: string;
  value: number;
  onChange: (value: number) => void;
  // For rows whose typed value is handled differently from a drag (clamped, or falling back to a default).
  onNumberChange?: (value: number) => void;
  // Extra control that sits after the value box (Duotone's randomise button).
  children?: ReactNode;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}) {
  const pct = percentRange(min, max, step);
  const shown = pct ? toPercent(value, pct) : value;
  const bounds = pct ? { min: 0, max: 100, step: 1 } : { min, max, step };
  const fromShown = (n: number) => (pct ? fromPercent(n, pct) : n);
  // Audio "learn" binding: while a band is being learned, touching this row binds its setting to the band.
  const learn = useLearn();
  const categories = useContext(ModCategoryCtx);
  const param = learn ? (paramProp ?? resolveParam(label, categories)) : null;
  const bound = param && learn ? learn.bindings.filter(b => b.param === param) : [];
  const learning = !!learn?.band;
  const onLearnTap = (e: React.SyntheticEvent) => {
    if (!learn || !learn.band) return;
    e.preventDefault(); e.stopPropagation();
    const name = typeof label === 'string' ? label.replace(/:$/, '') : 'This control';
    if (!param) { learn.setNotice(`${name} can't follow audio`); return; }
    const r = learn.toggle(param);
    learn.setNotice(r === 'added' ? `${name} now follows ${BAND_LABELS[learn.band]}` : `${name} no longer follows ${BAND_LABELS[learn.band]}`);
  };
  return (
    <div
      onPointerDownCapture={learning ? onLearnTap : undefined}
      onClickCapture={learning ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
      data-param={learn ? param ?? '' : undefined}
      className={`grid ${children ? 'grid-cols-[4.75rem_minmax(0,1fr)_3rem_auto]' : 'grid-cols-[4.75rem_minmax(0,1fr)_3rem]'} items-center gap-1 ${learning ? `cursor-pointer ${param ? 'outline outline-1 outline-[#a855f7]' : 'opacity-50'}` : ''}`} title={title}>
      <label className="text-[10px] text-white leading-[1.15]">
        {bound.map(b => <span key={b.id} aria-label={`Follows ${BAND_LABELS[b.band]}`} title={`Follows ${BAND_LABELS[b.band]}`} className="inline-block w-1.5 h-1.5 rounded-full mr-0.5 align-middle" style={{ background: BAND_COLORS[b.band] }} />)}
        {label}
      </label>
      <input
        type="range" min={bounds.min} max={bounds.max} step={bounds.step} value={shown}
        onChange={(e) => onChange(fromShown(Number(e.target.value)))}
        aria-label={typeof label === 'string' ? label.replace(/:$/, '') : undefined}
        className="w-full min-w-0"
      />
      <input
        type="number" min={bounds.min} max={bounds.max} step={bounds.step} value={shown}
        title={pct ? `Actual value ${Number(value.toFixed(4))}` : undefined}
        aria-label={typeof label === 'string' ? `${label.replace(/:$/, '')} value` : undefined}
        onChange={(e) => (onNumberChange ?? onChange)(fromShown(Number(e.target.value)))}
        className="wav-slider-value text-[10px] text-white w-full min-w-0 text-right bg-wav-field border border-wav-line rounded px-1"
      />
      {children}
    </div>
  );
}
