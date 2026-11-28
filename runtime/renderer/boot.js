/**
 * Entrypoint & Hot-Reload Bootstrap for Antigravity Wallpaper Engine Renderer.
 */
(function initBootModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  function isAntigravityHub(cfg) {
    if (cfg && cfg.allowAnyHost) return true;
    return Boolean(
      window.electronNative || window.nativeStorage || window.agent || window.electronUpdater
    );
  }

  function mount(config) {
    const cfg = config || window.__AGY_WE_CONFIG__ || {};
    if (!cfg.apiBase) return null;
    if (!isAntigravityHub(cfg)) return null;

    if (
      !cfg.forceReload &&
      window.__AGY_WE__ &&
      window.__AGY_WE__.apiBase === cfg.apiBase &&
      window.__AGY_WE__.buildStamp === cfg.buildStamp &&
      document.getElementById('agy-we-ui-root') &&
      document.getElementById('agy-we-bg-layer')
    ) {
      if (typeof window.__AGY_WE__.onNavigate === 'function') {
        window.__AGY_WE__.onNavigate();
      }
      return window.__AGY_WE__;
    }

    if (window.__AGY_WE__ && typeof window.__AGY_WE__.destroy === 'function') {
      try { window.__AGY_WE__.destroy(); } catch {}
    }

    const store = NS.createStore(cfg);
    const wallpaperLayer = NS.createWallpaperLayer(store);
    const glassEngine = NS.createGlassEngine(store);
    const fxParallax = NS.createFxParallax(store);
    const uiPanel = NS.createUiPanel(store, wallpaperLayer);

    // Self-heal guard: if React or a route change ever removes our nodes from body, re-attach them
    const keepAliveObs = new MutationObserver(() => {
      if (!document.body) return;
      try { wallpaperLayer.ensureMounted && wallpaperLayer.ensureMounted(); } catch {}
      try { uiPanel.ensureMounted && uiPanel.ensureMounted(); } catch {}
    });
    if (document.body) {
      keepAliveObs.observe(document.body, { childList: true });
    }

    // Initial async hydration
    Promise.all([
      store.loadSettings().catch(() => null),
      store.loadInventory(false).catch(() => null),
      store.loadPresets().catch(() => null),
    ]).then(() => {
      const s = store.getSettings();
      if (s.fontCustom) {
        store.loadSystemFonts(false).catch(() => {});
      }
      store.emit('all');
    });

    const api = {
      version: cfg.version || '1.0.2',
      buildStamp: cfg.buildStamp || '',
      apiBase: cfg.apiBase,
      store,
      togglePanel: () => uiPanel.toggle(),
      openPanel: () => uiPanel.setOpen(true),
      closePanel: () => uiPanel.setOpen(false),
      nextWallpaper: () => wallpaperLayer.pickNextWallpaper(),
      onNavigate: () => {
        try { wallpaperLayer.ensureMounted && wallpaperLayer.ensureMounted(); } catch {}
        try { uiPanel.ensureMounted && uiPanel.ensureMounted(); } catch {}
        try { glassEngine.rescanDom(); } catch {}
      },
      reload: () => Promise.all([store.loadSettings(), store.loadInventory(true), store.loadPresets()]),
      destroy() {
        try { keepAliveObs.disconnect(); } catch {}
        try { uiPanel.destroy(); } catch {}
        try { fxParallax.destroy(); } catch {}
        try { glassEngine.destroy(); } catch {}
        try { wallpaperLayer.destroy(); } catch {}
        if (window.__AGY_WE__ === api) delete window.__AGY_WE__;
      },
    };

    window.__AGY_WE__ = api;
    return api;
  }

  NS.mount = mount;
  if (typeof document !== 'undefined' && window.__AGY_WE_CONFIG__) {
    if (document.body) {
      mount(window.__AGY_WE_CONFIG__);
    } else {
      window.addEventListener('DOMContentLoaded', () => mount(window.__AGY_WE_CONFIG__), { once: true });
    }
  }
})();
