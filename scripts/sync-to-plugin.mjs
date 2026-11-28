#!/usr/bin/env node
/**
 * Builds runtime/renderer.bundle.js and syncs this plugin into
 * ~/.gemini/config/plugins/antigravity-wallpaper-engine/
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_ROOT = path.resolve(__dirname, '..');
const DEST_ROOT = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'antigravity-wallpaper-engine');

// 1. Rebuild renderer bundle first
execFileSync(process.execPath, [path.join(SRC_ROOT, 'runtime', 'bundle-renderer.mjs')], {
  cwd: SRC_ROOT,
  stdio: 'inherit',
});

// 2. Copy plugin files cleanly
const COPY_ITEMS = [
  'LICENSE',
  'package.json',
  'package-lock.json',
  'plugin.json',
  'hooks.json',
  'assets',
  'runtime',
  'server',
  'scripts',
  'skills',
  'node_modules',
];

fs.mkdirSync(DEST_ROOT, { recursive: true });

let copiedCount = 0;
let skippedCount = 0;

function copyIfChanged(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry === '.heartbeat.json') continue;
      copyIfChanged(path.join(src, entry), path.join(dst, entry));
    }
    return;
  }
  if (fs.existsSync(dst)) {
    try {
      const dstSt = fs.statSync(dst);
      if (dstSt.isFile() && dstSt.size === st.size) {
        const a = fs.readFileSync(src);
        const b = fs.readFileSync(dst);
        if (a.equals(b)) {
          skippedCount += 1;
          return;
        }
      }
    } catch {}
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  copiedCount += 1;
}

for (const item of COPY_ITEMS) {
  const src = path.join(SRC_ROOT, item);
  const dst = path.join(DEST_ROOT, item);
  if (!fs.existsSync(src)) continue;
  copyIfChanged(src, dst);
}

console.log(`[sync] synced plugin to ${DEST_ROOT} (${copiedCount} updated, ${skippedCount} unchanged)`);
