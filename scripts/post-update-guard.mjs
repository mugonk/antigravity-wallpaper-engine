#!/usr/bin/env node
/**
 * Post-update survival guard spawned on Antigravity before-quit when a pending
 * update exists. Watches app.asar for up to 3 minutes; once the updater
 * replaces app.asar with the new version, cleanly re-injects /* AGY_WE_HOOK_V1 *\/
 * without disturbing other plugins (e.g., antigravity-zh-cn).
 *
 * If NSIS or another plugin's guard already relaunched Antigravity.exe and
 * locked the newly updated app.asar before this guard could patch it, this
 * guard gracefully closes Antigravity once, applies the 1-line hook (and keeps
 * antigravity-zh-cn intact if present), and relaunches Antigravity seamlessly.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { DEFAULT_ASAR, checkAsarStatus, patchAsar } from './patch-asar.mjs';

const AGY_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'Programs',
  'antigravity'
);
const AGY_EXE = path.join(AGY_DIR, 'Antigravity.exe');
const VERSION_FILE = path.join(AGY_DIR, 'version');
const ZH_CN_PATCH = path.join(
  os.homedir(),
  '.gemini',
  'config',
  'plugins',
  'antigravity-zh-cn',
  'scripts',
  'patch-asar.mjs'
);

const INTERVAL_MS = 2000;
const MAX_WAIT_MS = 180000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readAsarSig() {
  try {
    const st = fs.statSync(DEFAULT_ASAR);
    return `${st.size}:${Math.round(st.mtimeMs)}`;
  } catch {
    return '';
  }
}

function readElectronVer() {
  try {
    return fs.existsSync(VERSION_FILE) ? fs.readFileSync(VERSION_FILE, 'utf8').trim() : '';
  } catch {
    return '';
  }
}

async function run() {
  let initialAppVer = '';
  try {
    initialAppVer = checkAsarStatus().appVersion || '';
  } catch {}
  const initialElectronVer = readElectronVer();
  const initialSig = readAsarSig();

  await sleep(3000);

  let elapsed = 3000;
  let lockedCount = 0;

  while (elapsed < MAX_WAIT_MS) {
    try {
      const st = checkAsarStatus();
      if (st.exists && !st.wePatched) {
        const res = patchAsar();
        if (res.ok) {
          return;
        }
        if (res.locked) {
          lockedCount += 1;
          const curElectronVer = readElectronVer();
          const curSig = readAsarSig();
          const versionChanged =
            (st.appVersion && initialAppVer && st.appVersion !== initialAppVer) ||
            (curElectronVer && initialElectronVer && curElectronVer !== initialElectronVer) ||
            (curSig && initialSig && curSig !== initialSig);

          // Wait 2 retries first in case another plugin's guard is mid-write (takes <200ms)
          if (versionChanged && lockedCount >= 3 && process.platform === 'win32') {
            try {
              execFileSync('taskkill', ['/IM', 'Antigravity.exe', '/F'], {
                stdio: 'ignore',
                windowsHide: true,
                timeout: 8000,
              });
            } catch {}
            await sleep(1400);
            try {
              // Ensure zh-cn stays intact if installed, then apply WE hook cleanly
              if (fs.existsSync(ZH_CN_PATCH) && !checkAsarStatus().zhCnPatched) {
                try {
                  execFileSync(process.execPath, [ZH_CN_PATCH, '--quiet'], {
                    stdio: 'ignore',
                    windowsHide: true,
                    timeout: 10000,
                  });
                } catch {}
              }
              patchAsar();
            } catch {}
            try {
              if (fs.existsSync(AGY_EXE)) {
                const child = spawn(AGY_EXE, [], { detached: true, stdio: 'ignore' });
                child.unref();
              }
            } catch {}
            return;
          }
        }
      } else {
        lockedCount = 0;
      }
    } catch {}

    await sleep(INTERVAL_MS);
    elapsed += INTERVAL_MS;
  }
}

run().catch(() => {});
