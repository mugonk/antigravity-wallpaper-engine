#!/usr/bin/env node
/**
 * Antigravity Wallpaper Engine — Local Loopback Media & Control Server.
 *
 * Zero-token-overhead local HTTP server bound strictly to 127.0.0.1:
 *  - Discovers Steam & Wallpaper Engine workshops + custom directories + user uploads
 *  - Serves preview thumbnails, Range-capable video/image media with virtual MP4 faststart
 *  - Serves WebWallGL live renderer + strict-fenced /scene-files with WE API shim injection
 *  - Manages settings, Liquid Glass presets, wallpaper user properties, system fonts & diagnostics
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRouter, readBufferBody, readJsonBody, sendJson, sendText } from './router.mjs';
import {
  atomicWriteJsonSync,
  DEFAULT_SETTINGS,
  getCacheDir,
  getDataDir,
  getUploadsDir,
  mergeSettings,
  readSettings,
} from './settings.mjs';
import { deleteUserPreset, listPresets, saveUserPreset } from './presets.mjs';
import { getSystemFonts } from './system-fonts.mjs';
import {
  listUploads,
  removeUpload,
  saveUploadedBuffer,
  saveUrlWallpaper,
  UPLOAD_MAX_BYTES,
} from './uploads.mjs';

import { extOf } from './upstream/fs-paths.js';
import { createSteamDiscoveryKit } from './upstream/steam-discovery.js';
import { createWallpaperScanKit } from './upstream/wallpaper-scan.js';
import { createShimSeedKit } from './upstream/shim-seed.js';
import { createMp4VfsKit } from './upstream/mp4-vfs.js';
import { createServeKit, payloadProgress } from './upstream/serve.js';
import { entryDirPrefix, filterKnownOverrides, parseUserPropDefs } from './upstream/we-props.js';
import { extractSceneVideoFromDir, extractSceneVideoFromPkgFile } from './upstream/scene-manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PLUGIN_ROOT = resolve(__dirname, '..');
const WEBWALLGL_DIR = join(__dirname, 'webwallgl');
const BASE = '/wallpaper-engine';
const WE_APPID = '431960';
const TINY_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function resolveWebWallGLPkgDir() {
  const candidates = [
    join(PLUGIN_ROOT, 'node_modules', 'webwallgl'),
    join(dirname(PLUGIN_ROOT), 'node_modules', 'webwallgl'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'webwallgl.global.min.js'))) return dir;
  }
  return '';
}

async function pathExistsP(p) {
  try { await access(p); return true; } catch { return false; }
}
async function isFileP(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}
async function isDirectoryP(p) {
  try { return (await stat(p)).isDirectory(); } catch { return false; }
}

function schemeToCss(raw) {
  if (typeof raw !== 'string') return null;
  const parts = raw.trim().split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const clampByte = (v) => {
    const scaled = v <= 1 ? Math.round(v * 255) : Math.round(v);
    return Math.max(0, Math.min(255, scaled));
  };
  const [r, g, b] = parts.slice(0, 3).map(clampByte);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function makeToken(key) {
  return createHash('sha1').update(String(key)).digest('hex').slice(0, 16);
}

function mimeForStatic(filePath) {
  const ext = extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.wasm': 'application/wasm',
  }[ext] || 'application/octet-stream';
}

export function createWallpaperServer(options = {}) {
  const startedAt = Date.now();
  const activeStreams = new Set();
  const mediaMap = new Map();       // token -> abs file path
  const previewMap = new Map();     // token -> abs preview path
  const slideMap = new Map();       // token -> { dirAbs, slides: string[], slideIntervalMs }
  const sceneVideoCache = new Map();// token -> abs extracted mp4 path | null
  const diagRing = [];
  const DIAG_MAX = 200;

  function appendDiagLine(kind, detail) {
    diagRing.push({
      ts: new Date().toISOString(),
      kind: String(kind || 'info'),
      detail: detail && typeof detail === 'object' ? detail : String(detail ?? ''),
    });
    if (diagRing.length > DIAG_MAX) diagRing.splice(0, diagRing.length - DIAG_MAX);
  }

  const log = {
    info: (msg) => appendDiagLine('info', msg),
    warn: (msg) => appendDiagLine('warn', msg),
    error: (msg) => appendDiagLine('error', msg),
  };

  const traceRequests = (res, route, path) => {
    res.once('finish', () => {
      if (res.statusCode >= 400) {
        appendDiagLine('http', { route, path: String(path || '').slice(0, 140), status: res.statusCode });
      }
    });
  };
  const traceMediaRequests = (req, res, path) => {
    const dest = req.headers['sec-fetch-dest'] || '';
    res.once('finish', () => {
      if (dest === 'document' || dest === 'iframe' || res.statusCode >= 400) {
        appendDiagLine('media', { path: String(path || '').slice(0, 140), dest, status: res.statusCode });
      }
    });
  };

  const steamKit = createSteamDiscoveryKit({ WE_APPID, pathExistsP });
  const scanKit = createWallpaperScanKit({
    WE_APPID,
    pathExistsP,
    isFileP,
    isDirectoryP,
    extOf,
    schemeToCss,
  });
  const shimSeedKit = createShimSeedKit({
    webwallglPkgDir: resolveWebWallGLPkgDir,
    readSettings,
  });
  const mp4VfsKit = createMp4VfsKit({ appendDiagLine });
  const serveKit = createServeKit({
    activeStreams,
    BASE,
    mediaMap,
    log,
    appendDiagLine,
    traceRequests,
    traceMediaRequests,
    readWebShim: shimSeedKit.readWebShim,
    buildSeedScript: shimSeedKit.buildSeedScript,
  });

  let inventoryCache = null;
  let inventoryInflight = null;
  let boundPort = 0;

  function apiBaseUrl() {
    return `http://127.0.0.1:${boundPort}`;
  }

  async function scanCustomDirs(dirs) {
    const items = [];
    const seen = new Set();
    const imgRe = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;
    const vidRe = /\.(mp4|webm|mov|mkv)$/i;
    for (const rawDir of dirs || []) {
      const dir = resolve(String(rawDir || '').trim());
      if (!dir || seen.has(dir.toLowerCase())) continue;
      seen.add(dir.toLowerCase());
      if (!(await isDirectoryP(dir))) continue;

      // Case 1: dir itself is a WE project
      const selfProj = await scanKit.readProjectP(dir);
      if (selfProj && selfProj.file) {
        const fileRel = selfProj.type === 'scene'
          ? await scanKit.resolveSceneMainFileP(dir, selfProj.file)
          : selfProj.file;
        if (fileRel && (await isFileP(resolve(dir, fileRel)))) {
          selfProj.fileAbs = resolve(dir, fileRel);
          selfProj.previewAbs = selfProj.preview && (await isFileP(resolve(dir, selfProj.preview)))
            ? resolve(dir, selfProj.preview)
            : null;
          selfProj.dirAbs = dir;
          selfProj.source = 'custom-dir';
          items.push(selfProj);
          continue;
        }
      }

      // Case 2: dir contains subdirectories (WE projects) or loose media files
      let entries = [];
      try { entries = await readdir(dir, { withFileTypes: true }); } catch { continue; }
      for (const ent of entries) {
        if (ent.name.startsWith('.')) continue;
        const full = join(dir, ent.name);
        if (ent.isDirectory()) {
          const p = await scanKit.readProjectP(full);
          if (!p || !p.file) continue;
          const fileRel = p.type === 'scene'
            ? await scanKit.resolveSceneMainFileP(full, p.file)
            : p.file;
          if (!fileRel || !(await isFileP(resolve(full, fileRel)))) continue;
          p.fileAbs = resolve(full, fileRel);
          p.previewAbs = p.preview && (await isFileP(resolve(full, p.preview)))
            ? resolve(full, p.preview)
            : null;
          p.dirAbs = full;
          p.source = 'custom-dir';
          items.push(p);
        } else if (ent.isFile() && (imgRe.test(ent.name) || vidRe.test(ent.name))) {
          const isVid = vidRe.test(ent.name);
          const id = `custom_${makeToken(full.toLowerCase())}`;
          items.push({
            id,
            title: ent.name.replace(/\.[^.]+$/, ''),
            type: isVid ? 'video' : 'image',
            file: ent.name,
            fileAbs: full,
            previewAbs: isVid ? null : full,
            dirAbs: dir,
            tags: ['自定义目录'],
            contentRating: 'unrated',
            source: 'custom-dir',
          });
        }
      }
    }
    return items;
  }

  async function buildInventory(force = false) {
    if (!force && inventoryCache) return inventoryCache;
    if (!force && inventoryInflight) return inventoryInflight;

    inventoryInflight = (async () => {
      const settings = readSettings();
      if (settings.customSteamRoot) {
        process.env.DSH_WE_STEAM_ROOT = settings.customSteamRoot;
      } else if (!options.preserveSteamEnv && !process.env.AGY_WE_KEEP_STEAM_ENV) {
        delete process.env.DSH_WE_STEAM_ROOT;
      }

      const [installDir, libraryDirs] = await Promise.all([
        steamKit.locateWallpaperEngineP().catch(() => null),
        steamKit.owningLibrariesP().catch(() => []),
      ]);

      const weItems = (installDir || libraryDirs.length)
        ? await scanKit.enumerateWallpapersAsync(installDir, libraryDirs).catch(() => [])
        : [];
      const customItems = await scanCustomDirs(settings.customWallpaperDirs || []).catch(() => []);
      const uploads = listUploads();

      mediaMap.clear();
      previewMap.clear();
      slideMap.clear();

      const wallpapers = [];
      const byPath = new Map();
      const byId = new Map();
      const seenIds = new Set();

      const registerItem = (raw, sourceTag) => {
        if (!raw || !raw.id || seenIds.has(raw.id)) return;
        // Local-only policy: strictly require a verified downloaded file on local disk (no remote URLs)
        if (raw.source === 'url' || !raw.fileAbs) return;
        try {
          const st = statSync(raw.fileAbs);
          if (!st.isFile() || st.size <= 0) return;
        } catch {
          return;
        }
        seenIds.add(raw.id);
        const token = makeToken(`${raw.id}|${raw.fileAbs}`);
        mediaMap.set(token, raw.fileAbs);
        byPath.set(scanKit.pathKey(raw.fileAbs), raw.id);
        if (raw.dirAbs) byPath.set(scanKit.pathKey(raw.dirAbs), raw.id);
        if (raw.previewAbs && existsSync(raw.previewAbs)) {
          previewMap.set(token, raw.previewAbs);
        }
        if (Array.isArray(raw.slides) && raw.slides.length && raw.dirAbs) {
          slideMap.set(token, {
            dirAbs: raw.dirAbs,
            slides: raw.slides,
            slideIntervalMs: raw.slideIntervalMs || null,
          });
        }

        const type = raw.type || 'image';
        const hasValidPreview = Boolean(raw.previewAbs && existsSync(raw.previewAbs));
        const item = {
          id: raw.id,
          token,
          title: raw.title || raw.id,
          type,
          source: raw.source || sourceTag,
          file: raw.file || (raw.fileName || ''),
          tags: Array.isArray(raw.tags) ? raw.tags : [],
          contentRating: raw.contentRating || 'unrated',
          schemeColor: raw.schemeColor || null,
          hasPreview: hasValidPreview,
          previewUrl: hasValidPreview ? `${BASE}/preview/${token}` : null,
          mediaUrl: `${BASE}/media/${token}`,
          sceneBaseUrl: `${BASE}/scene-files/${token}`,
          webEntryUrl: type === 'web'
            ? `${BASE}/scene-files/${token}/${String(raw.file || 'index.html').replace(/\\/g, '/').replace(/^\/+/, '')}`
            : null,
          slideCount: Array.isArray(raw.slides) ? raw.slides.length : 0,
          slideIntervalMs: raw.slideIntervalMs || null,
          isUpload: raw.source === 'upload',
          localVerified: true,
        };
        wallpapers.push(item);
        byId.set(item.id, item);
      };

      for (const u of uploads) {
        if (u.source === 'url' || !u.fileAbs) continue;
        registerItem({
          id: u.id,
          title: u.title,
          type: u.type,
          file: u.fileName || '',
          fileAbs: u.fileAbs,
          previewAbs: u.type === 'image' ? u.fileAbs : null,
          source: 'upload',
          tags: ['本地导入'],
        }, 'upload');
      }
      for (const c of customItems) registerItem(c, 'custom-dir');
      for (const w of weItems) registerItem(w, 'wallpaper-engine');

      // Read WE playlists if installDir exists
      let playlists = [];
      if (installDir) {
        try {
          const rawPlaylists = await scanKit.readPlaylistsP(installDir);
          playlists = (rawPlaylists || []).map((pl) => {
            const ids = [];
            const seenPl = new Set();
            for (const entry of pl.items || []) {
              const hit = scanKit.playlistItemId(entry, byPath, byId);
              if (hit && !seenPl.has(hit)) {
                seenPl.add(hit);
                ids.push(hit);
              }
            }
            return {
              id: pl.id || pl.name,
              name: pl.name || 'Playlist',
              wallpaperIds: ids,
              total: ids.length,
            };
          }).filter((p) => p.total > 0);
        } catch {
          playlists = [];
        }
      }

      const webwallglAvailable = Boolean(resolveWebWallGLPkgDir());
      inventoryCache = {
        installDir,
        libraryDirs,
        uploadDir: getUploadsDir(),
        cacheDir: getCacheDir(),
        webwallglAvailable,
        mediaBase: apiBaseUrl(),
        sceneMediaBase: apiBaseUrl(),
        total: wallpapers.length,
        playlists,
        wallpapers,
        scannedAt: new Date().toISOString(),
      };
      appendDiagLine('inventory', {
        total: wallpapers.length,
        weCount: weItems.length,
        uploadCount: uploads.length,
        customCount: customItems.length,
        webwallglAvailable,
      });
      return inventoryCache;
    })().finally(() => {
      inventoryInflight = null;
    });

    return inventoryInflight;
  }

  async function ensureInventory() {
    return inventoryCache || buildInventory(false);
  }

  async function extractSceneVideoPath(token) {
    if (sceneVideoCache.has(token)) {
      const cached = sceneVideoCache.get(token);
      if (!cached || existsSync(cached)) return cached;
      sceneVideoCache.delete(token);
    }
    const fileAbs = mediaMap.get(token);
    if (!fileAbs || !existsSync(fileAbs)) return null;
    try {
      const cacheDir = join(getCacheDir(), 'scene-videos');
      mkdirSync(cacheDir, { recursive: true });
      const outPath = join(cacheDir, `${token}.mp4`);
      if (existsSync(outPath) && statSync(outPath).size > 0) {
        sceneVideoCache.set(token, outPath);
        return outPath;
      }
      const lower = fileAbs.toLowerCase();
      let extracted = null;
      if (lower.endsWith('.pkg')) {
        extracted = await extractSceneVideoFromPkgFile(fileAbs);
      } else {
        extracted = extractSceneVideoFromDir(dirname(fileAbs));
      }
      if (extracted && extracted.bytes && extracted.bytes.length > 0) {
        writeFileSync(outPath, extracted.bytes);
        sceneVideoCache.set(token, outPath);
        return outPath;
      }
    } catch (err) {
      appendDiagLine('scene-video-error', String((err && err.message) || err));
    }
    sceneVideoCache.set(token, null);
    return null;
  }

  const router = createRouter();

  // 1. Health & Diagnostics
  router.register({
    kind: 'exact',
    method: 'GET',
    path: `${BASE}/health`,
    handler: (_req, res) => {
      sendJson(res, 200, {
        ok: true,
        port: boundPort,
        apiBase: apiBaseUrl(),
        version: '1.0.0',
        webwallglAvailable: Boolean(resolveWebWallGLPkgDir()),
        totalWallpapers: inventoryCache ? inventoryCache.total : null,
        uptimeMs: Date.now() - startedAt,
      });
    },
  });

  const handleDiagBeacon = (req, res) => {
    try {
      const u = new URL(req.url || '/', 'http://127.0.0.1');
      const msg = u.searchParams.get('msg') || '';
      const lvl = u.searchParams.get('lvl') || 'info';
      if (msg) appendDiagLine(`webwallgl:${lvl}`, msg.slice(0, 500));
    } catch {}
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store');
    res.end(TINY_GIF);
  };
  router.register({ kind: 'exact', method: 'GET', path: '/diag', handler: handleDiagBeacon });
  router.register({ kind: 'exact', method: 'GET', path: `${BASE}/diag`, handler: handleDiagBeacon });

  router.register({
    kind: 'exact',
    method: 'GET',
    path: `${BASE}/diag-log`,
    handler: (_req, res) => {
      sendJson(res, 200, { ok: true, lines: diagRing.slice(-120) });
    },
  });

  // 2. Settings
  router.register({
    kind: 'exact',
    method: 'GET',
    path: `${BASE}/settings`,
    handler: (_req, res) => {
      sendJson(res, 200, { ok: true, settings: readSettings() });
    },
  });

  router.register({
    kind: 'exact',
    method: 'POST',
    path: `${BASE}/settings`,
    handler: async (req, res) => {
      const patch = await readJsonBody(req);
      const prev = readSettings();
      const next = await mergeSettings(patch);
      const dirsChanged = prev.customSteamRoot !== next.customSteamRoot
        || JSON.stringify(prev.customWallpaperDirs) !== JSON.stringify(next.customWallpaperDirs);
      if (dirsChanged) inventoryCache = null;
      sendJson(res, 200, { ok: true, settings: next });
    },
  });

  // 3. Inventory & Rescan
  router.register({
    kind: 'exact',
    method: 'GET',
    path: `${BASE}/inventory`,
    handler: async (_req, res) => {
      const inv = await ensureInventory();
      sendJson(res, 200, { ...inv, mediaBase: apiBaseUrl(), sceneMediaBase: apiBaseUrl() });
    },
  });

  router.register({
    kind: 'exact',
    method: 'POST',
    path: `${BASE}/rescan`,
    handler: async (_req, res) => {
      const inv = await buildInventory(true);
      sendJson(res, 200, { ...inv, mediaBase: apiBaseUrl(), sceneMediaBase: apiBaseUrl() });
    },
  });

  // 4. Presets
  router.register({
    kind: 'exact',
    method: 'GET',
    path: `${BASE}/presets`,
    handler: (_req, res) => {
      sendJson(res, 200, { ok: true, presets: listPresets() });
    },
  });

  router.register({
    kind: 'exact',
    method: 'POST',
    path: `${BASE}/presets`,
    handler: async (req, res) => {
      const body = await readJsonBody(req);
      const preset = saveUserPreset(body);
      sendJson(res, 200, { ok: true, preset });
    },
  });

  router.register({
    kind: 'prefix',
    method: 'DELETE',
    path: `${BASE}/presets`,
    handler: (_req, res, pathname) => {
      const id = decodeURIComponent(pathname.slice(`${BASE}/presets/`.length));
      const deleted = deleteUserPreset(id);
      sendJson(res, deleted ? 200 : 404, { ok: deleted, id });
    },
  });

  // 5. System Fonts
  router.register({
    kind: 'exact',
    method: 'GET',
    path: `${BASE}/system-fonts`,
    handler: async (req, res) => {
      const u = new URL(req.url || '/', 'http://127.0.0.1');
      const refresh = u.searchParams.get('refresh') === '1';
      const data = await getSystemFonts(refresh);
      sendJson(res, 200, data);
    },
  });

  // 6. Uploads & URL Import
  router.register({
    kind: 'exact',
    method: 'POST',
    path: `${BASE}/upload`,
    handler: async (req, res) => {
      const buf = await readBufferBody(req, UPLOAD_MAX_BYTES);
      const rawName = String(req.headers['x-file-name'] || 'wallpaper.png');
      const rawTitle = String(req.headers['x-wallpaper-title'] || '');
      let filename = rawName;
      let title = rawTitle;
      try { filename = decodeURIComponent(rawName); } catch {}
      try { title = decodeURIComponent(rawTitle); } catch {}
      const entry = await saveUploadedBuffer({ filename, title, buffer: buf });
      inventoryCache = null;
      sendJson(res, 200, { ok: true, entry });
    },
  });

  router.register({
    kind: 'exact',
    method: 'POST',
    path: `${BASE}/url-import`,
    handler: async (_req, res) => {
      sendJson(res, 403, { ok: false, error: '仅支持选择本地已下载的壁纸，已禁用在线 URL 导入' });
    },
  });

  router.register({
    kind: 'prefix',
    method: 'DELETE',
    path: `${BASE}/upload`,
    handler: async (_req, res, pathname) => {
      const id = decodeURIComponent(pathname.slice(`${BASE}/upload/`.length));
      const removed = await removeUpload(id);
      inventoryCache = null;
      sendJson(res, removed ? 200 : 404, { ok: removed, id });
    },
  });

  // 6b. Mascot Rope Artwork & Reset-All
  const BUILTIN_MASCOTS = new Set(['gemini', 'whale', 'deepseek', 'claude', 'qwen', 'kimi', 'gpt', 'grok', 'glm', 'phoebe']);
  const MASCOT_ASSET_DIR = join(PLUGIN_ROOT, 'assets', 'rope');
  const getCustomMascotPath = () => join(getDataDir(), 'mascot-custom.img');

  function sniffImgMime(buf) {
    if (!buf || buf.length < 4) return 'image/png';
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
    return 'image/png';
  }

  router.register({
    kind: 'prefix',
    method: 'GET',
    path: `${BASE}/mascot`,
    handler: (_req, res, pathname) => {
      const name = decodeURIComponent(pathname.slice(`${BASE}/mascot/`.length)).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      if (name === 'custom') {
        const p = getCustomMascotPath();
        if (!existsSync(p)) { sendText(res, 404, 'no custom mascot'); return; }
        const buf = readFileSync(p);
        res.statusCode = 200;
        res.setHeader('Content-Type', sniffImgMime(buf));
        res.setHeader('Cache-Control', 'no-store');
        res.end(buf);
        return;
      }
      if (!BUILTIN_MASCOTS.has(name)) { sendText(res, 404, 'unknown mascot'); return; }
      const abs = join(MASCOT_ASSET_DIR, `${name}.png`);
      if (!existsSync(abs)) { sendText(res, 404, 'asset missing'); return; }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(readFileSync(abs));
    },
  });

  router.register({
    kind: 'exact',
    method: 'POST',
    path: `${BASE}/mascot/custom`,
    handler: async (req, res) => {
      const buf = await readBufferBody(req, 8 * 1024 * 1024);
      if (!buf || !buf.length) { sendJson(res, 400, { ok: false, error: 'empty image' }); return; }
      const p = getCustomMascotPath();
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, buf);
      const ts = Date.now();
      const settings = await mergeSettings({ mascotForm: 'custom', mascotCustomTs: ts, ropeStyle: 'mascot' });
      sendJson(res, 200, { ok: true, ts, settings });
    },
  });

  router.register({
    kind: 'exact',
    method: 'DELETE',
    path: `${BASE}/mascot/custom`,
    handler: async (_req, res) => {
      const p = getCustomMascotPath();
      try { if (existsSync(p)) unlinkSync(p); } catch {}
      const settings = await mergeSettings({ mascotForm: 'gemini', mascotCustomTs: 0 });
      sendJson(res, 200, { ok: true, settings });
    },
  });

  router.register({
    kind: 'exact',
    method: 'POST',
    path: `${BASE}/reset-all`,
    handler: async (_req, res) => {
      const cur = readSettings();
      const reset = await mergeSettings({
        ...DEFAULT_SETTINGS,
        wallpaperId: cur.wallpaperId || '',
        customSteamRoot: cur.customSteamRoot || '',
        customWallpaperDirs: cur.customWallpaperDirs || [],
        mascotCustomTs: cur.mascotCustomTs || 0,
      });
      sendJson(res, 200, { ok: true, settings: reset });
    },
  });

  // 7. Wallpaper User Properties
  router.register({
    kind: 'prefix',
    method: 'GET',
    path: `${BASE}/props`,
    handler: async (_req, res, pathname) => {
      await ensureInventory();
      const token = decodeURIComponent(pathname.slice(`${BASE}/props/`.length));
      const fileAbs = mediaMap.get(token);
      if (!fileAbs) {
        sendJson(res, 404, { ok: false, error: 'unknown-token' });
        return;
      }
      const pjPath = join(dirname(fileAbs), 'project.json');
      if (!existsSync(pjPath)) {
        sendJson(res, 200, { ok: true, token, props: [] });
        return;
      }
      try {
        const pj = JSON.parse(await readFile(pjPath, 'utf8'));
        const overrides = shimSeedKit.userPropsFor(token);
        const defs = parseUserPropDefs(pj, overrides, {
          filePrefix: entryDirPrefix(String((pj && pj.file) || '')),
        });
        sendJson(res, 200, { ok: true, token, props: defs });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: String((err && err.message) || err) });
      }
    },
  });

  router.register({
    kind: 'prefix',
    method: 'POST',
    path: `${BASE}/props`,
    handler: async (req, res, pathname) => {
      await ensureInventory();
      const token = decodeURIComponent(pathname.slice(`${BASE}/props/`.length));
      const fileAbs = mediaMap.get(token);
      if (!fileAbs) {
        sendJson(res, 404, { ok: false, error: 'unknown-token' });
        return;
      }
      const body = await readJsonBody(req);
      const rawOverrides = body && typeof body.overrides === 'object' ? body.overrides : {};
      const pjPath = join(dirname(fileAbs), 'project.json');
      let clean = rawOverrides;
      let defs = [];
      if (existsSync(pjPath)) {
        const pj = JSON.parse(await readFile(pjPath, 'utf8'));
        clean = filterKnownOverrides(pj, rawOverrides);
        defs = parseUserPropDefs(pj, clean, {
          filePrefix: entryDirPrefix(String((pj && pj.file) || '')),
        });
      }
      const cur = readSettings();
      const nextMap = { ...(cur.userProps || {}), [token]: clean };
      await mergeSettings({ userProps: nextMap });
      sendJson(res, 200, { ok: true, token, overrides: clean, props: defs });
    },
  });

  // 8. Preview / Media / Slides / Scene Video
  router.register({
    kind: 'prefix',
    method: null,
    path: `${BASE}/preview`,
    handler: async (req, res, pathname) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendText(res, 405, 'method not allowed');
        return;
      }
      await ensureInventory();
      const token = decodeURIComponent(pathname.slice(`${BASE}/preview/`.length));
      const abs = previewMap.get(token);
      if (!abs || !existsSync(abs)) {
        sendText(res, 404, 'preview not found');
        return;
      }
      serveKit.serveFile(abs, req, res, req.method === 'HEAD');
    },
  });

  router.register({
    kind: 'prefix',
    method: null,
    path: `${BASE}/media`,
    handler: async (req, res, pathname) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendText(res, 405, 'method not allowed');
        return;
      }
      await ensureInventory();
      const token = decodeURIComponent(pathname.slice(`${BASE}/media/`.length));
      const abs = mediaMap.get(token);
      if (!abs || !existsSync(abs)) {
        sendText(res, 404, 'media not found');
        return;
      }
      const layout = mp4VfsKit.layoutFor(abs);
      if (layout && layout.kind === 'virtual') {
        serveKit.serveLayout(layout, abs, req, res, req.method === 'HEAD');
      } else {
        serveKit.serveFile(abs, req, res, req.method === 'HEAD');
      }
    },
  });

  router.register({
    kind: 'prefix',
    method: 'GET',
    path: `${BASE}/slides`,
    handler: async (_req, res, pathname) => {
      await ensureInventory();
      const token = decodeURIComponent(pathname.slice(`${BASE}/slides/`.length));
      const entry = slideMap.get(token);
      if (!entry) {
        sendJson(res, 404, { ok: false, error: 'not-a-slideshow' });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        token,
        slideIntervalMs: entry.slideIntervalMs,
        slides: entry.slides.map((rel, idx) => ({
          index: idx,
          name: rel,
          url: `${BASE}/slide/${token}/${idx}`,
        })),
      });
    },
  });

  router.register({
    kind: 'prefix',
    method: null,
    path: `${BASE}/slide`,
    handler: async (req, res, pathname) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendText(res, 405, 'method not allowed');
        return;
      }
      await ensureInventory();
      const parts = pathname.slice(`${BASE}/slide/`.length).split('/');
      const token = decodeURIComponent(parts[0] || '');
      const idx = Number(parts[1]);
      const entry = slideMap.get(token);
      if (!entry || !Number.isInteger(idx) || idx < 0 || idx >= entry.slides.length) {
        sendText(res, 404, 'slide not found');
        return;
      }
      const abs = resolve(entry.dirAbs, entry.slides[idx]);
      if (!abs.startsWith(resolve(entry.dirAbs))) {
        sendText(res, 403, 'forbidden');
        return;
      }
      serveKit.serveFile(abs, req, res, req.method === 'HEAD');
    },
  });

  router.register({
    kind: 'prefix',
    method: null,
    path: `${BASE}/scene-video`,
    handler: async (req, res, pathname) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendText(res, 405, 'method not allowed');
        return;
      }
      await ensureInventory();
      const token = decodeURIComponent(pathname.slice(`${BASE}/scene-video/`.length));
      const mp4Path = await extractSceneVideoPath(token);
      if (!mp4Path) {
        sendText(res, 404, 'no embedded scene video');
        return;
      }
      serveKit.serveFile(mp4Path, req, res, req.method === 'HEAD');
    },
  });

  router.register({
    kind: 'exact',
    method: 'GET',
    path: `${BASE}/scene-payload-progress`,
    handler: (req, res) => {
      const u = new URL(req.url || '/', 'http://127.0.0.1');
      const token = u.searchParams.get('token') || '';
      sendJson(res, 200, payloadProgress(token));
    },
  });

  // 9. Fenced /scene-files (WebWallGL scene.pkg + strict-sandboxed web wallpapers)
  router.register({
    kind: 'prefix',
    method: null,
    path: `${BASE}/scene-files`,
    handler: async (req, res) => {
      await ensureInventory();
      serveKit.handleSceneFiles(req, res, 'app');
    },
  });

  // 10. WebWallGL Live Renderer static files + engine bundle
  router.register({
    kind: 'prefix',
    method: null,
    path: `${BASE}/scene-live`,
    handler: (req, res, pathname) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendText(res, 405, 'method not allowed');
        return;
      }
      let rel = pathname.slice(`${BASE}/scene-live`.length).replace(/^\/+/, '');
      if (!rel) rel = 'index.html';

      if (rel === 'engine/webwallgl.global.min.js' || rel === 'engine/webwallgl.mjs') {
        const pkgDir = resolveWebWallGLPkgDir();
        const fileName = rel.slice('engine/'.length);
        const abs = pkgDir ? join(pkgDir, fileName) : '';
        if (!abs || !existsSync(abs)) {
          sendText(res, 404, 'webwallgl engine not installed');
          return;
        }
        serveKit.serveFile(abs, req, res, req.method === 'HEAD', { revalidate: true });
        return;
      }

      const target = resolve(WEBWALLGL_DIR, rel);
      if (!target.startsWith(resolve(WEBWALLGL_DIR))) {
        sendText(res, 403, 'forbidden');
        return;
      }
      if (!existsSync(target) || !statSync(target).isFile()) {
        sendText(res, 404, 'not found');
        return;
      }
      if (rel === 'index.html') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method === 'HEAD') { res.end(); return; }
        res.end(readFileSync(target, 'utf8'));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', mimeForStatic(target));
      res.setHeader('Cache-Control', 'no-store');
      if (req.method === 'HEAD') { res.end(); return; }
      res.end(readFileSync(target));
    },
  });

  const server = http.createServer((req, res) => {
    router.dispatch(req, res);
  });

  function listen(port = 0, host = '127.0.0.1') {
    return new Promise((resolvePromise, rejectPromise) => {
      server.once('error', rejectPromise);
      server.listen(port, host, () => {
        server.off('error', rejectPromise);
        const addr = server.address();
        boundPort = typeof addr === 'object' && addr ? addr.port : Number(port) || 0;
        appendDiagLine('boot', { port: boundPort, host });
        resolvePromise({
          server,
          port: boundPort,
          apiBase: apiBaseUrl(),
          close,
          buildInventory,
        });
      });
    });
  }

  function close() {
    for (const s of activeStreams) {
      try { s.destroy(); } catch {}
    }
    activeStreams.clear();
    return new Promise((resolvePromise) => {
      try {
        server.close(() => resolvePromise());
      } catch {
        resolvePromise();
      }
    });
  }

  return { server, listen, close, buildInventory };
}

export async function startServer(opts = {}) {
  const port = Number(opts.port ?? process.env.AGY_WE_PORT ?? 0);
  const host = opts.host || '127.0.0.1';
  const instance = createWallpaperServer(opts);
  const info = await instance.listen(port, host);
  if (opts.writePortFile !== false) {
    try {
      atomicWriteJsonSync(join(getDataDir(), 'server.json'), {
        port: info.port,
        apiBase: info.apiBase,
        pid: process.pid,
        startedAt: new Date().toISOString(),
      });
    } catch {}
  }
  return info;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(__filename);
if (isMain) {
  const argv = process.argv.slice(2);
  let port = Number(process.env.AGY_WE_PORT || 0);
  const pIdx = argv.indexOf('--port');
  if (pIdx !== -1 && argv[pIdx + 1]) port = Number(argv[pIdx + 1]) || 0;

  startServer({ port, writePortFile: true })
    .then((info) => {
      process.stdout.write(`AGY_WE_READY:${JSON.stringify({ port: info.port, apiBase: info.apiBase, pid: process.pid })}\n`);
      const shutdown = () => {
        info.close().finally(() => process.exit(0));
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      process.stderr.write(`AGY_WE_ERROR:${String((err && err.message) || err)}\n`);
      process.exit(1);
    });
}
