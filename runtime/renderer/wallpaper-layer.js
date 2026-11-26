/**
 * Wallpaper Layer Renderer:
 * Renders Image (single & slideshow), Video, and Live WebWallGL Scene/Web iframes
 * underneath Antigravity's UI (z-index: -2, zero interference with host fixed portals),
 * with zero-flash poster-to-live handoff, blur edge compensation, smooth transitions,
 * power-saving occlusion pause, playlist/favorites rotation, and pointer forwarding.
 */
(function initWallpaperLayerModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  const FILTER_PRESETS = {
    none: '',
    blur: 'blur(14px)',
    grayscale: 'grayscale(1)',
    sepia: 'sepia(0.75)',
    vivid: 'saturate(1.6)',
    warm: 'sepia(0.35) saturate(1.35) brightness(1.05)',
    cool: 'sepia(0.25) hue-rotate(175deg) saturate(1.3) brightness(1.03)',
    invert: 'invert(1)',
    brighten: 'brightness(1.3)',
    darken: 'brightness(0.72)',
    contrast: 'contrast(1.35)',
  };

  function createWallpaperLayer(store) {
    let root = document.getElementById('agy-we-bg-layer');
    if (root) root.remove();

    root = document.createElement('div');
    root.id = 'agy-we-bg-layer';
    root.setAttribute('aria-hidden', 'true');
    root.setAttribute('data-agy-zh-skip', 'true');
    root.innerHTML = '<div id="agy-we-poster"></div><div id="agy-we-stage"></div><div id="agy-we-scrim"></div>';
    document.body.prepend(root);

    const poster = root.querySelector('#agy-we-poster');
    const stage = root.querySelector('#agy-we-stage');
    const scrim = root.querySelector('#agy-we-scrim');

    let currentItemKey = '';
    let currentMediaEl = null;
    let liveIframe = null;
    let liveIframeGen = 0;
    let liveReadyFallbackTimer = null;
    let posterFadeTimer = null;
    let slideTimer = null;
    let slideList = [];
    let slideIndex = 0;
    let rotationTimer = null;
    let batteryLow = false;
    let docHidden = document.hidden;
    let winBlurred = false;
    let overlayPaused = false;
    let destroyed = false;

    function ensureMounted() {
      if (destroyed || !document.body) return;
      if (!root.isConnected) {
        document.body.prepend(root);
      }
    }

    function buildFilterCss(s) {
      const parts = [];
      if (s.wallpaperBlur > 0) parts.push(`blur(${s.wallpaperBlur}px)`);
      if (s.backgroundBrightness !== 100) parts.push(`brightness(${s.backgroundBrightness}%)`);
      if (s.backgroundContrast !== 100) parts.push(`contrast(${s.backgroundContrast}%)`);
      if (s.backgroundSaturate !== 100) parts.push(`saturate(${s.backgroundSaturate}%)`);
      const preset = FILTER_PRESETS[s.wallpaperFilter] || '';
      if (preset) parts.push(preset);
      return parts.join(' ') || 'none';
    }

    function computePaused(s) {
      if (!s.enabled) return { paused: true, reason: 'disabled' };
      if (s.paused) return { paused: true, reason: 'manual' };
      if (overlayPaused) return { paused: true, reason: 'overlay' };
      if (s.pauseOnHidden && docHidden) return { paused: true, reason: 'hidden' };
      if (s.pauseOnBlur && winBlurred) return { paused: true, reason: 'blur' };
      if (s.pauseOnBattery && batteryLow) return { paused: true, reason: 'battery' };
      return { paused: false, reason: '' };
    }

    function sendLiveCmd(method, args = []) {
      if (!liveIframe || !liveIframe.contentWindow) return;
      try {
        liveIframe.contentWindow.postMessage({ __agyWeCmd: true, method, args }, '*');
      } catch {}
    }

    function clearLiveTimers() {
      if (liveReadyFallbackTimer) {
        clearTimeout(liveReadyFallbackTimer);
        liveReadyFallbackTimer = null;
      }
      if (posterFadeTimer) {
        clearTimeout(posterFadeTimer);
        posterFadeTimer = null;
      }
    }

    function setPoster(url, s) {
      if (posterFadeTimer) {
        clearTimeout(posterFadeTimer);
        posterFadeTimer = null;
      }
      if (!url) {
        poster.style.opacity = '0';
        poster.style.backgroundImage = '';
        return;
      }
      poster.style.transition = 'none';
      poster.style.backgroundImage = `url("${url}")`;
      poster.style.backgroundSize = s.objectFit === 'contain' ? 'contain' : 'cover';
      poster.style.backgroundPosition = `${s.layerPositionX ?? 50}% ${s.layerPositionY ?? 50}%`;
      poster.style.opacity = '1';
    }

    function fadeOutPoster(delayMs = 520) {
      if (posterFadeTimer) clearTimeout(posterFadeTimer);
      posterFadeTimer = setTimeout(() => {
        posterFadeTimer = null;
        poster.style.transition = 'opacity 360ms ease';
        poster.style.opacity = '0';
      }, delayMs);
    }

    function revealLiveIframe() {
      if (!liveIframe) return;
      if (liveReadyFallbackTimer) {
        clearTimeout(liveReadyFallbackTimer);
        liveReadyFallbackTimer = null;
      }
      liveIframe.style.opacity = '1';
      liveIframe.style.transform = 'none';
      fadeOutPoster(540);
    }

    function applyVisualStyles(s) {
      const wp = store.getActiveWallpaper();
      const hasWp = Boolean(s.enabled && wp);
      root.style.display = hasWp ? 'block' : 'none';
      document.documentElement.classList.toggle('agy-we-active', hasWp);
      if (!hasWp) {
        document.documentElement.style.removeProperty('--agy-we-underlay');
        return;
      }

      // Underlay fallback prevents white flash during minimize/restore or route swap
      const underlay = (wp && wp.schemeColor) ? wp.schemeColor : '#0b1020';
      document.documentElement.style.setProperty('--agy-we-underlay', underlay);

      // Blur edge compensation prevents dark/transparent vignette around viewport edges
      const baseScale = (s.layerScale || 100) / 100;
      const effBlur = (Number(s.wallpaperBlur) || 0) + (s.wallpaperFilter === 'blur' ? 14 : 0);
      const minDim = Math.max(320, Math.min(window.innerWidth || 1280, window.innerHeight || 720));
      const blurComp = effBlur > 0 ? (1 + (effBlur * 2.6) / minDim) : 1;
      const scale = baseScale * blurComp;
      const flipX = s.flip ? -1 : 1;

      const filterCss = buildFilterCss(s);
      const transformCss = (scale !== 1 || flipX !== 1) ? `scale(${(scale * flipX).toFixed(4)}, ${scale.toFixed(4)})` : 'none';
      const originCss = `${s.layerPositionX ?? 50}% ${s.layerPositionY ?? 50}%`;

      stage.style.opacity = String((s.wallpaperOpacity ?? 100) / 100);
      stage.style.filter = filterCss;
      stage.style.transform = transformCss;
      stage.style.transformOrigin = originCss;

      poster.style.filter = filterCss;
      poster.style.transform = transformCss;
      poster.style.transformOrigin = originCss;

      // Clean uniform readability scrim matching upstream DeepSeek Harness (scrim=0.50 => rgba(0,0,0,0.50))
      const sc = Math.min(0.85, Math.max(0, Number(s.scrim ?? 0.50)));
      if (sc > 0) {
        scrim.style.background = `rgba(0, 0, 0, ${sc.toFixed(3)})`;
      } else {
        scrim.style.background = 'transparent';
      }

      const fit = s.objectFit === 'stretch' ? 'fill' : (s.objectFit || 'cover');
      const pos = `${s.layerPositionX ?? 50}% ${s.layerPositionY ?? 50}%`;
      if (currentMediaEl && (currentMediaEl.tagName === 'IMG' || currentMediaEl.tagName === 'VIDEO')) {
        currentMediaEl.style.objectFit = fit;
        currentMediaEl.style.objectPosition = pos;
      }
      if (currentMediaEl && currentMediaEl.tagName === 'VIDEO') {
        currentMediaEl.playbackRate = Number(s.playbackRate) || 1;
        const vol = s.videoAudioEnabled ? Math.max(0, Math.min(1, (Number(s.videoVolume) || 0) / 100)) : 0;
        currentMediaEl.muted = vol === 0;
        currentMediaEl.volume = vol;
      }
      if (liveIframe) {
        sendLiveCmd('setFit', [s.objectFit || 'cover']);
        sendLiveCmd('setSceneFps', [Number(s.sceneLiveFps) || 30]);
        const vol = s.videoAudioEnabled ? Math.max(0, Math.min(1, (Number(s.videoVolume) || 0) / 100)) : 0;
        sendLiveCmd('setVolume', [vol]);
      }

      const pauseState = computePaused(s);
      store.setTelemetry({
        pausedEffective: pauseState.paused,
        occlusionReason: pauseState.reason,
      });

      if (currentMediaEl && currentMediaEl.tagName === 'VIDEO') {
        if (pauseState.paused) {
          try { currentMediaEl.pause(); } catch {}
        } else {
          currentMediaEl.play().catch(() => {});
        }
      }
      if (liveIframe) {
        sendLiveCmd(pauseState.paused ? 'pause' : 'resume', []);
      }
    }

    function clearSlideshow() {
      if (slideTimer) {
        clearInterval(slideTimer);
        slideTimer = null;
      }
      slideList = [];
      slideIndex = 0;
    }

    function transitionDurationMs(speed) {
      if (speed === 'fast') return 260;
      if (speed === 'slow') return 820;
      return 480;
    }

    function mountElement(el, s, waitForManualReveal = false) {
      const old = currentMediaEl;
      currentMediaEl = el;
      el.classList.add('agy-we-media');
      const mode = s.switchTransition || 'fade';
      const dur = mode === 'cut' ? 0 : transitionDurationMs(s.switchTransitionSpeed);
      const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

      if (dur > 0 || waitForManualReveal) {
        const effDur = waitForManualReveal ? Math.max(dur, 520) : dur;
        el.style.transition = `opacity ${effDur}ms ${ease}, transform ${effDur}ms ${ease}`;
        el.style.opacity = '0';
        if (!waitForManualReveal) {
          if (mode === 'slide') el.style.transform = 'translate3d(3%, 0, 0)';
          else if (mode === 'zoom') el.style.transform = 'scale(1.045)';
        }
      }

      stage.appendChild(el);

      if (!waitForManualReveal && dur > 0) {
        const reveal = () => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        };
        if (el.tagName === 'IMG' && !el.complete) {
          el.addEventListener('load', () => requestAnimationFrame(reveal), { once: true });
          el.addEventListener('error', () => requestAnimationFrame(reveal), { once: true });
          setTimeout(reveal, 600);
        } else {
          requestAnimationFrame(() => requestAnimationFrame(reveal));
          setTimeout(reveal, 90);
        }
      }

      if (old && old !== el) {
        const cleanupDelay = (waitForManualReveal ? 900 : dur) + 80;
        setTimeout(() => {
          try {
            if (old.tagName === 'VIDEO') {
              old.pause();
              old.removeAttribute('src');
              old.load();
            }
            old.remove();
          } catch {}
        }, cleanupDelay);
      }
    }

    function mountImage(src, s, modeLabel) {
      clearLiveTimers();
      liveIframe = null;
      setPoster('', s);
      const img = document.createElement('img');
      img.decoding = 'async';
      img.src = src;
      mountElement(img, s, false);
      store.setTelemetry({ activeMode: modeLabel || 'image', wallpaperFps: 0, liveFallback: false });
      applyVisualStyles(s);
    }

    function mountVideo(src, s, modeLabel, fallbackImg) {
      clearLiveTimers();
      liveIframe = null;
      setPoster(fallbackImg || '', s);
      const vid = document.createElement('video');
      vid.loop = true;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      vid.muted = !(s.videoAudioEnabled && s.videoVolume > 0);
      vid.src = src;
      const clearLowResPoster = () => fadeOutPoster(80);
      vid.addEventListener('loadeddata', clearLowResPoster, { once: true });
      vid.addEventListener('playing', clearLowResPoster, { once: true });
      vid.addEventListener('error', () => {
        store.setTelemetry({ lastError: '视频解码失败，请切换其他本地壁纸' });
        if (fallbackImg) mountImage(fallbackImg, store.getSettings(), 'image-fallback');
      }, { once: true });
      mountElement(vid, s, false);
      store.setTelemetry({ activeMode: modeLabel || 'video', wallpaperFps: 30, liveFallback: false });
      applyVisualStyles(s);
    }

    function mountLiveSceneOrWeb(wp, s) {
      clearLiveTimers();
      const inv = store.getInventory();
      const myGen = ++liveIframeGen;
      const sceneBase = `${inv.sceneMediaBase || store.apiBase}/wallpaper-engine/scene-files`;
      const isWeb = wp.type === 'web';
      const entryUrl = isWeb ? store.apiUrl(wp.webEntryUrl) : wp.token;

      // Always render at native crisp devicePixelRatio (up to 2x) with full-res video textures
      const nativeDpr = Math.min(2, Math.max(1, Number(window.devicePixelRatio) || 1));
      const qs = new URLSearchParams({
        type: isWeb ? 'web' : 'scene',
        src: entryUrl,
        mediaBase: sceneBase,
        fit: s.objectFit || 'cover',
        sceneFps: String(Number(s.sceneLiveFps) || 30),
        renderDpr: String(nativeDpr),
        vidscale: '1',
        muted: s.videoAudioEnabled && s.videoVolume > 0 ? 'false' : 'true',
        autoq: s.sceneAutoQuality ? '1' : '0',
      });

      // Keep crisp preview poster underneath until WebWallGL reports first live frame
      setPoster(wp.previewUrl ? store.apiUrl(wp.previewUrl) : '', s);

      const iframe = document.createElement('iframe');
      iframe.className = 'agy-we-media agy-we-live-frame';
      iframe.setAttribute('allow', 'autoplay; fullscreen');
      iframe.src = store.apiUrl(`/wallpaper-engine/scene-live/index.html?${qs.toString()}`);
      liveIframe = iframe;

      mountElement(iframe, s, true);
      store.setTelemetry({
        activeMode: isWeb ? 'web-live' : 'scene-live',
        activeTitle: wp.title || wp.id,
        liveFallback: false,
      });
      applyVisualStyles(s);

      // Push saved user properties once iframe finishes loading
      iframe.addEventListener('load', () => {
        if (myGen !== liveIframeGen || destroyed) return;
        const saved = (store.getSettings().userProps || {})[wp.token];
        if (saved && Object.keys(saved).length) {
          sendLiveCmd('updateWebProps', [saved]);
        }
        // For web wallpapers, reveal shortly after load if ready event doesn't beat it
        if (isWeb) {
          setTimeout(() => {
            if (myGen === liveIframeGen && !destroyed) revealLiveIframe();
          }, 320);
        }
      }, { once: true });

      // Safety fallback: reveal even if ready heartbeat is delayed
      liveReadyFallbackTimer = setTimeout(() => {
        if (myGen === liveIframeGen && !destroyed) revealLiveIframe();
      }, 2600);
    }

    async function renderActiveWallpaper(force = false) {
      ensureMounted();
      const s = store.getSettings();
      const wp = store.getActiveWallpaper();

      // Local-only safety guard: refuse non-local/URL wallpaper entries
      if (!s.enabled || !wp || wp.source === 'url' || /^https?:\/\//i.test(String(wp.mediaUrl || ''))) {
        currentItemKey = '';
        clearSlideshow();
        clearLiveTimers();
        liveIframe = null;
        stage.innerHTML = '';
        setPoster('', s);
        currentMediaEl = null;
        store.setTelemetry({ activeMode: 'idle', activeTitle: '', wallpaperFps: 0 });
        applyVisualStyles(s);
        return;
      }

      const wantLive = (wp.type === 'scene' || wp.type === 'web') && s.sceneLive;
      const itemKey = `${wp.id}|${wp.token}|${wantLive ? 'live' : 'static'}`;
      if (!force && itemKey === currentItemKey) {
        applyVisualStyles(s);
        return;
      }

      currentItemKey = itemKey;
      clearSlideshow();
      store.setTelemetry({ activeTitle: wp.title || wp.id });

      if (wp.type === 'image') {
        if (wp.slideCount > 1) {
          try {
            const data = await store.apiFetch(`/wallpaper-engine/slides/${encodeURIComponent(wp.token)}`);
            if (data && Array.isArray(data.slides) && data.slides.length > 1) {
              slideList = data.slides.map((x) => store.apiUrl(x.url));
              slideIndex = 0;
              mountImage(slideList[0], s, 'slideshow');
              const intervalMs = Math.max(3000, (Number(s.pictureSlideSeconds) || 30) * 1000);
              slideTimer = setInterval(() => {
                if (computePaused(store.getSettings()).paused || !slideList.length) return;
                slideIndex = (slideIndex + 1) % slideList.length;
                mountImage(slideList[slideIndex], store.getSettings(), 'slideshow');
              }, intervalMs);
              return;
            }
          } catch {}
        }
        mountImage(store.apiUrl(wp.mediaUrl), s, 'image');
        return;
      }

      if (wp.type === 'video') {
        mountVideo(
          store.apiUrl(wp.mediaUrl),
          s,
          'video',
          wp.previewUrl ? store.apiUrl(wp.previewUrl) : null
        );
        return;
      }

      if (wp.type === 'scene' || wp.type === 'web') {
        if (wantLive && store.getInventory().webwallglAvailable) {
          mountLiveSceneOrWeb(wp, s);
          return;
        }
        if (wp.type === 'scene') {
          try {
            const svUrl = store.apiUrl(`/wallpaper-engine/scene-video/${encodeURIComponent(wp.token)}`);
            const head = await fetch(svUrl, { method: 'HEAD' });
            if (head.ok) {
              mountVideo(svUrl, s, 'scene-video', wp.previewUrl ? store.apiUrl(wp.previewUrl) : null);
              return;
            }
          } catch {}
        }
        if (wp.previewUrl) {
          mountImage(store.apiUrl(wp.previewUrl), s, 'scene-preview');
        }
      }
    }

    function pickNextWallpaper() {
      const s = store.getSettings();
      const inv = store.getInventory();
      let pool = (inv.wallpapers || []).filter((w) => !(s.hiddenIds || []).includes(w.id));
      if (s.rotationSource === 'favorites') {
        const fav = new Set(s.favoriteIds || []);
        pool = pool.filter((w) => fav.has(w.id));
      } else if (s.rotationSource && s.rotationSource.startsWith('playlist:')) {
        const name = s.rotationSource.slice('playlist:'.length);
        const pl = (inv.playlists || []).find((p) => p.name === name || p.id === name);
        if (pl) {
          const idSet = new Set(pl.wallpaperIds || []);
          pool = pool.filter((w) => idSet.has(w.id));
        }
      }
      if (!pool.length) return null;
      const idx = pool.findIndex((w) => w.id === s.wallpaperId);
      const next = pool[(idx + 1) % pool.length];
      if (next) store.updateSettings({ wallpaperId: next.id }, true);
      return next;
    }

    function syncRotationTimer() {
      if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
      }
      const s = store.getSettings();
      if (!s.enabled || !s.rotationEnabled) return;
      const ms = Math.max(10000, (Number(s.rotationIntervalSec) || 300) * 1000);
      rotationTimer = setInterval(() => {
        if (!computePaused(store.getSettings()).paused) {
          pickNextWallpaper();
        }
      }, ms);
    }

    function onMessage(ev) {
      const d = ev && ev.data;
      if (!d || typeof d !== 'object' || d.__agyWeEvent !== true) return;
      if (d.type === 'ready') {
        revealLiveIframe();
      } else if (d.type === 'stats') {
        if (d.ready || d.fallback) {
          revealLiveIframe();
        }
        store.setTelemetry({
          wallpaperFps: Number(d.fps || 0),
          liveFallback: Boolean(d.fallback),
          lastError: d.webError ? String(d.webError) : '',
        });
      }
    }

    let lastPtrSent = 0;
    function onPointerMove(ev) {
      if (!liveIframe) return;
      const s = store.getSettings();
      if (!s.enabled || !s.scenePointerInteract) return;
      const now = performance.now();
      if (now - lastPtrSent < 32) return;
      lastPtrSent = now;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      sendLiveCmd('pushPointer', [ev.clientX / w, ev.clientY / h, ev.buttons || 0, 0]);
    }

    function onVisibilityChange() {
      docHidden = document.hidden;
      applyVisualStyles(store.getSettings());
    }
    function onWinBlur() {
      winBlurred = true;
      applyVisualStyles(store.getSettings());
    }
    function onWinFocus() {
      winBlurred = false;
      applyVisualStyles(store.getSettings());
    }
    function onResize() {
      applyVisualStyles(store.getSettings());
    }

    function onOverlayPause(ev) {
      const next = Boolean(ev && ev.detail && ev.detail.paused);
      if (next === overlayPaused) return;
      overlayPaused = next;
      applyVisualStyles(store.getSettings());
    }

    window.addEventListener('message', onMessage);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWinBlur);
    window.addEventListener('focus', onWinFocus);
    window.addEventListener('agy-we-overlay-pause', onOverlayPause);

    if (navigator.getBattery) {
      navigator.getBattery().then((bat) => {
        if (destroyed) return;
        const updateBat = () => {
          batteryLow = !bat.charging && bat.level <= 0.35;
          applyVisualStyles(store.getSettings());
        };
        updateBat();
        bat.addEventListener('chargingchange', updateBat);
        bat.addEventListener('levelchange', updateBat);
      }).catch(() => {});
    }

    const unsub = store.subscribe((topic) => {
      if (topic === 'settings' || topic === 'inventory' || topic === 'all') {
        renderActiveWallpaper(false);
        syncRotationTimer();
      } else if (topic === 'props') {
        const wp = store.getActiveWallpaper();
        if (wp && liveIframe) {
          const saved = (store.getSettings().userProps || {})[wp.token];
          if (saved) sendLiveCmd('updateWebProps', [saved]);
        }
      }
    });

    return {
      ensureMounted,
      renderActiveWallpaper,
      pickNextWallpaper,
      sendLiveCmd,
      destroy() {
        destroyed = true;
        unsub();
        clearSlideshow();
        clearLiveTimers();
        if (rotationTimer) clearInterval(rotationTimer);
        window.removeEventListener('message', onMessage);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onWinBlur);
        window.removeEventListener('focus', onWinFocus);
        window.removeEventListener('agy-we-overlay-pause', onOverlayPause);
        document.documentElement.classList.remove('agy-we-active');
        document.documentElement.style.removeProperty('--agy-we-underlay');
        try { root.remove(); } catch {}
      },
    };
  }

  NS.createWallpaperLayer = createWallpaperLayer;
})();
