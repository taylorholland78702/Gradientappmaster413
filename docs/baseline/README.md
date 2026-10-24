# Visual baseline

Contact sheets of every gradient and effect, rendered with a fixed palette, so there is a before/after image whenever a shader or effect changes.

- `gradients.jpg` — every gradient on the fixed palette (`#2b1055 #7597de #ff5e7e #ffd166`).
- `effects.jpg` — every effect on the Mesh gradient.
- `baseline.json` — average brightness, contrast and colour per item, used by the check.

## Use

```sh
npm run dev                 # one terminal
npm run baseline            # re-render and overwrite the sheets (do this when a change is intentional)
npm run baseline:check      # re-render and compare against baseline.json
```

The check prints items that went flat, or whose average colour moved a lot, and writes the new sheets to `/tmp/baseline-check/` so you can compare by eye. Animated gradients are captured at whatever moment the page reaches, so small differences are normal; only large ones fail the check. It needs Playwright (`npx playwright install chromium`). `BASE_URL` points it at another server; `SETTLE_MS` is how long each item renders first.

## Reading the sheets

- **Attractor, Particles, Reaction-Diffusion** are sparse by design: a few dots or a faint pattern on a dark ground. Reaction-Diffusion needs several seconds to grow.
- **Ribbon, Strands, Waves** are thin-line gradients and read nearly black at thumbnail size. They are not blank.
- **Windmill** and **Hatch** are low-contrast at this palette.
