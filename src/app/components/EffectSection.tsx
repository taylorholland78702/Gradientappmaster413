import { createContext, useContext, useRef, useState } from 'react';
import { CaretDown, DotsSixVertical } from '@phosphor-icons/react';
import { ModCategoryCtx } from './LearnContext';
import { EFFECT_MOD_CATEGORY } from '../constants/effectRegistry';

// The order the active effects are applied in (the canvas runs them first to last), and how to move one. With several
// effects on, each panel shows in that order and has a handle to drag it, or to nudge it with the arrow keys.
export const EffectOrderCtx = createContext<{ order: readonly string[]; move: (id: string, to: number) => void } | null>(null);

export function EffectSection({ id, label, isMulti, expanded, onToggle, children }: {
  id: string; label: string; isMulti: boolean;
  expanded: boolean; onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const categories = EFFECT_MOD_CATEGORY[id] ?? [];
  const orderCtx = useContext(EffectOrderCtx);
  const rootRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  if (!isMulti) return <ModCategoryCtx.Provider value={categories}>{children}</ModCategoryCtx.Provider>;
  const position = orderCtx ? orderCtx.order.indexOf(id) : -1;

  // While the handle is held, the panel follows the pointer: it swaps places with each neighbour whose middle the
  // pointer has passed. The panels are laid out in the order they are applied, so their positions on screen give the
  // new place directly.
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragging || !orderCtx || !rootRef.current?.parentElement) return;
    const others = Array.from(rootRef.current.parentElement.querySelectorAll<HTMLElement>('[data-effect-section]')).filter(el => el !== rootRef.current);
    const target = others.filter(el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 < e.clientY; }).length;
    if (target !== position) orderCtx.move(id, target);
  };

  return (
    <ModCategoryCtx.Provider value={categories}>
    <div
      ref={rootRef}
      data-effect-section={id}
      style={position >= 0 ? { order: position } : undefined}
      className={`${orderCtx ? (position === orderCtx.order.length - 1 ? '' : 'border-b border-wav-line-strong') : 'border-b border-wav-line-strong last:border-0'} ${dragging ? 'bg-wav-hover' : ''}`}
    >
      <div className="flex items-center">
        {orderCtx && (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Move ${label} in the effect order`}
            title="Drag to change the order effects are applied in (or use the up and down arrow keys)"
            className="touch-none cursor-grab active:cursor-grabbing text-wav-text-3 hover:text-white shrink-0 px-0.5 py-2 outline-none focus-visible:text-white"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); }}
            onPointerMove={onDragMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') { e.preventDefault(); orderCtx.move(id, position - 1); }
              else if (e.key === 'ArrowDown') { e.preventDefault(); orderCtx.move(id, position + 1); }
            }}
          >
            <DotsSixVertical weight="bold" className="w-3.5 h-3.5" />
          </span>
        )}
        <button
          onClick={() => onToggle(id)}
          className="flex items-center justify-between flex-1 min-w-0 py-2.5 text-left bg-transparent outline-none hover:bg-transparent active:bg-transparent focus:outline-none appearance-none"
        >
          <span className="text-[10px] text-wav-text-2 font-medium">{label}</span>
          <CaretDown weight="regular" className={`w-4 h-4 text-wav-text-3 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && <div className="flex flex-col gap-2 pb-3">{children}</div>}
    </div>
    </ModCategoryCtx.Provider>
  );
}
