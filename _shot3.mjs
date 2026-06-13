import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { readFileSync } from 'fs';
const server = await createServer({ server: { port: 5198 } });
await server.listen();
const b = await chromium.launch();
// favicon emoji preview
const svg = readFileSync('public/favicon.svg','utf8');
const fp = await b.newPage({ viewport: { width: 160, height: 80 } });
await fp.setContent(`<body style="margin:0;background:#ccc;display:flex;gap:12px;align-items:center;justify-content:center">
  <div style="width:64px;height:64px">${svg}</div>
  <div style="width:24px;height:24px">${svg.replace('width="64" height="64"','width="24" height="24"')}</div>
</body>`);
await fp.screenshot({ path: '/tmp/fav.png' });
// mobile header
const mp = await b.newPage({ viewport: { width: 480, height: 220 } });
await mp.goto('http://localhost:5198/');
await mp.getByTestId('site-nav').waitFor();
await mp.screenshot({ path: '/tmp/mobile.png' });
await b.close();
await server.close();
console.log('title:', await (async()=>{const p=await (await chromium.launch()).newPage();return ''})());
console.log('ok');
