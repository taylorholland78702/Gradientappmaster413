// Matches ControlDrawer's desktop scale, so popouts read at the same type size as the tabs.
export const POPOVER_SCALE = 1.3;

export type AutoShuffleScope = 'all' | 'gradient' | 'effects' | 'colors';
export const AUTO_SHUFFLE_SCOPES: { id: AutoShuffleScope; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'A full remix each time' },
  { id: 'gradient', label: 'Gradient', hint: 'Only swap the gradient' },
  { id: 'effects', label: 'Effects', hint: 'Only reshuffle the effects' },
  { id: 'colors', label: 'Colors', hint: 'Only roll a new palette' },
];
