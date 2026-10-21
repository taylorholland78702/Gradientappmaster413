import { describe, it, expect } from 'vitest';
import { EFFECT_LOOKS } from './effectLooks';
import { EFFECTS_UI_LIST as EFFECT_IDS } from './effectRegistry';
import { totalCost, MULTI_FX_COST_BUDGET } from './effectCost';

describe('effect looks', () => {
  it('only name real effects and fit the Multi-FX cost budget', () => {
    for (const look of EFFECT_LOOKS) {
      for (const e of look.effects) expect(EFFECT_IDS, `${look.name}/${e}`).toContain(e);
      expect(totalCost(look.effects), look.name).toBeLessThanOrEqual(MULTI_FX_COST_BUDGET);
    }
  });
});
