import type { ComponentProps, RefObject } from 'react';
import { Camera, Infinity as InfinityIcon } from '@phosphor-icons/react';
import { PopoverPortal, type PopoverAnchor } from './PopoverPortal';
import { ExportPopout } from './ExportPopout';
import { AutoShufflePopout } from './AutoShufflePopout';

type ExportProps = Omit<ComponentProps<typeof ExportPopout>, 'isMobile' | 'closePopover'>;

// The rail's popouts (Auto Shuffle, Save & share) rendered through one portal, so opening one from
// either rail layout never produces two copies. Moved out of InteractiveGradient unchanged.
export function RailPopouts({ mode, anchor, popoverRef, isMobile, setAnchor, exportProps, autoShuffleProps }: {
  mode: 'autoShuffle' | 'export';
  anchor: PopoverAnchor | null;
  popoverRef: RefObject<HTMLDivElement>;
  isMobile: boolean;
  setAnchor: (anchor: PopoverAnchor | null) => void;
  exportProps: ExportProps;
  autoShuffleProps: ComponentProps<typeof AutoShufflePopout>;
}) {
  if (!anchor) return null;
  const closePopover = () => setAnchor(null);
  const iconCls = 'w-4 h-4 shrink-0';
  const popout = {
    export: {
      title: 'Save & share',
      icon: <Camera weight="regular" className={iconCls} />,
      body: <ExportPopout isMobile={isMobile} closePopover={closePopover} {...exportProps} />,
    },
    autoShuffle: {
      title: 'Auto Shuffle',
      icon: <InfinityIcon weight="regular" className={iconCls} />,
      body: <AutoShufflePopout {...autoShuffleProps} />,
    },
  }[mode];
  return (
    <PopoverPortal anchor={anchor} popoverRef={popoverRef} isMobile={isMobile} title={popout.title} icon={popout.icon}>
      {popout.body}
    </PopoverPortal>
  );
}
