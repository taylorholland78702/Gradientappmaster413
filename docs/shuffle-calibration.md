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

## Session 7: the recalibrated score did not hold

Session 7 (30 looks, 18 kept, 6 loved) was the first marked with the session-6 score live, so it was a true test of it. It ranked
keeps above skips only 46% of the time (50% is chance) and loved above the rest 62%. Fitting weights to one session and
testing on the next had now failed twice (session 6 against the first fit, session 7 against the second).

Across sessions, how well each single measurement ranks kept looks above skipped ones (sessions 1-3 pooled / 6 / 7):

| measurement | 1-3 | 6 | 7 |
| --- | --- | --- | --- |
| detail | 0.69 | 0.65 | 0.60 |
| brightness spread (sd) | 0.60 | 0.54 | 0.46 |
| colourfulness | 0.33 | 0.70 | 0.44 |
| entropy | 0.60 | 0.42 | 0.39 |

Only detail pointed the same way every time. Colourfulness, contrast and entropy flip, so they are noise at this sample size.
Loved looks were darker in both sessions that had Love (mean 86 and 73 against 114 and 119).

So the frame score is now just `alive * (0.7 * detail + 0.3 * shadow)`: detail (up to 0.3, then falling off), plus how much of the
frame is not lit (dark-ground gradients keep their lit-share band), and zero for a frame with no brightness spread.
It ranks 60-69% on kept looks, a weak signal. `GOOD_ENOUGH` is 0.2, about the 35th percentile of all marked looks, so it only
triggers a retry for a poor roll and no longer shops among decent ones. What has held up is not the score: every look has at
least 3 effects, and the keep rate went from 43% to 60-87%.

## All 240 marks (sessions 1-8)

Kept 162 of 240 (67%), loved 20. Detail again ranks keeps above skips (kept 0.089 vs 0.044). Loved looks were darker (mean 87
vs 125, lit 0.66 vs 0.85), higher in contrast (sd 57 vs 41) and had more detail (0.12 vs 0.07).

- **The score works as a floor.** In the latest session (new score live) every look scoring under 0.2 was skipped (4 of 4) and none
  of the kept looks scored that low.
- **Effects.** Loved at a rate far above the 8% average: ascii 6 of 14, halftone 4 of 13. Kept every time: kaleidoscope 13 of 13,
  emoji 16 of 16, gesso 6 of 6; crt 14 of 15, mirror 22 of 26, grain 48 of 57. Weakest: grid-effect 1 of 5, vhs 14 of 26, slit-scan
  6 of 11. The taste table now favours ascii and halftone more (+2 on pattern and dark-ground gradients), no longer marks down emoji or
  kaleidoscope there, and no longer favours vhs.
- **Variety.** Without learning, 3000 simulated shuffles spread evenly over all 46 gradients (2.2% each; the most common was 2.9%),
  yet radial-burst and grid were 17% each of the marked looks. The cause is not the taste table. The code path that still read
  saved ratings from the old 1-10 rating feature (`gradientRatings` in the browser, which nothing writes any more) steered up to
  60% of shuffles toward the gradients, effects and palettes of those old ratings, with fast random speeds and sometimes no
  effects. It is switched off. Check with `JSON.parse(localStorage.gradientRatings || '[]').length` in the console.
- **Palettes and speed** have no data yet: the session was marked before the speed and palette fields were live.

## Session 9 (first with speed and palette)

30 looks, 20 kept, 7 loved; the score ranked keeps above skips 71% (it is only used as a floor now).

- **Speed and palette** (30 looks only, so weak): looks at medium speeds (2-4) were loved 4 of 10 times against 1 of 12 at fast speeds
  (5+), though fast ones were kept more often (75% vs 60%). High-contrast palettes were loved 4 of 11 times (36%) against low-contrast 3 of 19
  (16%). Nothing here is enough to change speeds or palettes yet; another 60 or so looks would be.
- **vhs and slit-scan** were the weak effects again (vhs kept 1 of 6 this session, 15 of 32 overall; slit-scan 7 of 14), so they are
  marked down on every kind of gradient.
- **Variety.** Grid, radial-burst and shapes were still half of this session. In a fresh profile, 45 real shuffles through the app
  (quality gate included) gave 31 different gradients with the top three at 18% of looks, so neither the taste table nor the quality
  gate is the cause. It has to be something in your browser: saved ratings from the old rating feature (switched off in the previous
  release), or what Shuffle has learned from your votes. Check the saved ratings with
  `JSON.parse(localStorage.gradientRatings || '[]').length` in the console, and make sure the page was reloaded after that release.
- **Bug: "Mark 15 more" did nothing**, because it restarted the session without starting the next shuffle or hiding the results,
  and would have counted from zero. It now extends the same session and shuffles the next look.

## Sessions 9-10 (speed, palette, and variety confirmed)

- **Variety is fixed.** Switching off the saved ratings from the old rating feature worked: in the session after it, the 30 looks covered
  20 different gradients with no grid, radial-burst or shapes at all (the session before: those three were half of the looks). Loves
  rose from about 6 of 30 to 8 of 30.
- **Speed** (60 looks that recorded it): looks at medium speeds (2-4) were loved 10 of 24 times (42%), slow (1 or less) 4 of 22 (18%), fast (5+)
  1 of 14 (7%), though fast ones were kept most often (71%): fine to look at, rarely a favourite. Mood speeds now sit mostly in 2-4
  (calm, soft, cinematic from 0.5-2 to 1-3; dense 2-4; glitchy no longer reaches 10).
- **Palette** (same 60): high-contrast palettes (lightest to darkest colour far apart) were loved 12 of 36 times (33%), low-contrast 3 of 24 (13%);
  light palettes 1 of 10. The palette scorer already rewards a wide brightness range as its main term, so nothing changes there.
- mirror was loved 10 of 38 times (26%, the second best after ascii and halftone) so it is no longer marked down on pattern gradients.
