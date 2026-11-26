/**
 * DeepSeek-Harness Inspired Ice Liquid Glass Control Drawer & Bulletproof Floating Trigger UI.
 * Shortcut: Ctrl+Alt+W to toggle drawer.
 */
(function initUiPanelModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  const TYPE_LABELS = { scene: '场景', video: '视频', web: '网页', image: '图片' };
  const GLASS_SWATCHES_DARK = ['#0a1622', '#0f172a', '#162032', '#1e1b2e', '#1a2421', '#22151a', '#000000'];
  const GLASS_SWATCHES_LIGHT = ['#ffffff', '#f0f9ff', '#fdf2f8', '#fef3c7', '#ecfdf5', '#f1f5f9', '#e2e8f0'];
  const ACCENT_SWATCHES = ['#75e6f5', '#4f8cff', '#7dd3fc', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#fb7185'];

  function escHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createUiPanel(store, wallpaperLayer) {
    let styleEl = document.getElementById('agy-we-ui-style');
    if (styleEl) styleEl.remove();
    styleEl = document.createElement('style');
    styleEl.id = 'agy-we-ui-style';
    styleEl.textContent = NS.UI_CSS || '';
    document.head.appendChild(styleEl);

    let root = document.getElementById('agy-we-ui-root');
    if (root) root.remove();
    root = document.createElement('div');
    root.id = 'agy-we-ui-root';
    root.setAttribute('data-agy-zh-skip', 'true');
    root.innerHTML = `
      <div id="agy-we-top-snap-guide" aria-hidden="true"></div>
      <button id="agy-we-rope-btn" type="button" title="Antigravity 壁纸引擎 (Ctrl+Alt+W，单击打开 / 拖动至顶端自动吸附)">
        <span class="agy-we-rope-icon" aria-hidden="true">✦</span>
        <span class="agy-we-rope-label">壁纸</span>
        <img class="agy-we-rope-mascot-img" alt="" draggable="false" />
      </button>
      <div id="agy-we-backdrop"></div>
      <aside id="agy-we-drawer" role="dialog" aria-label="Antigravity 壁纸引擎">
        <div class="agy-we-hdr">
          <div class="agy-we-title"><span class="agy-we-dot"></span><span>壁纸引擎</span></div>
          <div class="agy-we-hdr-actions">
            <button type="button" class="agy-we-btn" data-act="toggle-enabled"></button>
            <button type="button" class="agy-we-btn" data-act="close">收起</button>
          </div>
        </div>
        <div id="agy-we-nowbar-slot"></div>
        <div class="agy-we-tabs-wrap">
          <div class="agy-we-tabs">
            <button type="button" class="agy-we-tab active" data-tab="library">壁纸</button>
            <button type="button" class="agy-we-tab" data-tab="glass">外观</button>
            <button type="button" class="agy-we-tab" data-tab="playback">播放</button>
          </div>
        </div>
        <div class="agy-we-body" id="agy-we-body"></div>
        <div class="agy-we-drawer-foot">
          <button type="button" class="agy-we-more-btn" id="agy-we-more-btn">壁纸引擎设置 ›</button>
        </div>
      </aside>
    `;
    document.body.appendChild(root);

    const topSnapGuide = root.querySelector('#agy-we-top-snap-guide');
    const ropeBtn = root.querySelector('#agy-we-rope-btn');
    const ropeMascotImg = ropeBtn.querySelector('.agy-we-rope-mascot-img');
    const backdrop = root.querySelector('#agy-we-backdrop');
    const drawer = root.querySelector('#agy-we-drawer');
    const nowSlot = root.querySelector('#agy-we-nowbar-slot');
    const bodyEl = root.querySelector('#agy-we-body');
    const moreBtn = root.querySelector('#agy-we-more-btn');
    const toggleEnabledBtn = root.querySelector('[data-act="toggle-enabled"]');

    let isOpen = false;
    let activeTab = 'library';
    let viewMode = 'cards'; // 'cards' | 'list'
    let searchQuery = '';
    let onlyFavorites = false;
    let activeProps = null;
    let activePropsToken = '';
    let diagLines = [];
    let destroyed = false;
    let skipNextSettingsRender = false;

    function ensureMounted() {
      if (destroyed) return;
      if (document.head && !styleEl.isConnected) document.head.appendChild(styleEl);
      if (document.body && !root.isConnected) document.body.appendChild(root);
    }

    function showToast(msg) {
      const t = document.createElement('div');
      t.className = 'agy-we-toast';
      t.setAttribute('data-agy-zh-skip', 'true');
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => { try { t.remove(); } catch {} }, 2200);
    }

    const ROPE_STYLE_CLASSES = ['style-mascot', 'style-pill', 'style-orb', 'style-minimal'];

    function setRopeStyleClass(cls) {
      for (const c of ROPE_STYLE_CLASSES) {
        ropeBtn.classList.toggle(c, c === cls);
      }
    }

    function clampRopeCoords(x, y) {
      const bw = ropeBtn.offsetWidth || 72;
      const bh = ropeBtn.offsetHeight || 34;
      const maxX = Math.max(8, (window.innerWidth || 1280) - bw - 8);
      const maxY = Math.max(0, (window.innerHeight || 720) - bh - 8);
      return {
        x: Math.round(Math.max(8, Math.min(maxX, x))),
        y: Math.round(Math.max(0, Math.min(maxY, y))),
      };
    }

    let ropeDrag = null;
    let suppressClickUntil = 0;
    let mascotFailedSrc = '';
    let snapAnimTimer = null;

    if (ropeMascotImg) {
      ropeMascotImg.addEventListener('error', () => {
        mascotFailedSrc = ropeMascotImg.getAttribute('data-src') || '';
        setRopeStyleClass('style-pill');
        ropeBtn.style.width = '';
        ropeBtn.style.height = '';
      });
      ropeMascotImg.addEventListener('load', () => {
        mascotFailedSrc = '';
        if ((store.getSettings().ropeStyle || 'mascot') === 'mascot') {
          setRopeStyleClass('style-mascot');
        }
      });
    }

    function applyRopeState() {
      if (ropeDrag) return;
      const s = store.getSettings();
      ropeBtn.style.display = s.ropeShown ? 'inline-flex' : 'none';
      const wantedStyle = s.ropeStyle || 'mascot';
      if (wantedStyle === 'mascot') {
        const form = (s.mascotForm === 'custom' && s.mascotCustomTs > 0) ? 'custom' : (s.mascotForm || 'whale');
        const nextSrc = store.apiUrl(`/wallpaper-engine/mascot/${form}${form === 'custom' ? `?t=${s.mascotCustomTs}` : ''}`);
        if (mascotFailedSrc && mascotFailedSrc === nextSrc) {
          setRopeStyleClass('style-pill');
          ropeBtn.style.width = '';
          ropeBtn.style.height = '';
        } else {
          setRopeStyleClass('style-mascot');
          const scale = Math.max(0.5, Math.min(1.8, (Number(s.mascotScale) || 115) / 100));
          ropeBtn.style.width = `${Math.round(56 * scale)}px`;
          ropeBtn.style.height = `${Math.round(68 * scale)}px`;
          if (ropeMascotImg && ropeMascotImg.getAttribute('data-src') !== nextSrc) {
            ropeMascotImg.setAttribute('data-src', nextSrc);
            ropeMascotImg.src = nextSrc;
          }
        }
      } else {
        setRopeStyleClass(`style-${wantedStyle}`);
        ropeBtn.style.width = '';
        ropeBtn.style.height = '';
      }
      // Global top-edge docking: always anchored cleanly to top: 0px
      if (s.ropeX >= 0) {
        const clamped = clampRopeCoords(s.ropeX, 0);
        ropeBtn.style.left = `${clamped.x}px`;
        ropeBtn.style.top = '0px';
        ropeBtn.style.right = 'auto';
      } else {
        ropeBtn.style.left = 'auto';
        ropeBtn.style.right = '156px';
        ropeBtn.style.top = '0px';
      }
      ropeBtn.classList.add('is-top-docked');
      toggleEnabledBtn.textContent = s.enabled ? '已开启' : '已关闭';
      toggleEnabledBtn.className = s.enabled ? 'agy-we-btn primary' : 'agy-we-btn';
    }

    function finishRopeDrag(ev, commit) {
      const d = ropeDrag;
      if (!d) return;
      ropeDrag = null;
      ropeBtn.classList.remove('is-dragging', 'is-snap-preview');
      if (topSnapGuide) topSnapGuide.classList.remove('active');
      try {
        if (ev && ev.pointerId !== undefined && ropeBtn.hasPointerCapture && ropeBtn.hasPointerCapture(ev.pointerId)) {
          ropeBtn.releasePointerCapture(ev.pointerId);
        }
      } catch {}
      if (d.moved) {
        suppressClickUntil = Date.now() + 280;
        const rect = ropeBtn.getBoundingClientRect();
        const clamped = clampRopeCoords(rect.left, rect.top);
        const snapMs = Math.round(Math.max(280, Math.min(520, 260 + clamped.y * 0.35)));
        if (snapAnimTimer) clearTimeout(snapAnimTimer);
        ropeBtn.style.setProperty('--agy-we-snap-ms', `${snapMs}ms`);
        ropeBtn.classList.add('is-snapping');
        snapAnimTimer = setTimeout(() => {
          snapAnimTimer = null;
          ropeBtn.classList.remove('is-snapping');
        }, snapMs + 40);
        ropeBtn.style.left = `${clamped.x}px`;
        ropeBtn.style.top = '0px';
        ropeBtn.style.right = 'auto';
        ropeBtn.classList.add('is-top-docked');
        if (commit) {
          store.updateSettings({ ropeX: clamped.x, ropeY: 0 });
        }
      }
    }

    ropeBtn.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      ev.stopPropagation();
      if (snapAnimTimer) {
        clearTimeout(snapAnimTimer);
        snapAnimTimer = null;
        ropeBtn.classList.remove('is-snapping');
      }
      const rect = ropeBtn.getBoundingClientRect();
      ropeDrag = { pid: ev.pointerId, ox: ev.clientX - rect.left, oy: ev.clientY - rect.top, sx: ev.clientX, sy: ev.clientY, moved: false };
      try { ropeBtn.setPointerCapture(ev.pointerId); } catch {}
    });
    ropeBtn.addEventListener('pointermove', (ev) => {
      const d = ropeDrag;
      if (!d || d.pid !== ev.pointerId) return;
      const dx = ev.clientX - d.sx;
      const dy = ev.clientY - d.sy;
      if (!d.moved) {
        if (dx * dx + dy * dy < 64) return;
        d.moved = true;
        ropeBtn.classList.add('is-dragging');
      }
      const clamped = clampRopeCoords(ev.clientX - d.ox, ev.clientY - d.oy);
      ropeBtn.style.left = `${clamped.x}px`;
      ropeBtn.style.top = `${clamped.y}px`;
      ropeBtn.style.right = 'auto';
      ropeBtn.classList.add('is-snap-preview');
      ropeBtn.classList.toggle('is-top-docked', clamped.y <= 2);
      if (topSnapGuide) {
        const bw = ropeBtn.offsetWidth || 64;
        topSnapGuide.style.setProperty('--snap-x', `${Math.round(clamped.x + bw / 2)}px`);
        topSnapGuide.classList.add('active');
      }
    });
    ropeBtn.addEventListener('pointerup', (ev) => finishRopeDrag(ev, true));
    ropeBtn.addEventListener('pointercancel', (ev) => finishRopeDrag(ev, false));
    ropeBtn.addEventListener('lostpointercapture', (ev) => finishRopeDrag(ev, false));
    ropeBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (Date.now() < suppressClickUntil) return;
      setOpen(!isOpen);
    });

    const onWinBlurCleanup = () => { if (ropeDrag) finishRopeDrag(null, false); };
    const onWinResizeClamp = () => applyRopeState();
    window.addEventListener('blur', onWinBlurCleanup);
    window.addEventListener('resize', onWinResizeClamp, { passive: true });

    const settingsModal = typeof NS.createSettingsModal === 'function'
      ? NS.createSettingsModal(store, wallpaperLayer, root, {
          showToast,
          openDrawerToLibrary: () => {
            activeTab = 'library';
            root.querySelectorAll('.agy-we-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === 'library'));
            setOpen(true);
          },
        })
      : null;

    function updateMoreButtonLabel() {
      if (!moreBtn) return;
      if (activeTab === 'glass') moreBtn.textContent = '更多外观设置 ›';
      else if (activeTab === 'playback') moreBtn.textContent = '更多播放设置 ›';
      else moreBtn.textContent = '壁纸引擎设置 ›';
    }

    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const targetTab = activeTab === 'glass' ? 'appearance' : (activeTab === 'playback' ? 'playback' : 'library');
        setOpen(false);
        if (settingsModal) settingsModal.open(targetTab);
      });
    }

    function setOpen(next) {
      ensureMounted();
      isOpen = Boolean(next);
      backdrop.classList.toggle('open', isOpen);
      drawer.classList.toggle('open', isOpen);
      if (isOpen) {
        if (!store.getInventory().loaded) store.loadInventory(false).catch(() => {});
        if (!store.getPresets().length) store.loadPresets().catch(() => {});
        updateMoreButtonLabel();
        renderBody();
      }
    }

    backdrop.addEventListener('click', () => setOpen(false));
    root.querySelector('[data-act="close"]').addEventListener('click', () => setOpen(false));
    toggleEnabledBtn.addEventListener('click', () => {
      const s = store.getSettings();
      store.updateSettings({ enabled: !s.enabled }, true);
    });

    root.querySelectorAll('.agy-we-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        root.querySelectorAll('.agy-we-tab').forEach((b) => b.classList.toggle('active', b === btn));
        updateMoreButtonLabel();
        renderBody();
      });
    });

    function switchRow(label, key, checked, hint = '') {
      return `
        <div class="agy-we-row">
          <div style="flex:1;min-width:0">
            <div>${escHtml(label)}</div>
            ${hint ? `<div class="agy-we-hint">${escHtml(hint)}</div>` : ''}
          </div>
          <label class="agy-we-switch">
            <input type="checkbox" data-key="${key}" ${checked ? 'checked' : ''} />
            <span class="agy-we-switch-track"><span class="agy-we-switch-thumb"></span></span>
          </label>
        </div>
      `;
    }

    function rangeRow(label, key, val, min, max, step, suffix = '', displayMul = 1) {
      const numVal = Number(val);
      const pct = max > min ? Math.max(0, Math.min(100, ((numVal - min) / (max - min)) * 100)) : 0;
      const disp = displayMul === 1 ? numVal : Math.round(numVal * displayMul);
      return `
        <div class="agy-we-slider-row">
          <span class="agy-we-slider-label">${escHtml(label)}</span>
          <input type="range" class="agy-we-slider" data-key="${key}" data-mul="${displayMul}" data-suffix="${escHtml(suffix)}" min="${min}" max="${max}" step="${step}" value="${val}" style="--val-pct:${pct.toFixed(1)}%" />
          <span class="agy-we-pill-val" data-val-for="${key}">${disp}${suffix}</span>
        </div>
      `;
    }

    function selectRow(label, key, val, opts) {
      const optionsHtml = opts.map(([v, text]) =>
        `<option value="${escHtml(v)}" ${String(v) === String(val) ? 'selected' : ''}>${escHtml(text)}</option>`
      ).join('');
      return `<div class="agy-we-row"><label>${escHtml(label)}</label><select class="agy-we-select" data-key="${key}">${optionsHtml}</select></div>`;
    }

    function swatchRow(label, key, currentVal, palette) {
      const cur = String(currentVal || '').toLowerCase();
      const dots = palette.map((hex) => `
        <button type="button" class="agy-we-swatch ${cur === hex.toLowerCase() ? 'active' : ''}" style="background:${hex}" data-swatch-key="${key}" data-swatch-val="${hex}" title="${hex}"></button>
      `).join('');
      return `
        <div class="agy-we-row-col">
          <span>${escHtml(label)}</span>
          <div class="agy-we-swatches">
            ${dots}
            <label class="agy-we-color-custom">
              <input type="color" data-key="${key}" value="${escHtml(currentVal || palette[0])}" />
              <span>自定义</span>
            </label>
          </div>
        </div>
      `;
    }

    function renderNowBar(s) {
      const wp = store.getActiveWallpaper();
      const t = store.getTelemetry();
      const playing = Boolean(s.enabled && wp && !s.paused && !t.pausedEffective);
      const typeText = wp ? (TYPE_LABELS[wp.type] || wp.type) : '未选择';
      const stateText = !wp ? '请从下方选择本地壁纸' : (playing ? `${typeText} · 播放中` : `${typeText} · 已暂停`);
      nowSlot.innerHTML = `
        <div class="agy-we-nowbar">
          <div class="agy-we-disc ${playing ? 'playing' : ''}">
            ${wp && wp.previewUrl ? `<img src="${escHtml(store.apiUrl(wp.previewUrl))}" alt="" />` : ''}
          </div>
          <div class="agy-we-now-info">
            <div class="agy-we-now-title">${escHtml(wp ? (wp.title || wp.id) : '未选择本地壁纸')}</div>
            <div class="agy-we-now-meta">${escHtml(stateText)}${t.wallpaperFps ? ` · ${t.wallpaperFps} FPS` : ''}</div>
          </div>
          <div class="agy-we-now-actions">
            <button type="button" class="agy-we-btn" data-now-act="toggle-pause">${s.paused ? '继续' : '暂停'}</button>
            <button type="button" class="agy-we-btn" data-now-act="next-wp" title="下一张">下一张</button>
            <button type="button" class="agy-we-btn" data-now-act="clear-wp">清除</button>
          </div>
        </div>
      `;
      nowSlot.querySelectorAll('[data-now-act]').forEach((b) => {
        b.addEventListener('click', () => {
          const a = b.dataset.nowAct;
          if (a === 'toggle-pause') store.updateSettings({ paused: !store.getSettings().paused }, true);
          else if (a === 'next-wp') wallpaperLayer.pickNextWallpaper();
          else if (a === 'clear-wp') store.updateSettings({ wallpaperId: '' }, true);
        });
      });
    }

    function renderLibraryTab(s) {
      const inv = store.getInventory();
      const favSet = new Set(s.favoriteIds || []);
      const hiddenSet = new Set(s.hiddenIds || []);
      const typeSet = new Set(s.typeFilter || ['scene', 'web', 'video', 'image']);
      const q = searchQuery.trim().toLowerCase();

      const filtered = (inv.wallpapers || []).filter((w) => {
        if (hiddenSet.has(w.id)) return false;
        if (!typeSet.has(w.type)) return false;
        if (onlyFavorites && !favSet.has(w.id)) return false;
        if (q && !(w.title || '').toLowerCase().includes(q) && !(w.id || '').toLowerCase().includes(q)) return false;
        return true;
      });

      const activeWp = store.getActiveWallpaper();
      const typeChips = [
        ['scene', '场景'],
        ['video', '视频'],
        ['web', '网页'],
        ['image', '图片'],
      ].map(([tp, label]) => `<button type="button" class="agy-we-chip ${typeSet.has(tp) ? 'active' : ''}" data-type-chip="${tp}">${label}</button>`).join('');

      let listHtml = '';
      if (!filtered.length) {
        listHtml = `<div style="font-size:12px;color:var(--we-ui-ink-muted);padding:16px 4px;text-align:center">暂无匹配的本地已下载壁纸</div>`;
      } else if (viewMode === 'list') {
        listHtml = `<div class="agy-we-list">${filtered.slice(0, 150).map((w) => {
          const isAct = s.wallpaperId === w.id;
          return `
            <div class="agy-we-list-row ${isAct ? 'active' : ''}" data-select-wp="${escHtml(w.id)}">
              ${w.previewUrl ? `<img class="agy-we-list-thumb" loading="lazy" src="${escHtml(store.apiUrl(w.previewUrl))}" alt="" />` : '<div class="agy-we-list-thumb" style="background:rgba(255,255,255,0.08)"></div>'}
              <span class="agy-we-list-title" title="${escHtml(w.title)}">${escHtml(w.title)}</span>
              <span class="agy-we-list-type">${escHtml(TYPE_LABELS[w.type] || w.type)}</span>
            </div>
          `;
        }).join('')}</div>`;
      } else {
        listHtml = `<div class="agy-we-grid">${filtered.slice(0, 150).map((w) => {
          const isAct = s.wallpaperId === w.id;
          const isFav = favSet.has(w.id);
          const thumb = w.previewUrl
            ? `<img class="agy-we-wp-thumb" loading="lazy" src="${escHtml(store.apiUrl(w.previewUrl))}" alt="" />`
            : `<div class="agy-we-wp-placeholder">${escHtml(TYPE_LABELS[w.type] || w.type)}</div>`;
          return `
            <div class="agy-we-wp-card ${isAct ? 'active' : ''}" data-select-wp="${escHtml(w.id)}" title="${escHtml(w.title)}">
              ${thumb}
              <span class="agy-we-badge">${escHtml(TYPE_LABELS[w.type] || w.type)}</span>
              <button type="button" class="agy-we-fav-btn ${isFav ? 'fav' : ''}" data-fav-wp="${escHtml(w.id)}" title="收藏">${isFav ? '★' : '☆'}</button>
              <div class="agy-we-wp-overlay">
                <span class="agy-we-wp-name">${escHtml(w.title)}</span>
                ${w.isUpload ? `<button type="button" class="agy-we-btn danger" style="padding:1px 5px;font-size:9px" data-del-upload="${escHtml(w.id)}">删</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}</div>`;
      }

      let propsHtml = '';
      if (activeWp && (activeWp.type === 'scene' || activeWp.type === 'web') && activePropsToken === activeWp.token && Array.isArray(activeProps) && activeProps.length) {
        const editable = activeProps.filter((p) => !p.hidden && p.type !== 'text' && p.type !== 'group');
        if (editable.length) {
          propsHtml = `
            <div class="agy-we-sec">
              <div class="agy-we-sec-hdr"><span>壁纸专属属性 (${editable.length})</span></div>
              ${editable.slice(0, 20).map((p) => {
                if (p.type === 'bool') {
                  return `<div class="agy-we-row"><label>${escHtml(p.text || p.name)}</label><label class="agy-we-switch"><input type="checkbox" data-wp-prop="${escHtml(p.name)}" ${p.value ? 'checked' : ''} /><span class="agy-we-switch-track"><span class="agy-we-switch-thumb"></span></span></label></div>`;
                }
                if (p.type === 'slider') {
                  return `<div class="agy-we-row"><label>${escHtml(p.text || p.name)}</label><input type="range" class="agy-we-slider" style="max-width:160px" data-wp-prop="${escHtml(p.name)}" min="${p.min ?? 0}" max="${p.max ?? 100}" step="${p.step ?? 1}" value="${p.value ?? 0}" /></div>`;
                }
                if (p.type === 'combo' && Array.isArray(p.options)) {
                  const opts = p.options.map((o) => `<option value="${escHtml(JSON.stringify(o.value))}" ${o.value === p.value ? 'selected' : ''}>${escHtml(o.label)}</option>`).join('');
                  return `<div class="agy-we-row"><label>${escHtml(p.text || p.name)}</label><select class="agy-we-select" data-wp-prop-combo="${escHtml(p.name)}">${opts}</select></div>`;
                }
                return `<div class="agy-we-row"><label>${escHtml(p.text || p.name)}</label><input class="agy-we-input" style="width:140px" data-wp-prop-text="${escHtml(p.name)}" value="${escHtml(p.value ?? '')}" /></div>`;
              }).join('')}
            </div>
          `;
        }
      }

      return `
        <div class="agy-we-sec">
          <div class="agy-we-row">
            <input class="agy-we-input" style="flex:1" id="agy-we-search" placeholder="搜索本地壁纸标题..." value="${escHtml(searchQuery)}" />
            <button type="button" class="agy-we-btn" data-act="rescan">重扫</button>
          </div>
          <div class="agy-we-row" style="gap:6px">
            <div class="agy-we-chip-row" style="flex:1">
              ${typeChips}
              <button type="button" class="agy-we-chip ${onlyFavorites ? 'active' : ''}" data-act="toggle-fav-filter">★ 收藏</button>
              <button type="button" class="agy-we-chip" data-act="upload-trigger">+ 本地文件</button>
              <input type="file" id="agy-we-file-input" accept="image/*,video/*" style="display:none" />
            </div>
            <div class="agy-we-chip-row" style="flex:none">
              <button type="button" class="agy-we-chip ${viewMode === 'list' ? 'active' : ''}" data-view="list">列表</button>
              <button type="button" class="agy-we-chip ${viewMode === 'cards' ? 'active' : ''}" data-view="cards">卡片</button>
            </div>
          </div>
          <div style="font-size:11px;color:var(--we-ui-ink-muted)">本地已下载 ${inv.total || 0} 张 · 当前显示 ${filtered.length} 张</div>
        </div>
        ${propsHtml}
        ${listHtml}
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>声音</span></div>
          ${rangeRow('音量', 'videoVolume', s.videoVolume, 0, 100, 1, ' %')}
          ${switchRow('壁纸音轨', 'videoAudioEnabled', s.videoAudioEnabled, '关闭=静音（保留音量数值）')}
        </div>
      `;
    }

    function renderGlassTab(s) {
      const presets = store.getPresets();
      const isLight = document.documentElement.getAttribute('data-agy-we-theme') === 'light';
      const presetBtns = presets.map((p) => `
        <div style="display:inline-flex;align-items:center;gap:2px">
          <button type="button" class="agy-we-chip ${s.activePreset === p.id ? 'active' : ''}" data-apply-preset="${escHtml(p.id)}">${escHtml(p.name)}</button>
          ${!p.builtin ? `<button type="button" class="agy-we-chip" data-del-preset="${escHtml(p.id)}" title="删除预设">×</button>` : ''}
        </div>
      `).join('');

      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>外观预设</span>
            <button type="button" class="agy-we-btn" data-act="save-preset">+ 存为预设</button>
          </div>
          <div class="agy-we-chip-row">${presetBtns || '<span style="font-size:11px;color:var(--we-ui-ink-muted)">加载中...</span>'}</div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>主题与配色</span>
            <button type="button" class="agy-we-icon-btn" data-act="reset-glass" title="重置为 DeepSeek 冰透推荐参数">↺</button>
          </div>
          ${switchRow('强调色跟随壁纸主色', 'themeFollow', s.themeFollow, '自动提取壁纸代表色作为冰透高光与选中色')}
          ${swatchRow('全局强调色', 'accent', s.accent, ACCENT_SWATCHES)}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>玻璃 UI</span></div>
          ${switchRow('启用液态玻璃界面适配', 'glassEnabled', s.glassEnabled)}
          ${swatchRow(isLight ? '浅色玻璃底色' : '深色玻璃底色', isLight ? 'glassColorLight' : 'glassColorDark', isLight ? s.glassColorLight : s.glassColorDark, isLight ? GLASS_SWATCHES_LIGHT : GLASS_SWATCHES_DARK)}
          ${rangeRow('玻璃通透', 'glassAlpha', s.glassAlpha, 0, 100, 1, ' %')}
          ${rangeRow('雾化', 'blur', s.blur, 0, 36, 1, ' px')}
          ${rangeRow('保真度', 'glassFidelity', s.glassFidelity, 0, 100, 1, ' %')}
          ${rangeRow('边框', 'border', s.border, 0, 1, 0.05, ' %', 100)}
          ${rangeRow('背景压暗', 'scrim', s.scrim, 0, 0.85, 0.02, ' %', 100)}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>分区域液态玻璃</span></div>
          ${switchRow('左侧栏液态玻璃', 'leftSidebarGlass', s.leftSidebarGlass, '左侧栏跟随玻璃颜色 / 通透 / 雾化 / 边框')}
          ${switchRow('标题栏液态玻璃', 'headerGlass', s.headerGlass, '默认关 = 顶栏无缝透出壁纸')}
          ${switchRow('右侧面板液态玻璃', 'rightSidebarGlass', s.rightSidebarGlass)}
          ${switchRow('对话输入框液态玻璃', 'composerGlass', s.composerGlass)}
          ${switchRow('消息气泡与代码块玻璃', 'chatCardGlass', s.chatCardGlass)}
          ${switchRow('弹窗与下拉菜单玻璃', 'modalGlass', s.modalGlass)}
          <div class="agy-we-row-col">
            <span>额外补雾化的选择器</span>
            <textarea class="agy-we-textarea" rows="2" data-key="extraGlassSelectors" placeholder=".my-panel, [data-custom-card]">${escHtml(s.extraGlassSelectors || '')}</textarea>
          </div>
        </div>
      `;
    }

    function renderPlaybackTab(s) {
      const inv = store.getInventory();
      const rotSources = [
        ['all', '全部本地壁纸'],
        ['favorites', '仅收藏壁纸'],
        ...(inv.playlists || []).map((p) => [`playlist:${p.name}`, `播放列表: ${p.name} (${p.total})`]),
      ];
      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>画面布局与滤镜</span></div>
          ${selectRow('填充方式', 'objectFit', s.objectFit, [['cover', '裁切填满 (Cover)'], ['contain', '完整居中 (Contain)'], ['stretch', '拉伸填满 (Stretch)']])}
          ${switchRow('水平翻转', 'flip', s.flip)}
          ${rangeRow('画面缩放', 'layerScale', s.layerScale, 100, 200, 1, ' %')}
          ${rangeRow('水平位置', 'layerPositionX', s.layerPositionX, 0, 100, 1, ' %')}
          ${rangeRow('垂直位置', 'layerPositionY', s.layerPositionY, 0, 100, 1, ' %')}
          ${rangeRow('壁纸模糊', 'wallpaperBlur', s.wallpaperBlur, 0, 40, 1, ' px')}
          ${rangeRow('不透明度', 'wallpaperOpacity', s.wallpaperOpacity, 10, 100, 1, ' %')}
          ${rangeRow('亮度', 'backgroundBrightness', s.backgroundBrightness, 40, 150, 1, ' %')}
          ${rangeRow('对比度', 'backgroundContrast', s.backgroundContrast, 60, 150, 1, ' %')}
          ${rangeRow('饱和度', 'backgroundSaturate', s.backgroundSaturate, 0, 200, 1, ' %')}
          ${selectRow('预设滤镜', 'wallpaperFilter', s.wallpaperFilter, [
            ['none', '无'], ['vivid', '鲜艳'], ['warm', '暖色'], ['cool', '冷色'],
            ['sepia', '复古'], ['grayscale', '黑白'], ['brighten', '提亮'], ['darken', '压暗'], ['contrast', '高对比'],
          ])}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>实时引擎、视频与切换</span></div>
          ${switchRow('启用 Scene / Web 实时渲染', 'sceneLive', s.sceneLive)}
          ${selectRow('Scene 帧率上限', 'sceneLiveFps', s.sceneLiveFps, [['15', '15 FPS（省电）'], ['30', '30 FPS（均衡）'], ['60', '60 FPS（流畅）']])}
          ${switchRow('自动降画质省电', 'sceneAutoQuality', s.sceneAutoQuality, '建议关闭以保持 4K 锐利画质')}
          ${switchRow('鼠标指针交互透传', 'scenePointerInteract', s.scenePointerInteract)}
          ${rangeRow('视频倍速', 'playbackRate', s.playbackRate, 0.25, 2, 0.05, 'x')}
          ${selectRow('切换过场动画', 'switchTransition', s.switchTransition, [['fade', '淡入淡出'], ['slide', '轻滑'], ['zoom', '微缩放'], ['cut', '硬切']])}
          ${selectRow('过场速度', 'switchTransitionSpeed', s.switchTransitionSpeed, [['fast', '快'], ['normal', '标准'], ['slow', '柔和']])}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>省电与自动轮播</span></div>
          ${switchRow('窗口隐藏时自动暂停', 'pauseOnHidden', s.pauseOnHidden)}
          ${switchRow('窗口失焦时自动暂停', 'pauseOnBlur', s.pauseOnBlur)}
          ${switchRow('低电量未充电时暂停', 'pauseOnBattery', s.pauseOnBattery)}
          ${switchRow('启用自动轮播', 'rotationEnabled', s.rotationEnabled)}
          ${selectRow('轮播来源', 'rotationSource', s.rotationSource, rotSources)}
          ${rangeRow('轮播间隔', 'rotationIntervalSec', s.rotationIntervalSec, 15, 3600, 15, ' s')}
          ${rangeRow('幻灯片切图', 'pictureSlideSeconds', s.pictureSlideSeconds, 5, 300, 5, ' s')}
        </div>
      `;
    }

    function renderExtensionsTab(s) {
      const fonts = store.getSystemFonts();
      const uiFontOpts = [
        ...(fonts.builtin || []).map((b) => [b.id, b.label]),
        ...(fonts.families || []).slice(0, 200).map((f) => [`sys:${f}`, `系统: ${f}`]),
      ];
      const monoFontOpts = [
        ...(fonts.builtinMono || []).map((b) => [b.id, b.label]),
        ...(fonts.families || []).slice(0, 200).map((f) => [`sys:${f}`, `系统: ${f}`]),
      ];
      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>点击与鼠标拖尾特效</span></div>
          ${switchRow('启用点击与拖尾特效', 'fxEnabled', s.fxEnabled)}
          ${switchRow('点击波纹 / 火花', 'fxClick', s.fxClick)}
          ${selectRow('点击样式', 'fxClickStyle', s.fxClickStyle, [['ripple', '扩散波纹'], ['spark', '粒子火花'], ['both', '波纹+火花']])}
          ${rangeRow('扩散尺寸', 'fxClickSize', s.fxClickSize, 40, 400, 10, ' px')}
          ${switchRow('鼠标拖尾', 'fxTrail', s.fxTrail)}
          ${selectRow('拖尾样式', 'fxTrailStyle', s.fxTrailStyle, [['comet', '彗星光带'], ['dust', '星尘粒子']])}
          ${rangeRow('留存时长', 'fxTrailLength', s.fxTrailLength, 80, 1200, 20, ' ms')}
          ${rangeRow('拖尾线宽', 'fxTrailWidth', s.fxTrailWidth, 1, 12, 1, ' px')}
          ${selectRow('配色模式', 'fxColorMode', s.fxColorMode, [['accent', '跟随强调色'], ['rainbow', '彩虹流光'], ['custom', '自定义颜色']])}
          ${swatchRow('自定义特效色', 'fxColor', s.fxColor, ACCENT_SWATCHES)}
          ${rangeRow('不透明度', 'fxOpacity', s.fxOpacity, 10, 100, 5, ' %')}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>3D 鼠标视差</span></div>
          ${switchRow('启用 3D 视差', 'parallaxEnabled', s.parallaxEnabled)}
          ${rangeRow('视差幅度', 'parallaxBg', s.parallaxBg, 0, 8, 0.2, ' %')}
          ${switchRow('悬浮按钮跟随视差', 'parallaxRope', s.parallaxRope)}
          ${rangeRow('平滑阻尼', 'parallaxSmooth', s.parallaxSmooth, 10, 96, 2, ' %')}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>全局字体</span>
            <button type="button" class="agy-we-btn" data-act="refresh-fonts">刷新系统字体</button>
          </div>
          ${switchRow('启用自定义字体', 'fontCustom', s.fontCustom)}
          ${selectRow('界面字体', 'uiFontFamily', s.uiFontFamily, uiFontOpts.length ? uiFontOpts : [['', '默认']])}
          ${selectRow('代码字体', 'monoFontFamily', s.monoFontFamily, monoFontOpts.length ? monoFontOpts : [['', '默认']])}
          ${rangeRow('字号缩放', 'uiFontScale', s.uiFontScale, 85, 125, 1, ' %')}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>悬浮按钮与性能监控</span>
            <button type="button" class="agy-we-btn" data-act="reset-rope">复位按钮位置</button>
          </div>
          ${switchRow('显示悬浮入口按钮', 'ropeShown', s.ropeShown)}
          ${selectRow('入口样式', 'ropeStyle', s.ropeStyle, [['pill', '胶囊按钮'], ['orb', '圆形图标'], ['minimal', '极简半透明']])}
          ${switchRow('开启性能监控统计', 'perfEnabled', s.perfEnabled)}
          ${switchRow('显示桌面性能悬浮窗', 'perfFloat', s.perfFloat)}
        </div>
      `;
    }

    function renderSystemTab(s) {
      const inv = store.getInventory();
      const t = store.getTelemetry();
      const customDirsText = (s.customWallpaperDirs || []).join('\n');
      const diagText = diagLines.length
        ? diagLines.slice(-40).map((l) => `[${l.ts.slice(11, 19)}] ${l.kind}: ${typeof l.detail === 'string' ? l.detail : JSON.stringify(l.detail)}`).join('\n')
        : '暂无诊断日志';

      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>运行状态</span></div>
          <div style="font-size:11px;line-height:1.8;color:var(--we-ui-ink-muted)">
            <div>本地服务：<b style="color:var(--we-ui-ink)">${escHtml(store.apiBase)}</b>（${t.serverOk ? '正常' : '连接中'}）</div>
            <div>WebWallGL 引擎：<b style="color:var(--we-ui-ink)">${inv.webwallglAvailable ? '已就绪' : '未安装'}</b></div>
            <div>当前渲染模式：<b style="color:var(--we-ui-ink)">${escHtml(t.activeMode || 'idle')}</b>（壁纸 FPS: ${t.wallpaperFps || 0}）</div>
            <div>Wallpaper Engine 目录：<b style="color:var(--we-ui-ink)">${escHtml(inv.installDir || '未自动发现')}</b></div>
            <div>本地创意工坊库：<b style="color:var(--we-ui-ink)">${(inv.libraryDirs || []).length} 个目录 · 共 ${inv.total || 0} 张</b></div>
            <div>本地导入存储目录：<b style="color:var(--we-ui-ink)">${escHtml(inv.uploadDir || '-')}</b></div>
          </div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>本地壁纸目录</span></div>
          <div class="agy-we-row-col">
            <span>手动指定 Steam 根目录（可选，留空自动探测）</span>
            <input class="agy-we-input" id="agy-we-steam-root" value="${escHtml(s.customSteamRoot || '')}" placeholder="例如 D:\\Steam" />
          </div>
          <div class="agy-we-row-col">
            <span>额外本地壁纸目录（每行一个绝对路径）</span>
            <textarea class="agy-we-textarea" id="agy-we-custom-dirs" rows="3" placeholder="D:\\Wallpapers">${escHtml(customDirsText)}</textarea>
          </div>
          <div class="agy-we-row" style="justify-content:flex-end">
            <button type="button" class="agy-we-btn primary" data-act="save-dirs">保存并重新扫描</button>
          </div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>诊断日志</span>
            <button type="button" class="agy-we-btn" data-act="reload-diag">刷新</button>
          </div>
          <div class="agy-we-log">${escHtml(diagText)}</div>
        </div>
      `;
    }

    function bindBodyEvents() {
      bodyEl.querySelectorAll('[data-key]').forEach((el) => {
        const key = el.dataset.key;
        const isLiveControl = el.type === 'range' || el.type === 'color' || el.tagName === 'TEXTAREA';
        const evName = (el.type === 'range' || el.type === 'color') ? 'input' : 'change';
        el.addEventListener(evName, () => {
          let val;
          if (el.type === 'checkbox') val = el.checked;
          else if (el.type === 'range') {
            val = Number(el.value);
            const mn = Number(el.min);
            const mx = Number(el.max);
            if (mx > mn) {
              el.style.setProperty('--val-pct', `${(((val - mn) / (mx - mn)) * 100).toFixed(1)}%`);
            }
            const mul = Number(el.dataset.mul || '1');
            const suf = el.dataset.suffix || '';
            const disp = mul === 1 ? val : Math.round(val * mul);
            const badge = bodyEl.querySelector(`[data-val-for="${key}"]`);
            if (badge) badge.textContent = `${disp}${suf}`;
          } else {
            val = el.value;
            if (key === 'sceneLiveFps') val = Number(val);
          }
          if (isLiveControl) skipNextSettingsRender = true;
          try {
            store.updateSettings({ [key]: val });
          } finally {
            skipNextSettingsRender = false;
          }
        });
      });

      bodyEl.querySelectorAll('[data-swatch-key]').forEach((dot) => {
        dot.addEventListener('click', () => {
          const k = dot.dataset.swatchKey;
          const v = dot.dataset.swatchVal;
          if (k && v) store.updateSettings({ [k]: v }, true);
        });
      });

      bodyEl.querySelectorAll('[data-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
          viewMode = btn.dataset.view === 'list' ? 'list' : 'cards';
          renderBody();
        });
      });

      const searchEl = bodyEl.querySelector('#agy-we-search');
      if (searchEl) {
        searchEl.addEventListener('input', () => {
          searchQuery = searchEl.value;
          renderBody();
          const nextSearch = bodyEl.querySelector('#agy-we-search');
          if (nextSearch) {
            nextSearch.focus();
            nextSearch.setSelectionRange(searchQuery.length, searchQuery.length);
          }
        });
      }

      bodyEl.querySelectorAll('[data-type-chip]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const t = btn.dataset.typeChip;
          const cur = new Set(store.getSettings().typeFilter || ['scene', 'web', 'video', 'image']);
          if (cur.has(t) && cur.size > 1) cur.delete(t);
          else cur.add(t);
          store.updateSettings({ typeFilter: Array.from(cur) }, true);
        });
      });

      bodyEl.querySelectorAll('[data-select-wp]').forEach((card) => {
        card.addEventListener('click', (ev) => {
          if (ev.target.closest('button')) return;
          const id = card.dataset.selectWp;
          store.updateSettings({ enabled: true, wallpaperId: id }, true);
          const wp = (store.getInventory().wallpapers || []).find((w) => w.id === id);
          if (wp && (wp.type === 'scene' || wp.type === 'web')) {
            store.loadProps(wp.token).then((d) => {
              activePropsToken = wp.token;
              activeProps = (d && d.props) || [];
              if (isOpen && activeTab === 'library') renderBody();
            }).catch(() => {});
          }
        });
      });

      bodyEl.querySelectorAll('[data-fav-wp]').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const id = btn.dataset.favWp;
          const set = new Set(store.getSettings().favoriteIds || []);
          if (set.has(id)) set.delete(id);
          else set.add(id);
          store.updateSettings({ favoriteIds: Array.from(set) }, true);
        });
      });

      bodyEl.querySelectorAll('[data-del-upload]').forEach((btn) => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          store.deleteUpload(btn.dataset.delUpload).then(() => showToast('已删除本地导入壁纸')).catch((e) => showToast(e.message));
        });
      });

      const pushWpProp = (name, value) => {
        const wp = store.getActiveWallpaper();
        if (!wp) return;
        const cur = { ...((store.getSettings().userProps || {})[wp.token] || {}), [name]: value };
        store.saveProps(wp.token, cur).catch(() => {});
      };
      bodyEl.querySelectorAll('[data-wp-prop]').forEach((el) => {
        el.addEventListener('change', () => {
          const val = el.type === 'checkbox' ? el.checked : Number(el.value);
          pushWpProp(el.dataset.wpProp, val);
        });
      });
      bodyEl.querySelectorAll('[data-wp-prop-combo]').forEach((el) => {
        el.addEventListener('change', () => {
          let val = el.value;
          try { val = JSON.parse(val); } catch {}
          pushWpProp(el.dataset.wpPropCombo, val);
        });
      });
      bodyEl.querySelectorAll('[data-wp-prop-text]').forEach((el) => {
        el.addEventListener('change', () => pushWpProp(el.dataset.wpPropText, el.value));
      });

      bodyEl.querySelectorAll('[data-apply-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const p = store.getPresets().find((x) => x.id === btn.dataset.applyPreset);
          if (p && p.values) {
            store.updateSettings({ ...p.values, activePreset: p.id }, true);
            showToast(`已应用预设：${p.name}`);
          }
        });
      });
      bodyEl.querySelectorAll('[data-del-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          store.deletePreset(btn.dataset.delPreset).then(() => showToast('已删除预设')).catch(() => {});
        });
      });

      const fileInput = bodyEl.querySelector('#agy-we-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', () => {
          const f = fileInput.files && fileInput.files[0];
          if (!f) return;
          showToast(`正在导入 ${f.name}...`);
          store.uploadFile(f)
            .then((res) => {
              if (res && res.entry) store.updateSettings({ enabled: true, wallpaperId: res.entry.id }, true);
              showToast('本地壁纸已导入并应用');
            })
            .catch((e) => showToast(`导入失败：${e.message}`));
        });
      }

      bodyEl.querySelectorAll('[data-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.act;
          if (act === 'rescan') {
            showToast('正在重新扫描本地壁纸库...');
            store.loadInventory(true).then((inv) => showToast(`扫描完成，本地已下载 ${inv.total || 0} 张`)).catch((e) => showToast(e.message));
          } else if (act === 'toggle-fav-filter') {
            onlyFavorites = !onlyFavorites;
            renderBody();
          } else if (act === 'upload-trigger' && fileInput) {
            fileInput.click();
          } else if (act === 'reset-glass') {
            store.updateSettings({
              activePreset: 'agy-crystal',
              themeFollow: false,
              accent: '#75e6f5',
              caretColor: '',
              glassColorDark: '#0a1622',
              glassColorLight: '#ffffff',
              scrim: 0.5,
              blur: 9,
              glassAlpha: 40,
              glassFidelity: 20,
              border: 0.35,
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
              fontCustom: true,
              wallpaperBlur: 0,
              backgroundBrightness: 85,
              backgroundContrast: 110,
              backgroundSaturate: 150,
            }, true);
            showToast('已重置为 DeepSeek 冰透推荐参数');
          } else if (act === 'reset-rope') {
            store.updateSettings({ ropeX: -1, ropeY: 0, ropeShown: true }, true);
            showToast('已吸附复位到窗口顶端');
          } else if (act === 'save-preset') {
            const name = window.prompt('请输入新预设名称：', '我的冰透玻璃');
            if (!name) return;
            store.savePreset(name).then(() => showToast('预设已保存')).catch((e) => showToast(e.message));
          } else if (act === 'refresh-fonts') {
            showToast('正在扫描系统字体...');
            store.loadSystemFonts(true).then((f) => showToast(`已发现 ${(f.families || []).length} 款系统字体`)).catch(() => {});
          } else if (act === 'save-dirs') {
            const steamInput = bodyEl.querySelector('#agy-we-steam-root');
            const dirsInput = bodyEl.querySelector('#agy-we-custom-dirs');
            const customSteamRoot = steamInput ? steamInput.value.trim() : '';
            const customWallpaperDirs = dirsInput
              ? dirsInput.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
              : [];
            store.updateSettings({ customSteamRoot, customWallpaperDirs }, true);
            setTimeout(() => {
              store.loadInventory(true).then((inv) => showToast(`已保存并重扫：共 ${inv.total || 0} 张壁纸`)).catch(() => {});
            }, 150);
          } else if (act === 'reload-diag') {
            store.loadDiagLog().then((d) => {
              diagLines = (d && d.lines) || [];
              renderBody();
            }).catch(() => {});
          }
        });
      });
    }

    function renderBody() {
      applyRopeState();
      if (!isOpen) return;
      const s = store.getSettings();
      renderNowBar(s);
      if (activeTab === 'library') bodyEl.innerHTML = renderLibraryTab(s);
      else if (activeTab === 'glass') bodyEl.innerHTML = renderGlassTab(s);
      else if (activeTab === 'playback') bodyEl.innerHTML = renderPlaybackTab(s);
      else if (activeTab === 'extensions') bodyEl.innerHTML = renderExtensionsTab(s);
      else if (activeTab === 'system') bodyEl.innerHTML = renderSystemTab(s);
      bindBodyEvents();
    }

    function onKeyDown(ev) {
      if (ev.ctrlKey && ev.altKey && (ev.key === 'w' || ev.key === 'W')) {
        ev.preventDefault();
        if (settingsModal && settingsModal.isOpen()) settingsModal.close();
        else setOpen(!isOpen);
      } else if (ev.key === 'Escape') {
        if (settingsModal && settingsModal.isOpen()) settingsModal.close();
        else if (isOpen) setOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown, true);
    const unsub = store.subscribe((topic) => {
      if (topic === 'telemetry') {
        if (isOpen) renderNowBar(store.getSettings());
        return;
      }
      applyRopeState();
      if (isOpen && !(topic === 'settings' && skipNextSettingsRender)) renderBody();
    });

    applyRopeState();

    return {
      ensureMounted,
      setOpen,
      toggle: () => setOpen(!isOpen),
      destroy() {
        destroyed = true;
        unsub();
        if (snapAnimTimer) { clearTimeout(snapAnimTimer); snapAnimTimer = null; }
        if (settingsModal) { try { settingsModal.destroy(); } catch {} }
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('blur', onWinBlurCleanup);
        window.removeEventListener('resize', onWinResizeClamp);
        try { root.remove(); } catch {}
        try { styleEl.remove(); } catch {}
      },
    };
  }

  NS.createUiPanel = createUiPanel;
})();
