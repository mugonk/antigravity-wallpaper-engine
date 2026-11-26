/**
 * Client state store, API client, and event bus for Antigravity Wallpaper Engine.
 */
(function initStateModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  const DEFAULT_STATE = {
    enabled: true,
    wallpaperId: '',
    paused: false,
    objectFit: 'cover',
    flip: false,
    layerScale: 100,
    layerPositionX: 50,
    layerPositionY: 50,
    wallpaperBlur: 0,
    wallpaperOpacity: 100,
    backgroundBrightness: 85,
    backgroundContrast: 110,
    backgroundSaturate: 150,
    wallpaperFilter: 'none',
    playbackRate: 1,
    videoVolume: 0,
    videoAudioEnabled: false,
    switchTransition: 'cut',
    switchTransitionSpeed: 'normal',
    sceneLive: true,
    sceneLiveFps: 60,
    sceneAutoQuality: false,
    scenePointerInteract: true,
    pauseOnHidden: true,
    pauseOnBlur: false,
    pauseOnBattery: false,
    startPaused: false,
    rotationEnabled: false,
    rotationIntervalSec: 300,
    rotationSource: 'all',
    pictureSlideSeconds: 30,
    glassEnabled: true,
    activePreset: 'agy-crystal',
    accent: '#75e6f5',
    scrim: 0.5,
    blur: 9,
    glassAlpha: 40,
    glassFidelity: 20,
    border: 0.35,
    glassColorLight: '#ffffff',
    glassColorDark: '#0a1622',
    leftSidebarGlass: true,
    rightSidebarGlass: true,
    headerGlass: false,
    composerGlass: true,
    chatCardGlass: true,
    modalGlass: true,
    leftSidebarRadius: 20,
    leftSidebarCorners: [0, 1, 1, 0],
    rightSidebarRadius: 20,
    rightSidebarCorners: [1, 0, 0, 1],
    textColorPrimary: '#f9fafb',
    textColorMuted: '#75e6f5',
    extraGlassSelectors: '',
    themeFollow: false,
    ropeShown: true,
    ropeStyle: 'mascot',
    mascotForm: 'whale',
    mascotScale: 115,
    mascotCustomTs: 0,
    ropeX: -1,
    ropeY: 0,
    fxEnabled: false,
    fxClick: true,
    fxClickStyle: 'ripple',
    fxClickSize: 140,
    fxClickGlow: 60,
    fxTrail: true,
    fxTrailStyle: 'comet',
    fxTrailLength: 420,
    fxTrailWidth: 3,
    fxTrailGlow: 60,
    fxOpacity: 85,
    fxBlend: 'screen',
    fxColorMode: 'accent',
    fxColor: '#4f8cff',
    parallaxEnabled: false,
    parallaxBg: 1.8,
    parallaxRope: true,
    parallaxUi: false,
    parallaxUiSidebarDepth: 1.2,
    parallaxUiComposerDepth: 1.6,
    parallaxUiChatDepth: 0.8,
    parallaxSmooth: 85,
    fontCustom: true,
    uiFontFamily: '',
    monoFontFamily: '',
    uiFontScale: 100,
    caretColor: '',
    perfEnabled: false,
    perfFloat: false,
    perfFloatX: -1,
    perfFloatY: -1,
    typeFilter: ['scene', 'web', 'video', 'image'],
    contentRatingFilter: ['everyone', 'pg13', 'mature', 'unrated'],
    orientationFilter: 'all',
    hiddenIds: [],
    favoriteIds: [],
    userProps: {},
    customSteamRoot: '',
    customWallpaperDirs: [],
  };

  function createStore(config) {
    const apiBase = String((config && config.apiBase) || '').replace(/\/+$/, '');
    const listeners = new Set();
    let settings = { ...DEFAULT_STATE };
    let inventory = {
      installDir: null,
      libraryDirs: [],
      uploadDir: '',
      webwallglAvailable: false,
      mediaBase: apiBase,
      sceneMediaBase: apiBase,
      total: 0,
      playlists: [],
      wallpapers: [],
      loaded: false,
    };
    let presets = [];
    let systemFonts = { families: [], builtin: [], builtinMono: [], source: 'idle', approximate: false };
    let runtimeTelemetry = {
      wallpaperFps: 0,
      uiFps: 0,
      activeMode: 'idle',
      activeTitle: '',
      occlusionReason: '',
      pausedEffective: false,
      serverOk: false,
      lastError: '',
      liveFallback: false,
    };
    let saveTimer = null;
    let pendingPatch = {};

    function emit(topic) {
      for (const fn of listeners) {
        try { fn(topic || 'all'); } catch {}
      }
    }

    function subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }

    function apiUrl(path) {
      if (!path) return apiBase;
      if (/^https?:\/\//i.test(path)) return path;
      return `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    async function apiFetch(path, opts = {}) {
      const url = apiUrl(path);
      const res = await fetch(url, opts);
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = (body && typeof body === 'object' && body.error) ? body.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return body;
    }

    async function loadSettings() {
      const data = await apiFetch('/wallpaper-engine/settings');
      if (data && data.settings) {
        settings = { ...DEFAULT_STATE, ...data.settings };
        if (settings.startPaused) settings.paused = true;
        runtimeTelemetry.serverOk = true;
        emit('settings');
      }
      return settings;
    }

    function flushPatch() {
      const patch = pendingPatch;
      pendingPatch = {};
      if (!Object.keys(patch).length) return Promise.resolve(settings);
      return apiFetch('/wallpaper-engine/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).then((data) => {
        if (data && data.settings) {
          settings = { ...settings, ...data.settings };
        }
        return settings;
      }).catch((err) => {
        runtimeTelemetry.lastError = String((err && err.message) || err);
        return settings;
      });
    }

    function updateSettings(patch, immediate = false) {
      if (!patch || typeof patch !== 'object') return;
      settings = { ...settings, ...patch };
      Object.assign(pendingPatch, patch);
      emit('settings');
      if (saveTimer) clearTimeout(saveTimer);
      if (immediate) {
        saveTimer = null;
        flushPatch();
      } else {
        saveTimer = setTimeout(() => {
          saveTimer = null;
          flushPatch();
        }, 160);
      }
    }

    async function loadInventory(forceRescan = false) {
      const data = forceRescan
        ? await apiFetch('/wallpaper-engine/rescan', { method: 'POST' })
        : await apiFetch('/wallpaper-engine/inventory');
      if (data && typeof data === 'object') {
        inventory = { ...inventory, ...data, loaded: true };
        runtimeTelemetry.serverOk = true;
        emit('inventory');
      }
      return inventory;
    }

    async function loadPresets() {
      const data = await apiFetch('/wallpaper-engine/presets');
      if (data && Array.isArray(data.presets)) {
        presets = data.presets;
        emit('presets');
      }
      return presets;
    }

    async function savePreset(name) {
      const data = await apiFetch('/wallpaper-engine/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, values: settings }),
      });
      await loadPresets();
      return data;
    }

    async function deletePreset(id) {
      await apiFetch(`/wallpaper-engine/presets/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadPresets();
    }

    async function loadSystemFonts(refresh = false) {
      const data = await apiFetch(`/wallpaper-engine/system-fonts${refresh ? '?refresh=1' : ''}`);
      if (data && typeof data === 'object') {
        systemFonts = data;
        emit('fonts');
      }
      return systemFonts;
    }

    async function uploadFile(file) {
      const buf = await file.arrayBuffer();
      const data = await apiFetch('/wallpaper-engine/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name || 'wallpaper.png'),
          'X-Wallpaper-Title': encodeURIComponent((file.name || '').replace(/\.[^.]+$/, '')),
        },
        body: buf,
      });
      await loadInventory(true);
      return data;
    }

    async function importUrl(url, title, type) {
      const data = await apiFetch('/wallpaper-engine/url-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title, type }),
      });
      await loadInventory(true);
      return data;
    }

    async function deleteUpload(id) {
      await apiFetch(`/wallpaper-engine/upload/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (settings.wallpaperId === id) {
        updateSettings({ wallpaperId: '' }, true);
      }
      await loadInventory(true);
    }

    async function loadProps(token) {
      return apiFetch(`/wallpaper-engine/props/${encodeURIComponent(token)}`);
    }

    async function saveProps(token, overrides) {
      const data = await apiFetch(`/wallpaper-engine/props/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides }),
      });
      const nextProps = { ...(settings.userProps || {}), [token]: overrides };
      settings = { ...settings, userProps: nextProps };
      emit('props');
      return data;
    }

    async function loadDiagLog() {
      return apiFetch('/wallpaper-engine/diag-log');
    }

    async function uploadMascotCustom(file) {
      const buf = await file.arrayBuffer();
      const data = await apiFetch('/wallpaper-engine/mascot/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      });
      if (data && data.settings) {
        settings = { ...settings, ...data.settings };
        emit('settings');
      }
      return data;
    }

    async function clearMascotCustom() {
      const data = await apiFetch('/wallpaper-engine/mascot/custom', { method: 'DELETE' });
      if (data && data.settings) {
        settings = { ...settings, ...data.settings };
        emit('settings');
      }
      return data;
    }

    async function resetAllSettings() {
      const data = await apiFetch('/wallpaper-engine/reset-all', { method: 'POST' });
      if (data && data.settings) {
        settings = { ...DEFAULT_STATE, ...data.settings };
        emit('settings');
      }
      return data;
    }

    function getActiveWallpaper() {
      if (!settings.wallpaperId) return null;
      return (inventory.wallpapers || []).find((w) => w.id === settings.wallpaperId) || null;
    }

    function setTelemetry(patch) {
      Object.assign(runtimeTelemetry, patch);
      emit('telemetry');
    }

    return {
      apiBase,
      apiUrl,
      apiFetch,
      subscribe,
      emit,
      getSettings: () => settings,
      getInventory: () => inventory,
      getPresets: () => presets,
      getSystemFonts: () => systemFonts,
      getTelemetry: () => runtimeTelemetry,
      getActiveWallpaper,
      setTelemetry,
      loadSettings,
      updateSettings,
      loadInventory,
      loadPresets,
      savePreset,
      deletePreset,
      loadSystemFonts,
      uploadFile,
      importUrl,
      deleteUpload,
      loadProps,
      saveProps,
      loadDiagLog,
      uploadMascotCustom,
      clearMascotCustom,
      resetAllSettings,
    };
  }

  NS.DEFAULT_STATE = DEFAULT_STATE;
  NS.createStore = createStore;
})();
