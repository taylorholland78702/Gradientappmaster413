import type { ReactNode } from 'react';

// Single-choice buttons. Two looks only: chips (this file) for up to about six options, and the
// hairline grid for long lists (Gradients, Effects). Both share .wav-choice for height, so the whole
// app has one control height (24px desktop, 44px mobile; see index.css).
//
// Chips are square, 10px text, a black 25% resting fill and a white selected fill with black bold text.

/** Class string for one chip. `layout` carries only placement (flex-1, shrink-0, min-w-0, ...). */
export const choice = (active: boolean, layout = '') =>
  `wav-choice px-1.5 text-[10px] transition-all ${layout} ${active ? 'bg-white text-black font-bold' : 'bg-wav-field text-white hover:bg-wav-hover'}`.replace(/\s+/g, ' ').trim();

export interface ChoiceOption<T extends string | number> {
  id: T;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
}

/** A row of chips where exactly one option is selected. */
export function ChoiceChips<T extends string | number>({ options, value, onChange, ariaLabel, disabled, grow = true }: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Chips share the row (default). Turn off for chips that keep their own width. */
  grow?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={ariaLabel}>
      {options.map(o => (
        <button
          key={String(o.id)}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          title={o.title}
          disabled={disabled || o.disabled}
          className={`${choice(value === o.id, `${grow ? 'flex-auto' : ''} whitespace-nowrap`)} disabled:opacity-50`}
        >{o.label}</button>
      ))}
    </div>
  );
}
