/**
 * DeepSeek-Harness Inspired Ice Liquid Glass Drawer & Floating Trigger CSS.
 * - High-clarity translucent ice-glass drawer synced live with user's glass color & blur.
 * - Spinning circular vinyl-style thumbnail, 3-column immersive wallpaper grid,
 *   circular color swatches, pill value readouts, and bulletproof `-webkit-app-region: no-drag`.
 */
(function initUiStylesModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  NS.UI_CSS = `
    @keyframes agy-we-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #agy-we-ui-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483630;
      -webkit-app-region: initial !important;
      font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei UI", sans-serif;
      --we-ui-bg: rgba(var(--agy-we-glass-rgb, 10, 22, 34), 0.56);
      --we-ui-card: rgba(255, 255, 255, 0.04);
      --we-ui-card-border: rgba(255, 255, 255, 0.14);
      --we-ui-ink: #f1f5f9;
      --we-ui-ink-muted: #94a3b8;
      --we-ui-hint: var(--agy-we-accent, #7dd3fc);
      --we-ui-input-bg: rgba(4, 10, 18, 0.34);
      --we-ui-btn-bg: rgba(255, 255, 255, 0.05);
      --we-ui-btn-hover: rgba(255, 255, 255, 0.13);
      --we-ui-pill-bg: rgba(2, 6, 16, 0.48);
      --we-ui-sheen: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 36%, rgba(255,255,255,0.005) 100%);
    }
    html[data-agy-we-theme="light"] #agy-we-ui-root {
      --we-ui-bg: rgba(250, 252, 255, 0.72);
      --we-ui-card: rgba(255, 255, 255, 0.52);
      --we-ui-card-border: rgba(15, 23, 42, 0.12);
      --we-ui-ink: #0f172a;
      --we-ui-ink-muted: #475569;
      --we-ui-input-bg: rgba(255, 255, 255, 0.68);
      --we-ui-btn-bg: rgba(15, 23, 42, 0.05);
      --we-ui-btn-hover: rgba(15, 23, 42, 0.11);
      --we-ui-pill-bg: rgba(15, 23, 42, 0.08);
      --we-ui-sheen: linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.16) 38%, rgba(255,255,255,0.02) 100%);
    }

    #agy-we-top-snap-guide {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 2147483634;
      pointer-events: none;
      opacity: 0;
      background: radial-gradient(
        180px 10px at var(--snap-x, 50%) 0%,
        rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.92),
        rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.22) 55%,
        transparent 100%
      );
      box-shadow: 0 2px 14px rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.55);
      transition: opacity 0.16s ease;
    }
    #agy-we-top-snap-guide.active { opacity: 1; }

    #agy-we-rope-btn {
      position: fixed;
      right: 156px;
      top: 0;
      z-index: 2147483635;
      pointer-events: auto !important;
      -webkit-app-region: no-drag !important;
      app-region: no-drag !important;
      touch-action: none;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 32px;
      padding: 0 13px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.24);
      background-color: rgba(var(--agy-we-glass-rgb, 10, 22, 34), 0.50);
      background-image: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 60%);
      color: #f8fafc;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      backdrop-filter: blur(16px) saturate(165%);
      -webkit-backdrop-filter: blur(16px) saturate(165%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.32), 0 8px 22px rgba(0,0,0,0.26);
      user-select: none;
      -webkit-user-select: none;
      transform: translate3d(var(--agy-we-px, 0px), var(--agy-we-py, 0px), 0);
      transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, border-radius 0.2s ease;
    }
    html[data-agy-we-theme="light"] #agy-we-rope-btn {
      background-color: rgba(255, 255, 255, 0.72);
      color: #0f172a;
      border-color: rgba(15, 23, 42, 0.15);
    }
    #agy-we-rope-btn:hover {
      border-color: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.75);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.42), 0 0 0 2px rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.22), 0 10px 26px rgba(0,0,0,0.32);
    }
    #agy-we-rope-btn.is-dragging { cursor: grabbing; opacity: 0.92; transition: none; }
    #agy-we-rope-btn.is-snapping {
      transition: top var(--agy-we-snap-ms, 360ms) cubic-bezier(0.22, 1.15, 0.36, 1), left 0.22s ease, border-radius 0.22s ease, transform 0.22s ease !important;
    }
    #agy-we-rope-btn.is-snap-preview:not(.style-mascot) {
      border-color: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.85);
      box-shadow: 0 -2px 14px rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.45), 0 8px 22px rgba(0,0,0,0.28);
    }
    #agy-we-rope-btn.is-top-docked:not(.style-mascot) {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      border-top-width: 0;
      padding-top: 2px;
      box-shadow: inset 0 -1px 0 rgba(255,255,255,0.22), 0 6px 18px rgba(0,0,0,0.26);
    }
    #agy-we-rope-btn.is-top-docked:not(.style-mascot):hover {
      padding-top: 4px;
    }
    #agy-we-rope-btn .agy-we-rope-icon {
      display: inline-flex;
      color: var(--agy-we-accent, #7dd3fc);
      font-size: 13px;
      text-shadow: 0 0 10px rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.75);
      pointer-events: none;
    }
    #agy-we-rope-btn .agy-we-rope-label { pointer-events: none; }
    #agy-we-rope-btn.style-orb { width: 36px; height: 36px; padding: 0; justify-content: center; border-radius: 50%; }
    #agy-we-rope-btn.style-orb.is-top-docked { border-radius: 0 0 18px 18px; }
    #agy-we-rope-btn.style-orb .agy-we-rope-label { display: none; }
    #agy-we-rope-btn.style-minimal { height: 26px; padding: 0 10px; font-size: 11px; opacity: 0.68; }
    #agy-we-rope-btn.style-minimal:hover { opacity: 1; }
    #agy-we-rope-btn.style-mascot {
      height: auto;
      padding: 0;
      border: none;
      border-radius: 0 0 12px 12px;
      background: transparent;
      background-image: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: none;
      overflow: visible;
      transform-origin: 50% 0%;
    }
    #agy-we-rope-btn.style-mascot:hover {
      border-color: transparent;
      box-shadow: none;
    }
    #agy-we-rope-btn.style-mascot .agy-we-rope-icon,
    #agy-we-rope-btn.style-mascot .agy-we-rope-label { display: none; }
    #agy-we-rope-btn .agy-we-rope-mascot-img {
      display: none;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: top center;
      pointer-events: none;
      transform-origin: 50% 0%;
      transition: transform 0.22s cubic-bezier(0.22, 1.35, 0.36, 1), filter 0.18s ease;
    }
    #agy-we-rope-btn.style-mascot .agy-we-rope-mascot-img { display: block; }
    #agy-we-rope-btn.style-mascot:hover .agy-we-rope-mascot-img { transform: scale(1.06); }
    #agy-we-rope-btn.style-mascot.is-top-docked:hover .agy-we-rope-mascot-img {
      transform: translateY(4px) scale(1.03);
    }
    #agy-we-rope-btn.style-mascot.is-top-docked:active .agy-we-rope-mascot-img {
      transform: translateY(9px) scale(1.01);
    }
    #agy-we-rope-btn.style-mascot.is-snap-preview .agy-we-rope-mascot-img {
      filter: drop-shadow(0 -3px 10px rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.72));
    }

    #agy-we-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483631;
      background: rgba(2, 8, 18, 0.16);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      -webkit-app-region: no-drag !important;
      app-region: no-drag !important;
      transition: opacity 220ms ease, visibility 0s linear 220ms;
    }
    #agy-we-backdrop.open {
      pointer-events: auto;
      opacity: 1;
      visibility: visible;
      transition: opacity 220ms ease, visibility 0s;
    }

    #agy-we-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483632;
      width: min(460px, 94vw);
      pointer-events: none;
      display: flex;
      flex-direction: column;
      border-left: 1px solid rgba(255,255,255,0.20);
      background-color: var(--we-ui-bg);
      background-image: var(--we-ui-sheen);
      color: var(--we-ui-ink);
      backdrop-filter: blur(22px) saturate(165%) brightness(1.03);
      -webkit-backdrop-filter: blur(22px) saturate(165%) brightness(1.03);
      box-shadow: inset 1px 0 0 rgba(255,255,255,0.22), -18px 0 48px rgba(0,0,0,0.34);
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translate3d(102%, 0, 0);
      -webkit-app-region: no-drag !important;
      app-region: no-drag !important;
      transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, visibility 0s linear 320ms;
    }
    #agy-we-drawer * {
      -webkit-app-region: no-drag !important;
      app-region: no-drag !important;
    }
    #agy-we-drawer.open {
      pointer-events: auto;
      opacity: 1;
      visibility: visible;
      transform: translate3d(0, 0, 0);
      transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease, visibility 0s;
    }

    .agy-we-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 10px;
      border-bottom: 1px solid var(--we-ui-card-border);
      gap: 8px;
    }
    .agy-we-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
    }
    .agy-we-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--agy-we-accent, #7dd3fc);
      box-shadow: 0 0 10px var(--agy-we-accent, #7dd3fc);
    }
    .agy-we-hdr-actions { display: flex; align-items: center; gap: 6px; }

    /* Now-playing vinyl strip (DeepSeek Harness style) */
    .agy-we-nowbar {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 12px 16px 10px;
    }
    .agy-we-disc {
      position: relative;
      width: 42px;
      height: 42px;
      flex: none;
      border-radius: 50%;
      overflow: hidden;
      clip-path: circle(50%);
      border: 1px solid rgba(255,255,255,0.26);
      background: rgba(10, 20, 32, 0.6);
    }
    .agy-we-disc::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 11px;
      height: 11px;
      margin: -5.5px 0 0 -5.5px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.55);
      background: rgba(10, 22, 34, 0.65);
    }
    .agy-we-disc img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      animation: agy-we-spin 14s linear infinite;
      animation-play-state: paused;
    }
    .agy-we-disc.playing img { animation-play-state: running; }
    .agy-we-now-info { flex: 1; min-width: 0; }
    .agy-we-now-title {
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .agy-we-now-meta { font-size: 11px; color: var(--we-ui-ink-muted); margin-top: 2px; }
    .agy-we-now-actions { display: flex; gap: 6px; flex: none; }

    /* Segmented pill tab bar (DeepSeek Harness style) */
    .agy-we-tabs-wrap { padding: 4px 14px 10px; }
    .agy-we-tabs {
      display: flex;
      padding: 3px;
      border-radius: 12px;
      border: 1px solid var(--we-ui-card-border);
      background: rgba(2, 8, 18, 0.24);
      gap: 2px;
    }
    .agy-we-tab {
      flex: 1;
      border: 1px solid transparent;
      background: transparent;
      color: var(--we-ui-ink-muted);
      padding: 6px 6px;
      border-radius: 9px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.16s ease;
    }
    .agy-we-tab:hover { color: var(--we-ui-ink); }
    .agy-we-tab.active {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.11);
      border-color: rgba(255, 255, 255, 0.16);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.16);
    }
    html[data-agy-we-theme="light"] .agy-we-tab.active {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.85);
      border-color: rgba(15, 23, 42, 0.10);
    }

    .agy-we-body {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 4px 14px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .agy-we-sec {
      border-top: 1px solid var(--we-ui-card-border);
      padding-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 9px;
    }
    .agy-we-sec:first-child { border-top: none; padding-top: 2px; }
    .agy-we-sec-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 700;
      color: var(--we-ui-ink);
    }
    .agy-we-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 12px;
      color: var(--we-ui-ink);
    }
    .agy-we-row-col {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 12px;
      color: var(--we-ui-ink);
    }
    .agy-we-row label { flex: 1; }
    .agy-we-hint {
      font-size: 11px;
      color: var(--we-ui-hint);
      opacity: 0.88;
      line-height: 1.4;
    }

    .agy-we-btn {
      border: 1px solid var(--we-ui-card-border);
      background: var(--we-ui-btn-bg);
      color: var(--we-ui-ink);
      border-radius: 9px;
      padding: 5px 11px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    }
    .agy-we-btn:hover { background: var(--we-ui-btn-hover); border-color: rgba(255,255,255,0.28); }
    .agy-we-btn:active { transform: scale(0.97); }
    .agy-we-btn.primary {
      background: var(--agy-we-accent, #7dd3fc);
      border-color: transparent;
      color: #09131d;
      font-weight: 700;
    }
    .agy-we-btn.danger {
      background: rgba(239, 68, 68, 0.16);
      border-color: rgba(239, 68, 68, 0.40);
      color: #fecaca;
    }
    .agy-we-icon-btn {
      width: 26px;
      height: 26px;
      padding: 0;
      border-radius: 50%;
      border: 1px solid var(--we-ui-card-border);
      background: var(--we-ui-btn-bg);
      color: var(--we-ui-ink);
      cursor: pointer;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .agy-we-icon-btn:hover { background: var(--we-ui-btn-hover); }

    .agy-we-input, .agy-we-select, .agy-we-textarea {
      background: var(--we-ui-input-bg);
      border: 1px solid var(--we-ui-card-border);
      color: var(--we-ui-ink);
      border-radius: 9px;
      padding: 6px 10px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .agy-we-input:focus, .agy-we-select:focus, .agy-we-textarea:focus {
      border-color: var(--agy-we-accent, #7dd3fc);
    }

    /* Circular color swatches (DeepSeek Harness style) */
    .agy-we-swatches {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .agy-we-swatch {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.45);
      cursor: pointer;
      padding: 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: transform 0.14s ease, box-shadow 0.14s ease;
    }
    .agy-we-swatch:hover { transform: scale(1.12); }
    .agy-we-swatch.active {
      box-shadow: 0 0 0 2px rgba(10,22,34,0.85), 0 0 0 4px var(--agy-we-accent, #7dd3fc);
    }
    .agy-we-color-custom {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--we-ui-hint);
      cursor: pointer;
    }
    .agy-we-color-custom input[type="color"] {
      width: 22px;
      height: 22px;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0;
    }

    /* iOS-style capsule toggle switch */
    .agy-we-switch { position: relative; display: inline-flex; flex: none !important; cursor: pointer; }
    .agy-we-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
    .agy-we-switch-track {
      position: relative;
      width: 38px;
      height: 21px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.30);
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-sizing: border-box;
      transition: background 180ms ease, border-color 180ms ease;
    }
    .agy-we-switch input:checked + .agy-we-switch-track {
      background: var(--agy-we-accent, #7dd3fc);
      border-color: transparent;
    }
    .agy-we-switch-thumb {
      position: absolute;
      left: 2px;
      top: 2px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.32);
      transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .agy-we-switch input:checked + .agy-we-switch-track .agy-we-switch-thumb {
      transform: translateX(17px);
    }

    /* DeepSeek-style full-width progress slider with dark pill readout */
    .agy-we-slider-row {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
    .agy-we-slider-label {
      font-size: 12px;
      color: var(--we-ui-ink);
      min-width: 72px;
      white-space: nowrap;
    }
    .agy-we-slider {
      -webkit-appearance: none;
      appearance: none;
      flex: 1;
      height: 18px;
      background: transparent;
      cursor: pointer;
    }
    .agy-we-slider::-webkit-slider-runnable-track {
      height: 4px;
      border-radius: 999px;
      background: linear-gradient(
        to right,
        var(--agy-we-accent, #7dd3fc) 0%,
        var(--agy-we-accent, #7dd3fc) var(--val-pct, 50%),
        rgba(148, 163, 184, 0.30) var(--val-pct, 50%),
        rgba(148, 163, 184, 0.30) 100%
      );
    }
    .agy-we-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      margin-top: -6px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid var(--agy-we-accent, #7dd3fc);
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.36);
      transition: transform 0.12s ease;
    }
    .agy-we-slider:hover::-webkit-slider-thumb { transform: scale(1.14); }
    .agy-we-pill-val {
      min-width: 54px;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--we-ui-pill-bg);
      border: 1px solid rgba(255,255,255,0.08);
      text-align: center;
      font-family: ui-monospace, Consolas, monospace;
      font-size: 11px;
      color: var(--we-ui-ink);
      flex: none;
    }

    /* 3-column immersive wallpaper card grid (DeepSeek Harness style) */
    .agy-we-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .agy-we-wp-card {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      aspect-ratio: 16 / 10;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(4, 10, 18, 0.55);
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .agy-we-wp-card:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.38); }
    .agy-we-wp-card.active {
      border-color: var(--agy-we-accent, #7dd3fc);
      box-shadow: 0 0 0 2px rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.45);
    }
    .agy-we-wp-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .agy-we-wp-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .agy-we-wp-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 14px 6px 5px;
      background: linear-gradient(180deg, transparent 0%, rgba(2, 6, 16, 0.84) 100%);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }
    .agy-we-wp-name {
      font-size: 10.5px;
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .agy-we-badge {
      position: absolute;
      top: 5px;
      left: 5px;
      padding: 1px 5px;
      border-radius: 5px;
      font-size: 9.5px;
      font-weight: 600;
      background: rgba(2, 8, 18, 0.72);
      color: #e2e8f0;
      border: 1px solid rgba(255,255,255,0.16);
      backdrop-filter: blur(6px);
    }
    .agy-we-fav-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      border: none;
      background: rgba(2, 8, 18, 0.62);
      color: #cbd5e1;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 11px;
      line-height: 20px;
      text-align: center;
      padding: 0;
    }
    .agy-we-fav-btn.fav { color: #fbbf24; }

    /* Compact list mode */
    .agy-we-list { display: flex; flex-direction: column; gap: 4px; }
    .agy-we-list-row {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 6px 8px;
      border-radius: 9px;
      border: 1px solid transparent;
      background: rgba(255,255,255,0.03);
      cursor: pointer;
      transition: background 0.14s ease, border-color 0.14s ease;
    }
    .agy-we-list-row:hover { background: rgba(255,255,255,0.08); }
    .agy-we-list-row.active {
      background: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.16);
      border-color: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.45);
    }
    .agy-we-list-thumb { width: 42px; height: 26px; border-radius: 5px; object-fit: cover; flex: none; }
    .agy-we-list-title { flex: 1; min-width: 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .agy-we-list-type { font-size: 10px; color: var(--we-ui-ink-muted); padding: 1px 6px; border-radius: 5px; border: 1px solid var(--we-ui-card-border); }

    .agy-we-chip-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .agy-we-chip {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid var(--we-ui-card-border);
      background: var(--we-ui-btn-bg);
      color: var(--we-ui-ink);
      cursor: pointer;
      transition: all 0.14s ease;
    }
    .agy-we-chip:hover { background: var(--we-ui-btn-hover); }
    .agy-we-chip.active {
      background: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.24);
      border-color: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.72);
      color: #ffffff;
    }
    html[data-agy-we-theme="light"] .agy-we-chip.active { color: #0f172a; }

    .agy-we-log {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 11px;
      background: var(--we-ui-input-bg);
      border: 1px solid var(--we-ui-card-border);
      border-radius: 10px;
      padding: 8px 10px;
      max-height: 200px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--we-ui-ink-muted);
    }
    .agy-we-toast {
      position: fixed;
      bottom: 22px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(10, 22, 34, 0.88);
      color: #f8fafc;
      border: 1px solid rgba(255,255,255,0.22);
      backdrop-filter: blur(16px);
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 2147483642;
      box-shadow: 0 12px 32px rgba(0,0,0,0.42);
    }

    /* Drawer bottom footer button: "更多外观设置 ›" / "壁纸引擎设置 ›" */
    .agy-we-drawer-foot {
      flex: none;
      padding: 10px 14px 12px;
      border-top: 1px solid var(--we-ui-card-border);
      background: rgba(2, 8, 18, 0.16);
    }
    .agy-we-more-btn {
      width: 100%;
      padding: 8px 14px;
      border-radius: 11px;
      border: 1px solid var(--we-ui-card-border);
      background: rgba(255, 255, 255, 0.06);
      color: var(--we-ui-ink);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.16s ease, border-color 0.16s ease;
    }
    .agy-we-more-btn:hover {
      background: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.16);
      border-color: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.55);
    }

    /* Full Settings Center Modal (DeepSeek Harness Settings Window style) */
    #agy-we-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483636;
      background: rgba(2, 6, 16, 0.48);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      -webkit-app-region: no-drag !important;
      app-region: no-drag !important;
      transition: opacity 220ms ease, visibility 0s linear 220ms;
    }
    #agy-we-modal-backdrop.open {
      pointer-events: auto;
      opacity: 1;
      visibility: visible;
      transition: opacity 220ms ease, visibility 0s;
    }
    #agy-we-modal {
      position: fixed;
      left: 50%;
      top: 50%;
      z-index: 2147483637;
      width: min(860px, 92vw);
      height: min(760px, 88vh);
      display: flex;
      flex-direction: column;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.22);
      background-color: rgba(var(--agy-we-glass-rgb, 10, 22, 34), 0.72);
      background-image: var(--we-ui-sheen);
      color: var(--we-ui-ink);
      backdrop-filter: blur(28px) saturate(170%) brightness(1.03);
      -webkit-backdrop-filter: blur(28px) saturate(170%) brightness(1.03);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.28), 0 28px 80px rgba(0,0,0,0.58);
      overflow: hidden;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transform: translate(-50%, -48%) scale(0.97);
      -webkit-app-region: no-drag !important;
      app-region: no-drag !important;
      transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, visibility 0s linear 240ms;
    }
    #agy-we-modal * {
      -webkit-app-region: no-drag !important;
      app-region: no-drag !important;
    }
    html[data-agy-we-theme="light"] #agy-we-modal {
      background-color: rgba(250, 252, 255, 0.84);
      border-color: rgba(15, 23, 42, 0.14);
    }
    #agy-we-modal.open {
      pointer-events: auto;
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -50%) scale(1);
      transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, visibility 0s;
    }
    .agy-we-modal-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 20px 10px;
      gap: 12px;
    }
    .agy-we-modal-title-wrap { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
    .agy-we-modal-title { font-size: 16px; font-weight: 700; }
    .agy-we-modal-count { font-size: 12px; color: var(--we-ui-ink-muted); font-weight: 600; }
    .agy-we-modal-sub { font-size: 12px; color: var(--we-ui-hint); margin-left: auto; }
    .agy-we-modal-tabs-wrap { padding: 0 20px 12px; }
    .agy-we-modal-body {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 4px 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Large Vinyl Record Card (Settings -> Wallpaper Library) */
    .agy-we-vinyl-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px 20px;
      border-radius: 14px;
      border: 1px solid var(--we-ui-card-border);
      background: rgba(2, 8, 18, 0.24);
    }
    .agy-we-vinyl {
      position: relative;
      width: 112px;
      height: 112px;
      flex: none;
      border-radius: 50%;
      background: repeating-radial-gradient(circle at center, #14171f 0 2px, #212633 2px 4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.52), inset 0 0 0 1px rgba(255,255,255,0.08);
      animation: agy-we-spin 9s linear infinite;
      animation-play-state: paused;
    }
    .agy-we-vinyl.playing { animation-play-state: running; }
    .agy-we-vinyl-cover {
      position: absolute;
      inset: 22%;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid rgba(0,0,0,0.8);
      background: rgba(128,128,128,0.22);
    }
    .agy-we-vinyl-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .agy-we-vinyl-hole {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 12px;
      height: 12px;
      margin: -6px 0 0 -6px;
      border-radius: 50%;
      background: #0a0c12;
      border: 1px solid rgba(255,255,255,0.18);
    }
    .agy-we-vinyl-info { flex: 1; min-width: 0; }
    .agy-we-vinyl-title { font-size: 16px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .agy-we-vinyl-meta { font-size: 12px; color: var(--we-ui-ink-muted); margin-top: 4px; }

    /* 4-column Preset Slot Grid (Settings -> Appearance) */
    .agy-we-preset-box {
      border: 1px solid var(--we-ui-card-border);
      border-radius: 12px;
      padding: 12px;
      background: rgba(2, 8, 18, 0.22);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .agy-we-preset-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    .agy-we-preset-slot {
      display: flex;
      align-items: center;
      border-radius: 8px;
      border: 1px solid var(--we-ui-card-border);
      background: rgba(255,255,255,0.04);
      overflow: hidden;
      min-height: 32px;
    }
    .agy-we-preset-slot.active {
      border-color: var(--agy-we-accent, #7dd3fc);
      background: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.18);
    }
    .agy-we-preset-slot.empty {
      border-style: dashed;
      background: transparent;
      color: var(--we-ui-ink-muted);
      justify-content: center;
      font-size: 11px;
      opacity: 0.6;
      cursor: pointer;
    }
    .agy-we-preset-slot.empty:hover { opacity: 1; border-color: var(--agy-we-accent, #7dd3fc); }
    .agy-we-preset-name {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      color: var(--we-ui-ink);
      font-size: 11.5px;
      font-weight: 500;
      padding: 5px 8px;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
    .agy-we-preset-del {
      width: 24px;
      align-self: stretch;
      border: none;
      border-left: 1px solid var(--we-ui-card-border);
      background: transparent;
      color: var(--we-ui-ink-muted);
      cursor: pointer;
      font-size: 12px;
    }
    .agy-we-preset-del:hover { color: #fecaca; background: rgba(239,68,68,0.18); }

    /* Segmented button group (Speed, FPS, Fit, Sidebar Corners) */
    .agy-we-seg-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .agy-we-seg-btn {
      flex: 1;
      min-width: 62px;
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--we-ui-card-border);
      background: rgba(255,255,255,0.04);
      color: var(--we-ui-ink);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: all 0.14s ease;
    }
    .agy-we-seg-btn:hover { background: rgba(255,255,255,0.11); }
    .agy-we-seg-btn.active {
      background: var(--agy-we-accent, #7dd3fc);
      border-color: transparent;
      color: #09131d;
      font-weight: 700;
    }

    /* Mascot Showcase Carousel (System Tab - matching DeepSeek Harness) */
    .agy-we-mascot-strip {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      overflow-x: auto;
      padding: 10px 6px 8px;
      scroll-snap-type: x proximity;
    }
    .agy-we-mascot-card {
      flex: none;
      width: 96px;
      height: 132px;
      border-radius: 14px;
      border: 1px solid var(--we-ui-card-border);
      background: rgba(255,255,255,0.03);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding: 8px 6px 7px;
      gap: 5px;
      cursor: pointer;
      scroll-snap-align: center;
      transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
    }
    .agy-we-mascot-card:hover {
      border-color: rgba(255,255,255,0.34);
      transform: translateY(-2px);
    }
    .agy-we-mascot-card.active {
      border-color: var(--agy-we-accent, #7dd3fc);
      background: rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.14);
      box-shadow: 0 0 0 1px var(--agy-we-accent, #7dd3fc), 0 8px 22px rgba(0,0,0,0.28);
      transform: translateY(-3px) scale(1.03);
    }
    .agy-we-mascot-card img {
      width: 72px;
      height: 92px;
      object-fit: contain;
      display: block;
      pointer-events: none;
    }
    .agy-we-mascot-card-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--we-ui-ink);
      white-space: nowrap;
    }
    .agy-we-mascot-dots {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 4px;
    }
    .agy-we-mascot-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      border: none;
      padding: 0;
      background: rgba(148, 163, 184, 0.42);
      cursor: pointer;
      transition: width 0.18s ease, background 0.18s ease;
    }
    .agy-we-mascot-dot.active {
      width: 22px;
      background: var(--agy-we-accent, #7dd3fc);
    }

    /* Modular Extension Cards (Extensions Tab - matching DeepSeek Harness) */
    .agy-we-ext-card {
      border: 1px solid var(--we-ui-card-border);
      border-radius: 14px;
      background: rgba(2, 8, 18, 0.24);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .agy-we-ext-card-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .agy-we-ext-card-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--we-ui-ink);
    }
    .agy-we-path-box {
      border: 1px solid var(--we-ui-card-border);
      border-radius: 12px;
      padding: 11px 14px;
      background: rgba(2, 8, 18, 0.20);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .agy-we-perf-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      padding-top: 4px;
    }
    .agy-we-perf-cell {
      border: 1px solid var(--we-ui-card-border);
      border-radius: 10px;
      padding: 8px 10px;
      background: rgba(255,255,255,0.03);
    }
    .agy-we-perf-cell-k { font-size: 11px; color: var(--we-ui-ink-muted); }
    .agy-we-perf-cell-v { font-size: 14px; font-weight: 700; color: var(--agy-we-accent, #7dd3fc); margin-top: 2px; font-family: ui-monospace, Consolas, monospace; }

    /* About Tab Attribution Card */
    .agy-we-about-card {
      border: 1px solid var(--we-ui-card-border);
      border-radius: 14px;
      background: rgba(2, 8, 18, 0.24);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 12.5px;
      line-height: 1.75;
      color: var(--we-ui-ink-muted);
    }
    html[data-agy-we-theme="light"] .agy-we-about-card {
      background: rgba(255, 255, 255, 0.56);
    }
    .agy-we-about-kv {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 10px;
    }
    .agy-we-about-k {
      color: var(--we-ui-ink);
      font-weight: 600;
      min-width: 72px;
    }
    .agy-we-about-link {
      color: var(--agy-we-accent, #7dd3fc);
      text-decoration: none;
      word-break: break-all;
      border-bottom: 1px dashed rgba(var(--agy-we-accent-rgb, 125, 211, 252), 0.45);
      transition: opacity 0.15s ease, border-color 0.15s ease;
    }
    .agy-we-about-link:hover {
      opacity: 0.9;
      border-bottom-style: solid;
      border-bottom-color: var(--agy-we-accent, #7dd3fc);
    }
    .agy-we-about-inline-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
  `;
})();
