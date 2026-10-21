// Gradient render smoke test. Open the app (npm run dev), open the browser
// console, paste this file, and read the result. It opens the Gradients tab,
// selects each gradient in turn, and reports the brightness range of the canvas
// (max - min luminance over a 48x48 downscale). A gradient near 0 is rendering
// flat — a failed shader, a wrong clear color, or a pipeline that never drew.
// Fade and Windmill legitimately read low at their defaults; anything else
// under ~6 is worth a look.
(async () => {
  const sleep = (t) => new Promise((r) => setTimeout(r, t));
  const rows = () => [...document.querySelectorAll('button[aria-pressed]')].filter((b) => b.className.includes('whitespace-nowrap'));
  if (rows().length === 0) { document.querySelector('button[aria-label="Gradient tab"]')?.click(); await sleep(500); }
  const names = rows().map((b) => b.textContent);
  const result = {};
  for (const name of names) {
    rows().find((b) => b.textContent === name).click();
    await sleep(600);
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const t = document.createElement('canvas'); t.width = 48; t.height = 48;
    const x = t.getContext('2d'); x.drawImage(c, 0, 0, 48, 48);
    const d = x.getImageData(0, 0, 48, 48).data;
    let lo = 255, hi = 0;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; lo = Math.min(lo, l); hi = Math.max(hi, l); }
    result[name] = Math.round(hi - lo);
  }
  const flat = Object.entries(result).filter(([, v]) => v < 6).map(([k]) => k);
  console.table(result);
  console.log(flat.length ? `Flat: ${flat.join(', ')}` : 'No flat gradients.');
})();
