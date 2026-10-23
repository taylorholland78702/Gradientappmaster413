import { CaretDown } from '@phosphor-icons/react';

export function EffectSection({ id, label, isMulti, expanded, onToggle, children }: {
  id: string; label: string; isMulti: boolean;
  expanded: boolean; onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  if (!isMulti) return <>{children}</>;
  return (
    <div className="border-b border-white/50 last:border-0">
      <button
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full py-2.5 text-left bg-transparent outline-none hover:bg-transparent active:bg-transparent focus:outline-none appearance-none"
      >
        <span className="text-[10px] text-white/80 font-medium">{label}</span>
        <CaretDown weight="regular" className={`w-4 h-4 text-white/40 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && <div className="flex flex-col gap-2 pb-3">{children}</div>}
    </div>
  );
}
