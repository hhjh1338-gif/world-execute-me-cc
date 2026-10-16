// Save covers to this package's CC/发布. Missing optional artwork uses frontend placeholders.
// Browser: --chrome /path/to/browser or CHROME_PATH; common installed browsers are discovered automatically.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve, ROOT } from './serve.mjs';
import { chromePath, BROWSER_FLAGS, loadChromium, assetStatus } from './runtime.mjs';

const chrome = chromePath(), chromium = await loadChromium();
const out = join(ROOT, 'CC', '发布'); mkdirSync(out, { recursive: true });
const server = await serve(0);
let browser;
try {
  browser = await chromium.launch({ executablePath: chrome, args: BROWSER_FLAGS, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:' + server.address().port + '/CC/app/film/index.html?export=1');
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  if (errors.length) throw new Error(errors.join('\n'));
  const outputs = [];
  for (const [v, name] of [[1, '封面_1_Token来_表情'], [2, '封面_2_Token来_只剩明暗']]) {
    for (const [width, ratio] of [[1920, '16比9'], [1440, '4比3']]) {
      const f = join(out, name + '_' + ratio + '.png');
      writeFileSync(f, Buffer.from((await page.evaluate(([vv, ww]) => window.coverAt(vv, ww), [v, width])).split(',')[1], 'base64'));
      outputs.push(f); console.log('wrote', f);
    }
  }
  writeFileSync(join(out, '封面_导出记录.json'), JSON.stringify({ made: new Date().toISOString(), assets: await assetStatus(page), outputs }, null, 2) + '\n');
} finally { if (browser) await browser.close(); server.close(); }
