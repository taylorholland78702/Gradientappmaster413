import type { ComponentProps, RefObject } from 'react';
import { Camera, Circle, Infinity as InfinityIcon } from '@phosphor-icons/react';
import { PopoverPortal, type PopoverAnchor } from './PopoverPortal';
import { ExportPopout } from './ExportPopout';
import { RecordPopout } from './RecordPopout';
import { AutoShufflePopout } from './AutoShufflePopout';

type ExportProps = Omit<ComponentProps<typeof ExportPopout>, 'isMobile' | 'closePopover'>;
type RecordProps = Omit<ComponentProps<typeof RecordPopout>, 'startVideoTake'> & { startVideoTake: () => void };

// The rail's popouts (Auto Shuffle, Save & share, Record) rendered through one portal, so opening one from
// either rail layout never produces two copies. Moved out of InteractiveGradient unchanged.
export function RailPopouts({ mode, anchor, popoverRef, isMobile, setAnchor, exportProps, recordProps, autoShuffleProps }: {
  mode: 'autoShuffle' | 'export' | 'record';
  anchor: PopoverAnchor | null;
  popoverRef: RefObject<HTMLDivElement>;
  isMobile: boolean;
  setAnchor: (anchor: PopoverAnchor | null) => void;
  exportProps: ExportProps;
  recordProps: RecordProps;
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
    record: {
      title: 'Record video',
      icon: <Circle weight="regular" className={iconCls} />,
      body: <RecordPopout {...recordProps} startVideoTake={() => { recordProps.startVideoTake(); closePopover(); }} />,
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
