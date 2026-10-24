// Visual baseline: renders every gradient and every effect with a fixed palette and builds two contact sheets,
// so a before/after image exists whenever a shader or effect changes.
//
//   npm run dev                      # in one terminal
//   node scripts/baseline.mjs        # writes docs/baseline/{gradients,effects}.jpg and baseline.json
//   node scripts/baseline.mjs --check   # re-renders and compares against baseline.json (exit 1 on a flat/black/white item or a big colour shift)
//
// Needs Playwright (npx playwright install chromium). BASE_URL overrides http://127.0.0.1:5173.
// Animated gradients are sampled at whatever moment the page reaches, so compare sheets by eye; --check only
// looks for gross changes (an item gone flat, black or white, or a large shift in average colour).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('playwright-core'); }

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = path.resolve('docs/baseline');
const CHECK = process.argv.includes('--check');
const SETTLE_MS = Number(process.env.SETTLE_MS || 2600);
const SIZE = { width: 640, height: 400 };
const PALETTE = ['#2b1055', '#7597de', '#ff5e7e', '#ffd166'].map(h => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) }));
const EFFECT_BASE_GRADIENT = 'mesh';

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1 });
const page = await ctx.newPage();

// ids and labels come from the app's own tables, so the sheet can never drift from the app
await page.goto(BASE + '/', { waitUntil: 'load' });
const meta = await page.evaluate(async () => {
  const g = await import('/src/app/constants/gradientEffects.ts');
  const e = await import('/src/app/constants/effectRegistry.ts');
  return { gradients: g.FULL_GRADIENT_TYPES.map(id => ({ id, label: g.GRADIENT_DISPLAY_NAMES[id] || id })), effects: e.EFFECT_IDS.filter(id => id !== 'photo' && id !== 'none').map(id => ({ id, label: e.EFFECT_LABELS[id] || id })) };
});
const encode = (o) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function shoot(snapshot) {
  const p = await ctx.newPage();
  try {
    await p.goto(`${BASE}/?display=1&preset=${encode({ gradientColors: PALETTE, targetColors: PALETTE, structuralSeed: 7, ...snapshot })}`, { waitUntil: 'load', timeout: 30000 });
    await p.waitForTimeout(SETTLE_MS);
    const data = await p.evaluate(() => {
      const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      const t = document.createElement('canvas'); t.width = 320; t.height = 200;
      const x = t.getContext('2d'); x.drawImage(c, 0, 0, 320, 200);
      const d = x.getImageData(0, 0, 320, 200).data;
      let sr = 0, sg = 0, sb = 0, sl = 0, sl2 = 0; const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; const l = (d[i] + d[i + 1] + d[i + 2]) / 3; sl += l; sl2 += l * l; }
      const mean = sl / n;
      return { url: t.toDataURL('image/jpeg', 0.82), mean: Math.round(mean), sd: Math.round(Math.sqrt(Math.max(0, sl2 / n - mean * mean)) * 10) / 10, rgb: [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)] };
    });
    return data;
  } finally { await p.close(); }
}

const results = { gradients: [], effects: [] };
for (const g of meta.gradients) {
  const r = await shoot({ gradientType: g.id, activeEffects: [] });
  results.gradients.push({ ...g, ...r }); process.stdout.write(`gradient ${g.id} mean ${r.mean} sd ${r.sd}\n`);
}
for (const e of meta.effects) {
  const r = await shoot({ gradientType: EFFECT_BASE_GRADIENT, activeEffects: [e.id] });
  results.effects.push({ ...e, ...r }); process.stdout.write(`effect ${e.id} mean ${r.mean} sd ${r.sd}\n`);
}

async function sheet(title, items, file) {
  const sp = await ctx.newPage();
  await sp.setContent('<canvas id=c></canvas>');
  const jpg = await sp.evaluate(async ({ title, items }) => {
    const cols = 6, cw = 320, ch = 200, pad = 12, lab = 22, head = 52;
    const rows = Math.ceil(items.length / cols);
    const c = document.getElementById('c');
    c.width = cols * (cw + pad) + pad; c.height = head + rows * (ch + lab + pad) + pad;
    const x = c.getContext('2d');
    x.fillStyle = '#0d0c10'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#ece9f1'; x.font = '600 22px system-ui, sans-serif'; x.fillText(title, pad, 34);
    await Promise.all(items.map((it, i) => new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const col = i % cols, row = Math.floor(i / cols);
        const px = pad + col * (cw + pad), py = head + row * (ch + lab + pad);
        x.drawImage(img, px, py, cw, ch);
        x.fillStyle = '#a09cab'; x.font = '13px system-ui, sans-serif'; x.fillText(it.label, px, py + ch + 16);
        res();
      };
      img.src = it.url;
    })));
    return c.toDataURL('image/jpeg', 0.85);
  }, { title, items });
  fs.writeFileSync(file, Buffer.from(jpg.split(',')[1], 'base64'));
  await sp.close();
}

const stats = (list) => Object.fromEntries(list.map(i => [i.id, { mean: i.mean, sd: i.sd, rgb: i.rgb }]));
if (!CHECK) {
  fs.mkdirSync(OUT, { recursive: true });
  await sheet(`Gradients (${results.gradients.length}) — fixed palette`, results.gradients, path.join(OUT, 'gradients.jpg'));
  await sheet(`Effects (${results.effects.length}) — on the ${EFFECT_BASE_GRADIENT} gradient`, results.effects, path.join(OUT, 'effects.jpg'));
  fs.writeFileSync(path.join(OUT, 'baseline.json'), JSON.stringify({ gradients: stats(results.gradients), effects: stats(results.effects) }, null, 1) + '\n');
  console.log('wrote', OUT);
} else {
  const base = JSON.parse(fs.readFileSync(path.join(OUT, 'baseline.json'), 'utf8'));
  // Sparse gradients (a few dots on black) read as near-black by design; they are compared to their own baseline.
  const problems = [];
  for (const [kind, list] of [['gradients', results.gradients], ['effects', results.effects]]) {
    for (const r of list) {
      const b = base[kind][r.id];
      if (!b) { problems.push(`${kind}/${r.id}: not in the baseline (new?)`); continue; }
      const dMean = Math.abs(r.mean - b.mean), dRgb = Math.max(...r.rgb.map((v, i) => Math.abs(v - b.rgb[i])));
      const wasFlat = b.sd < 6, isFlat = r.sd < 6;
      if (isFlat && !wasFlat) problems.push(`${kind}/${r.id}: went flat (sd ${b.sd} -> ${r.sd})`);
      else if (dMean > 60 || dRgb > 70) problems.push(`${kind}/${r.id}: average colour moved a lot (mean ${b.mean} -> ${r.mean})`);
    }
    for (const id of Object.keys(base[kind])) if (!list.some(r => r.id === id)) problems.push(`${kind}/${id}: in the baseline but no longer rendered`);
  }
  console.log(problems.length ? problems.join('\n') : 'baseline check: no gross changes');
  fs.mkdirSync('/tmp/baseline-check', { recursive: true });
  await sheet('Gradients (check run)', results.gradients, '/tmp/baseline-check/gradients.jpg');
  await sheet('Effects (check run)', results.effects, '/tmp/baseline-check/effects.jpg');
  await browser.close();
  process.exit(problems.length ? 1 : 0);
}
await browser.close();
