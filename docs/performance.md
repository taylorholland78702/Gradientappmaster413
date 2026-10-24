# Performance notes

What was measured, what changed, and what still needs a real device.

## Measured here

Only a software renderer (SwiftShader) is available in the sandbox, so GPU timings are relative, not real. CPU effects can be measured fairly, and were.

### Oil Paint (`hooks/effects/oilPaintPixels.ts`)

The mode filter rescanned the whole window for every pixel (O(radius²) per pixel). It now slides the window along each row, adding one column and removing one (O(radius) per pixel). The output is bit-for-bit the same as the old code; a test compares them on random images, including edge clamping and the drifting window offset.

| radius | before | after | |
|---|---|---|---|
| 3 | 64 ms | 20 ms | 3.2x |
| 6 | 195 ms | 20 ms | 10x |
| 10 | 490 ms | 27 ms | 18x |

420×262 working size (the effect's own cap), 8 levels, Node. The same function runs in the Worker.

### Slit-Scan (`hooks/effects/slitScanSampling.ts`)

Radial and circular modes did a `sqrt`, `atan2`, `sin` and `cos` per pixel per frame, although the result depends only on the settings and canvas size. That is now a lookup table built when those change, and each frame is a gather of 32-bit pixels. Output is identical (tested against the old loops for all four directions and several buffer lengths).

| mode | per frame before | after | |
|---|---|---|---|
| radial, 1280×720 | 85 ms | 10 ms | 8x |

The table is rebuilt only when direction, size, intensity or the buffer geometry changes; radial and circular keep their table while the frame buffer is still filling.

### In the browser (software GL, relative)

| | before | after | idle pipeline |
|---|---|---|---|
| Slit-Scan | 5.2 fps | 9.0 fps | 9.9 fps |
| Oil Paint | 6.1 fps | 8.1 fps | 9.9 fps |

Both are now close to the cost of drawing nothing; what remains is the renderer's own `drawImage`.

## Changed but not measurable here

**Embers, Bokeh, Strands** (and Waves, Spectral, Nebula, Prism) are fragment-shader bound. In SwiftShader they run at 0.6–1.6 fps, which says only that they are the costliest, not what a phone GPU does. Two changes, both only active when frames are slow:

- They join the heavy-gradient list, which caps the render at 2.6 M pixels instead of 4.2 M on very large screens (a Retina laptop's full window). On ordinary screens nothing changes.
- The slowest gradients (those plus Raindrops, Iridescent, Glass, Contour, Ring) get two emergency steps in the adaptive quality controller: if frames are still over budget after the existing steps, the render drops to 75% and then 60% of the display's native size and is stretched. Frames recovering brings it back up step by step. Normal gradients keep their old floor.

## To check on real hardware

- A mid-range Android phone and an older iPhone: Embers, Bokeh, Strands, Slit-Scan, Oil Paint. Watch whether the emergency steps engage, how soon, and whether the softness is noticeable.
- Whether the 2.6 M cap is visible on a 5K display.
- Chrome's Performance panel on a low-end laptop for the CPU effects.
