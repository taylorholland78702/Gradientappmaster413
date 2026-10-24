// The one on/off control for binary settings (chips are for choosing between modes).
// SwitchTrack is the drawing; Switch is a button around it. Pass `label` for assistive tech.

export function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors shrink-0 ${on ? 'bg-white' : 'bg-wav-hover'}`}>
      <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-transform ${on ? 'bg-black translate-x-[18px]' : 'bg-white translate-x-[2px]'}`} />
    </span>
  );
}

export function Switch({ on, onChange, label, title }: {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      aria-label={label}
      title={title}
      className="relative wav-hit shrink-0"
    >
      <SwitchTrack on={on} />
    </button>
  );
}
