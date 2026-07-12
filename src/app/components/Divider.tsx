import React from 'react';

// Thin hairline separator used between buttons in the icon row, VCR
// controls, and tab bar. `orientation="vertical"` stretches to fill the
// height of a flex row; `"horizontal"` spans the full width between rows.
export const Divider: React.FC<{ orientation?: 'vertical' | 'horizontal' }> = ({ orientation = 'vertical' }) => (
  <div
    className={
      orientation === 'vertical'
        ? 'w-px self-stretch bg-white/20 flex-shrink-0'
        : 'h-px w-full bg-white/20 flex-shrink-0'
    }
  />
);
