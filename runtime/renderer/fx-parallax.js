/**
 * Visual Extensions:
 *  1. Click & Cursor Trail FX Canvas (ripple/spark/comet/dust, zero-idle-cost rAF)
 *  2. 3D Parallax Engine (background stage, rope trigger, optional UI depth)
 *  3. Performance Monitor Floating HUD (UI FPS, Wallpaper FPS, active mode, draggable)
 */
(function initFxParallaxModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  function createFxParallax(store) {
    // ── 1. FX Canvas ──────────────────────────────────────────────────────────
    let canvas = document.getElementById('agy-we-fx-canvas');
    if (canvas) canvas.remove();
    canvas = document.createElement('canvas');
    canvas.id = 'agy-we-fx-canvas';
    canvas.setAttribute('data-agy-zh-skip', 'true');
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '2147483620',
      webkitAppRegion: 'initial',
    });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();

    const ripples = [];
    const sparks = [];
    const trail = [];
    let fxRaf = null;
    let hueTick = 0;

    function pickFxColor(s, offset = 0) {
      if (s.fxColorMode === 'rainbow') {
        return `hsl(${(hueTick + offset) % 360}, 90%, 64%)`;
      }
      if (s.fxColorMode === 'custom') return s.fxColor || '#4f8cff';
      return s.accent || '#4f8cff';
    }

    function ensureFxLoop() {
      if (fxRaf !== null) return;
      fxRaf = requestAnimationFrame(stepFx);
    }

    function stepFx(now) {
      fxRaf = null;
      const s = store.getSettings();
      if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!s.fxEnabled) {
        ripples.length = 0;
        sparks.length = 0;
        trail.length = 0;
        return;
      }

      hueTick = (hueTick + 2) % 360;
      canvas.style.mixBlendMode = s.fxBlend || 'screen';
      canvas.style.opacity = String((s.fxOpacity ?? 85) / 100);

      // Trail
      const maxAge = Math.max(80, Number(s.fxTrailLength) || 420);
      while (trail.length && now - trail[0].t > maxAge) trail.shift();
      if (s.fxTrail && trail.length > 1) {
        if (s.fxTrailStyle === 'dust') {
          for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            const alpha = Math.max(0, 1 - (now - p.t) / maxAge);
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.85;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = (s.fxTrailGlow || 0) * 0.25;
            ctx.arc(p.x, p.y, Math.max(1, (s.fxTrailWidth || 3) * alpha), 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          for (let i = 1; i < trail.length; i++) {
            const a = trail[i - 1];
            const b = trail[i];
            const frac = i / trail.length;
            const alpha = Math.max(0, 1 - (now - b.t) / maxAge) * frac;
            ctx.beginPath();
            ctx.strokeStyle = b.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = Math.max(0.8, (s.fxTrailWidth || 3) * frac);
            ctx.lineCap = 'round';
            ctx.shadowColor = b.color;
            ctx.shadowBlur = (s.fxTrailGlow || 0) * 0.3;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const p = (now - r.t) / r.dur;
        if (p >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const ease = 1 - Math.pow(1 - p, 3);
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = (1 - p) * 0.85;
        ctx.lineWidth = Math.max(1, 3 * (1 - p));
        ctx.shadowColor = r.color;
        ctx.shadowBlur = (s.fxClickGlow || 0) * 0.35;
        ctx.arc(r.x, r.y, r.maxR * ease, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Click sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        const p = (now - sp.t) / sp.dur;
        if (p >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.94;
        sp.vy *= 0.94;
        ctx.beginPath();
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = 1 - p;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = (s.fxClickGlow || 0) * 0.25;
        ctx.arc(sp.x, sp.y, sp.r * (1 - p * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (ripples.length || sparks.length || trail.length) {
        ensureFxLoop();
      }
    }

    function onFxPointerMove(ev) {
      const s = store.getSettings();
      if (!s.fxEnabled || !s.fxTrail) return;
      trail.push({
        x: ev.clientX,
        y: ev.clientY,
        t: performance.now(),
        color: pickFxColor(s),
      });
      if (trail.length > 90) trail.shift();
      ensureFxLoop();
    }

    function onFxPointerDown(ev) {
      const s = store.getSettings();
      if (!s.fxEnabled || !s.fxClick) return;
      const now = performance.now();
      const color = pickFxColor(s);
      const maxR = Math.max(24, (Number(s.fxClickSize) || 140) * 0.5);
      if (s.fxClickStyle === 'ripple' || s.fxClickStyle === 'both') {
        ripples.push({ x: ev.clientX, y: ev.clientY, t: now, dur: 520, maxR, color });
      }
      if (s.fxClickStyle === 'spark' || s.fxClickStyle === 'both') {
        const count = 12;
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
          const spd = 2.2 + Math.random() * (maxR / 22);
          sparks.push({
            x: ev.clientX,
            y: ev.clientY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            r: 2 + Math.random() * 2.5,
            t: now,
            dur: 460 + Math.random() * 200,
            color: pickFxColor(s, i * 24),
          });
        }
      }
      ensureFxLoop();
    }

    // ── 2. 3D Parallax ────────────────────────────────────────────────────────
    let targetNx = 0;
    let targetNy = 0;
    let curNx = 0;
    let curNy = 0;
    let parallaxRaf = null;

    function resetParallax() {
      const bg = document.getElementById('agy-we-bg-layer');
      if (bg) bg.style.transform = '';
      const rope = document.getElementById('agy-we-rope-btn');
      if (rope) rope.style.setProperty('--agy-we-px', '0px');
      if (rope) rope.style.setProperty('--agy-we-py', '0px');
    }

    function stepParallax() {
      parallaxRaf = null;
      const s = store.getSettings();
      if (!s.parallaxEnabled || !s.enabled) {
        resetParallax();
        return;
      }
      const smooth = Math.max(0.04, 1 - (Number(s.parallaxSmooth ?? 85) / 100));
      curNx += (targetNx - curNx) * smooth;
      curNy += (targetNy - curNy) * smooth;

      const bg = document.getElementById('agy-we-bg-layer');
      if (bg) {
        const pct = Number(s.parallaxBg ?? 1.8);
        const extraScale = 1 + (pct / 100) * 2.2;
        const tx = (-curNx * pct).toFixed(3);
        const ty = (-curNy * pct).toFixed(3);
        bg.style.transform = `translate3d(${tx}%, ${ty}%, 0) scale(${extraScale.toFixed(4)})`;
      }

      if (s.parallaxRope) {
        const rope = document.getElementById('agy-we-rope-btn');
        if (rope) {
          const docked = rope.classList.contains('is-top-docked');
          rope.style.setProperty('--agy-we-px', `${(curNx * (docked ? 5 : 8)).toFixed(2)}px`);
          rope.style.setProperty('--agy-we-py', docked ? '0px' : `${(curNy * 8).toFixed(2)}px`);
        }
      }

      if (Math.abs(targetNx - curNx) > 0.001 || Math.abs(targetNy - curNy) > 0.001) {
        parallaxRaf = requestAnimationFrame(stepParallax);
      }
    }

    function onParallaxMove(ev) {
      const s = store.getSettings();
      if (!s.parallaxEnabled || !s.enabled) return;
      targetNx = (ev.clientX / (window.innerWidth || 1) - 0.5) * 2;
      targetNy = (ev.clientY / (window.innerHeight || 1) - 0.5) * 2;
      if (parallaxRaf === null) parallaxRaf = requestAnimationFrame(stepParallax);
    }

    // ── 3. Performance Monitor Float HUD ──────────────────────────────────────
    let perfEl = document.getElementById('agy-we-perf-float');
    if (perfEl) perfEl.remove();
    perfEl = document.createElement('div');
    perfEl.id = 'agy-we-perf-float';
    perfEl.setAttribute('data-agy-zh-skip', 'true');
    Object.assign(perfEl.style, {
      position: 'fixed',
      right: '16px',
      bottom: '54px',
      zIndex: '2147483631',
      display: 'none',
      padding: '9px 13px',
      borderRadius: '14px',
      fontSize: '11px',
      lineHeight: '1.55',
      fontFamily: 'ui-monospace, Consolas, monospace',
      color: '#e2e8f0',
      background: 'rgba(15, 23, 42, 0.72)',
      border: '1px solid rgba(255,255,255,0.18)',
      backdropFilter: 'blur(18px) saturate(160%)',
      webkitBackdropFilter: 'blur(18px) saturate(160%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 28px rgba(0,0,0,0.36)',
      cursor: 'grab',
      userSelect: 'none',
      touchAction: 'none',
      webkitAppRegion: 'no-drag',
      minWidth: '178px',
    });
    document.body.appendChild(perfEl);

    let dragPerf = null;
    const finishPerfDrag = (ev, savePos) => {
      if (!dragPerf) return;
      const pid = dragPerf.pid;
      dragPerf = null;
      perfEl.style.cursor = 'grab';
      try { if (pid !== undefined) perfEl.releasePointerCapture(pid); } catch {}
      if (savePos) {
        const rect = perfEl.getBoundingClientRect();
        store.updateSettings({ perfFloatX: Math.round(rect.left), perfFloatY: Math.round(rect.top) });
      }
    };
    perfEl.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.stopPropagation();
      const rect = perfEl.getBoundingClientRect();
      dragPerf = { pid: ev.pointerId, ox: ev.clientX - rect.left, oy: ev.clientY - rect.top };
      try { perfEl.setPointerCapture(ev.pointerId); } catch {}
      perfEl.style.cursor = 'grabbing';
    });
    perfEl.addEventListener('pointermove', (ev) => {
      if (!dragPerf) return;
      const x = Math.max(8, Math.min(window.innerWidth - 184, ev.clientX - dragPerf.ox));
      const y = Math.max(8, Math.min(window.innerHeight - 84, ev.clientY - dragPerf.oy));
      perfEl.style.left = `${x}px`;
      perfEl.style.top = `${y}px`;
      perfEl.style.right = 'auto';
      perfEl.style.bottom = 'auto';
    });
    perfEl.addEventListener('pointerup', (ev) => finishPerfDrag(ev, true));
    perfEl.addEventListener('pointercancel', (ev) => finishPerfDrag(ev, false));
    perfEl.addEventListener('lostpointercapture', (ev) => finishPerfDrag(ev, false));

    let uiFrames = 0;
    let uiFpsLast = performance.now();
    let uiFpsVal = 60;
    let perfRaf = null;
    let perfTicker = null;

    function tickUiFps(now) {
      uiFrames += 1;
      if (now - uiFpsLast >= 1000) {
        uiFpsVal = Math.round((uiFrames * 1000) / (now - uiFpsLast));
        uiFrames = 0;
        uiFpsLast = now;
        store.setTelemetry({ uiFps: uiFpsVal });
      }
      if (store.getSettings().perfEnabled) {
        perfRaf = requestAnimationFrame(tickUiFps);
      } else {
        perfRaf = null;
      }
    }

    function updatePerfHud() {
      const s = store.getSettings();
      const show = Boolean(s.perfEnabled && s.perfFloat);
      perfEl.style.display = show ? 'block' : 'none';
      if (s.perfEnabled && perfRaf === null) {
        uiFrames = 0;
        uiFpsLast = performance.now();
        perfRaf = requestAnimationFrame(tickUiFps);
      }
      if (!show) return;
      if (s.perfFloatX >= 0 && s.perfFloatY >= 0 && !dragPerf) {
        perfEl.style.left = `${Math.min(window.innerWidth - 180, s.perfFloatX)}px`;
        perfEl.style.top = `${Math.min(window.innerHeight - 80, s.perfFloatY)}px`;
        perfEl.style.right = 'auto';
        perfEl.style.bottom = 'auto';
      }
      const t = store.getTelemetry();
      const mem = performance && performance.memory
        ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`
        : '-';
      perfEl.innerHTML = [
        `<div style="font-weight:700;color:#60a5fa;margin-bottom:2px">AGY 壁纸性能监控</div>`,
        `<div>UI FPS: <b>${t.uiFps || uiFpsVal}</b> &nbsp;|&nbsp; 壁纸 FPS: <b>${t.wallpaperFps || 0}</b></div>`,
        `<div>模式: <b>${t.activeMode || 'idle'}</b>${t.pausedEffective ? ' (已暂停)' : ''}</div>`,
        `<div>JS 堆内存: <b>${mem}</b></div>`,
      ].join('');
    }

    perfTicker = setInterval(updatePerfHud, 1000);

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', onFxPointerMove, { passive: true });
    window.addEventListener('pointerdown', onFxPointerDown, { passive: true });
    window.addEventListener('pointermove', onParallaxMove, { passive: true });

    const unsub = store.subscribe((topic) => {
      if (topic === 'settings' || topic === 'telemetry' || topic === 'all') {
        const s = store.getSettings();
        if (!s.parallaxEnabled) resetParallax();
        updatePerfHud();
      }
    });

    updatePerfHud();

    return {
      destroy() {
        unsub();
        if (fxRaf !== null) cancelAnimationFrame(fxRaf);
        if (parallaxRaf !== null) cancelAnimationFrame(parallaxRaf);
        if (perfRaf !== null) cancelAnimationFrame(perfRaf);
        if (perfTicker) clearInterval(perfTicker);
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('pointermove', onFxPointerMove);
        window.removeEventListener('pointerdown', onFxPointerDown);
        window.removeEventListener('pointermove', onParallaxMove);
        resetParallax();
        try { canvas.remove(); } catch {}
        try { perfEl.remove(); } catch {}
      },
    };
  }

  NS.createFxParallax = createFxParallax;
})();
