'use strict';

/**
 * Electron Main-Process Runtime Hook for Antigravity Wallpaper Engine.
 * - Coexists cleanly with antigravity-zh-cn (independent global guard & ASAR marker).
 * - Zero Agent token overhead (no MCP server exposed).
 * - Starts isolated local 127.0.0.1 loopback media server via ELECTRON_RUN_AS_NODE.
 * - Relaxes CSP strictly for this plugin's loopback origin only.
 * - Injects runtime/renderer.bundle.js into Antigravity Hub webContents with hot-reload.
 */
if (!process.versions || !process.versions.electron || process.type !== 'browser') {
  return;
}

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const exeName = path.basename(process.execPath || '').toLowerCase();
if (exeName !== 'antigravity.exe' && exeName !== 'antigravity') {
  return;
}

if (global.__AGY_WE_HOOK_LOADED__) {
  return;
}
global.__AGY_WE_HOOK_LOADED__ = true;

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SERVER_SCRIPT = path.join(PLUGIN_ROOT, 'server', 'index.mjs');
const BUNDLE_PATH = path.join(__dirname, 'renderer.bundle.js');
const HEARTBEAT_PATH = path.join(__dirname, '.heartbeat.json');
const POST_UPDATE_SCRIPT = path.join(PLUGIN_ROOT, 'scripts', 'post-update-guard.mjs');

let electron;
try {
  electron = require('electron');
} catch {
  return;
}
if (!electron || !electron.app) {
  return;
}

const heartbeatState = {
  pluginVersion: '1.0.0',
  mode: global.__AGY_WE_MODE__ || 'asar',
  electronVersion: process.versions.electron || '',
  appVersion: '',
  installedVersion: '',
  pid: process.pid,
  serverPid: null,
  serverPort: null,
  apiBase: '',
  startedAt: new Date().toISOString(),
  domInjections: 0,
  lastInjectedUrl: '',
  lastError: '',
};

function writeHeartbeat() {
  try {
    try {
      const versionFile = path.join(path.dirname(process.execPath), 'version');
      if (fs.existsSync(versionFile)) {
        heartbeatState.installedVersion = fs.readFileSync(versionFile, 'utf8').trim();
      }
    } catch {}
    if (electron.app && typeof electron.app.getVersion === 'function') {
      heartbeatState.appVersion = electron.app.getVersion();
    }
    heartbeatState.updatedAt = new Date().toISOString();
    fs.writeFileSync(HEARTBEAT_PATH, JSON.stringify(heartbeatState, null, 2), 'utf8');
  } catch {}
}

writeHeartbeat();

// 1. Start local loopback media server child process
let serverChild = null;
let serverInfo = null;
let resolveServerReady = null;
const serverReadyPromise = new Promise((resolve) => {
  resolveServerReady = resolve;
});

function startMediaServer(fixedPort = 0) {
  if (!fs.existsSync(SERVER_SCRIPT)) {
    heartbeatState.lastError = `missing server script: ${SERVER_SCRIPT}`;
    writeHeartbeat();
    resolveServerReady(null);
    return;
  }
  try {
    const childEnv = Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' });
    if (fixedPort > 0) childEnv.AGY_WE_PORT = String(fixedPort);
    const child = spawn(process.execPath, [SERVER_SCRIPT], {
      cwd: PLUGIN_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: childEnv,
    });
    serverChild = child;
    heartbeatState.serverPid = child.pid || null;
    writeHeartbeat();

    let buf = '';
    child.stdout.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('AGY_WE_READY:')) {
          try {
            const info = JSON.parse(line.slice('AGY_WE_READY:'.length));
            if (info && info.apiBase) {
              const prevBase = serverInfo ? serverInfo.apiBase : '';
              const portChanged = Boolean(prevBase && prevBase !== info.apiBase);
              serverInfo = info;
              heartbeatState.serverPort = info.port || null;
              heartbeatState.apiBase = info.apiBase;
              heartbeatState.lastError = '';
              writeHeartbeat();
              resolveServerReady(info);
              // Only re-inject renderer if the server port actually changed (prevents tearing down WebWallGL twice!)
              if (portChanged) {
                for (const wc of activeWebContents) {
                  scheduleInject(wc, true, 160);
                }
              }
            }
          } catch {}
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString('utf8').trim();
      if (text) {
        heartbeatState.lastError = text.slice(0, 300);
        writeHeartbeat();
      }
    });

    child.on('exit', () => {
      if (serverChild === child) serverChild = null;
      if (!serverInfo) resolveServerReady(null);
    });
  } catch (err) {
    heartbeatState.lastError = String((err && err.message) || err);
    writeHeartbeat();
    resolveServerReady(null);
  }
}

let serverRestartTimer = null;
let serverRestarting = false;
function restartMediaServer() {
  if (serverRestarting) return;
  serverRestarting = true;
  const prevPort = (serverInfo && serverInfo.port) || 0;
  const prev = serverChild;
  const launch = () => {
    setTimeout(() => {
      serverRestarting = false;
      startMediaServer(prevPort);
    }, 180);
  };
  if (prev) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      launch();
    };
    prev.once('exit', finish);
    try { prev.kill(); } catch {}
    setTimeout(finish, 900);
  } else {
    launch();
  }
}

startMediaServer();

// 2. Patch CSP strictly to allow this plugin's loopback origin (127.0.0.1:<port>)
function appendCspSource(csp, directive, origin) {
  const re = new RegExp(`(^|;\\s*)${directive}([^;]*)`, 'i');
  if (re.test(csp)) {
    return csp.replace(re, (full, prefix, rest) => {
      if (rest.includes(origin)) return full;
      return `${prefix}${directive}${rest} ${origin}`;
    });
  }
  return csp;
}

function patchCspHeaderValue(raw, origin) {
  if (!raw || typeof raw !== 'string' || !origin) return raw;
  let out = raw;
  for (const dir of ['default-src', 'connect-src', 'img-src', 'media-src', 'frame-src', 'child-src']) {
    out = appendCspSource(out, dir, origin);
  }
  if (/style-src/i.test(out) && !/style-src[^;]*'unsafe-inline'/i.test(out)) {
    out = appendCspSource(out, 'style-src', "'unsafe-inline'");
  }
  return out;
}

// 3. Inject renderer bundle into Antigravity Hub webContents
const activeWebContents = new Set();
const injectTimers = new WeakMap();
const injectInFlight = new WeakSet();
const injectPendingForce = new WeakMap();

function isCandidateHubUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('devtools:')) return false;
  // Never inject into our own media/WebWallGL iframe origin
  if (serverInfo && serverInfo.apiBase && url.startsWith(serverInfo.apiBase)) return false;
  if (/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(url)) return true;
  if (/^(?:file|antigravity[a-z0-9-]*|app):\/\//i.test(url)) return true;
  return false;
}

function scheduleInject(wc, forceReload = false, delayMs = 90) {
  if (!wc || wc.isDestroyed()) return;
  if (forceReload) injectPendingForce.set(wc, true);
  const prev = injectTimers.get(wc);
  if (prev) clearTimeout(prev);
  const t = setTimeout(() => {
    injectTimers.delete(wc);
    const wantForce = Boolean(injectPendingForce.get(wc));
    injectPendingForce.delete(wc);
    injectIntoWebContents(wc, wantForce);
  }, delayMs);
  injectTimers.set(wc, t);
}

function injectIntoWebContents(wc, forceReload = false) {
  if (!wc || wc.isDestroyed()) return;
  if (!serverInfo || !serverInfo.apiBase) {
    serverReadyPromise.then((info) => {
      if (info && !wc.isDestroyed()) scheduleInject(wc, forceReload, 50);
    });
    return;
  }
  const url = typeof wc.getURL === 'function' ? (wc.getURL() || '') : '';
  if (!isCandidateHubUrl(url)) return;
  if (!fs.existsSync(BUNDLE_PATH)) return;
  if (injectInFlight.has(wc)) {
    if (forceReload) injectPendingForce.set(wc, true);
    return;
  }

  injectInFlight.add(wc);
  try {
    const stat = fs.statSync(BUNDLE_PATH);
    const buildStamp = `${stat.size}-${Math.round(stat.mtimeMs)}`;
    const bundleSrc = fs.readFileSync(BUNDLE_PATH, 'utf8');
    const cfg = {
      apiBase: serverInfo.apiBase,
      version: heartbeatState.pluginVersion,
      buildStamp,
      forceReload: Boolean(forceReload),
    };
    // Fast-path: if already mounted with same apiBase & buildStamp and DOM intact, just rescan & keep alive
    const guardScript = `
      (function(){
        var cfg = ${JSON.stringify(cfg)};
        var isHub = Boolean(window.electronNative || window.nativeStorage || window.agent || window.electronUpdater);
        if (!isHub) return 'skip-non-hub';
        var cur = window.__AGY_WE__;
        if (!cfg.forceReload && cur && cur.apiBase === cfg.apiBase && cur.buildStamp === cfg.buildStamp) {
          if (typeof cur.onNavigate === 'function') cur.onNavigate();
          if (document.getElementById('agy-we-ui-root') && document.getElementById('agy-we-bg-layer')) {
            return 'reused';
          }
        }
        window.__AGY_WE_CONFIG__ = cfg;
        return 'need-mount';
      })();
    `;
    wc.executeJavaScript(guardScript, true)
      .then((state) => {
        if (state === 'reused' || state === 'skip-non-hub') return;
        const code = `window.__AGY_WE_CONFIG__ = ${JSON.stringify(cfg)};\n${bundleSrc}\nBoolean(window.__AGY_WE__);`;
        return wc.executeJavaScript(code, true).then((ok) => {
          if (ok) {
            heartbeatState.domInjections += 1;
            heartbeatState.lastInjectedUrl = url.replace(/([?&](?:token|auth|csrf|key)=)[^&]+/gi, '$1[REDACTED]');
            writeHeartbeat();
          }
        });
      })
      .catch(() => {})
      .finally(() => {
        injectInFlight.delete(wc);
        if (injectPendingForce.get(wc) && !wc.isDestroyed()) {
          injectPendingForce.delete(wc);
          scheduleInject(wc, true, 120);
        }
      });
  } catch {
    injectInFlight.delete(wc);
  }
}

electron.app.on('web-contents-created', (_event, wc) => {
  if (!wc) return;
  activeWebContents.add(wc);
  wc.on('destroyed', () => {
    activeWebContents.delete(wc);
    const t = injectTimers.get(wc);
    if (t) clearTimeout(t);
    injectTimers.delete(wc);
  });
  wc.on('dom-ready', () => scheduleInject(wc, false, 60));
  wc.on('did-finish-load', () => scheduleInject(wc, false, 120));
  wc.on('did-navigate', () => scheduleInject(wc, false, 120));
  wc.on('did-navigate-in-page', () => scheduleInject(wc, false, 100));
});

electron.app.whenReady().then(() => {
  writeHeartbeat();

  // Register scoped CSP patch once app is ready
  try {
    const ses = electron.session && electron.session.defaultSession;
    if (ses && ses.webRequest) {
      ses.webRequest.onHeadersReceived((details, callback) => {
        const headers = details.responseHeaders;
        if (!headers || !serverInfo || !serverInfo.apiBase) {
          callback({ responseHeaders: headers });
          return;
        }
        // Only patch Hub documents, skip external internet responses
        if (!isCandidateHubUrl(details.url || '')) {
          callback({ responseHeaders: headers });
          return;
        }
        const origin = serverInfo.apiBase;
        for (const key of Object.keys(headers)) {
          if (key.toLowerCase() === 'content-security-policy') {
            const vals = Array.isArray(headers[key]) ? headers[key] : [headers[key]];
            headers[key] = vals.map((v) => patchCspHeaderValue(String(v), origin));
          }
        }
        callback({ responseHeaders: headers });
      });
    }
  } catch {}

  // Hot-reload renderer bundle ONLY when its size/mtime actually changed (prevents duplicate Windows watch bursts)
  try {
    let reloadTimer = null;
    let lastBundleStamp = '';
    try {
      const st0 = fs.statSync(BUNDLE_PATH);
      lastBundleStamp = `${st0.size}-${Math.round(st0.mtimeMs)}`;
    } catch {}
    fs.watch(__dirname, (_ev, filename) => {
      if (filename !== 'renderer.bundle.js') return;
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        reloadTimer = null;
        try {
          const st = fs.statSync(BUNDLE_PATH);
          const stamp = `${st.size}-${Math.round(st.mtimeMs)}`;
          if (stamp === lastBundleStamp) return;
          lastBundleStamp = stamp;
        } catch {
          return;
        }
        for (const wc of activeWebContents) {
          scheduleInject(wc, true, 120);
        }
      }, 450);
    });
  } catch {}

  // Hot-restart local media server ONLY when server/*.mjs bytes/mtime actually changed
  try {
    const serverDir = path.join(PLUGIN_ROOT, 'server');
    const getServerSig = () => {
      try {
        return fs.readdirSync(serverDir)
          .filter((f) => f.endsWith('.mjs'))
          .sort()
          .map((f) => {
            const st = fs.statSync(path.join(serverDir, f));
            return `${f}:${st.size}:${Math.round(st.mtimeMs)}`;
          })
          .join('|');
      } catch {
        return '';
      }
    };
    let lastServerSig = getServerSig();
    fs.watch(serverDir, (_ev, filename) => {
      if (!filename || !filename.endsWith('.mjs')) return;
      if (serverRestartTimer) clearTimeout(serverRestartTimer);
      serverRestartTimer = setTimeout(() => {
        serverRestartTimer = null;
        const sig = getServerSig();
        if (!sig || sig === lastServerSig) return;
        lastServerSig = sig;
        restartMediaServer();
      }, 650);
    });
  } catch {}
}).catch(() => {});

// 4. Clean shutdown + auto-update survival guard
let guardSpawned = false;
electron.app.on('before-quit', () => {
  if (serverChild) {
    try { serverChild.kill(); } catch {}
    serverChild = null;
  }
  if (guardSpawned) return;
  try {
    const updaterDir = path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
      'antigravity-updater',
      'pending'
    );
    const hasPendingUpdate = fs.existsSync(updaterDir) && fs.readdirSync(updaterDir).length > 0;
    if (hasPendingUpdate && fs.existsSync(POST_UPDATE_SCRIPT)) {
      guardSpawned = true;
      const child = spawn(process.execPath, [POST_UPDATE_SCRIPT], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }),
      });
      child.unref();
    }
  } catch {}
});
