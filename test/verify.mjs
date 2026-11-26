#!/usr/bin/env node
/**
 * End-to-end verification suite for Antigravity Wallpaper Engine.
 * Runs fully isolated against a temp data dir and a synthetic ASAR archive.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Isolate data dir BEFORE importing server modules
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-we-test-'));
const dataDir = path.join(tmpRoot, 'data');
process.env.AGY_WE_DATA_DIR = dataDir;
process.env.AGY_WE_KEEP_STEAM_ENV = '1';
process.env.DSH_WE_STEAM_ROOT = path.join(tmpRoot, 'empty-steam');

const { startServer } = await import('../server/index.mjs');
const {
  checkAsarStatus,
  patchAsar,
  removeWeHookFromAsar,
  readAsar,
  ZH_CN_MARKER,
} = await import('../scripts/patch-asar.mjs');

let passed = 0;
async function runTest(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(err);
    throw err;
  }
}

function createFakeAsar(outPath, mainJsContent) {
  const mainBuf = Buffer.from(mainJsContent, 'utf8');
  const header = {
    files: {
      dist: {
        files: {
          'main.js': {
            size: mainBuf.length,
            offset: '0',
          },
        },
      },
    },
  };
  const headerStr = Buffer.from(JSON.stringify(header), 'utf8');
  const padded = (headerStr.length + 3) & ~3;
  const payloadSize = 4 + padded;
  const pickleSize = 4 + payloadSize;
  const prefix = Buffer.alloc(16 + padded, 0);
  prefix.writeUInt32LE(4, 0);
  prefix.writeUInt32LE(pickleSize, 4);
  prefix.writeUInt32LE(payloadSize, 8);
  prefix.writeUInt32LE(headerStr.length, 12);
  headerStr.copy(prefix, 16);
  fs.writeFileSync(outPath, Buffer.concat([prefix, mainBuf]));
}

let srv = null;

try {
  console.log('[verify] starting Antigravity Wallpaper Engine verification suite...');

  await runTest('1. Renderer bundle exists and parses cleanly', async () => {
    const bundlePath = path.join(ROOT, 'runtime', 'renderer.bundle.js');
    assert.ok(fs.existsSync(bundlePath), 'renderer.bundle.js must exist (run npm run build first)');
    const src = fs.readFileSync(bundlePath, 'utf8');
    assert.ok(src.length > 5000, 'bundle looks unexpectedly small');
    new vm.Script(src, { filename: 'renderer.bundle.js' });
  });

  srv = await startServer({ port: 0, host: '127.0.0.1', writePortFile: true });
  const base = srv.apiBase;

  await runTest('2. Health & settings endpoints sanitize and persist', async () => {
    const hRes = await fetch(`${base}/wallpaper-engine/health`);
    assert.equal(hRes.status, 200);
    const h = await hRes.json();
    assert.equal(h.ok, true);
    assert.equal(h.webwallglAvailable, true);

    const pRes = await fetch(`${base}/wallpaper-engine/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blur: 999, accent: 'not-a-color', fxEnabled: true, sceneLiveFps: 60 }),
    });
    assert.equal(pRes.status, 200);
    const saved = await pRes.json();
    assert.equal(saved.settings.blur, 48, 'blur should clamp to 48');
    assert.equal(saved.settings.accent, '#75e6f5', 'invalid color should keep fallback');
    assert.equal(saved.settings.fxEnabled, true);
    assert.equal(saved.settings.sceneLiveFps, 60);
  });

  await runTest('3. Presets list, save, and delete lifecycle', async () => {
    const list1 = await (await fetch(`${base}/wallpaper-engine/presets`)).json();
    assert.ok(Array.isArray(list1.presets) && list1.presets.length >= 2, 'should include builtin presets');

    const created = await (await fetch(`${base}/wallpaper-engine/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '测试预设', values: { blur: 24, accent: '#ff5500' } }),
    })).json();
    assert.equal(created.ok, true);
    const pid = created.preset.id;

    const delRes = await fetch(`${base}/wallpaper-engine/presets/${encodeURIComponent(pid)}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
  });

  await runTest('4. Upload PNG, Range media serving, local-only URL rejection, and delete', async () => {
    const pngBytes = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );
    const upRes = await fetch(`${base}/wallpaper-engine/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Name': encodeURIComponent('demo-test.png'),
        'X-Wallpaper-Title': encodeURIComponent('测试壁纸'),
      },
      body: pngBytes,
    });
    assert.equal(upRes.status, 200);
    const up = await upRes.json();
    assert.equal(up.ok, true);

    const inv = await (await fetch(`${base}/wallpaper-engine/inventory`)).json();
    const found = inv.wallpapers.find((w) => w.id === up.entry.id);
    assert.ok(found, 'uploaded local wallpaper should appear in inventory');
    assert.equal(found.localVerified, true, 'inventory items must be verified local files');

    const rangeRes = await fetch(`${base}${found.mediaUrl}`, { headers: { Range: 'bytes=0-7' } });
    assert.equal(rangeRes.status, 206);
    const slice = Buffer.from(await rangeRes.arrayBuffer());
    assert.equal(slice.length, 8);
    assert.deepEqual(slice, pngBytes.subarray(0, 8));

    // Remote URL import must be rejected under local-only policy
    const urlRes = await fetch(`${base}/wallpaper-engine/url-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/bg.jpg', title: '外链测试' }),
    });
    assert.equal(urlRes.status, 403, 'remote URL wallpaper import must be rejected');

    const del1 = await fetch(`${base}/wallpaper-engine/upload/${encodeURIComponent(up.entry.id)}`, { method: 'DELETE' });
    assert.equal(del1.status, 200);
  });

  await runTest('5. Custom WE web project scan, /scene-files fence, shim injection & /props', async () => {
    const customRoot = path.join(tmpRoot, 'custom-wallpapers');
    const wpDir = path.join(customRoot, 'mock-web-wp');
    fs.mkdirSync(wpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'secret.txt'), 'TOP_SECRET');
    fs.writeFileSync(path.join(wpDir, 'project.json'), JSON.stringify({
      title: '模拟网页壁纸',
      type: 'web',
      file: 'index.html',
      general: {
        properties: {
          speed: { type: 'slider', text: '速度', value: 5, min: 1, max: 10 },
          glow: { type: 'bool', text: '发光', value: true },
        },
      },
    }));
    fs.writeFileSync(path.join(wpDir, 'index.html'), '<!doctype html><html><head></head><body><h1>Mock</h1></body></html>');

    await fetch(`${base}/wallpaper-engine/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customWallpaperDirs: [customRoot] }),
    });
    const inv = await (await fetch(`${base}/wallpaper-engine/rescan`, { method: 'POST' })).json();
    const webWp = inv.wallpapers.find((w) => w.title === '模拟网页壁纸');
    assert.ok(webWp, 'custom web wallpaper should be discovered');

    // HTML entry should receive shim + seed props injection
    const htmlRes = await fetch(`${base}${webWp.webEntryUrl}`);
    assert.equal(htmlRes.status, 200);
    const html = await htmlRes.text();
    assert.ok(html.includes('__weSeedProps'), 'web wallpaper HTML should receive seeded properties');

    // Path traversal must be blocked with 403
    const escRes = await fetch(`${base}/wallpaper-engine/scene-files/${webWp.token}/..%2F..%2Fsecret.txt`);
    assert.equal(escRes.status, 403, 'path traversal out of wallpaper root must be fenced (403)');

    // Props GET & POST
    const props1 = await (await fetch(`${base}/wallpaper-engine/props/${webWp.token}`)).json();
    assert.equal(props1.ok, true);
    assert.ok(props1.props.some((p) => p.name === 'speed' && p.value === 5));

    const props2 = await (await fetch(`${base}/wallpaper-engine/props/${webWp.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrides: { speed: 9, unknownKey: 123 } }),
    })).json();
    assert.equal(props2.ok, true);
    assert.equal(props2.overrides.speed, 9);
    assert.equal('unknownKey' in props2.overrides, false);
  });

  await runTest('6. WebWallGL live renderer assets & diag beacon', async () => {
    const idx = await fetch(`${base}/wallpaper-engine/scene-live/index.html`);
    assert.equal(idx.status, 200);
    const eng = await fetch(`${base}/wallpaper-engine/scene-live/engine/webwallgl.global.min.js`);
    assert.equal(eng.status, 200);
    const engText = await eng.text();
    assert.ok(engText.length > 50000, 'webwallgl global bundle should be served');

    const dRes = await fetch(`${base}/diag?msg=verify-ping&lvl=info`);
    assert.equal(dRes.status, 200);
    const logs = await (await fetch(`${base}/wallpaper-engine/diag-log`)).json();
    assert.ok(logs.lines.some((l) => String(l.detail).includes('verify-ping')));
  });

  await runTest('7. ASAR patch & surgical removal preserves antigravity-zh-cn hook', async () => {
    const fakeAsar = path.join(tmpRoot, 'fake-app.asar');
    const zhLine = `${ZH_CN_MARKER} try{require('fake-zh');}catch{}\n`;
    createFakeAsar(fakeAsar, `${zhLine}console.log("main");\n`);

    const st0 = checkAsarStatus(fakeAsar);
    assert.equal(st0.wePatched, false);
    assert.equal(st0.zhCnPatched, true);

    const p1 = patchAsar(fakeAsar);
    assert.equal(p1.ok, true);
    assert.equal(p1.alreadyPatched, false);
    assert.equal(p1.zhCnPreserved, true);

    const st1 = checkAsarStatus(fakeAsar);
    assert.equal(st1.wePatched, true);
    assert.equal(st1.zhCnPatched, true);

    // Check integrity hash metadata was written
    const parsed = readAsar(fakeAsar);
    const mainEntry = parsed.header.files.dist.files['main.js'];
    assert.equal(mainEntry.integrity?.algorithm, 'SHA256');
    assert.ok(mainEntry.integrity?.hash?.length === 64);

    // Idempotent second patch
    const p2 = patchAsar(fakeAsar);
    assert.equal(p2.ok, true);
    assert.equal(p2.alreadyPatched, true);

    // Surgical removal must remove WE hook while keeping ZH-CN hook intact
    const r1 = removeWeHookFromAsar(fakeAsar);
    assert.equal(r1.ok, true);
    assert.equal(r1.removed, true);
    assert.equal(r1.zhCnPreserved, true);

    const st2 = checkAsarStatus(fakeAsar);
    assert.equal(st2.wePatched, false);
    assert.equal(st2.zhCnPatched, true, 'antigravity-zh-cn hook MUST remain intact after removing WE hook');
  });

  await runTest('8. Mascot artwork serving, custom mascot upload & reset-all', async () => {
    const mRes = await fetch(`${base}/wallpaper-engine/mascot/gemini`);
    assert.equal(mRes.status, 200);
    assert.equal(mRes.headers.get('content-type'), 'image/png');
    const mBytes = Buffer.from(await mRes.arrayBuffer());
    assert.ok(mBytes.length > 1000, 'builtin mascot png should be served');

    const tinyPng = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );
    const upM = await (await fetch(`${base}/wallpaper-engine/mascot/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: tinyPng,
    })).json();
    assert.equal(upM.ok, true);
    assert.equal(upM.settings.mascotForm, 'custom');
    assert.equal(upM.settings.ropeStyle, 'mascot');

    const getM = await fetch(`${base}/wallpaper-engine/mascot/custom`);
    assert.equal(getM.status, 200);

    const rst = await (await fetch(`${base}/wallpaper-engine/reset-all`, { method: 'POST' })).json();
    assert.equal(rst.ok, true);
    assert.equal(rst.settings.blur, 9);

    const delM = await fetch(`${base}/wallpaper-engine/mascot/custom`, { method: 'DELETE' });
    assert.equal(delM.status, 200);
  });

  console.log(`\n[verify] ALL ${passed} TESTS PASSED!`);
} finally {
  if (srv) await srv.close();
  try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
}
