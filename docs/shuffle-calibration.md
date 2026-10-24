# Shuffle calibration from marked looks

Two marking sessions of 30 looks each (60 in all; 28 kept, 32 skipped).

## What the marks showed

- The old frame score ranked keeps above skips 35% and 39% of the time (50% is chance): mildly backwards.
- Looks with no effects at all: kept 1 of 16. Looks with effects: kept 27 of 44. The full-random path always adds at least
  2 effects, so the empty ones most likely came from the rated-results blend path, which could end with none; it now tops up
  to 2.
- Kept looks had more detail (0.053-0.083 vs 0.032-0.040), a little more brightness spread, and clearly less colourfulness
  (0.70-0.90 vs 1.05-1.21). The old score capped colourfulness at 0.55, so it rewarded saturation, and it also rewarded a fully
  lit frame (kept looks were slightly less lit).
- Seen so far: grid kept 1 of 12; windmill 2 of 6 and radial 3 of 10 (mostly effect-less ones); grain kept 10 of 11. Effects like
  shift, bloom, vignette, mirror are kept about 60-75%. Moods are too mixed to read yet. These are not yet in the taste table:
  the learner already adjusts the odds per browser from the same marks.

## The new score

`scoreFrame` is now 0.25 contrast + 0.25 detail (falling off above 0.2, which reads as noise) + 0.1 brightness richness +
0.4 colour, where colour is best at a touch (0.15) and falls to 0 at 1.8, and counts only for frames with some brightness spread.
Dark-ground gradients mix in a lit-share term at 15%.

Fitted on session 1 and tested on session 2 the weights ranked keeps above skips 69-71%; fitted the other way round, 74%. On all
60 looks: 70% (73% and 71% per session). The first attempt, fitted on session 1 only, scored 68% there but only 54% on session 2,
which is why the weights were refit on both. Expect somewhat less on new looks; mark another batch to check.

`GOOD_ENOUGH` moved from 0.62 to 0.5 because the scale shifted: about half of the marked looks score below it, so a poor roll is
retried and a decent one is accepted straight away.

## Third session (held out)

A third session of 30 (19 kept) was marked while the page was still running the old score (its recorded scores are on the old scale,
and its AUC was 40%), which made it an untouched test of the new one: **the new score ranks it 72%** (70-73% on the first two).
Across all 90 looks it ranks 72%. Detail is the single best feature (77% on this session, 69% over all 90); colourfulness
is the best inverted (low colour preferred).

Number of effects and how often the look was kept (90 looks): 0 effects 2 of 21, 1 effect 4 of 15, 2 effects 21 of 31,
3 effects 14 of 15, 4-5 effects 6 of 8. So the floor is now 3 effects (2 on gradients that take at most 2; the rated-results blend
tops up to the same).

## Sessions 4-6 (every look has at least 3 effects; session 6 has Love)

- Sessions 4 and 5: 52 of 60 looks kept. Session 6: 20 of 30 kept, 7 loved.
- The colour penalty did not hold. In sessions 1-3 colourful looks were skipped more (the effect-less looks, always
  smooth and colourful, drove that). In session 6, with effects everywhere, the kept looks were *more* colourful
  (0.66 vs 0.51). So the score no longer uses colourfulness, and on session 6 the previous score ranked keeps above skips only
  44% of the time (chance is 50%).
- What set the loved looks apart: more detail (0.17 vs 0.09), more contrast (sd 63 vs 44), fewer lit pixels (0.56 vs 0.77),
  darker (mean 86 vs 114). Five of the seven loved looks used ascii or halftone, and ascii was kept 5 of 5, halftone 4 of 4.
  The taste table had both at -1 for most gradients; it is now +1 for pattern and dark-ground gradients.
- New score: 0.4 contrast + 0.4 detail (up to 0.3, then falling off) + 0.1 brightness richness + 0.1 for shadow (dark-ground
  gradients keep the lit-share band). On sessions 1-3 it ranks keeps above skips 67%, on session 6 62%, and the loved looks
  above the rest 80% of the time. This is fitted to those sessions, so it is optimistic; more Love marks will tell.
- GOOD_ENOUGH is 0.45, about the median of all marked looks.
