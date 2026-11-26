/**
 * Full-Featured Centered Liquid Glass Settings Modal ("壁纸引擎设置中心").
 * Triggered from the bottom "更多外观设置 ›" / "壁纸引擎设置 ›" button inside the quick drawer.
 * Tabs: 壁纸库 | 外观 | 播放 | 系统 | 扩展 | 关于
 */
(function initSettingsModalModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  const TYPE_LABELS = { scene: '场景', video: '视频', web: '网页', image: '图片' };
  const GLASS_SWATCHES_DARK = ['#0a1622', '#0f172a', '#162032', '#1e1b2e', '#1a2421', '#22151a', '#000000'];
  const GLASS_SWATCHES_LIGHT = ['#ffffff', '#f0f9ff', '#fdf2f8', '#fef3c7', '#ecfdf5', '#f1f5f9', '#e2e8f0'];
  const ACCENT_SWATCHES = ['#75e6f5', '#4f8cff', '#7dd3fc', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#fb7185'];
  const CARET_SWATCHES = ['', '#ffffff', '#000000', '#75e6f5', '#4f8cff', '#f472b6', '#fb7185', '#fbbf24'];
  const MASCOT_LIST = [
    ['gemini', 'Gemini'],
    ['whale', '鲸尾女仆'],
    ['deepseek', 'DeepSeek'],
    ['qwen', 'Qwen'],
    ['claude', 'Claude'],
    ['kimi', 'Kimi'],
    ['gpt', 'GPT'],
    ['grok', 'Grok'],
    ['glm', 'GLM'],
    ['phoebe', 'Phoebe'],
    ['custom', '自定义'],
  ];

  function escHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createSettingsModal(store, wallpaperLayer, rootContainer, helpers) {
    const { showToast, openDrawerToLibrary } = helpers;

    const backdrop = document.createElement('div');
    backdrop.id = 'agy-we-modal-backdrop';
    const modal = document.createElement('div');
    modal.id = 'agy-we-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Antigravity 壁纸引擎设置');
    modal.innerHTML = `
      <div class="agy-we-modal-hdr">
        <div class="agy-we-modal-title-wrap">
          <span class="agy-we-modal-title">壁纸引擎</span>
          <span class="agy-we-modal-count" id="agy-we-modal-count">0</span>
        </div>
        <span class="agy-we-modal-sub">本地 Wallpaper Engine 壁纸 · 液态玻璃主题</span>
        <div class="agy-we-hdr-actions">
          <button type="button" class="agy-we-btn" data-mact="export-json">导出预设</button>
          <button type="button" class="agy-we-btn" data-mact="import-json">导入预设</button>
          <input type="file" id="agy-we-preset-import-file" accept=".json,application/json" style="display:none" />
          <button type="button" class="agy-we-btn" data-mact="close-modal">✕</button>
        </div>
      </div>
      <div class="agy-we-modal-tabs-wrap">
        <div class="agy-we-tabs" id="agy-we-modal-tabs">
          <button type="button" class="agy-we-tab" data-mtab="library">壁纸库</button>
          <button type="button" class="agy-we-tab active" data-mtab="appearance">外观</button>
          <button type="button" class="agy-we-tab" data-mtab="playback">播放</button>
          <button type="button" class="agy-we-tab" data-mtab="system">系统</button>
          <button type="button" class="agy-we-tab" data-mtab="extensions">扩展</button>
          <button type="button" class="agy-we-tab" data-mtab="about">关于</button>
        </div>
      </div>
      <div class="agy-we-modal-body" id="agy-we-modal-body"></div>
    `;
    rootContainer.appendChild(backdrop);
    rootContainer.appendChild(modal);

    const bodyEl = modal.querySelector('#agy-we-modal-body');
    const countEl = modal.querySelector('#agy-we-modal-count');
    const importFileInput = modal.querySelector('#agy-we-preset-import-file');

    let isOpen = false;
    let activeTab = 'appearance';
    let diagLines = [];
    let skipNextRender = false;

    function switchRow(label, key, checked, hint = '') {
      return `
        <div class="agy-we-row">
          <div style="flex:1;min-width:0">
            <div>${escHtml(label)}</div>
            ${hint ? `<div class="agy-we-hint">${escHtml(hint)}</div>` : ''}
          </div>
          <label class="agy-we-switch">
            <input type="checkbox" data-mkey="${key}" ${checked ? 'checked' : ''} />
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
          <span class="agy-we-slider-label" style="min-width:92px">${escHtml(label)}</span>
          <input type="range" class="agy-we-slider" data-mkey="${key}" data-mul="${displayMul}" data-suffix="${escHtml(suffix)}" min="${min}" max="${max}" step="${step}" value="${val}" style="--val-pct:${pct.toFixed(1)}%" />
          <span class="agy-we-pill-val" data-mval-for="${key}">${disp}${suffix}</span>
        </div>
      `;
    }

    function selectRow(label, key, val, opts, hint = '') {
      const optionsHtml = opts.map(([v, text]) =>
        `<option value="${escHtml(v)}" ${String(v) === String(val) ? 'selected' : ''}>${escHtml(text)}</option>`
      ).join('');
      return `
        <div class="agy-we-row">
          <div style="flex:1;min-width:0">
            <div>${escHtml(label)}</div>
            ${hint ? `<div class="agy-we-hint">${escHtml(hint)}</div>` : ''}
          </div>
          <select class="agy-we-select" style="min-width:160px" data-mkey="${key}">${optionsHtml}</select>
        </div>
      `;
    }

    function swatchRow(label, key, currentVal, palette, hint = '') {
      const cur = String(currentVal || '').toLowerCase();
      const dots = palette.map((hex) => {
        if (hex === '') {
          return `<button type="button" class="agy-we-swatch ${cur === '' ? 'active' : ''}" style="background:linear-gradient(135deg,#1e293b 50%,#f8fafc 50%);font-size:9px;color:#0f172a;font-weight:700" data-mswatch-key="${key}" data-mswatch-val="" title="自动">自</button>`;
        }
        return `<button type="button" class="agy-we-swatch ${cur === hex.toLowerCase() ? 'active' : ''}" style="background:${hex}" data-mswatch-key="${key}" data-mswatch-val="${hex}" title="${hex}"></button>`;
      }).join('');
      return `
        <div class="agy-we-row-col">
          <span>${escHtml(label)}</span>
          ${hint ? `<div class="agy-we-hint">${escHtml(hint)}</div>` : ''}
          <div class="agy-we-swatches">
            ${dots}
            <label class="agy-we-color-custom">
              <input type="color" data-mkey="${key}" value="${escHtml(currentVal || '#7dd3fc')}" />
              <span>自定义</span>
            </label>
          </div>
        </div>
      `;
    }

    function renderLibraryPage(s) {
      const inv = store.getInventory();
      const wp = store.getActiveWallpaper();
      const t = store.getTelemetry();
      const playing = Boolean(s.enabled && wp && !s.paused && !t.pausedEffective);
      const typeLabel = wp ? `${TYPE_LABELS[wp.type] || wp.type}壁纸` : '未选择';
      const rotSources = [
        ['all', '全部本地壁纸'],
        ['favorites', '仅收藏壁纸'],
        ...(inv.playlists || []).map((p) => [`playlist:${p.name}`, `播放列表: ${p.name} (${p.total})`]),
      ];
      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>当前壁纸</span></div>
          <div class="agy-we-vinyl-card">
            <div class="agy-we-vinyl ${playing ? 'playing' : ''}">
              <div class="agy-we-vinyl-cover">${wp && wp.previewUrl ? `<img src="${escHtml(store.apiUrl(wp.previewUrl))}" alt="" />` : ''}</div>
              <div class="agy-we-vinyl-hole"></div>
            </div>
            <div class="agy-we-vinyl-info">
              <div class="agy-we-vinyl-title">${escHtml(wp ? (wp.title || wp.id) : '暂未选择壁纸')}</div>
              <div class="agy-we-vinyl-meta">${escHtml(typeLabel)} · ${playing ? '播放中' : '已暂停'}${t.wallpaperFps ? ` · ${t.wallpaperFps} FPS` : ''}</div>
            </div>
            <button type="button" class="agy-we-btn primary" data-mact="pick-wallpaper">选择壁纸</button>
          </div>
          <div class="agy-we-chip-row">
            <button type="button" class="agy-we-btn" data-mact="toggle-pause">${s.paused ? '▶ 继续' : '⏸ 暂停'}</button>
            <button type="button" class="agy-we-btn" data-mact="toggle-audio">${s.videoAudioEnabled ? '🔊 声音开' : '🔇 音乐关'}</button>
            <button type="button" class="agy-we-btn" data-mact="next-wp">⏭ 下一张</button>
            <button type="button" class="agy-we-btn" data-mact="clear-wp">清除</button>
            <button type="button" class="agy-we-btn" data-mact="rescan">刷新壁纸库</button>
          </div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>切换过场</span></div>
          ${selectRow('过场动画', 'switchTransition', s.switchTransition, [['fade', '淡入淡出'], ['slide', '轻滑'], ['zoom', '微缩放'], ['cut', '硬切']], '换壁纸时的转场')}
          ${selectRow('过场速度', 'switchTransitionSpeed', s.switchTransitionSpeed, [['fast', '快'], ['normal', '标准'], ['slow', '柔和']])}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>自动轮播</span></div>
          ${switchRow('启用定时自动轮播', 'rotationEnabled', s.rotationEnabled, '按间隔自动切换到下一张本地已下载壁纸')}
          ${selectRow('轮播来源', 'rotationSource', s.rotationSource, rotSources)}
          ${rangeRow('轮播间隔', 'rotationIntervalSec', s.rotationIntervalSec, 15, 3600, 15, ' s')}
          ${rangeRow('幻灯片间隔', 'pictureSlideSeconds', s.pictureSlideSeconds, 5, 300, 5, ' s')}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>本地壁纸存储</span></div>
          <div style="font-size:12px;color:var(--we-ui-ink-muted);line-height:1.7">
            <div>Wallpaper Engine 目录：<b style="color:var(--we-ui-ink)">${escHtml(inv.installDir || '未发现')}</b></div>
            <div>本地导入存储位置：<b style="color:var(--we-ui-ink)">${escHtml(inv.uploadDir || '-')}</b></div>
            <div class="agy-we-hint">仅支持本地已下载壁纸，不加载任何在线外链壁纸。</div>
          </div>
        </div>
      `;
    }

    function renderAppearancePage(s) {
      const presets = store.getPresets();
      const fonts = store.getSystemFonts();
      const isLight = document.documentElement.getAttribute('data-agy-we-theme') === 'light';
      const slots = [];
      for (const p of presets) {
        const isAct = s.activePreset === p.id;
        slots.push(`
          <div class="agy-we-preset-slot ${isAct ? 'active' : ''}">
            <button type="button" class="agy-we-preset-name" data-mapply-preset="${escHtml(p.id)}" title="${escHtml(p.name)}">${escHtml(p.name)}</button>
            ${!p.builtin ? `<button type="button" class="agy-we-preset-del" data-mdel-preset="${escHtml(p.id)}" title="删除">×</button>` : ''}
          </div>
        `);
      }
      const emptyNeeded = Math.max(2, Math.ceil(slots.length / 4) * 4 - slots.length + 4);
      for (let i = 0; i < Math.min(8, emptyNeeded); i += 1) {
        slots.push(`<button type="button" class="agy-we-preset-slot empty" data-mact="save-preset">空预设位</button>`);
      }

      const lc = Array.isArray(s.leftSidebarCorners) && s.leftSidebarCorners.length === 4 ? s.leftSidebarCorners : [0, 1, 1, 0];
      const rc = Array.isArray(s.rightSidebarCorners) && s.rightSidebarCorners.length === 4 ? s.rightSidebarCorners : [1, 0, 0, 1];
      const cornerLabels = ['左上角', '右上角', '右下角', '左下角'];
      const radOpts = [[0, '跟随原生'], [6, '小 6px'], [12, '中 12px'], [20, '大 20px']];

      const uiFontOpts = [
        ['', '跟随 Antigravity'],
        ...(fonts.builtin || []).map((b) => [b.id, b.label]),
        ...(fonts.families || []).slice(0, 200).map((f) => [`sys:${f}`, `系统: ${f}`]),
      ];
      const monoFontOpts = [
        ['', '跟随'],
        ...(fonts.builtinMono || []).map((b) => [b.id, b.label]),
        ...(fonts.families || []).slice(0, 200).map((f) => [`sys:${f}`, `系统: ${f}`]),
      ];

      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>主题</span>
            <button type="button" class="agy-we-icon-btn" data-mact="reset-appearance" title="重置外观页">↺</button>
          </div>
          ${switchRow('主题随壁纸强调色', 'themeFollow', s.themeFollow, '自动提取当前壁纸主色作为全局高亮色')}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>细节</span></div>
          ${rangeRow('边框', 'border', s.border, 0, 1, 0.05, ' %', 100)}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>主题预设</span></div>
          <div class="agy-we-hint">一键套用整套液态玻璃与画面配置（出厂预设 + 自定义预设槽位），应用后可继续微调</div>
          <div class="agy-we-preset-box">
            <div class="agy-we-preset-grid">${slots.join('')}</div>
            <div class="agy-we-row" style="justify-content:space-between;padding-top:4px">
              <button type="button" class="agy-we-btn" data-mact="save-preset">保存当前为预设...</button>
              <div style="display:flex;gap:8px">
                <button type="button" class="agy-we-btn" data-mact="export-json">导出预设...</button>
                <button type="button" class="agy-we-btn" data-mact="import-json">导入预设...</button>
              </div>
            </div>
          </div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>玻璃 UI</span></div>
          ${switchRow('启用液态玻璃界面适配', 'glassEnabled', s.glassEnabled)}
          ${swatchRow(isLight ? '浅色玻璃颜色' : '深色玻璃颜色', isLight ? 'glassColorLight' : 'glassColorDark', isLight ? s.glassColorLight : s.glassColorDark, isLight ? GLASS_SWATCHES_LIGHT : GLASS_SWATCHES_DARK)}
          ${rangeRow('玻璃通透', 'glassAlpha', s.glassAlpha, 0, 100, 1, ' %')}
          ${rangeRow('雾化', 'blur', s.blur, 0, 36, 1, ' px')}
          ${rangeRow('暗化', 'scrim', s.scrim, 0, 0.85, 0.02, ' %', 100)}
          ${rangeRow('玻璃保真度', 'glassFidelity', s.glassFidelity, 0, 100, 1, ' %')}
          <div class="agy-we-row">
            <div style="flex:1;min-width:0">
              <div>额外补雾化的选择器</div>
              <div class="agy-we-hint">给其他自定义面板补上毛玻璃（逗号或换行分隔）</div>
            </div>
            <input class="agy-we-input" style="width:200px" data-mkey="extraGlassSelectors" value="${escHtml(s.extraGlassSelectors || '')}" placeholder=".my-panel, [data-card]" />
          </div>
          ${switchRow('左侧栏液态玻璃', 'leftSidebarGlass', s.leftSidebarGlass, '左侧栏跟随玻璃颜色 / 通透 / 雾化 / 边框')}
          ${switchRow('标题栏液态玻璃', 'headerGlass', s.headerGlass, '默认关 = 顶栏无缝透出壁纸')}
          ${switchRow('右侧面板液态玻璃', 'rightSidebarGlass', s.rightSidebarGlass)}
          ${switchRow('对话输入框液态玻璃', 'composerGlass', s.composerGlass)}
          ${switchRow('消息气泡与代码块玻璃', 'chatCardGlass', s.chatCardGlass)}
          ${switchRow('弹窗与菜单防重影玻璃', 'modalGlass', s.modalGlass)}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>侧边栏圆角</span></div>
          <div class="agy-we-row">
            <label>左侧栏 · 统一圆角</label>
            <div class="agy-we-seg-group" style="max-width:340px">
              ${radOpts.map(([v, txt]) => `<button type="button" class="agy-we-seg-btn ${Number(s.leftSidebarRadius) === v ? 'active' : ''}" data-mset-key="leftSidebarRadius" data-mset-val="${v}">${txt}</button>`).join('')}
            </div>
          </div>
          <div class="agy-we-row">
            <label>左侧栏 · 四角单独</label>
            <div class="agy-we-seg-group" style="max-width:380px">
              ${cornerLabels.map((lbl, idx) => `<button type="button" class="agy-we-seg-btn ${lc[idx] ? 'active' : ''}" data-mcorner-side="left" data-mcorner-idx="${idx}">${lbl} ${lc[idx] ? '圆角' : '直角'}</button>`).join('')}
            </div>
          </div>
          <div class="agy-we-row">
            <label>右侧栏 · 统一圆角</label>
            <div class="agy-we-seg-group" style="max-width:340px">
              ${radOpts.map(([v, txt]) => `<button type="button" class="agy-we-seg-btn ${Number(s.rightSidebarRadius) === v ? 'active' : ''}" data-mset-key="rightSidebarRadius" data-mset-val="${v}">${txt}</button>`).join('')}
            </div>
          </div>
          <div class="agy-we-row">
            <label>右侧栏 · 四角单独</label>
            <div class="agy-we-seg-group" style="max-width:380px">
              ${cornerLabels.map((lbl, idx) => `<button type="button" class="agy-we-seg-btn ${rc[idx] ? 'active' : ''}" data-mcorner-side="right" data-mcorner-idx="${idx}">${lbl} ${rc[idx] ? '圆角' : '直角'}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>全局 UI 配色</span></div>
          ${swatchRow('全局配色', 'accent', s.accent, ACCENT_SWATCHES, '一处调全部：界面强调色、按钮、选中态与侧栏高亮都会跟着变')}
          ${swatchRow('光标颜色', 'caretColor', s.caretColor, CARET_SWATCHES, '输入框光标看不清时换个颜色（始终可调）')}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>全局字体与文字色</span>
            <button type="button" class="agy-we-btn" data-mact="refresh-fonts">重新扫描字体</button>
          </div>
          ${switchRow('字体自定义', 'fontCustom', s.fontCustom)}
          ${selectRow('默认字体', 'uiFontFamily', s.uiFontFamily, uiFontOpts, '整套界面的默认字族（全局）')}
          ${selectRow('代码 / 终端字体', 'monoFontFamily', s.monoFontFamily, monoFontOpts, '对话里的代码块与终端等宽字体')}
          ${rangeRow('全局字号缩放', 'uiFontScale', s.uiFontScale, 85, 125, 1, ' %')}
          <div class="agy-we-row">
            <label>正文主文字颜色</label>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="color" data-mkey="textColorPrimary" value="${escHtml(s.textColorPrimary || '#f9fafb')}" style="width:26px;height:26px;border:none;background:transparent;cursor:pointer" />
              <span class="agy-we-pill-val">${escHtml(s.textColorPrimary || '默认')}</span>
              ${s.textColorPrimary ? `<button type="button" class="agy-we-btn" data-mset-key="textColorPrimary" data-mset-val="">清除</button>` : ''}
            </div>
          </div>
          <div class="agy-we-row">
            <label>弱化说明颜色</label>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="color" data-mkey="textColorMuted" value="${escHtml(s.textColorMuted || '#75e6f5')}" style="width:26px;height:26px;border:none;background:transparent;cursor:pointer" />
              <span class="agy-we-pill-val">${escHtml(s.textColorMuted || '默认')}</span>
              ${s.textColorMuted ? `<button type="button" class="agy-we-btn" data-mset-key="textColorMuted" data-mset-val="">清除</button>` : ''}
            </div>
          </div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>重置本页</span></div>
          <div class="agy-we-hint">把外观页的设置恢复为 DeepSeek 冰透默认值；已选壁纸与本地库不受影响。</div>
          <div><button type="button" class="agy-we-btn" data-mact="reset-appearance">重置本页</button></div>
        </div>
      `;
    }

    function renderPlaybackPage(s) {
      const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
      const fpsOpts = [[60, '60fps (流畅)'], [30, '30fps (均衡)'], [15, '15fps (省电)']];
      const fitOpts = [['cover', '覆盖'], ['contain', '居中'], ['stretch', '拉伸']];
      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>画面</span>
            <button type="button" class="agy-we-icon-btn" data-mact="reset-playback" title="重置画面参数">↺</button>
          </div>
          ${rangeRow('壁纸模糊', 'wallpaperBlur', s.wallpaperBlur, 0, 40, 1, ' px')}
          ${rangeRow('亮度', 'backgroundBrightness', s.backgroundBrightness, 30, 160, 1, ' %')}
          ${rangeRow('对比度', 'backgroundContrast', s.backgroundContrast, 50, 160, 1, ' %')}
          ${rangeRow('饱和度', 'backgroundSaturate', s.backgroundSaturate, 0, 220, 1, ' %')}
          ${rangeRow('水平', 'layerPositionX', s.layerPositionX, 0, 100, 1, ' %')}
          ${rangeRow('垂直', 'layerPositionY', s.layerPositionY, 0, 100, 1, ' %')}
          ${rangeRow('缩放', 'layerScale', s.layerScale, 100, 200, 1, ' %')}
          ${rangeRow('壁纸不透明', 'wallpaperOpacity', s.wallpaperOpacity, 10, 100, 1, ' %')}
          ${rangeRow('暗化', 'scrim', s.scrim, 0, 0.85, 0.02, ' %', 100)}
          <div class="agy-we-row">
            <label style="min-width:92px;flex:none">倍速</label>
            <div class="agy-we-seg-group" style="flex:1">
              ${speeds.map((sp) => `<button type="button" class="agy-we-seg-btn ${Math.abs(Number(s.playbackRate) - sp) < 0.01 ? 'active' : ''}" data-mset-key="playbackRate" data-mset-val="${sp}">${sp}x</button>`).join('')}
            </div>
          </div>
          <div class="agy-we-row">
            <div style="min-width:92px;flex:none">
              <div>帧率上限</div>
              <div class="agy-we-hint">Scene 实时渲染</div>
            </div>
            <div class="agy-we-seg-group" style="flex:1">
              ${fpsOpts.map(([f, lbl]) => `<button type="button" class="agy-we-seg-btn ${Number(s.sceneLiveFps) === f ? 'active' : ''}" data-mset-key="sceneLiveFps" data-mset-val="${f}">${lbl}</button>`).join('')}
            </div>
          </div>
          <div class="agy-we-row">
            <label style="min-width:92px;flex:none">适配</label>
            <div class="agy-we-seg-group" style="flex:1">
              ${fitOpts.map(([fv, flbl]) => `<button type="button" class="agy-we-seg-btn ${s.objectFit === fv ? 'active' : ''}" data-mset-key="objectFit" data-mset-val="${fv}">${flbl}</button>`).join('')}
            </div>
          </div>
          ${switchRow('水平翻转', 'flip', s.flip)}
          ${selectRow('预设滤镜', 'wallpaperFilter', s.wallpaperFilter, [
            ['none', '无'], ['vivid', '鲜艳'], ['warm', '暖色'], ['cool', '冷色'],
            ['sepia', '复古'], ['grayscale', '黑白'], ['brighten', '提亮'], ['darken', '压暗'], ['contrast', '高对比'],
          ])}
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>声音与省电</span></div>
          ${rangeRow('音量', 'videoVolume', s.videoVolume, 0, 100, 1, ' %')}
          ${switchRow('壁纸音轨', 'videoAudioEnabled', s.videoAudioEnabled)}
          ${switchRow('启用 Scene / Web 实时渲染 (WebWallGL)', 'sceneLive', s.sceneLive)}
          ${switchRow('自动降画质省电', 'sceneAutoQuality', s.sceneAutoQuality, '建议关闭以保持 4K 锐利画质')}
          ${switchRow('鼠标指针交互透传', 'scenePointerInteract', s.scenePointerInteract)}
          ${switchRow('窗口隐藏时自动暂停', 'pauseOnHidden', s.pauseOnHidden)}
          ${switchRow('窗口失焦时自动暂停', 'pauseOnBlur', s.pauseOnBlur)}
          ${switchRow('低电量未充电时暂停', 'pauseOnBattery', s.pauseOnBattery)}
        </div>
      `;
    }

    function renderSystemPage(s) {
      const inv = store.getInventory();
      const t = store.getTelemetry();
      const customDirsText = (s.customWallpaperDirs || []).join('\n');
      const diagText = diagLines.length
        ? diagLines.slice(-45).map((l) => `[${l.ts.slice(11, 19)}] ${l.kind}: ${typeof l.detail === 'string' ? l.detail : JSON.stringify(l.detail)}`).join('\n')
        : '暂无诊断日志';
      const curForm = s.mascotForm || 'gemini';
      const mascotCards = MASCOT_LIST.map(([id, label]) => {
        const isAct = curForm === id;
        const hasCustom = id === 'custom' && s.mascotCustomTs > 0;
        const imgSrc = id === 'custom'
          ? (hasCustom ? store.apiUrl(`/wallpaper-engine/mascot/custom?t=${s.mascotCustomTs}`) : '')
          : store.apiUrl(`/wallpaper-engine/mascot/${id}`);
        return `
          <button type="button" class="agy-we-mascot-card ${isAct ? 'active' : ''}" data-mascot-pick="${id}">
            ${imgSrc
              ? `<img src="${escHtml(imgSrc)}" alt="${escHtml(label)}" />`
              : `<div style="width:72px;height:92px;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,0.25);border-radius:10px;font-size:22px;color:var(--we-ui-ink-muted)">+</div>`
            }
            <span class="agy-we-mascot-card-name">${escHtml(label)}</span>
          </button>
        `;
      }).join('');
      const mascotDots = MASCOT_LIST.map(([id]) =>
        `<button type="button" class="agy-we-mascot-dot ${curForm === id ? 'active' : ''}" data-mascot-pick="${id}" title="${id}"></button>`
      ).join('');
      const ropeStyles = [
        ['mascot', '拉绳吉祥物'],
        ['pill', '冰透胶囊'],
        ['orb', '圆形图标'],
        ['minimal', '极简半透明'],
      ];

      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>聊天吉祥物</span>
            <button type="button" class="agy-we-btn" data-mact="reset-rope">复位位置</button>
          </div>
          ${switchRow('显示吉祥物 / 悬浮入口', 'ropeShown', s.ropeShown, '关闭后隐藏悬浮入口（仍可用 Ctrl+Alt+W 打开壁纸抽屉）')}
          <div class="agy-we-row">
            <label style="min-width:92px;flex:none">入口形态</label>
            <div class="agy-we-seg-group" style="flex:1">
              ${ropeStyles.map(([sv, slbl]) => `<button type="button" class="agy-we-seg-btn ${(s.ropeStyle || 'pill') === sv ? 'active' : ''}" data-mset-key="ropeStyle" data-mset-val="${sv}">${slbl}</button>`).join('')}
            </div>
          </div>
          <div style="font-size:12px;color:var(--we-ui-ink)">吉祥物形态</div>
          <div class="agy-we-mascot-strip">${mascotCards}</div>
          <div class="agy-we-row">
            <div class="agy-we-mascot-dots">${mascotDots}</div>
            <div style="display:flex;gap:6px">
              <button type="button" class="agy-we-btn" data-mact="upload-mascot">导入自定义立绘...</button>
              ${s.mascotCustomTs > 0 ? `<button type="button" class="agy-we-btn" data-mact="clear-mascot">清除自定义</button>` : ''}
              <input type="file" id="agy-we-mascot-file" accept="image/*" style="display:none" />
            </div>
          </div>
          ${rangeRow('吉祥物大小', 'mascotScale', s.mascotScale ?? 110, 50, 180, 5, '%')}
        </div>

        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>省电</span></div>
          ${switchRow('最小化 / 切页时暂停', 'pauseOnHidden', s.pauseOnHidden, '窗口隐藏或最小化时自动暂停视频与实时渲染')}
          ${switchRow('窗口失焦时暂停', 'pauseOnBlur', s.pauseOnBlur, '切到其他软件时暂停动态壁纸以节省 GPU')}
          ${switchRow('使用电池时暂停', 'pauseOnBattery', s.pauseOnBattery, '笔记本未接电源且低电量时自动暂停')}
          ${switchRow('启动时暂停', 'startPaused', s.startPaused, '重启 Antigravity 后从暂停状态开始')}
        </div>

        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>缓存与本地壁纸目录</span></div>
          <div class="agy-we-path-box">
            <div style="font-size:12px">缓存目录：<b style="font-family:ui-monospace,Consolas,monospace;font-size:11px">${escHtml(inv.cacheDir || '~/.antigravity-wallpaper-engine/cache')}</b></div>
            <div class="agy-we-hint">缓存可再生，随时可清理；当前本地服务 ${escHtml(store.apiBase)}（${t.serverOk ? '正常' : '连接中'}）· WebWallGL ${inv.webwallglAvailable ? '已就绪' : '未安装'}</div>
          </div>
          <div class="agy-we-row-col">
            <span>手动指定 Steam 根目录（可选，留空自动探测）</span>
            <input class="agy-we-input" id="agy-we-m-steam-root" value="${escHtml(s.customSteamRoot || '')}" placeholder="例如 D:\\Steam" />
          </div>
          <div class="agy-we-row-col">
            <span>额外本地壁纸目录（每行一个绝对路径，仅限本地已下载文件）</span>
            <textarea class="agy-we-textarea" id="agy-we-m-custom-dirs" rows="2" placeholder="D:\\Wallpapers">${escHtml(customDirsText)}</textarea>
          </div>
          <div class="agy-we-row" style="justify-content:flex-end">
            <button type="button" class="agy-we-btn primary" data-mact="save-dirs">保存并重新扫描</button>
          </div>
        </div>

        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr">
            <span>诊断日志</span>
            <button type="button" class="agy-we-btn" data-mact="reload-diag">刷新日志</button>
          </div>
          <div class="agy-we-log">${escHtml(diagText)}</div>
        </div>

        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>重置本页</span></div>
          <div class="agy-we-hint">把系统页的吉祥物与省电设置恢复为默认值；已选壁纸与外观配置不受影响。</div>
          <div><button type="button" class="agy-we-btn" data-mact="reset-system">重置本页</button></div>
        </div>

        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>重置</span></div>
          <div class="agy-we-hint">把全部设置恢复为出厂默认值；本地壁纸库与导入图片不受影响。此操作不可撤销。</div>
          <div><button type="button" class="agy-we-btn danger" data-mact="reset-all">全部重置</button></div>
        </div>
      `;
    }

    function renderExtensionsPage(s) {
      const t = store.getTelemetry();
      const mem = performance && performance.memory
        ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`
        : '-';

      return `
        <div class="agy-we-sec-hdr"><span>扩展模块</span></div>

        <div class="agy-we-ext-card">
          <div class="agy-we-ext-card-hdr">
            <span class="agy-we-ext-card-title">点击效果与拖尾效果</span>
            <button type="button" class="agy-we-icon-btn" data-mact="reset-fx" title="重置点击与拖尾特效">↺</button>
          </div>
          <div class="agy-we-hint">在壁纸之上叠加随光标响应的点击波纹与拖尾流光：不拦截任何鼠标交互</div>
          ${switchRow('启用点击效果与拖尾效果', 'fxEnabled', s.fxEnabled)}
          ${s.fxEnabled ? `
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
          ` : ''}
        </div>

        <div class="agy-we-ext-card">
          <div class="agy-we-ext-card-hdr">
            <span class="agy-we-ext-card-title">3D 效果</span>
            <button type="button" class="agy-we-icon-btn" data-mact="reset-parallax" title="重置 3D 视差">↺</button>
          </div>
          <div class="agy-we-hint">光标移动时，壁纸与吉祥物沿屏幕中心的对称方向轻轻偏移，营造立体视差纵深</div>
          ${switchRow('启用 3D 效果', 'parallaxEnabled', s.parallaxEnabled)}
          ${s.parallaxEnabled ? `
            ${rangeRow('背景视差幅度', 'parallaxBg', s.parallaxBg, 0, 8, 0.2, ' %')}
            ${switchRow('吉祥物 / 入口跟随视差', 'parallaxRope', s.parallaxRope)}
            ${rangeRow('平滑阻尼', 'parallaxSmooth', s.parallaxSmooth, 10, 96, 2, ' %')}
          ` : ''}
        </div>

        <div class="agy-we-ext-card">
          <div class="agy-we-ext-card-hdr">
            <span class="agy-we-ext-card-title">性能监控</span>
            <button type="button" class="agy-we-icon-btn" data-mact="reset-perf" title="重置性能监控">↺</button>
          </div>
          <div class="agy-we-hint">查看当前壁纸渲染帧率、界面帧率与 JS 内存占用；关闭时零采样开销（默认关）</div>
          ${switchRow('启用性能监控', 'perfEnabled', s.perfEnabled)}
          ${s.perfEnabled ? `
            ${switchRow('显示桌面性能悬浮窗', 'perfFloat', s.perfFloat, '可自由拖动悬浮在窗口任意角落')}
            <div class="agy-we-perf-grid">
              <div class="agy-we-perf-cell"><div class="agy-we-perf-cell-k">界面帧率</div><div class="agy-we-perf-cell-v">${t.uiFps || 60} FPS</div></div>
              <div class="agy-we-perf-cell"><div class="agy-we-perf-cell-k">壁纸帧率</div><div class="agy-we-perf-cell-v">${t.wallpaperFps || 0} FPS</div></div>
              <div class="agy-we-perf-cell"><div class="agy-we-perf-cell-k">JS 堆内存</div><div class="agy-we-perf-cell-v">${mem}</div></div>
            </div>
          ` : ''}
        </div>
      `;
    }

    function renderAboutPage() {
      const upstreamRepoUrl = 'https://github.com/elysia395/dsh-wallpaper-engine';
      const upstreamAuthorUrl = 'https://github.com/elysia395';
      return `
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>Antigravity 壁纸引擎 & 液态玻璃</span></div>
          <div style="font-size:12.5px;line-height:1.9;color:var(--we-ui-ink-muted)">
            <div>• 专为 <b style="color:var(--we-ui-ink)">Antigravity 2.0</b> 打造的本地 Wallpaper Engine 渲染与冰透液态玻璃插件。</div>
            <div>• <b style="color:var(--we-ui-ink)">零 Token 开销</b>：不暴露 MCP 工具，完全在本地 Electron 进程与 loopback 媒体服务中运行。</div>
            <div>• <b style="color:var(--we-ui-ink)">安全共存</b>：与 <code style="font-family:monospace">antigravity-zh-cn</code> 简体中文汉化插件完全隔离互不干扰。</div>
            <div>• <b style="color:var(--we-ui-ink)">纯本地壁纸</b>：仅读取并播放本地磁盘已下载的 Wallpaper Engine 壁纸与本地文件。</div>
            <div>• <b style="color:var(--we-ui-ink)">快捷键</b>：按 <b>Ctrl+Alt+W</b> 随时呼出/收起右侧壁纸抽屉；按 <b>Esc</b> 关闭当前弹窗。</div>
          </div>
        </div>
        <div class="agy-we-sec">
          <div class="agy-we-sec-hdr"><span>出处声明与开源致谢</span></div>
          <div class="agy-we-about-card">
            <div>
              本插件移植并适配自 <b style="color:var(--we-ui-ink)">DeepSeek（DeepSeek Harness / DSH）</b> 的 Wallpaper Engine 壁纸与液态玻璃插件 <code style="font-family:monospace">dsh-wallpaper-engine</code>（<code style="font-family:monospace">dsh-plugin-wallpaper-engine</code>），在此向原作者及上游开源社区致以诚挚感谢。
            </div>
            <div class="agy-we-about-kv">
              <span class="agy-we-about-k">原作者</span>
              <a class="agy-we-about-link" href="${upstreamAuthorUrl}" target="_blank" rel="noopener noreferrer">elysia395（生鱼）</a>
            </div>
            <div class="agy-we-about-kv">
              <span class="agy-we-about-k">原项目地址</span>
              <a class="agy-we-about-link" href="${upstreamRepoUrl}" target="_blank" rel="noopener noreferrer">${upstreamRepoUrl}</a>
              <span class="agy-we-about-inline-actions">
                <button type="button" class="agy-we-btn" data-mact="copy-upstream-url">复制地址</button>
              </span>
            </div>
            <div class="agy-we-about-kv">
              <span class="agy-we-about-k">开源协议</span>
              <span>MIT License · Copyright (c) 2026 elysia395</span>
            </div>
          </div>
        </div>
      `;
    }

    function bindModalBodyEvents() {
      bodyEl.querySelectorAll('[data-mkey]').forEach((el) => {
        const key = el.dataset.mkey;
        const isLive = el.type === 'range' || el.type === 'color' || el.tagName === 'TEXTAREA' || el.type === 'text' || el.tagName === 'INPUT' && el.type !== 'checkbox';
        const evName = (el.type === 'range' || el.type === 'color') ? 'input' : 'change';
        el.addEventListener(evName, () => {
          let val;
          if (el.type === 'checkbox') val = el.checked;
          else if (el.type === 'range') {
            val = Number(el.value);
            const mn = Number(el.min);
            const mx = Number(el.max);
            if (mx > mn) el.style.setProperty('--val-pct', `${(((val - mn) / (mx - mn)) * 100).toFixed(1)}%`);
            const mul = Number(el.dataset.mul || '1');
            const suf = el.dataset.suffix || '';
            const disp = mul === 1 ? val : Math.round(val * mul);
            const badge = bodyEl.querySelector(`[data-mval-for="${key}"]`);
            if (badge) badge.textContent = `${disp}${suf}`;
          } else {
            val = el.value;
          }
          if (isLive && el.type !== 'color') skipNextRender = true;
          if (el.type === 'color') skipNextRender = true;
          try {
            store.updateSettings({ [key]: val });
          } finally {
            skipNextRender = false;
          }
        });
      });

      bodyEl.querySelectorAll('[data-mswatch-key]').forEach((dot) => {
        dot.addEventListener('click', () => {
          const k = dot.dataset.mswatchKey;
          const v = dot.dataset.mswatchVal;
          if (k) store.updateSettings({ [k]: v }, true);
        });
      });

      bodyEl.querySelectorAll('[data-mset-key]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const k = btn.dataset.msetKey;
          let v = btn.dataset.msetVal;
          if (k === 'leftSidebarRadius' || k === 'rightSidebarRadius' || k === 'playbackRate' || k === 'sceneLiveFps') {
            v = Number(v);
          }
          store.updateSettings({ [k]: v }, true);
        });
      });

      bodyEl.querySelectorAll('[data-mcorner-side]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const side = btn.dataset.mcornerSide;
          const idx = Number(btn.dataset.mcornerIdx);
          const key = side === 'left' ? 'leftSidebarCorners' : 'rightSidebarCorners';
          const cur = store.getSettings()[key];
          const next = Array.isArray(cur) && cur.length === 4 ? [...cur] : (side === 'left' ? [0, 1, 1, 0] : [1, 0, 0, 1]);
          next[idx] = next[idx] ? 0 : 1;
          store.updateSettings({ [key]: next }, true);
        });
      });

      bodyEl.querySelectorAll('[data-mapply-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const p = store.getPresets().find((x) => x.id === btn.dataset.mapplyPreset);
          if (p && p.values) {
            store.updateSettings({ ...p.values, activePreset: p.id }, true);
            showToast(`已套用预设：${p.name}`);
          }
        });
      });

      bodyEl.querySelectorAll('[data-mdel-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          store.deletePreset(btn.dataset.mdelPreset).then(() => showToast('已删除预设')).catch(() => {});
        });
      });

      bodyEl.querySelectorAll('[data-mascot-pick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const form = btn.dataset.mascotPick;
          if (form === 'custom' && !(store.getSettings().mascotCustomTs > 0)) {
            const inp = bodyEl.querySelector('#agy-we-mascot-file');
            if (inp) inp.click();
            return;
          }
          store.updateSettings({ mascotForm: form, ropeStyle: 'mascot', ropeShown: true }, true);
        });
      });

      const mascotFile = bodyEl.querySelector('#agy-we-mascot-file');
      if (mascotFile) {
        mascotFile.addEventListener('change', () => {
          const f = mascotFile.files && mascotFile.files[0];
          if (!f) return;
          store.uploadMascotCustom(f).then(() => showToast('自定义吉祥物已应用')).catch((e) => showToast(`上传失败：${e.message}`));
        });
      }

      bodyEl.querySelectorAll('[data-mact]').forEach((btn) => {
        btn.addEventListener('click', () => handleAction(btn.dataset.mact));
      });
    }

    function handleAction(act) {
      if (act === 'close-modal') {
        setOpen(false);
      } else if (act === 'pick-wallpaper') {
        setOpen(false);
        if (typeof openDrawerToLibrary === 'function') openDrawerToLibrary();
      } else if (act === 'toggle-pause') {
        store.updateSettings({ paused: !store.getSettings().paused }, true);
      } else if (act === 'toggle-audio') {
        const s = store.getSettings();
        const nextEn = !s.videoAudioEnabled;
        store.updateSettings({ videoAudioEnabled: nextEn, ...(nextEn && s.videoVolume === 0 ? { videoVolume: 50 } : {}) }, true);
      } else if (act === 'next-wp') {
        wallpaperLayer.pickNextWallpaper();
      } else if (act === 'clear-wp') {
        store.updateSettings({ wallpaperId: '' }, true);
      } else if (act === 'rescan') {
        showToast('正在重新扫描本地壁纸库...');
        store.loadInventory(true).then((inv) => showToast(`扫描完成，本地已下载 ${inv.total || 0} 张`)).catch((e) => showToast(e.message));
      } else if (act === 'save-preset') {
        const name = window.prompt('请输入新预设名称：', '我的冰透玻璃');
        if (!name) return;
        store.savePreset(name).then(() => showToast('预设已保存')).catch((e) => showToast(e.message));
      } else if (act === 'export-json') {
        const payload = {
          $schema: 'agy-we/preset@1',
          name: `Antigravity预设-${new Date().toISOString().slice(0, 10)}`,
          values: store.getSettings(),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agy-wallpaper-preset.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('已导出 JSON 预设文件');
      } else if (act === 'import-json' && importFileInput) {
        importFileInput.value = '';
        importFileInput.click();
      } else if (act === 'reset-appearance') {
        store.updateSettings({
          activePreset: 'agy-crystal',
          themeFollow: false,
          accent: '#75e6f5',
          caretColor: '',
          glassEnabled: true,
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
          uiFontScale: 100,
        }, true);
        showToast('外观页已重置为 DeepSeek 冰透推荐配置');
      } else if (act === 'reset-playback') {
        store.updateSettings({
          wallpaperBlur: 0,
          backgroundBrightness: 85,
          backgroundContrast: 110,
          backgroundSaturate: 150,
          layerPositionX: 50,
          layerPositionY: 50,
          layerScale: 100,
          wallpaperOpacity: 100,
          scrim: 0.5,
          playbackRate: 1,
          sceneLiveFps: 60,
          objectFit: 'cover',
          flip: false,
          switchTransition: 'cut',
          wallpaperFilter: 'none',
          videoVolume: 0,
          videoAudioEnabled: false,
          sceneAutoQuality: false,
        }, true);
        showToast('画面播放参数已重置');
      } else if (act === 'refresh-fonts') {
        showToast('正在扫描系统字体...');
        store.loadSystemFonts(true).then((f) => showToast(`已发现 ${(f.families || []).length} 款系统字体`)).catch(() => {});
      } else if (act === 'reset-rope') {
        store.updateSettings({ ropeX: -1, ropeY: 0, ropeShown: true }, true);
        showToast('已吸附复位到窗口顶端');
      } else if (act === 'save-dirs') {
        const steamInput = bodyEl.querySelector('#agy-we-m-steam-root');
        const dirsInput = bodyEl.querySelector('#agy-we-m-custom-dirs');
        const customSteamRoot = steamInput ? steamInput.value.trim() : '';
        const customWallpaperDirs = dirsInput ? dirsInput.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) : [];
        store.updateSettings({ customSteamRoot, customWallpaperDirs }, true);
        setTimeout(() => {
          store.loadInventory(true).then((inv) => showToast(`已保存并重扫：共 ${inv.total || 0} 张壁纸`)).catch(() => {});
        }, 150);
      } else if (act === 'reload-diag') {
        store.loadDiagLog().then((d) => { diagLines = (d && d.lines) || []; render(); }).catch(() => {});
      } else if (act === 'upload-mascot') {
        const inp = bodyEl.querySelector('#agy-we-mascot-file');
        if (inp) inp.click();
      } else if (act === 'clear-mascot') {
        store.clearMascotCustom().then(() => showToast('已清除自定义立绘')).catch(() => {});
      } else if (act === 'reset-system') {
        store.updateSettings({
          ropeShown: true,
          ropeStyle: 'mascot',
          mascotForm: 'whale',
          mascotScale: 115,
          ropeX: -1,
          ropeY: 0,
          pauseOnHidden: true,
          pauseOnBlur: false,
          pauseOnBattery: false,
          startPaused: false,
        }, true);
        showToast('系统页已恢复默认');
      } else if (act === 'reset-all') {
        if (!window.confirm('确定把全部设置恢复为出厂默认值吗？（本地壁纸与已导入图片不受影响）')) return;
        store.resetAllSettings().then(() => showToast('已全部恢复为出厂默认值')).catch((e) => showToast(e.message));
      } else if (act === 'reset-fx') {
        store.updateSettings({
          fxEnabled: false,
          fxClick: true,
          fxClickStyle: 'ripple',
          fxClickSize: 140,
          fxTrail: true,
          fxTrailStyle: 'comet',
          fxTrailLength: 420,
          fxTrailWidth: 3,
          fxColorMode: 'accent',
          fxOpacity: 85,
        }, true);
        showToast('已重置点击与拖尾特效');
      } else if (act === 'reset-parallax') {
        store.updateSettings({ parallaxEnabled: false, parallaxBg: 1.8, parallaxRope: true, parallaxSmooth: 85 }, true);
        showToast('已重置 3D 效果');
      } else if (act === 'reset-perf') {
        store.updateSettings({ perfEnabled: false, perfFloat: false }, true);
        showToast('已重置性能监控');
      } else if (act === 'copy-upstream-url') {
        const url = 'https://github.com/elysia395/dsh-wallpaper-engine';
        const fallbackCopy = () => {
          const ta = document.createElement('textarea');
          ta.value = url;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
            showToast('已复制原项目地址');
          } catch {
            showToast('复制失败，请手动选中链接复制');
          } finally {
            ta.remove();
          }
        };
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(url).then(() => showToast('已复制原项目地址')).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      }
    }

    function render() {
      if (!isOpen) return;
      const s = store.getSettings();
      const inv = store.getInventory();
      if (countEl) countEl.textContent = String(inv.total || 0);
      modal.querySelectorAll('[data-mtab]').forEach((b) => b.classList.toggle('active', b.dataset.mtab === activeTab));
      if (activeTab === 'library') bodyEl.innerHTML = renderLibraryPage(s);
      else if (activeTab === 'appearance') bodyEl.innerHTML = renderAppearancePage(s);
      else if (activeTab === 'playback') bodyEl.innerHTML = renderPlaybackPage(s);
      else if (activeTab === 'system') bodyEl.innerHTML = renderSystemPage(s);
      else if (activeTab === 'extensions') bodyEl.innerHTML = renderExtensionsPage(s);
      else bodyEl.innerHTML = renderAboutPage();
      bindModalBodyEvents();
    }

    function setOpen(next, tab) {
      if (tab) activeTab = tab;
      isOpen = Boolean(next);
      backdrop.classList.toggle('open', isOpen);
      modal.classList.toggle('open', isOpen);
      if (isOpen) {
        if (!store.getPresets().length) store.loadPresets().catch(() => {});
        if (activeTab === 'appearance' && !store.getSystemFonts().families.length) {
          store.loadSystemFonts(false).catch(() => {});
        }
        if (activeTab === 'system') {
          store.loadDiagLog().then((d) => { diagLines = (d && d.lines) || []; render(); }).catch(() => {});
        }
        render();
      }
    }

    backdrop.addEventListener('click', () => setOpen(false));
    modal.querySelectorAll('[data-mact]').forEach((b) => {
      b.addEventListener('click', () => handleAction(b.dataset.mact));
    });
    modal.querySelectorAll('[data-mtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.mtab;
        if (activeTab === 'appearance' && !store.getSystemFonts().families.length) {
          store.loadSystemFonts(false).catch(() => {});
        }
        if (activeTab === 'system') {
          store.loadDiagLog().then((d) => { diagLines = (d && d.lines) || []; render(); }).catch(() => {});
        }
        render();
      });
    });

    if (importFileInput) {
      importFileInput.addEventListener('change', () => {
        const f = importFileInput.files && importFileInput.files[0];
        if (!f) return;
        f.text().then((txt) => {
          const parsed = JSON.parse(txt);
          const vals = parsed && (parsed.values || parsed.settings || parsed);
          if (!vals || typeof vals !== 'object') throw new Error('无效的预设 JSON');
          store.updateSettings(vals, true);
          if (parsed.name) store.savePreset(String(parsed.name)).catch(() => {});
          showToast('已导入并应用预设');
        }).catch((e) => showToast(`导入失败：${e.message}`));
      });
    }

    const unsub = store.subscribe((topic) => {
      if (!isOpen || topic === 'telemetry') return;
      if (topic === 'settings' && skipNextRender) return;
      render();
    });

    return {
      isOpen: () => isOpen,
      open: (tab) => setOpen(true, tab || activeTab),
      close: () => setOpen(false),
      destroy() {
        unsub();
        try { backdrop.remove(); } catch {}
        try { modal.remove(); } catch {}
      },
    };
  }

  NS.createSettingsModal = createSettingsModal;
})();
