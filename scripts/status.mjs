#!/usr/bin/env node
/**
 * Diagnostic status reporter for Antigravity Wallpaper Engine plugin.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkAsarStatus } from './patch-asar.mjs';
import { getConfigPath, readConfig } from '../server/settings.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const AGY_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'Programs',
  'antigravity'
);
const VERSION_FILE = path.join(AGY_DIR, 'version');
const HEARTBEAT_PATH = path.join(PLUGIN_ROOT, 'runtime', '.heartbeat.json');
const BUNDLE_PATH = path.join(PLUGIN_ROOT, 'runtime', 'renderer.bundle.js');
const WEBWALLGL_PATH = path.join(PLUGIN_ROOT, 'node_modules', 'webwallgl', 'webwallgl.global.min.js');

function readJson(p, fallback) {
  try {
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback;
  } catch {
    return fallback;
  }
}

function checkScheduledTask() {
  if (process.platform !== 'win32') return false;
  try {
    execFileSync('schtasks', ['/Query', '/TN', 'Antigravity-WE-AutoGuard'], { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

const installedVersion = fs.existsSync(VERSION_FILE) ? fs.readFileSync(VERSION_FILE, 'utf8').trim() : '未检测到';
const asar = checkAsarStatus();
const installedAppVersion = asar.appVersion || '';
const heartbeat = readJson(HEARTBEAT_PATH, null);
const cfg = readConfig();
const settings = cfg.settings || {};

const versionMatched = Boolean(
  heartbeat &&
  (installedAppVersion && heartbeat.appVersion
    ? heartbeat.appVersion === installedAppVersion
    : heartbeat.installedVersion === installedVersion)
);

console.log(JSON.stringify({
  pluginDir: PLUGIN_ROOT,
  antigravityDir: AGY_DIR,
  installedVersion,
  installedAppVersion,
  asar,
  webwallglInstalled: fs.existsSync(WEBWALLGL_PATH),
  rendererBundleBuilt: fs.existsSync(BUNDLE_PATH),
  logonGuardTaskRegistered: checkScheduledTask(),
  heartbeat,
  activeOnCurrentVersion: Boolean(asar.wePatched && versionMatched),
  config: {
    path: getConfigPath(),
    enabled: Boolean(settings.enabled),
    wallpaperId: settings.wallpaperId || '',
    glassEnabled: Boolean(settings.glassEnabled),
    activePreset: settings.activePreset || '',
    sceneLive: Boolean(settings.sceneLive),
    fxEnabled: Boolean(settings.fxEnabled),
    parallaxEnabled: Boolean(settings.parallaxEnabled),
    uploadsCount: (cfg.uploads || []).length,
    favoritesCount: (settings.favoriteIds || []).length,
    customWallpaperDirsCount: (settings.customWallpaperDirs || []).length,
  },
}, null, 2));
