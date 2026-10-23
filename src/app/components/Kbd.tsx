// Small pill showing a hotkey label, used in the About/Info panel's shortcut list
export function Kbd({ label }: { label: string }) {
  return (
    <span className="shrink-0 text-[10px] text-white/70 bg-white/10 border border-white/15 rounded px-1.5 py-0.5 font-mono">
      {label}
    </span>
  );
}
