// Small pill showing a hotkey label, used in the About/Info panel's shortcut list
export function Kbd({ label }: { label: string }) {
  return (
    <span className="shrink-0 text-[10px] text-wav-text-2 bg-wav-hover border border-wav-line rounded px-1.5 py-0.5 font-mono">
      {label}
    </span>
  );
}
