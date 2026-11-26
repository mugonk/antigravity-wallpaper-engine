/**
 * Apple / DeepSeek-Harness Grade Liquid Glass & Ultra-Clean Shell Piercer for Antigravity 2.0.
 *
 * Design principles aligned with DeepSeek Harness visual reference:
 *  1. Crystal-clear main conversation canvas: strips even faint 2% gray veils on main shells
 *     so 4K/video wallpapers shine through at 100% sharpness & vividness.
 *  2. Seamless frameless top edge: header glass defaults OFF so the wallpaper flows continuously
 *     behind the top bar with zero black bars or seams.
 *  3. Unified ice-glass left sidebar: continuous translucent glass from top to bottom with
 *     all internal solid-black patches/sticky headers/dividers dissolved.
 *  4. Ultra-clean floating composer card: outermost rounded frame styled as translucent wet glass
 *     with hairline highlight border; all black fade strips and inner black borders removed.
 *  5. Crisp inline-code capsules & subtle code-block frost without muddying the wallpaper.
 */
(function initGlassEngineModule() {
  const NS = (window.__AGY_WE_NS__ = window.__AGY_WE_NS__ || {});

  const PRUNE_TAGS = new Set([
    'SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT',
    'IMG', 'VIDEO', 'AUDIO', 'CANVAS', 'SVG', 'IFRAME',
    'CODE', 'PRE', 'TEXTAREA', 'SELECT', 'TABLE',
  ]);
  const SKIP_SELF_TAGS = new Set([
    'BR', 'HR', 'BUTTON', 'INPUT', 'OPTION', 'SPAN', 'A', 'P', 'LABEL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  ]);

  function hexToRgb(hex, fallback = [10, 22, 34]) {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '').trim());
    if (!m) return fallback;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  function parseRgba(colorStr) {
    if (!colorStr || colorStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    const m = /rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i.exec(colorStr);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] === undefined ? 1 : Number(m[4]),
    };
  }

  function luminance(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function isNeutralColor(r, g, b) {
    return (Math.max(r, g, b) - Math.min(r, g, b)) <= 48;
  }

  function detectDarkTheme() {
    const de = document.documentElement;
    const body = document.body;
    const checkHint = (el) => {
      if (!el) return null;
      if (el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark' || el.getAttribute('data-color-scheme') === 'dark') return true;
      if (el.classList.contains('light') || el.getAttribute('data-theme') === 'light' || el.getAttribute('data-color-scheme') === 'light') return false;
      return null;
    };
    const h1 = checkHint(de);
    if (h1 !== null) return h1;
    const h2 = checkHint(body);
    if (h2 !== null) return h2;

    try {
      const rootCs = getComputedStyle(de);
      if (rootCs.colorScheme === 'dark') return true;
      if (rootCs.colorScheme === 'light') return false;
    } catch {}

    try {
      if (body) {
        const bcs = getComputedStyle(body);
        const fg = parseRgba(bcs.color);
        if (fg.a > 0.5) {
          const fgLum = luminance(fg.r, fg.g, fg.b);
          if (fgLum > 150) return true;
          if (fgLum < 110) return false;
        }
        const bg = parseRgba(bcs.backgroundColor);
        if (bg.a > 0.5) {
          return luminance(bg.r, bg.g, bg.b) < 128;
        }
      }
    } catch {}

    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function resolveFontStack(id, builtins) {
    if (!id) return '';
    if (id.startsWith('builtin:')) {
      const found = (builtins || []).find((b) => b.id === id);
      return found ? found.stack : '';
    }
    if (id.startsWith('sys:')) {
      const fam = id.slice(4).replace(/["'\\;{}()<>`]/g, '').trim();
      return fam ? `"${fam}", system-ui, sans-serif` : '';
    }
    return '';
  }

  function isOwnElement(el) {
    if (!el || !el.closest) return false;
    return Boolean(el.closest('#agy-we-bg-layer, #agy-we-focus-veil, #agy-we-fx-canvas, #agy-we-ui-root, #agy-we-perf-float, #agy-zh-toggle-root'));
  }

  function setAttr(el, name, val) {
    if (el && el.getAttribute(name) !== val) el.setAttribute(name, val);
  }

  function delAttr(el, name) {
    if (el && el.hasAttribute(name)) el.removeAttribute(name);
  }

  function hasFixedDescendant(el) {
    try {
      return Boolean(el.querySelector('[style*="position: fixed"], [style*="position:fixed"]'));
    } catch {
      return false;
    }
  }

  function createGlassEngine(store) {
    let styleEl = document.getElementById('agy-we-glass-style');
    if (styleEl) styleEl.remove();
    styleEl = document.createElement('style');
    styleEl.id = 'agy-we-glass-style';
    document.head.appendChild(styleEl);

    // Dedicated GPU-composited veil for butter-smooth 60fps Settings blur fade-in & fade-out
    let focusVeil = document.getElementById('agy-we-focus-veil');
    if (focusVeil) focusVeil.remove();
    focusVeil = document.createElement('div');
    focusVeil.id = 'agy-we-focus-veil';
    focusVeil.setAttribute('data-agy-zh-skip', 'true');
    focusVeil.setAttribute('aria-hidden', 'true');
    if (document.body) document.body.appendChild(focusVeil);

    let scanTimer = null;
    let sidebarReconcileTimer = null;
    let scanning = false;
    let lastLeftSidebar = null;
    let lastRightSidebar = null;
    let lastSettingsNav = null;
    let activeOverlayDialogEl = null;
    let activeOverlayOuterEl = null;
    let overlayAttrObs = null;
    let hasActiveOverlay = false;
    let lastHoveredRow = null;
    let lastHoveredRowSig = 0;
    let hoverRaf = null;
    let overlayNavTimer = null;
    let lastSidebarReconcileAt = 0;
    let lastFullScanAt = 0;

    const MANAGED_ATTRS = [
      'data-agy-we-shell',
      'data-agy-we-region',
      'data-agy-we-sticky',
      'data-agy-we-item-soft',
      'data-agy-we-row-hover',
      'data-agy-we-action-bar',
      'data-agy-we-divider',
      'data-agy-we-dim-target',
      'data-agy-we-behind-overlay',
      'data-agy-we-overlay-backdrop',
      'data-agy-we-has-backdrop',
      'data-agy-we-composer-inner',
      'data-agy-we-composer-dock',
      'data-agy-we-bubble-inner',
    ];

    function hasGradient(cs) {
      return Boolean(cs && cs.backgroundImage && cs.backgroundImage !== 'none' && cs.backgroundImage.includes('gradient('));
    }

    function isExplicitSelected(el) {
      if (!el || el.hasAttribute('aria-expanded')) return false;
      const ariaCur = el.getAttribute('aria-current');
      return (
        el.getAttribute('aria-selected') === 'true' ||
        ariaCur === 'page' ||
        ariaCur === 'true' ||
        el.getAttribute('data-active') === 'true' ||
        el.getAttribute('data-selected') === 'true' ||
        el.getAttribute('data-state') === 'active'
      );
    }

    function isInteractiveSidebarRow(el, sr, scs) {
      if (!el || sr.height < 22 || sr.height > 48 || sr.width < 90) return false;
      const role = (el.getAttribute('role') || '').toLowerCase();
      return (
        el.tagName === 'BUTTON' ||
        el.tagName === 'A' ||
        role === 'button' ||
        role === 'option' ||
        role === 'treeitem' ||
        role === 'listitem' ||
        isExplicitSelected(el) ||
        scs.cursor === 'pointer'
      );
    }

    function hasVisibleNeutralBorder(scs) {
      const sides = [
        ['borderTopWidth', 'borderTopColor'],
        ['borderBottomWidth', 'borderBottomColor'],
        ['borderLeftWidth', 'borderLeftColor'],
        ['borderRightWidth', 'borderRightColor'],
      ];
      for (const [wKey, cKey] of sides) {
        if (parseFloat(scs[wKey] || '0') > 0) {
          const bc = parseRgba(scs[cKey]);
          if (bc.a > 0.05 && isNeutralColor(bc.r, bc.g, bc.b)) return true;
        }
      }
      return false;
    }

    function isActionOverlayCandidate(el, sr, scs, boundsRect, checkPseudo = false) {
      if (!el || isOwnElement(el)) return false;
      if (sr.height < 6 || sr.height > 56 || sr.width < 4) return false;
      if (hasGradient(scs)) return true;
      if (checkPseudo) {
        try {
          if (hasGradient(getComputedStyle(el, '::before')) || hasGradient(getComputedStyle(el, '::after'))) {
            return true;
          }
        } catch {}
      }

      if (el.tagName === 'BUTTON' || el.tagName === 'A') return false;
      const bg = parseRgba(scs.backgroundColor);
      const hasNeutralBg = bg.a > 0.10 && isNeutralColor(bg.r, bg.g, bg.b);
      const isOverlayPos = scs.position === 'absolute' || scs.position === 'sticky';
      const hasShadow = Boolean(scs.boxShadow && scs.boxShadow !== 'none');
      if (!hasNeutralBg && !(isOverlayPos && hasShadow)) return false;

      const isNarrowRightBox =
        boundsRect &&
        sr.left >= boundsRect.left + 20 &&
        sr.right >= boundsRect.right - 36 &&
        sr.width < boundsRect.width * 0.85 &&
        (Boolean(el.querySelector('button, [role="button"], svg')) || (el.textContent || '').trim().length === 0);

      return Boolean(isOverlayPos || isNarrowRightBox);
    }

    function findEnclosingSidebarRow(targetEl, regionEl, regionWidth) {
      let row = null;
      let cur = targetEl;
      for (let d = 0; cur && cur !== regionEl && d < 8; d += 1, cur = cur.parentElement) {
        const cr = cur.getBoundingClientRect();
        if (cr.height >= 20 && cr.height <= 56 && cr.width >= regionWidth * 0.50) {
          row = cur;
        }
      }
      return row;
    }

    function cleanHoverRowSubtree(row, regionEl) {
      if (!row || !regionEl || row === regionEl || !row.isConnected || isOwnElement(row)) return;
      const rowRect = row.getBoundingClientRect();
      if (rowRect.width < 80) return;

      // Batch reads first, then batch writes (zero layout thrashing; pseudo-element check ONLY on the ~15 nodes in 1 hovered row!)
      let markRowHover = false;
      if (!row.hasAttribute('data-agy-we-row-hover') && !isExplicitSelected(row) && row.matches(':hover')) {
        const rcs = getComputedStyle(row);
        if (isInteractiveSidebarRow(row, rowRect, rcs)) {
          const rbg = parseRgba(rcs.backgroundColor);
          if (rbg.a >= 0.16 && isNeutralColor(rbg.r, rbg.g, rbg.b)) {
            markRowHover = true;
          }
        }
      }

      const toClear = [];
      const nodes = row.querySelectorAll('div, span, nav, section, aside, ul, li, button, a');
      for (let i = 0; i < nodes.length && i < 60; i += 1) {
        const n = nodes[i];
        if (isOwnElement(n) || n.hasAttribute('data-agy-we-action-bar')) continue;
        const nr = n.getBoundingClientRect();
        if (nr.width < 4 || nr.height < 6) continue;
        if (isActionOverlayCandidate(n, nr, getComputedStyle(n), rowRect, true)) {
          toClear.push(n);
        }
      }

      if (markRowHover) setAttr(row, 'data-agy-we-row-hover', '1');
      for (const n of toClear) {
        setAttr(n, 'data-agy-we-action-bar', 'clear');
        delAttr(n, 'data-agy-we-item-soft');
      }
    }

    function reconcileSidebarRegion(regionEl) {
      if (!regionEl || !regionEl.isConnected) return;
      const regionRect = regionEl.getBoundingClientRect();
      if (regionRect.width < 80) return;

      // Phase 1: Lift previous item-soft marks in one batch before measuring native backgrounds
      const prevSoft = regionEl.querySelectorAll('[data-agy-we-item-soft]');
      for (const el of prevSoft) el.removeAttribute('data-agy-we-item-soft');

      // Phase 2: Pure read pass (collect all mutations without interleaving DOM writes!)
      const toActionClear = [];
      const toSticky = [];
      const toRowHover = [];
      const toDivider = [];
      const toShell = [];
      const explicitSelected = [];
      const candByParent = new Map();
      const interactiveCountByParent = new Map();

      const subNodes = regionEl.querySelectorAll('div, span, section, header, footer, ul, li, nav, button, a');
      let subCount = 0;
      for (const sub of subNodes) {
        if (++subCount > 800) break;
        if (isOwnElement(sub)) continue;

        const sr = sub.getBoundingClientRect();
        if (sr.width < 4 || sr.height < 6) continue;

        const scs = getComputedStyle(sub);

        if (!sub.hasAttribute('data-agy-we-action-bar') && isActionOverlayCandidate(sub, sr, scs, regionRect)) {
          toActionClear.push(sub);
          continue;
        }
        if (sub.hasAttribute('data-agy-we-action-bar')) continue;

        if (scs.position === 'sticky' && sr.height <= 54) {
          if (!sub.hasAttribute('data-agy-we-sticky')) toSticky.push(sub);
          continue;
        }

        if (isInteractiveSidebarRow(sub, sr, scs)) {
          const parent = sub.parentElement || regionEl;
          interactiveCountByParent.set(parent, (interactiveCountByParent.get(parent) || 0) + 1);

          if (sub.hasAttribute('aria-expanded')) {
            const sbg = parseRgba(scs.backgroundColor);
            if (sub.matches(':hover')) {
              if (sbg.a >= 0.16 && isNeutralColor(sbg.r, sbg.g, sbg.b) && !sub.hasAttribute('data-agy-we-row-hover')) {
                toRowHover.push(sub);
              }
            } else if (sbg.a > 0.08 && isNeutralColor(sbg.r, sbg.g, sbg.b) && !sub.hasAttribute('data-agy-we-sticky')) {
              toSticky.push(sub);
            }
            continue;
          }

          if (isExplicitSelected(sub)) {
            explicitSelected.push(sub);
            continue;
          }

          const sbg = parseRgba(scs.backgroundColor);
          const hasNeutralBg = sbg.a >= 0.08 && isNeutralColor(sbg.r, sbg.g, sbg.b);

          if (sub.matches(':hover')) {
            if (sbg.a >= 0.16 && isNeutralColor(sbg.r, sbg.g, sbg.b) && !sub.hasAttribute('data-agy-we-row-hover')) {
              toRowHover.push(sub);
            }
            continue;
          }

          if (hasNeutralBg && sr.width <= Math.max(360, regionRect.width + 4)) {
            if (!candByParent.has(parent)) candByParent.set(parent, []);
            candByParent.get(parent).push(sub);
          }
          continue;
        }

        if (!sub.hasAttribute('data-agy-we-divider') && hasVisibleNeutralBorder(scs)) {
          toDivider.push(sub);
        }

        if (sub.hasAttribute('data-agy-we-shell') || sub.hasAttribute('data-agy-we-sticky')) {
          continue;
        }
        if (sr.width < 70 || sr.height < 14) continue;
        const sbg = parseRgba(scs.backgroundColor);
        const isNeutralFill = (sbg.a > 0.08 && isNeutralColor(sbg.r, sbg.g, sbg.b)) || hasGradient(scs);
        if (isNeutralFill) {
          toShell.push(sub);
        }
      }

      // Phase 3: Single batched DOM write pass
      for (const el of toActionClear) {
        setAttr(el, 'data-agy-we-action-bar', 'clear');
        delAttr(el, 'data-agy-we-item-soft');
      }
      for (const el of toSticky) setAttr(el, 'data-agy-we-sticky', 'soft');
      for (const el of toRowHover) setAttr(el, 'data-agy-we-row-hover', '1');
      for (const el of toDivider) setAttr(el, 'data-agy-we-divider', 'soft');
      for (const el of toShell) setAttr(el, 'data-agy-we-shell', 'transparent');
      for (const el of explicitSelected) setAttr(el, 'data-agy-we-item-soft', '1');
      for (const [parent, cands] of candByParent.entries()) {
        const totalSibs = interactiveCountByParent.get(parent) || cands.length;
        if (cands.length === 1 || (totalSibs > 2 && cands.length < totalSibs)) {
          for (const el of cands) setAttr(el, 'data-agy-we-item-soft', '1');
        }
      }
      lastSidebarReconcileAt = Date.now();
    }

    function reconcileAllSidebars(onlySettingsNav = false) {
      if (scanning || !document.body) return;
      const s = store.getSettings();
      const wp = store.getActiveWallpaper();
      if (!(s.enabled && wp)) return;
      scanning = true;
      try {
        if (hasActiveOverlay || onlySettingsNav) {
          if (lastSettingsNav && lastSettingsNav.isConnected) reconcileSidebarRegion(lastSettingsNav);
        } else {
          if (lastLeftSidebar && lastLeftSidebar.isConnected) reconcileSidebarRegion(lastLeftSidebar);
          if (lastRightSidebar && lastRightSidebar.isConnected) reconcileSidebarRegion(lastRightSidebar);
        }
      } finally {
        scanning = false;
      }
    }

    function collectBehindElements(overlayEl, vw, vh) {
      const behind = [];
      const backdrops = [];
      let cur = overlayEl;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        const parent = cur.parentElement;
        if (!parent) break;
        for (const sib of parent.children) {
          if (sib === cur || isOwnElement(sib) || PRUNE_TAGS.has(sib.tagName)) continue;
          const sr = sib.getBoundingClientRect();
          if (sr.width >= vw * 0.35 && sr.height >= vh * 0.35) {
            const scs = getComputedStyle(sib);
            if (scs.display !== 'none' && scs.visibility !== 'hidden' && parseFloat(scs.opacity || '1') > 0.05) {
              const txtLen = (sib.textContent || '').trim().length;
              if (txtLen === 0 && (scs.position === 'fixed' || scs.position === 'absolute')) {
                backdrops.push(sib);
              } else if (txtLen > 0) {
                behind.push(sib);
              }
            }
          }
        }
        cur = parent;
      }
      return { behind, backdrops };
    }

    function unwrapCenteredDialogCard(outerEl, vw, vh) {
      const or = outerEl.getBoundingClientRect();
      const innerBackdrops = [];
      // If outerEl covers almost the entire viewport, unwrap wrappers & collect inner empty backdrop siblings
      if (or.width >= vw * 0.92 && or.height >= vh * 0.92) {
        let cur = outerEl;
        for (let depth = 0; depth < 6; depth += 1) {
          const visibleChildren = [];
          const emptyFullSibs = [];
          for (const ch of cur.children) {
            if (!ch || ch.nodeType !== 1 || isOwnElement(ch) || PRUNE_TAGS.has(ch.tagName)) continue;
            const cr = ch.getBoundingClientRect();
            const txtLen = (ch.textContent || '').trim().length;
            if (txtLen === 0 && cr.width >= vw * 0.85 && cr.height >= vh * 0.85) {
              emptyFullSibs.push(ch);
            } else if (cr.width >= vw * 0.42 && cr.height >= vh * 0.42 && txtLen > 10) {
              visibleChildren.push({ el: ch, cr });
            }
          }
          if (visibleChildren.length === 1) {
            for (const b of emptyFullSibs) innerBackdrops.push(b);
            const only = visibleChildren[0];
            if (only.cr.width < vw * 0.92 || only.cr.height < vh * 0.92) {
              return { backdropEl: outerEl, innerBackdrops, dialogEl: only.el, dialogRect: only.cr, isFullViewport: false };
            }
            cur = only.el;
          } else {
            break;
          }
        }
        return { backdropEl: null, innerBackdrops, dialogEl: cur, dialogRect: cur.getBoundingClientRect(), isFullViewport: true };
      }
      return { backdropEl: null, innerBackdrops, dialogEl: outerEl, dialogRect: or, isFullViewport: false };
    }

    function findFullScreenOverlay(vw, vh, hintRoots = null) {
      const seen = new Set();
      const candidates = [];

      const consider = (el) => {
        if (!el || el.nodeType !== 1 || seen.has(el) || isOwnElement(el) || PRUNE_TAGS.has(el.tagName)) return false;
        if (el === document.body || el === document.documentElement || el.id === 'root' || el.id === 'app') return false;
        const r = el.getBoundingClientRect();
        if (r.width < vw * 0.42 || r.height < vh * 0.42) return false;

        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const role = (el.getAttribute('role') || '').toLowerCase();
        const isModalAttr = el.tagName === 'DIALOG' || role === 'dialog' || role === 'alertdialog' || el.getAttribute('aria-modal') === 'true';
        const isOpeningState = el.getAttribute('data-state') === 'open';
        const op = parseFloat(cs.opacity || '1');
        // Allow frame-0 fade-in modals (opacity: 0 at mount) when explicitly marked as dialog/open!
        if (op <= 0.05 && !isModalAttr && !isOpeningState) return false;
        if (cs.pointerEvents === 'none' && !isModalAttr) return false;
        if ((el.textContent || '').trim().length <= 10) return false;

        const z = parseInt(cs.zIndex, 10);
        const p = el.parentElement;
        const isPortalChild = p === document.body || Boolean(p && p.hasAttribute('data-radix-portal'));
        // Strictly fixed high-z / portal or explicit dialog ONLY — never match generic position:absolute chat panes!
        const isLayered = cs.position === 'fixed' && ((Number.isFinite(z) && z >= 10) || isPortalChild);
        if (!isModalAttr && !isLayered) return false;
        // Never mistake the main chat shell containing the bottom chat composer for a Settings modal
        if (!isModalAttr && el.querySelector && el.querySelector('[data-agy-we-region="composer"], [data-agy-we-region="composer-nofilter"]')) {
          return false;
        }

        const { behind, backdrops } = collectBehindElements(el, vw, vh);
        if (behind.length > 0 || isModalAttr) {
          seen.add(el);
          candidates.push({ el, behind, backdrops, z: Number.isFinite(z) ? z : 0, isModalAttr });
          return true;
        }
        return false;
      };

      // Fast path: when triggered by newly inserted DOM nodes, check them and their shallow dialog containers first (O(1)!)
      if (hintRoots && hintRoots.length) {
        for (const root of hintRoots) {
          if (!root || !root.isConnected || isOwnElement(root)) continue;
          consider(root);
          if (root.parentElement && root.parentElement !== document.body && root.parentElement.id !== 'root') {
            consider(root.parentElement);
          }
          if (root.querySelectorAll) {
            const innerModals = root.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-state="open"]');
            for (let i = 0; i < innerModals.length && i < 16; i += 1) {
              consider(innerModals[i]);
            }
          }
          // Check shallow fixed wrapper children (max 2 levels)
          if (!candidates.length && root.children) {
            for (let i = 0; i < root.children.length && i < 8; i += 1) {
              const ch = root.children[i];
              if (consider(ch)) continue;
              if (ch && ch.children) {
                for (let j = 0; j < ch.children.length && j < 8; j += 1) {
                  consider(ch.children[j]);
                }
              }
            }
          }
        }
        if (candidates.length) {
          const roots = candidates.filter((c) => !candidates.some((other) => other !== c && other.el.contains(c.el)));
          roots.sort((a, b) => (b.z - a.z) || (Number(b.isModalAttr) - Number(a.isModalAttr)));
          return roots[0] || candidates[0];
        }
      }

      // 1. Targeted query for ARIA/native/Radix/portal dialog containers (avoid wildcard `*` over hundreds of modal children!)
      const directNodes = document.querySelectorAll(
        'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-radix-portal] > *, [data-radix-portal] > * > *, [data-state="open"]'
      );
      for (let i = 0; i < directNodes.length && i < 48; i += 1) {
        consider(directNodes[i]);
      }

      // 2. Shallow walk from document.body only if direct modal query found nothing
      if (!candidates.length && document.body) {
        const visit = (el, depth) => {
          if (!el || el.nodeType !== 1 || depth > 5 || isOwnElement(el) || PRUNE_TAGS.has(el.tagName)) return;
          if (consider(el)) return;
          const r = el.getBoundingClientRect();
          const mayContainFixed = depth <= 3 || r.width === 0 || r.height === 0 || (r.width >= vw * 0.42 && r.height >= vh * 0.42);
          if (!mayContainFixed) return;
          for (let i = 0; i < el.children.length && i < 24; i += 1) {
            visit(el.children[i], depth + 1);
          }
        };
        for (let i = 0; i < document.body.children.length && i < 30; i += 1) {
          visit(document.body.children[i], 0);
        }
      }

      if (!candidates.length) return null;
      const roots = candidates.filter((c) => !candidates.some((other) => other !== c && other.el.contains(c.el)));
      roots.sort((a, b) => (b.z - a.z) || (Number(b.isModalAttr) - Number(a.isModalAttr)));
      return roots[0] || candidates[0];
    }

    function findOverlayStackZ(el) {
      let cur = el;
      let maxZ = 0;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        const z = parseInt(getComputedStyle(cur).zIndex, 10);
        if (Number.isFinite(z) && z > maxZ) maxZ = z;
        cur = cur.parentElement;
      }
      return maxZ;
    }

    function findBodyDirectChild(el) {
      let cur = el;
      while (cur && cur.parentElement && cur.parentElement !== document.body) {
        cur = cur.parentElement;
      }
      return cur && cur.parentElement === document.body ? cur : null;
    }

    function detachOverlayAttrObs() {
      if (overlayAttrObs) {
        try { overlayAttrObs.disconnect(); } catch {}
        overlayAttrObs = null;
      }
    }

    function attachOverlayAttrObs(outerEl, dialogEl) {
      detachOverlayAttrObs();
      overlayAttrObs = new MutationObserver(() => {
        if (scanning || !hasActiveOverlay) return;
        const closing =
          !dialogEl.isConnected ||
          dialogEl.getAttribute('data-state') === 'closed' ||
          outerEl.getAttribute('data-state') === 'closed' ||
          dialogEl.getAttribute('aria-hidden') === 'true' ||
          outerEl.getAttribute('aria-hidden') === 'true' ||
          dialogEl.hasAttribute('hidden') ||
          outerEl.hasAttribute('hidden');
        if (closing) {
          closeActiveOverlayNow();
          return;
        }
        const cs = getComputedStyle(dialogEl);
        if (cs.display === 'none' || cs.visibility === 'hidden' || (parseFloat(cs.opacity || '1') <= 0.05 && cs.pointerEvents === 'none')) {
          closeActiveOverlayNow();
        }
      });
      const opts = { attributes: true, attributeFilter: ['data-state', 'aria-hidden', 'hidden', 'style', 'class'] };
      try { overlayAttrObs.observe(dialogEl, opts); } catch {}
      if (outerEl && outerEl !== dialogEl) {
        try { overlayAttrObs.observe(outerEl, opts); } catch {}
      }
    }

    function closeActiveOverlayNow() {
      if (!hasActiveOverlay) return;
      hasActiveOverlay = false;
      activeOverlayDialogEl = null;
      activeOverlayOuterEl = null;
      lastSettingsNav = null;
      if (overlayNavTimer) {
        clearTimeout(overlayNavTimer);
        overlayNavTimer = null;
      }
      detachOverlayAttrObs();
      document.documentElement.classList.remove('agy-we-overlay-open');
      setFocusVeilOpen(false);
      document.querySelectorAll('[data-agy-we-overlay-backdrop]').forEach((el) => el.removeAttribute('data-agy-we-overlay-backdrop'));
      document.querySelectorAll('[data-agy-we-has-backdrop]').forEach((el) => el.removeAttribute('data-agy-we-has-backdrop'));
      document.querySelectorAll('[data-agy-we-region="settings-overlay"], [data-agy-we-region="settings-nav"]').forEach((el) => {
        el.removeAttribute('data-agy-we-region');
      });
    }

    function setFocusVeilOpen(open, targetZ = 0, anchorEl = null) {
      if (!focusVeil) return;
      if (document.body && !focusVeil.isConnected) document.body.appendChild(focusVeil);
      if (open) {
        // Position focusVeil directly underneath the Settings dialog without ever covering it
        if (targetZ > 1) {
          const nextZ = String(targetZ - 1);
          if (focusVeil.style.zIndex !== nextZ) focusVeil.style.zIndex = nextZ;
        } else {
          const bodyAnchor = anchorEl ? findBodyDirectChild(anchorEl) : null;
          if (bodyAnchor && bodyAnchor.id !== 'root' && bodyAnchor.id !== 'app' && focusVeil.nextSibling !== bodyAnchor) {
            try { document.body.insertBefore(focusVeil, bodyAnchor); } catch {}
            focusVeil.style.zIndex = '0';
          } else {
            focusVeil.style.zIndex = '40';
          }
        }
        // Mirror #agy-we-modal-backdrop: direct class toggle for immediate, silky 220ms GPU opacity transition
        // (NO wallpaper pause, NO :root style invalidation, NO 1-frame rAF lag!)
        focusVeil.classList.add('open');
      } else {
        focusVeil.classList.remove('open');
      }
    }

    function cleanOverlaySubtree(roots, dialogEl) {
      if (!roots || !roots.length || !dialogEl || !dialogEl.isConnected) return;
      const or = dialogEl.getBoundingClientRect();
      if (or.width < 120 || or.height < 120) return;

      // Pure Read Pass (hard 2ms budget, max 48 structural nodes)
      const tStart = performance.now();
      const toShell = [];
      let checked = 0;
      for (const root of roots) {
        if (checked >= 48 || performance.now() - tStart > 2) break;
        if (!root || !root.isConnected || isOwnElement(root)) continue;
        if (lastSettingsNav && lastSettingsNav.contains(root)) continue;
        const queue = [root];
        while (queue.length && checked < 48) {
          if ((checked & 7) === 0 && performance.now() - tStart > 2) break;
          const sub = queue.shift();
          checked += 1;
          if (!sub || sub.nodeType !== 1 || PRUNE_TAGS.has(sub.tagName) || SKIP_SELF_TAGS.has(sub.tagName) || isOwnElement(sub)) continue;
          if (sub === dialogEl || sub === lastSettingsNav) continue;
          if (sub.getAttribute('data-agy-we-shell') === 'transparent') continue;
          const sr = sub.getBoundingClientRect();
          if (sr.width >= or.width * 0.42 && sr.height >= 40) {
            const scs = getComputedStyle(sub);
            const sbg = parseRgba(scs.backgroundColor);
            if ((sbg.a > 0.08 && isNeutralColor(sbg.r, sbg.g, sbg.b)) || hasGradient(scs)) {
              const btmRad = Math.max(
                parseFloat(scs.borderBottomLeftRadius || '0'),
                parseFloat(scs.borderBottomRightRadius || '0')
              );
              if (sr.height >= or.height * 0.42 || sr.width >= or.width * 0.58 || btmRad < 6 || scs.position === 'sticky') {
                toShell.push(sub);
              }
            }
          }
          if (queue.length + checked < 48 && sub.children) {
            for (let i = 0; i < sub.children.length && i < 16; i += 1) {
              const ch = sub.children[i];
              if (ch && ch.nodeType === 1 && !PRUNE_TAGS.has(ch.tagName) && !SKIP_SELF_TAGS.has(ch.tagName)) {
                queue.push(ch);
              }
            }
          }
        }
      }

      // Single Batched Write Pass
      for (const sub of toShell) {
        setAttr(sub, 'data-agy-we-shell', 'transparent');
        delAttr(sub, 'data-agy-we-region');
      }
    }

    function syncSettingsOverlayAndBlur(vw, vh, forceFullClean = false, hintRoots = null) {
      // Fast-path: if the exact same Settings overlay is still open & visible, avoid re-walking nodes!
      if (!forceFullClean && hasActiveOverlay && activeOverlayDialogEl) {
        if (
          !activeOverlayDialogEl.isConnected ||
          activeOverlayDialogEl.getAttribute('data-state') === 'closed' ||
          (activeOverlayOuterEl && activeOverlayOuterEl.getAttribute('data-state') === 'closed')
        ) {
          closeActiveOverlayNow();
          return null;
        }
        const cs = getComputedStyle(activeOverlayDialogEl);
        if (cs.display === 'none' || cs.visibility === 'hidden' || (parseFloat(cs.opacity || '1') <= 0.05 && cs.pointerEvents === 'none')) {
          closeActiveOverlayNow();
          return null;
        }
        return activeOverlayOuterEl || activeOverlayDialogEl;
      }

      const found = findFullScreenOverlay(vw, vh, hintRoots);

      if (!found) {
        closeActiveOverlayNow();
        return null;
      }

      // ── Phase 1: Pure Read Pass (ZERO DOM mutations before all geometry & styles are measured!) ──
      const { el: outerOverlayEl, backdrops } = found;
      const { backdropEl, innerBackdrops, dialogEl, dialogRect: or, isFullViewport } = unwrapCenteredDialogCard(outerOverlayEl, vw, vh);
      const overlayZ = Math.max(findOverlayStackZ(dialogEl), findOverlayStackZ(outerOverlayEl));

      let navEl = null;
      const toShell = [];
      const tStart = performance.now();
      const nodes = dialogEl.querySelectorAll('div, aside, nav, section, main, header');
      for (let i = 0; i < nodes.length && i < 180; i += 1) {
        if ((i & 15) === 0 && performance.now() - tStart > 3.5) break;
        const sub = nodes[i];
        if (isOwnElement(sub)) continue;
        if (navEl && navEl.contains(sub)) continue;
        const sr = sub.getBoundingClientRect();
        if (sr.width < 60 || sr.height < 28) continue;

        const isLeftNav =
          !navEl &&
          sr.left <= or.left + 32 &&
          sr.width >= 120 &&
          sr.width <= Math.min(340, or.width * 0.36) &&
          sr.height >= or.height * 0.48;

        if (isLeftNav) {
          navEl = sub;
          continue;
        }

        if (sr.width >= or.width * 0.42 && sr.height >= 40) {
          const scs = getComputedStyle(sub);
          const sbg = parseRgba(scs.backgroundColor);
          if ((sbg.a > 0.08 && isNeutralColor(sbg.r, sbg.g, sbg.b)) || hasGradient(scs)) {
            const btmRad = Math.max(
              parseFloat(scs.borderBottomLeftRadius || '0'),
              parseFloat(scs.borderBottomRightRadius || '0')
            );
            if (sr.height >= or.height * 0.45 || sr.width >= or.width * 0.60 || btmRad < 6 || scs.position === 'sticky') {
              toShell.push(sub);
            }
          }
        }
      }

      const prevBackdrops = document.querySelectorAll('[data-agy-we-overlay-backdrop]');

      // ── Phase 2: Single Batched Write Pass (zero forced synchronous reflow!) ──
      for (const el of prevBackdrops) el.removeAttribute('data-agy-we-overlay-backdrop');

      hasActiveOverlay = true;
      activeOverlayOuterEl = outerOverlayEl;
      activeOverlayDialogEl = dialogEl;
      lastSettingsNav = navEl;
      document.documentElement.classList.add('agy-we-overlay-open');
      attachOverlayAttrObs(outerOverlayEl, dialogEl);

      // Centered dialog: pair #agy-we-focus-veil (8px soft blur) + dialog (28px rich liquid glass), identical to #agy-we-modal!
      // Full-viewport overlay: skip redundant hidden focusVeil blur so GPU renders only 1 full-screen blur pass!
      if (!isFullViewport) {
        setFocusVeilOpen(true, overlayZ, outerOverlayEl);
      } else {
        setFocusVeilOpen(false);
      }

      // Neutralize host's own harsh/unanimated backdrop & inner backdrops so there is NEVER a double backdrop-filter!
      if (backdropEl) {
        setAttr(backdropEl, 'data-agy-we-overlay-backdrop', '1');
        delAttr(backdropEl, 'data-agy-we-shell');
        delAttr(backdropEl, 'data-agy-we-region');
      }
      for (const bd of innerBackdrops) {
        if (bd !== dialogEl && !bd.contains(dialogEl) && !isOwnElement(bd)) {
          setAttr(bd, 'data-agy-we-overlay-backdrop', '1');
          delAttr(bd, 'data-agy-we-shell');
        }
      }
      for (const bd of backdrops) {
        if (bd !== dialogEl && !bd.contains(dialogEl) && !isOwnElement(bd)) {
          setAttr(bd, 'data-agy-we-overlay-backdrop', '1');
          delAttr(bd, 'data-agy-we-shell');
        }
      }

      setAttr(dialogEl, 'data-agy-we-region', 'settings-overlay');
      setAttr(dialogEl, 'data-agy-we-has-backdrop', isFullViewport ? '0' : '1');
      delAttr(dialogEl, 'data-agy-we-shell');

      if (navEl) {
        setAttr(navEl, 'data-agy-we-region', 'settings-nav');
        delAttr(navEl, 'data-agy-we-shell');
      }
      for (const sub of toShell) {
        setAttr(sub, 'data-agy-we-shell', 'transparent');
        delAttr(sub, 'data-agy-we-region');
      }

      // Defer secondary nav-row polish until AFTER the 240ms entrance animation finishes (zero frame-0 jank!)
      if (overlayNavTimer) clearTimeout(overlayNavTimer);
      if (navEl) {
        overlayNavTimer = setTimeout(() => {
          overlayNavTimer = null;
          if (hasActiveOverlay && lastSettingsNav && lastSettingsNav.isConnected) {
            reconcileAllSidebars(true);
          }
        }, 260);
      }

      return outerOverlayEl;
    }

    function scheduleSidebarReconcile(delayMs = 80, onlySettingsNav = false) {
      if (sidebarReconcileTimer) clearTimeout(sidebarReconcileTimer);
      sidebarReconcileTimer = setTimeout(() => {
        sidebarReconcileTimer = null;
        reconcileAllSidebars(onlySettingsNav);
      }, delayMs);
    }

    function clearDomMarks() {
      for (const attr of MANAGED_ATTRS) {
        document.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
      }
      hasActiveOverlay = false;
      activeOverlayDialogEl = null;
      activeOverlayOuterEl = null;
      lastSettingsNav = null;
      lastHoveredRow = null;
      if (overlayNavTimer) {
        clearTimeout(overlayNavTimer);
        overlayNavTimer = null;
      }
      detachOverlayAttrObs();
      setFocusVeilOpen(false);
      document.documentElement.classList.remove('agy-we-overlay-open');
      document.documentElement.removeAttribute('data-agy-we-theme');
    }

    function tagComposerInput(inp, vw, vh, composerTagged, protectedMainAncestors) {
      if (!inp || isOwnElement(inp)) return;
      const ir = inp.getBoundingClientRect();
      if (ir.width < 130 || ir.height < 14 || ir.top < vh * 0.22) return;

      const candidates = [];
      let cur = inp.parentElement;
      for (let depth = 0; cur && depth < 9 && cur !== document.body; depth += 1, cur = cur.parentElement) {
        const r = cur.getBoundingClientRect();
        if (r.width > vw * 0.88 || r.height > vh * 0.44) break;
        if (r.width >= 200 && r.height >= 42) {
          const cs = getComputedStyle(cur);
          const bg = parseRgba(cs.backgroundColor);
          const radius = parseFloat(cs.borderTopLeftRadius || '0');
          const bw = Math.max(
            parseFloat(cs.borderTopWidth || '0'),
            parseFloat(cs.borderBottomWidth || '0'),
            parseFloat(cs.borderLeftWidth || '0')
          );
          const hasOutlineOrShadow = (cs.boxShadow && cs.boxShadow !== 'none') || parseFloat(cs.outlineWidth || '0') > 0;
          if (radius >= 6 && (bg.a > 0.08 || bw > 0 || hasOutlineOrShadow)) {
            candidates.push({ el: cur, r, radius });
          }
        }
      }

      let picked = null;
      if (candidates.length) {
        picked = candidates[candidates.length - 1].el;
        for (const c of candidates) {
          if (c.el !== picked) {
            setAttr(c.el, 'data-agy-we-composer-inner', 'clear');
            delAttr(c.el, 'data-agy-we-region');
          }
        }
      }

      if (!picked) return;
      setAttr(picked, 'data-agy-we-region', hasFixedDescendant(picked) ? 'composer-nofilter' : 'composer');
      delAttr(picked, 'data-agy-we-shell');
      delAttr(picked, 'data-agy-we-composer-inner');
      if (composerTagged) composerTagged.add(picked);

      // Clear nested dark/bordered wrappers inside composer card
      picked.querySelectorAll('div, form, section').forEach((child) => {
        if (child.getAttribute('data-agy-we-composer-inner') === 'clear') return;
        if (child === inp || child.contains(inp) || child.tagName === 'FORM') {
          const ccs = getComputedStyle(child);
          const cbg = parseRgba(ccs.backgroundColor);
          const cbw = Math.max(parseFloat(ccs.borderTopWidth || '0'), parseFloat(ccs.borderBottomWidth || '0'));
          if ((cbg.a > 0.06 && isNeutralColor(cbg.r, cbg.g, cbg.b)) || cbw > 0 || (ccs.boxShadow && ccs.boxShadow !== 'none')) {
            setAttr(child, 'data-agy-we-composer-inner', 'clear');
          }
        }
      });

      // Protect every ancestor of composer as crystal-clear main canvas + clear bottom/side fade docks
      let anc = picked.parentElement;
      let ancDepth = 0;
      while (anc && anc !== document.body) {
        if (protectedMainAncestors) protectedMainAncestors.add(anc);
        setAttr(anc, 'data-agy-we-shell', 'transparent');
        delAttr(anc, 'data-agy-we-region');
        if (ancDepth < 6) {
          setAttr(anc, 'data-agy-we-composer-dock', 'clear');
        }
        anc = anc.parentElement;
        ancDepth += 1;
      }

      // Neutralize sibling fade-out strips & dark dock edges at depth 1 and depth 2 around composer
      const dockParents = [picked.parentElement, picked.parentElement && picked.parentElement.parentElement].filter(Boolean);
      for (const dockParent of dockParents) {
        if (dockParent === document.body) continue;
        for (const sib of dockParent.children) {
          if (sib === picked || sib.contains(picked) || isOwnElement(sib)) continue;
          if (sib.getAttribute('data-agy-we-composer-dock') === 'clear') continue;
          const sr = sib.getBoundingClientRect();
          if (sr.width >= vw * 0.20 && sr.height >= 2 && sr.height <= 140) {
            const scs = getComputedStyle(sib);
            const sbg = parseRgba(scs.backgroundColor);
            const shasGrad = hasGradient(scs);
            if (shasGrad || (sbg.a > 0.04 && isNeutralColor(sbg.r, sbg.g, sbg.b) && (sib.textContent || '').trim().length === 0)) {
              setAttr(sib, 'data-agy-we-shell', 'transparent');
              setAttr(sib, 'data-agy-we-composer-dock', 'clear');
            }
          }
        }
      }
    }

    function fastPrePaintClean(addedRoots) {
      if (scanning || !document.body || !addedRoots.length) return;
      const s = store.getSettings();
      const wp = store.getActiveWallpaper();
      if (!(s.enabled && wp)) return;

      scanning = true;
      try {
        const vw = window.innerWidth || 1280;
        const vh = window.innerHeight || 720;
        const composerTagged = new Set();
        const protectedMainAncestors = new Set();

        // 0. Detect newly mounted Settings/modal overlay synchronously at t=0ms (before Frame 1 paints!)
        const wasOverlayOpen = hasActiveOverlay;
        let maybeOverlay = wasOverlayOpen;
        if (!maybeOverlay) {
          for (const root of addedRoots) {
            if (!root || !root.isConnected || isOwnElement(root)) continue;
            const p = root.parentElement;
            if (
              p === document.body ||
              (p && (p.id === 'root' || p.id === 'app' || p.hasAttribute('data-radix-portal'))) ||
              root.tagName === 'DIALOG' ||
              root.getAttribute('role') === 'dialog' ||
              root.hasAttribute('data-radix-portal')
            ) {
              maybeOverlay = true;
              break;
            }
            const rr = root.getBoundingClientRect();
            // Catch nested portal/fixed overlays (either 0x0 portal wrapper or >=42% large overlay div)
            if (rr.width === 0 || rr.height === 0 || (rr.width >= vw * 0.42 && rr.height >= vh * 0.42)) {
              maybeOverlay = true;
              break;
            }
          }
        }
        const activeOverlayEl = maybeOverlay ? syncSettingsOverlayAndBlur(vw, vh, false, addedRoots) : null;

        // Fast exit: when Settings overlay just opened or tab content updated inside it,
        // skip all main-canvas scanning to keep Frame 1 & tab switches locked at 60fps!
        if (activeOverlayEl) {
          if (wasOverlayOpen && activeOverlayDialogEl) {
            const insideRoots = addedRoots.filter((r) => r && r.isConnected && activeOverlayDialogEl.contains(r));
            if (insideRoots.length) {
              cleanOverlaySubtree(insideRoots, activeOverlayDialogEl);
            }
          }
          const outsideRoots = addedRoots.filter((r) => r && r.isConnected && r !== activeOverlayEl && !activeOverlayEl.contains(r));
          if (!outsideRoots.length) return;
        }

        // 1. Immediately catch any newly mounted composer & its dock/ancestors before Frame 1 paints
        for (const root of addedRoots) {
          if (!root || !root.isConnected || isOwnElement(root)) continue;
          if (activeOverlayEl && (root === activeOverlayEl || activeOverlayEl.contains(root))) continue;
          if (root.matches && root.matches('textarea, [contenteditable="true"], [role="textbox"]')) {
            tagComposerInput(root, vw, vh, composerTagged, protectedMainAncestors);
          } else if (root.querySelectorAll) {
            const inps = root.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]');
            for (const inp of inps) {
              tagComposerInput(inp, vw, vh, composerTagged, protectedMainAncestors);
            }
          }
        }

        // 2. Immediately strip newly mounted opaque canvas shells, fade bands, and style bubbles before paint
        // Hard 4ms budget guarantees fastPrePaintClean can NEVER stall or freeze the renderer during heavy streaming!
        const tStart = performance.now();
        let budget = 80;
        for (const root of addedRoots) {
          if (budget <= 0 || performance.now() - tStart > 4) break;
          if (!root || !root.isConnected || isOwnElement(root)) continue;
          if (activeOverlayEl && (root === activeOverlayEl || activeOverlayEl.contains(root))) continue;
          const inSidebar = Boolean(root.closest && root.closest('[data-agy-we-region="left-sidebar"], [data-agy-we-region="right-sidebar"]'));
          if (inSidebar) continue;

          const queue = [root];
          while (queue.length && budget > 0) {
            if ((budget & 7) === 0 && performance.now() - tStart > 4) break;
            const el = queue.shift();
            budget -= 1;
            if (!el || el.nodeType !== 1 || PRUNE_TAGS.has(el.tagName) || isOwnElement(el)) continue;
            if (composerTagged.has(el)) continue;
          if (activeOverlayEl && (el === activeOverlayEl || activeOverlayEl.contains(el))) continue;

            const alreadyRegion = el.getAttribute('data-agy-we-region');
            if (alreadyRegion === 'modal' || alreadyRegion === 'composer' || alreadyRegion === 'composer-nofilter' || alreadyRegion === 'chat-bubble') {
              continue;
            }

            const rect = el.getBoundingClientRect();
            if (rect.width < 24 || rect.height < 4) continue;

            const isMainCanvas = protectedMainAncestors.has(el);
            const isFullCanvas = isMainCanvas || (rect.width >= vw * 0.55 && rect.height >= vh * 0.45);
            const isLargeArea = rect.width >= vw * 0.28 && rect.height >= vh * 0.25;
            const isWideBand = rect.width >= vw * 0.20 && rect.height >= 4 && rect.height <= 140;
            const isBubbleSize = !isMainCanvas && !isFullCanvas &&
              rect.width >= 40 && rect.width <= vw * 0.74 && rect.height >= 28 && rect.height <= vh * 0.68;

            if (el.getAttribute('data-agy-we-shell') !== 'transparent') {
              const cs = getComputedStyle(el);
              const bg = parseRgba(cs.backgroundColor);
              const grad = hasGradient(cs);
              const btmRad = Math.max(
                parseFloat(cs.borderBottomLeftRadius || '0'),
                parseFloat(cs.borderBottomRightRadius || '0')
              );
              const isPageHeaderBand =
                !isMainCanvas && !isFullCanvas &&
                rect.width >= vw * 0.35 &&
                rect.height >= 28 &&
                rect.height <= Math.max(260, vh * 0.36) &&
                (
                  cs.position === 'sticky' ||
                  el.tagName === 'HEADER' ||
                  (el.getAttribute('role') || '').toLowerCase() === 'banner' ||
                  (rect.top <= 140 && rect.width >= vw * 0.45 && btmRad < 6)
                );

              if (isFullCanvas || isLargeArea) {
                if ((bg.a > 0.01 && isNeutralColor(bg.r, bg.g, bg.b)) || grad) {
                  setAttr(el, 'data-agy-we-shell', 'transparent');
                  delAttr(el, 'data-agy-we-region');
                }
              } else if (isPageHeaderBand) {
                if ((bg.a > 0.06 && isNeutralColor(bg.r, bg.g, bg.b)) || grad) {
                  setAttr(el, 'data-agy-we-shell', 'transparent');
                  setAttr(el, 'data-agy-we-composer-dock', 'clear');
                  delAttr(el, 'data-agy-we-region');
                }
              } else if (isWideBand) {
                const noText = (el.textContent || '').trim().length === 0;
                const isFade = (grad && (noText || cs.pointerEvents === 'none' || rect.bottom >= vh - 180 || rect.top <= 96))
                  || (cs.pointerEvents === 'none' && noText && bg.a > 0.04 && isNeutralColor(bg.r, bg.g, bg.b));
                if (isFade) {
                  setAttr(el, 'data-agy-we-shell', 'transparent');
                  setAttr(el, 'data-agy-we-composer-dock', 'clear');
                  delAttr(el, 'data-agy-we-region');
                  continue;
                }
              } else if (
                isBubbleSize &&
                cs.position !== 'fixed' &&
                cs.position !== 'sticky' &&
                btmRad >= 8 &&
                !el.closest('header, nav, aside, button, a, [role="banner"], [role="navigation"], [role="toolbar"], [role="menubar"]') &&
                !el.querySelector('input, [role="searchbox"], [role="tablist"]')
              ) {
                const maxRad = Math.max(
                  parseFloat(cs.borderTopLeftRadius || '0'),
                  parseFloat(cs.borderTopRightRadius || '0'),
                  btmRad
                );
                const hasContent = (el.textContent || '').trim().length > 0 || Boolean(el.querySelector('img, video'));
                if (maxRad >= 10 && hasContent && bg.a >= 0.30 && isNeutralColor(bg.r, bg.g, bg.b)) {
                  setAttr(el, 'data-agy-we-region', 'chat-bubble');
                  delAttr(el, 'data-agy-we-shell');
                  continue;
                }
              }
            }

            if (queue.length < budget && el.children && el.children.length) {
              for (let i = 0; i < el.children.length && i < 24; i += 1) {
                const ch = el.children[i];
                if (ch && ch.nodeType === 1 && !PRUNE_TAGS.has(ch.tagName) && !SKIP_SELF_TAGS.has(ch.tagName)) {
                  queue.push(ch);
                }
              }
            }
          }
        }
      } finally {
        scanning = false;
      }
    }

    function scanAndTagDom() {
      if (scanning || !document.body) return;
      const s = store.getSettings();
      const wp = store.getActiveWallpaper();
      const active = Boolean(s.enabled && wp);
      if (!active) {
        clearDomMarks();
        return;
      }

      scanning = true;
      try {
        const vw = window.innerWidth || 1280;
        const vh = window.innerHeight || 720;

        // 0. Detect any full-screen Settings/modal overlay first (blur behind + clean its black nav column)
        const activeOverlayEl = syncSettingsOverlayAndBlur(vw, vh);

        // 1. Locate main chat composer (pick OUTERMOST rounded box) & strip dock/inner black chrome
        const composerTagged = new Set();
        const protectedMainAncestors = new Set();
        const inputs = document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]');
        for (const inp of inputs) {
          if (activeOverlayEl && activeOverlayEl.contains(inp)) continue;
          tagComposerInput(inp, vw, vh, composerTagged, protectedMainAncestors);
        }

        // 2. Pruned TreeWalker for shells, sidebars, headers, fade strips, and modals
        let leftSidebarTagged = null;
        let rightSidebarTagged = null;
        let topHeaderTagged = null;

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
          acceptNode(el) {
            if (PRUNE_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
            if (
              el.id === 'agy-we-bg-layer' ||
              el.id === 'agy-we-focus-veil' ||
              el.id === 'agy-we-fx-canvas' ||
              el.id === 'agy-we-ui-root' ||
              el.id === 'agy-we-perf-float' ||
              el.id === 'agy-zh-toggle-root'
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            if (activeOverlayEl && el === activeOverlayEl) return NodeFilter.FILTER_REJECT;
            // Prune entire subtrees of already-tagged isolated regions in O(1) (huge speedup in long chats!)
            const ownRegion = el.getAttribute('data-agy-we-region');
            if (ownRegion === 'chat-bubble' || ownRegion === 'composer' || ownRegion === 'composer-nofilter' || ownRegion === 'modal' || ownRegion === 'settings-overlay' || ownRegion === 'settings-nav') {
              return NodeFilter.FILTER_REJECT;
            }
            if (ownRegion === 'left-sidebar' && leftSidebarTagged && leftSidebarTagged !== el) return NodeFilter.FILTER_ACCEPT;
            if (SKIP_SELF_TAGS.has(el.tagName)) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        const walkStart = performance.now();
        let node = walker.nextNode();
        let visited = 0;
        while (node && visited < 2500) {
          if ((visited & 63) === 0 && performance.now() - walkStart > 14) break;
          visited += 1;
          const el = node;
          node = walker.nextNode();

          if (composerTagged.has(el)) continue;
          if (activeOverlayEl && (el === activeOverlayEl || activeOverlayEl.contains(el))) continue;

          const role = (el.getAttribute('role') || '').toLowerCase();
          if (role === 'dialog' || role === 'menu' || role === 'listbox' || role === 'tooltip' || role === 'alertdialog') {
            setAttr(el, 'data-agy-we-region', 'modal');
            delAttr(el, 'data-agy-we-shell');
            continue;
          }

          const rect = el.getBoundingClientRect();
          if (rect.width < 20 || rect.height < 6) continue;

          const ancestorRegion = el.parentElement && el.parentElement.closest('[data-agy-we-region]');
          const ancestorRegionName = ancestorRegion ? ancestorRegion.getAttribute('data-agy-we-region') : '';
          if (
            ancestorRegionName === 'modal' ||
            ancestorRegionName === 'composer' ||
            ancestorRegionName === 'composer-nofilter' ||
            ancestorRegionName === 'chat-bubble'
          ) {
            continue;
          }
          if (ancestorRegionName === 'left-sidebar' || ancestorRegionName === 'right-sidebar' || ancestorRegionName === 'header') {
            continue; // Cleaned up idempotently in Pass 3 below
          }

          const alreadyShell = el.getAttribute('data-agy-we-shell') === 'transparent';
          const alreadyRegion = el.getAttribute('data-agy-we-region');

          // Lock already-tagged chat bubbles idempotently (zero flicker)
          if (alreadyRegion === 'chat-bubble') continue;

          const isMainCanvas = protectedMainAncestors.has(el);
          const isFullCanvas = isMainCanvas || (rect.width >= vw * 0.58 && rect.height >= vh * 0.52);
          const isLargeArea = rect.width >= vw * 0.32 && rect.height >= vh * 0.30;
          const isTallLeft = !isFullCanvas && !isMainCanvas && rect.left <= 16 && rect.width >= 150 && rect.width <= Math.min(340, vw * 0.28) && rect.height >= vh * 0.58;
          const isTallRight = !isFullCanvas && !isMainCanvas && rect.right >= vw - 16 && rect.left >= vw * 0.62 && rect.width >= 180 && rect.width <= Math.min(420, vw * 0.34) && rect.height >= vh * 0.58;
          const isTopBar = !isMainCanvas && rect.top <= 48 && rect.width >= vw * 0.35 && rect.height >= 20 && rect.height <= 64;
          const isWideBand = !isTallLeft && !isTallRight && rect.width >= vw * 0.24 && rect.height >= 6 && rect.height <= 140;
          const isHeaderBandSize = !isMainCanvas && !isFullCanvas && !isTallLeft && !isTallRight &&
            rect.width >= vw * 0.35 && rect.height >= 28 && rect.height <= Math.max(260, vh * 0.36);
          const isBubbleSize = !isMainCanvas && !isFullCanvas && !isTallLeft && !isTallRight && !isTopBar &&
            rect.width >= 40 && rect.width <= vw * 0.74 && rect.height >= 28 && rect.height <= vh * 0.68;

          if (!isFullCanvas && !isLargeArea && !isTallLeft && !isTallRight && !isTopBar && !isWideBand && !isHeaderBandSize && !isBubbleSize) {
            // Never strip tags during transient resize/layout frames unless element became tiny
            if (rect.width < 80 && rect.height < 24) delAttr(el, 'data-agy-we-shell');
            continue;
          }

          // Keep already-assigned primary regions stable to prevent compositor flicker!
          if (alreadyRegion === 'left-sidebar' && isTallLeft && !leftSidebarTagged) {
            leftSidebarTagged = el;
            continue;
          }
          if (alreadyRegion === 'right-sidebar' && isTallRight && !rightSidebarTagged) {
            rightSidebarTagged = el;
            continue;
          }
          if (alreadyRegion === 'header' && isTopBar && rect.top <= 8 && !topHeaderTagged) {
            topHeaderTagged = el;
            continue;
          }
          if (alreadyShell) continue;

          const cs = getComputedStyle(el);
          const bg = parseRgba(cs.backgroundColor);
          const hasGradientBg = Boolean(cs.backgroundImage && cs.backgroundImage !== 'none' && cs.backgroundImage.includes('gradient('));
          const btmRad = Math.max(
            parseFloat(cs.borderBottomLeftRadius || '0'),
            parseFloat(cs.borderBottomRightRadius || '0')
          );

          // Dissolve opaque sticky page headers / top search banners (e.g. Customizations, Settings, Plugins pages)
          if (
            isHeaderBandSize &&
            !(isTopBar && rect.top <= 8) &&
            (
              cs.position === 'sticky' ||
              el.tagName === 'HEADER' ||
              role === 'banner' ||
              (rect.top <= 140 && rect.width >= vw * 0.45 && btmRad < 6)
            )
          ) {
            if ((bg.a > 0.06 && isNeutralColor(bg.r, bg.g, bg.b)) || hasGradientBg) {
              setAttr(el, 'data-agy-we-shell', 'transparent');
              setAttr(el, 'data-agy-we-composer-dock', 'clear');
              delAttr(el, 'data-agy-we-region');
              continue;
            }
          }

          // Detect rounded user/chat message bubbles & cards inside conversation stream -> Liquid Glass
          if (
            isBubbleSize &&
            cs.position !== 'fixed' &&
            cs.position !== 'sticky' &&
            btmRad >= 8 &&
            role !== 'button' && role !== 'menuitem' && role !== 'tab' &&
            role !== 'option' && role !== 'switch' && role !== 'checkbox' && role !== 'radio' &&
            !el.closest('header, nav, aside, button, a, [role="banner"], [role="navigation"], [role="toolbar"], [role="menubar"]') &&
            !el.querySelector('input, [role="searchbox"], [role="tablist"]')
          ) {
            const maxRad = Math.max(
              parseFloat(cs.borderTopLeftRadius || '0'),
              parseFloat(cs.borderTopRightRadius || '0'),
              btmRad
            );
            const isTinyPointerChip = rect.height <= 32 && rect.width <= 120 && cs.cursor === 'pointer';
            const hasContent = (el.textContent || '').trim().length > 0 || Boolean(el.querySelector('img, video'));
            if (maxRad >= 10 && !isTinyPointerChip && hasContent && bg.a >= 0.30 && isNeutralColor(bg.r, bg.g, bg.b)) {
              setAttr(el, 'data-agy-we-region', 'chat-bubble');
              delAttr(el, 'data-agy-we-shell');
              // Dissolve redundant opaque neutral inner wrappers inside the bubble
              el.querySelectorAll('div, section, p').forEach((child) => {
                if (child.getAttribute('data-agy-we-bubble-inner') === 'clear') return;
                if (child.closest('pre, code, table, button, a')) return;
                const ccs = getComputedStyle(child);
                const cbg = parseRgba(ccs.backgroundColor);
                if (cbg.a >= 0.25 && isNeutralColor(cbg.r, cbg.g, cbg.b)) {
                  setAttr(child, 'data-agy-we-bubble-inner', 'clear');
                }
              });
              continue;
            }
          }

          // Kill ALL decorative fade-out gradient bands (bottom composer fade, top scroll fade)
          if (isWideBand) {
            const noText = (el.textContent || '').trim().length === 0;
            const isFade = (hasGradientBg && (noText || cs.pointerEvents === 'none' || rect.bottom >= vh - 160 || rect.top <= 96))
              || (cs.pointerEvents === 'none' && noText && bg.a > 0.04 && isNeutralColor(bg.r, bg.g, bg.b));
            if (isFade) {
              setAttr(el, 'data-agy-we-shell', 'transparent');
              setAttr(el, 'data-agy-we-composer-dock', 'clear');
              delAttr(el, 'data-agy-we-region');
              continue;
            }
          }

          // For main canvas / large shells: strip EVEN faint gray veils (bg.a > 0.01) so wallpaper is 100% vivid & crisp!
          const alphaThreshold = (isFullCanvas || isLargeArea) ? 0.01 : 0.14;
          const hasNeutralFill = (bg.a > alphaThreshold && isNeutralColor(bg.r, bg.g, bg.b)) || hasGradientBg;
          if (!alreadyRegion && !hasNeutralFill) continue;

          if (isFullCanvas) {
            setAttr(el, 'data-agy-we-shell', 'transparent');
            delAttr(el, 'data-agy-we-region');
          } else if (isTallLeft && (!leftSidebarTagged || leftSidebarTagged === el)) {
            leftSidebarTagged = el;
            setAttr(el, 'data-agy-we-region', 'left-sidebar');
            delAttr(el, 'data-agy-we-shell');
          } else if (isTallRight && (!rightSidebarTagged || rightSidebarTagged === el)) {
            rightSidebarTagged = el;
            setAttr(el, 'data-agy-we-region', 'right-sidebar');
            delAttr(el, 'data-agy-we-shell');
          } else if (isTopBar && rect.top <= 8 && (!topHeaderTagged || topHeaderTagged === el)) {
            topHeaderTagged = el;
            setAttr(el, 'data-agy-we-region', 'header');
            delAttr(el, 'data-agy-we-shell');
          } else if (isTopBar || isLargeArea || isTallLeft || isTallRight) {
            setAttr(el, 'data-agy-we-shell', 'transparent');
            delAttr(el, 'data-agy-we-region');
          }
        }

        // 3. Reconcile sidebars (throttled when no explicit sidebar change occurred) & header cleanup
        const leftChanged = leftSidebarTagged !== lastLeftSidebar;
        const rightChanged = rightSidebarTagged !== lastRightSidebar;
        lastLeftSidebar = leftSidebarTagged;
        lastRightSidebar = rightSidebarTagged;
        const nowTs = Date.now();
        if (leftSidebarTagged && (leftChanged || nowTs - lastSidebarReconcileAt > 900)) {
          reconcileSidebarRegion(leftSidebarTagged);
        }
        if (rightSidebarTagged && (rightChanged || nowTs - lastSidebarReconcileAt > 900)) {
          reconcileSidebarRegion(rightSidebarTagged);
        }
        if (topHeaderTagged) {
          const subNodes = topHeaderTagged.querySelectorAll('div, section, header, footer, ul, li, nav, button, a');
          let subCount = 0;
          for (const sub of subNodes) {
            if (++subCount > 600) break;
            if (isOwnElement(sub)) continue;
            if (sub.hasAttribute('data-agy-we-shell')) continue;
            const sr = sub.getBoundingClientRect();
            if (sr.width < 24 || sr.height < 14) continue;
            const scs = getComputedStyle(sub);
            const sbg = parseRgba(scs.backgroundColor);
            const isNeutralFill = (sbg.a > 0.08 && isNeutralColor(sbg.r, sbg.g, sbg.b)) || hasGradient(scs);
            if (isNeutralFill) {
              setAttr(sub, 'data-agy-we-shell', 'transparent');
            }
          }
        }
      } finally {
        lastFullScanAt = Date.now();
        scanning = false;
      }
    }

    function scheduleScan(delayMs = 180) {
      if (scanTimer) clearTimeout(scanTimer);
      const sinceLast = Date.now() - lastFullScanAt;
      const wait = Math.max(delayMs, sinceLast < 480 ? (480 - sinceLast) : 0);
      scanTimer = setTimeout(() => {
        scanTimer = null;
        scanAndTagDom();
      }, wait);
    }

    function apply() {
      const s = store.getSettings();
      const wp = store.getActiveWallpaper();
      const active = Boolean(s.enabled && wp);
      const isDark = detectDarkTheme();
      document.documentElement.setAttribute('data-agy-we-theme', isDark ? 'dark' : 'light');

      const accent = (s.themeFollow && wp && wp.schemeColor) ? wp.schemeColor : (s.accent || '#75e6f5');
      const [ar, ag, ab] = hexToRgb(accent, [117, 230, 245]);
      const baseColorHex = isDark ? (s.glassColorDark || '#0a1622') : (s.glassColorLight || '#ffffff');
      const [gr, gg, gb] = hexToRgb(baseColorHex, isDark ? [10, 22, 34] : [255, 255, 255]);

      // Upstream DeepSeek-Harness calibrated optical glass formula:
      // floor = (dark ? 0.59 : 0.45) * fidelity; aGlass = max(0.10, 0.25 - clarity * 0.15)
      // effectiveAlpha = floor + aGlass * (1 - floor)
      // At reference settings (glassAlpha=40, glassFidelity=20, blur=9, border=0.35):
      // floor = 0.118, aGlass = 0.19 => effAlpha = 0.286 (crystal-clear wet ice glass)
      const clarity = Math.max(0, Math.min(100, Number(s.glassAlpha ?? 40))) / 100;
      const fidelity = Math.max(0, Math.min(100, Number(s.glassFidelity ?? 20))) / 100;
      const blurPx = Math.max(0, Math.min(48, Number(s.blur ?? 9)));
      const borderKnob = Math.max(0, Math.min(1, Number(s.border ?? 0.35)));

      const floorBase = isDark ? 0.59 : 0.45;
      const floor = floorBase * fidelity;
      const aGlass = Math.max(0.10, 0.25 - clarity * 0.15);
      const effAlpha = Math.max(isDark ? 0.12 : 0.18, Math.min(0.86, floor + aGlass * (1 - floor)));

      const sidebarAlpha = Math.min(0.86, effAlpha * 1.10);
      const headerAlpha = Math.max(isDark ? 0.10 : 0.16, effAlpha * 0.92);
      const composerAlpha = Math.min(0.84, effAlpha * 0.96);
      const bubbleAlpha = Math.min(0.84, effAlpha * 1.04);
      const cardAlpha = Math.min(0.84, effAlpha * 1.12);
      const modalAlpha = Math.max(isDark ? 0.62 : 0.74, Math.min(0.92, effAlpha + 0.38));

      // Optical backdrop filter: subtle saturation lift so wallpaper glows through ice glass
      const satPct = Math.round(118 + fidelity * 52);
      const briPct = isDark ? Math.round(98 + fidelity * 4) : Math.round(102 + fidelity * 4);
      const conPct = Math.round(101 + fidelity * 2);

      // Wet specular sheen gradient
      const sheenTop = ((isDark ? 0.095 : 0.34) * (0.45 + fidelity * 0.55)).toFixed(3);
      const sheenMid = ((isDark ? 0.024 : 0.10) * (0.45 + fidelity * 0.55)).toFixed(3);
      const sheenBot = ((isDark ? 0.006 : 0.02) * (0.45 + fidelity * 0.55)).toFixed(3);
      const sheenGrad = `linear-gradient(180deg, rgba(255,255,255,${sheenTop}) 0%, rgba(255,255,255,${sheenMid}) 38%, rgba(255,255,255,${sheenBot}) 100%)`;

      const borderRgb = isDark ? '255,255,255' : '15,23,42';
      const borderAlpha = (borderKnob * (isDark ? 0.32 : 0.24)).toFixed(3);
      const rimTop = ((isDark ? 0.20 : 0.58) * (0.40 + fidelity * 0.60)).toFixed(3);
      const rimBot = ((isDark ? 0.06 : 0.16) * (0.40 + fidelity * 0.60)).toFixed(3);
      const rimHair = ((isDark ? 0.07 : 0.18) * borderKnob).toFixed(3);

      // Single-pass GPU backdrop blur (dropping chained saturate/brightness/contrast cuts GPU shader passes by ~60%!)
      const makeBdFilter = (px) => px > 0 ? `blur(${px}px)` : 'none';
      const bdFilter = makeBdFilter(blurPx);
      const bdFilterSidebar = makeBdFilter(blurPx);
      const bdFilterHeader = makeBdFilter(Math.round(blurPx * 0.85));
      const bdFilterModal = makeBdFilter(Math.min(14, Math.max(8, blurPx + 2)));

      const makeCornerCss = (rad, corners) => {
        const r = Math.max(0, Math.min(32, Number(rad) || 0));
        if (r <= 0) return '';
        const c = Array.isArray(corners) && corners.length === 4 ? corners : [0, 1, 1, 0];
        return `border-radius: ${c[0] ? r : 0}px ${c[1] ? r : 0}px ${c[2] ? r : 0}px ${c[3] ? r : 0}px !important; overflow: hidden;`;
      };
      const leftCornerCss = makeCornerCss(s.leftSidebarRadius, s.leftSidebarCorners);
      const rightCornerCss = makeCornerCss(s.rightSidebarRadius, s.rightSidebarCorners);

      const sidebarGlassDecl = `
        background-color: rgba(${gr}, ${gg}, ${gb}, ${sidebarAlpha.toFixed(3)}) !important;
        background-image: ${sheenGrad} !important;
        backdrop-filter: ${bdFilterSidebar} !important;
        -webkit-backdrop-filter: ${bdFilterSidebar} !important;
        border-color: rgba(${borderRgb}, ${Math.min(0.24, Number(borderAlpha)).toFixed(3)}) !important;
        box-shadow: inset -1px 0 0 rgba(${borderRgb}, ${Math.min(0.18, Number(borderAlpha)).toFixed(3)}) !important;
      `;

      const headerGlassDecl = `
        background-color: rgba(${gr}, ${gg}, ${gb}, ${headerAlpha.toFixed(3)}) !important;
        background-image: ${sheenGrad} !important;
        backdrop-filter: ${bdFilterHeader} !important;
        -webkit-backdrop-filter: ${bdFilterHeader} !important;
        border-bottom-color: rgba(${borderRgb}, ${Math.min(0.20, Number(borderAlpha)).toFixed(3)}) !important;
        box-shadow: none !important;
      `;

      const composerGlassDecl = `
        background-color: rgba(${gr}, ${gg}, ${gb}, ${composerAlpha.toFixed(3)}) !important;
        background-image: ${sheenGrad} !important;
        backdrop-filter: ${bdFilter} !important;
        -webkit-backdrop-filter: ${bdFilter} !important;
        border: 1px solid rgba(${borderRgb}, ${Math.min(0.32, Math.max(0.14, Number(borderAlpha) * 1.15)).toFixed(3)}) !important;
        outline: none !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,${rimTop}),
          inset 0 -1px 0 rgba(255,255,255,${rimBot}),
          inset 0 0 0 0.5px rgba(255,255,255,${rimHair}),
          0 10px 30px rgba(0,0,0,${isDark ? '0.20' : '0.08'}) !important;
      `;

      const composerNoFilterDecl = `
        background-color: rgba(${gr}, ${gg}, ${gb}, ${Math.min(0.76, composerAlpha + 0.08).toFixed(3)}) !important;
        background-image: ${sheenGrad} !important;
        border: 1px solid rgba(${borderRgb}, ${Math.min(0.32, Math.max(0.14, Number(borderAlpha) * 1.15)).toFixed(3)}) !important;
        outline: none !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,${rimTop}),
          inset 0 -1px 0 rgba(255,255,255,${rimBot}),
          0 10px 30px rgba(0,0,0,${isDark ? '0.20' : '0.08'}) !important;
      `;

      const fontsData = store.getSystemFonts();
      const uiFont = s.fontCustom ? resolveFontStack(s.uiFontFamily, fontsData.builtin) : '';
      const monoFont = s.fontCustom ? resolveFontStack(s.monoFontFamily, fontsData.builtinMono) : '';
      const fontScale = s.fontCustom ? (Math.max(85, Math.min(125, Number(s.uiFontScale) || 100)) / 100) : 1;

      const rules = [];
      rules.push(`
        :root {
          --agy-we-accent: ${accent};
          --agy-we-accent-rgb: ${ar}, ${ag}, ${ab};
          --agy-we-glass-rgb: ${gr}, ${gg}, ${gb};
          --agy-we-glass-bg: rgba(${gr}, ${gg}, ${gb}, ${sidebarAlpha.toFixed(3)});
          --agy-we-glass-bg-strong: rgba(${gr}, ${gg}, ${gb}, ${modalAlpha.toFixed(3)});
          --agy-we-glass-border: rgba(${borderRgb}, ${borderAlpha});
          --agy-we-glass-sheen: ${sheenGrad};
          --agy-we-glass-blur: ${blurPx}px;
          --agy-we-glass-sat: ${satPct}%;
          --agy-we-text: ${s.textColorPrimary || (isDark ? '#f9fafb' : '#0f172a')};
          --agy-we-text-muted: ${s.textColorMuted || (isDark ? '#75e6f5' : '#475569')};
        }
        #agy-we-bg-layer {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: -2;
          pointer-events: none;
          overflow: hidden;
          background-color: var(--agy-we-underlay, ${isDark ? '#060c14' : '#f1f5f9'});
          -webkit-app-region: initial !important;
        }
        #agy-we-poster, #agy-we-stage, #agy-we-scrim {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        #agy-we-poster {
          background-repeat: no-repeat;
          background-position: center;
          background-size: cover;
          z-index: 1;
        }
        #agy-we-stage { z-index: 2; }
        #agy-we-scrim { z-index: 3; }
        #agy-we-stage .agy-we-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          pointer-events: none;
        }
      `);

      if (active) {
        rules.push(`
          html.agy-we-active {
            background-color: var(--agy-we-underlay, ${isDark ? '#060c14' : '#f1f5f9'}) !important;
            background-image: none !important;
          }
          html.agy-we-active body,
          html.agy-we-active #root,
          html.agy-we-active #app,
          html.agy-we-active main,
          html.agy-we-active [data-agy-we-shell="transparent"],
          html.agy-we-active [data-agy-we-composer-dock="clear"] {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
          }
          html.agy-we-active [data-agy-we-composer-dock="clear"] {
            box-shadow: none !important;
            border-color: transparent !important;
          }
          html.agy-we-active [data-agy-we-composer-dock="clear"]::before,
          html.agy-we-active [data-agy-we-composer-dock="clear"]::after,
          html.agy-we-active [data-agy-we-shell="transparent"]::before,
          html.agy-we-active [data-agy-we-shell="transparent"]::after {
            background: transparent !important;
            background-image: none !important;
          }
          html.agy-we-active [data-agy-we-composer-inner="clear"] {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            border-color: transparent !important;
            box-shadow: none !important;
            outline: none !important;
          }
          /* Sidebar sticky/folder headers: completely seamless, zero black block */
          html.agy-we-active [data-agy-we-sticky="soft"] {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            box-shadow: none !important;
          }
          /* Kill ugly black hover action-bar strips & horizontal fade gradients inside sidebars */
          html.agy-we-active [data-agy-we-action-bar="clear"],
          html.agy-we-active [data-agy-we-action-bar="clear"]::before,
          html.agy-we-active [data-agy-we-action-bar="clear"]::after,
          html.agy-we-active [data-agy-we-region="left-sidebar"] [class*="bg-gradient-to-l"],
          html.agy-we-active [data-agy-we-region="left-sidebar"] [class*="bg-gradient-to-r"],
          html.agy-we-active [data-agy-we-region="left-sidebar"] [class*="bg-linear-to-l"],
          html.agy-we-active [data-agy-we-region="left-sidebar"] [class*="bg-linear-to-r"],
          html.agy-we-active [data-agy-we-region="right-sidebar"] [class*="bg-gradient-to-l"],
          html.agy-we-active [data-agy-we-region="right-sidebar"] [class*="bg-gradient-to-r"],
          html.agy-we-active [data-agy-we-region="right-sidebar"] [class*="bg-linear-to-l"],
          html.agy-we-active [data-agy-we-region="right-sidebar"] [class*="bg-linear-to-r"] {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            box-shadow: none !important;
          }
          /* Soft glass hover tint ONLY while cursor is actively hovering an opaque-hover row */
          html.agy-we-active [data-agy-we-row-hover="1"]:hover {
            background-color: rgba(${isDark ? '255, 255, 255' : '15, 23, 42'}, ${isDark ? '0.09' : '0.07'}) !important;
            background-image: none !important;
          }
          /* Settings modal backdrop & surface — aligned 1:1 with #agy-we-modal-backdrop & #agy-we-modal */
          @keyframes agy-we-settings-pop {
            from {
              opacity: 0;
              scale: 0.97;
              translate: 0 10px;
            }
            to {
              opacity: 1;
              scale: 1;
              translate: 0 0;
            }
          }
          #agy-we-focus-veil {
            position: fixed;
            inset: 0;
            pointer-events: none;
            background-color: ${isDark ? 'rgba(2, 6, 16, 0.48)' : 'rgba(241, 245, 249, 0.42)'};
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            opacity: 0;
            visibility: hidden;
            will-change: opacity;
            contain: strict;
            transition: opacity 220ms ease, visibility 0s linear 220ms;
          }
          #agy-we-focus-veil.open {
            opacity: 1;
            visibility: visible;
            transition: opacity 220ms ease, visibility 0s;
          }
          html.agy-we-active [data-agy-we-overlay-backdrop="1"],
          html.agy-we-active dialog[open]::backdrop {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          html.agy-we-active [data-agy-we-region="settings-overlay"] {
            background-color: ${isDark ? `rgba(${gr}, ${gg}, ${gb}, 0.72)` : 'rgba(250, 252, 255, 0.84)'} !important;
            background-image: ${isDark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 36%, rgba(255,255,255,0.005) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.16) 38%, rgba(255,255,255,0.02) 100%)'} !important;
            backdrop-filter: blur(28px) saturate(170%) brightness(1.03) !important;
            -webkit-backdrop-filter: blur(28px) saturate(170%) brightness(1.03) !important;
            border-color: ${isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.14)'} !important;
            box-shadow: ${isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.28), 0 28px 80px rgba(0,0,0,0.58)'
              : 'inset 0 1px 0 rgba(255,255,255,0.72), 0 28px 80px rgba(15,23,42,0.18)'} !important;
            animation: agy-we-settings-pop 240ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
          }
          html.agy-we-active [data-agy-we-region="settings-nav"] {
            background-color: ${isDark ? 'rgba(2, 8, 18, 0.18)' : 'rgba(255, 255, 255, 0.34)'} !important;
            background-image: none !important;
            border-right: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.10)'} !important;
            box-shadow: none !important;
          }
          /* Active/selected sidebar row ONLY: clean soft ice-accent capsule */
          html.agy-we-active [data-agy-we-item-soft="1"],
          html.agy-we-active [data-agy-we-region="left-sidebar"] [aria-selected="true"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="left-sidebar"] [aria-current="page"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="left-sidebar"] [aria-current="true"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="left-sidebar"] [data-active="true"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="left-sidebar"] [data-selected="true"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="settings-nav"] [aria-selected="true"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="settings-nav"] [aria-current="page"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="settings-nav"] [data-active="true"]:not([aria-expanded]),
          html.agy-we-active [data-agy-we-region="settings-nav"] [data-selected="true"]:not([aria-expanded]) {
            background-color: rgba(${ar}, ${ag}, ${ab}, ${isDark ? '0.16' : '0.14'}) !important;
            background-image: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01)) !important;
            border-color: rgba(${ar}, ${ag}, ${ab}, 0.28) !important;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.14) !important;
          }
          /* Soften only genuinely visible dividers (never make border-transparent rows into boxes!) */
          html.agy-we-active [data-agy-we-divider="soft"],
          html.agy-we-active [data-agy-we-region="left-sidebar"] hr,
          html.agy-we-active [data-agy-we-region="left-sidebar"] [role="separator"],
          html.agy-we-active [data-agy-we-region="right-sidebar"] hr,
          html.agy-we-active [data-agy-we-region="right-sidebar"] [role="separator"] {
            border-color: rgba(${borderRgb}, ${Math.min(0.14, Number(borderAlpha)).toFixed(3)});
          }
          /* Crisp inline-code glass capsules (matching DeepSeek Harness chat prose) */
          html.agy-we-active :not(pre) > code {
            background-color: rgba(${gr}, ${gg}, ${gb}, ${isDark ? '0.46' : '0.32'}) !important;
            border: 1px solid rgba(${borderRgb}, ${isDark ? '0.18' : '0.16'}) !important;
            border-radius: 6px !important;
            padding: 1px 6px !important;
          }
          /* Soft glass-blended scrollbars (no dark scrollbar strip flash on conversation switch) */
          html.agy-we-active ::-webkit-scrollbar,
          html.agy-we-active ::-webkit-scrollbar-track,
          html.agy-we-active ::-webkit-scrollbar-track-piece,
          html.agy-we-active ::-webkit-scrollbar-corner {
            background: transparent !important;
            background-color: transparent !important;
          }
          html.agy-we-active ::-webkit-scrollbar-thumb {
            background-color: rgba(${isDark ? '226, 232, 240' : '30, 41, 59'}, ${isDark ? '0.22' : '0.26'}) !important;
            border-radius: 999px !important;
          }
          html.agy-we-active ::-webkit-scrollbar-thumb:hover {
            background-color: rgba(${isDark ? '226, 232, 240' : '30, 41, 59'}, ${isDark ? '0.38' : '0.42'}) !important;
          }
        `);

        if (s.glassEnabled) {
          if (s.leftSidebarGlass) {
            rules.push(`
              html.agy-we-active [data-agy-we-region="left-sidebar"],
              html.agy-we-active [data-sidebar="left"] {
                ${sidebarGlassDecl}
                ${leftCornerCss}
              }
            `);
          } else {
            rules.push(`
              html.agy-we-active [data-agy-we-region="left-sidebar"] {
                background: transparent !important;
                background-image: none !important;
                border-color: transparent !important;
                box-shadow: none !important;
                ${leftCornerCss}
              }
            `);
          }

          if (s.rightSidebarGlass) {
            rules.push(`
              html.agy-we-active [data-agy-we-region="right-sidebar"],
              html.agy-we-active [data-sidebar="right"] {
                ${sidebarGlassDecl}
                ${rightCornerCss}
              }
            `);
          } else {
            rules.push(`
              html.agy-we-active [data-agy-we-region="right-sidebar"] {
                background: transparent !important;
                background-image: none !important;
                border-color: transparent !important;
                box-shadow: none !important;
                ${rightCornerCss}
              }
            `);
          }

          if (s.headerGlass) {
            rules.push(`
              html.agy-we-active [data-agy-we-region="header"],
              html.agy-we-active [role="banner"] {
                ${headerGlassDecl}
              }
            `);
          } else {
            rules.push(`
              html.agy-we-active [data-agy-we-region="header"] {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border-color: transparent !important;
                box-shadow: none !important;
              }
            `);
          }

          if (s.composerGlass) {
            rules.push(`
              html.agy-we-active [data-agy-we-region="composer"] {
                ${composerGlassDecl}
              }
              html.agy-we-active [data-agy-we-region="composer-nofilter"] {
                ${composerNoFilterDecl}
              }
              html.agy-we-active [data-agy-we-region="composer"]:focus-within,
              html.agy-we-active [data-agy-we-region="composer-nofilter"]:focus-within {
                border-color: rgba(${ar}, ${ag}, ${ab}, 0.58) !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,${rimTop}),
                  0 0 0 1px rgba(${ar}, ${ag}, ${ab}, 0.24),
                  0 12px 34px rgba(0,0,0,${isDark ? '0.26' : '0.10'}) !important;
              }
            `);
          }

          if (s.chatCardGlass) {
            rules.push(`
              /* Scrolling chat bubbles & code blocks: translucent wet-glass tint WITHOUT per-card backdrop-filter
                 so scrolling long chats over 60fps 4K WebWallGL wallpapers stays locked 60fps with zero GPU overload! */
              html.agy-we-active [data-agy-we-region="chat-bubble"] {
                background-color: rgba(${gr}, ${gg}, ${gb}, ${Math.min(0.86, bubbleAlpha + 0.10).toFixed(3)}) !important;
                background-image: ${sheenGrad} !important;
                border: 1px solid rgba(${borderRgb}, ${Math.min(0.34, Math.max(0.14, Number(borderAlpha) * 1.15)).toFixed(3)}) !important;
                outline: none !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,${rimTop}),
                  inset 0 -1px 0 rgba(255,255,255,${rimBot}),
                  inset 0 0 0 0.5px rgba(255,255,255,${rimHair}),
                  0 6px 20px rgba(0,0,0,${isDark ? '0.18' : '0.06'}) !important;
              }
              html.agy-we-active [data-agy-we-bubble-inner="clear"] {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                border-color: transparent !important;
                box-shadow: none !important;
              }
              html.agy-we-active [class*="message" i][class*="card" i],
              html.agy-we-active [class*="assistant" i][class*="bubble" i],
              html.agy-we-active [class*="user-message" i],
              html.agy-we-active pre:has(code),
              html.agy-we-active .prose table,
              html.agy-we-active .markdown table {
                background-color: rgba(${gr}, ${gg}, ${gb}, ${Math.min(0.86, cardAlpha + 0.10).toFixed(3)}) !important;
                background-image: ${sheenGrad} !important;
                border-color: rgba(${borderRgb}, ${Math.min(0.26, Number(borderAlpha)).toFixed(3)}) !important;
                box-shadow: inset 0 1px 0 rgba(255,255,255,${rimTop}), 0 4px 16px rgba(0,0,0,${isDark ? '0.16' : '0.05'}) !important;
              }
              html.agy-we-active pre:has(code) code {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
              }
            `);
          }

          if (s.modalGlass) {
            rules.push(`
              html.agy-we-active [data-agy-we-region="modal"]:not(#agy-we-drawer):not(#agy-we-modal),
              html.agy-we-active [role="dialog"]:not(#agy-we-drawer):not(#agy-we-modal):not([data-agy-we-region="settings-overlay"]):not([data-agy-we-overlay-backdrop="1"]),
              html.agy-we-active [role="menu"],
              html.agy-we-active [role="listbox"],
              html.agy-we-active [class*="popover" i],
              html.agy-we-active [class*="dropdown" i] {
                background-color: rgba(${gr}, ${gg}, ${gb}, ${modalAlpha.toFixed(3)}) !important;
                background-image: ${sheenGrad} !important;
                backdrop-filter: ${bdFilterModal} !important;
                -webkit-backdrop-filter: ${bdFilterModal} !important;
                border-color: rgba(${borderRgb}, ${Math.min(0.38, Number(borderAlpha) * 1.25).toFixed(3)}) !important;
                box-shadow:
                  inset 0 1px 0 rgba(255,255,255,${rimTop}),
                  0 18px 46px rgba(0,0,0,${isDark ? '0.38' : '0.16'}) !important;
              }
            `);
          }

          if (s.extraGlassSelectors && s.extraGlassSelectors.trim()) {
            const safeSelectors = s.extraGlassSelectors
              .split(/[\n,]/)
              .map((sel) => sel.trim())
              .filter((sel) => sel && !/[{}<>]/.test(sel))
              .map((sel) => `html.agy-we-active ${sel}`)
              .join(',\n');
            if (safeSelectors) {
              rules.push(`${safeSelectors} { ${composerGlassDecl} }`);
            }
          }
        }
      }

      if (s.caretColor) {
        rules.push(`input, textarea, [contenteditable="true"] { caret-color: ${s.caretColor} !important; }`);
      }
      if (s.textColorPrimary) {
        rules.push(`html.agy-we-active body { color: ${s.textColorPrimary}; }`);
      }
      if (s.fontCustom) {
        if (uiFont) {
          rules.push(`body, button, input, textarea, select { font-family: ${uiFont} !important; }`);
        }
        if (monoFont) {
          rules.push(`code, pre, kbd, samp, .monaco-editor { font-family: ${monoFont} !important; }`);
        }
        if (fontScale !== 1) {
          rules.push(`html { font-size: ${(fontScale * 100).toFixed(1)}% !important; }`);
        }
      }

      styleEl.textContent = rules.join('\n');
      if (active) scheduleScan(50);
      else clearDomMarks();
    }

    const unsub = store.subscribe((topic) => {
      if (topic === 'settings' || topic === 'inventory' || topic === 'fonts' || topic === 'all') {
        apply();
      }
    });

    const themeObs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.attributeName === 'data-agy-we-theme' || m.attributeName === 'style') continue;
        apply();
        return;
      }
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-scheme'] });

    const STRUCTURAL_TAGS = new Set(['DIV', 'MAIN', 'SECTION', 'FORM', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'TEXTAREA', 'DIALOG']);
    const domObs = new MutationObserver((mutations) => {
      if (scanning) return;
      let needFullScan = false;
      let removedWhileOverlay = false;
      const addedStructural = [];
      for (const m of mutations) {
        if (!m.target || isOwnElement(m.target)) continue;
        // Skip streaming text/code mutations inside existing bubbles/code blocks/composer (zero work during AI output!)
        if (m.target.closest && m.target.closest('[data-agy-we-region="chat-bubble"], pre, code, [data-agy-we-region="composer"], [data-agy-we-region="composer-nofilter"]')) {
          continue;
        }
        if (m.type === 'childList') {
          if (hasActiveOverlay && m.removedNodes.length) {
            for (const rn of m.removedNodes) {
              if (rn && rn.nodeType === 1 && !isOwnElement(rn)) {
                removedWhileOverlay = true;
                break;
              }
            }
          }
          if (m.addedNodes.length) {
            for (const n of m.addedNodes) {
              if (n && n.nodeType === 1 && !PRUNE_TAGS.has(n.tagName) && !isOwnElement(n)) {
                needFullScan = true;
                if (STRUCTURAL_TAGS.has(n.tagName) && addedStructural.length < 12) {
                  addedStructural.push(n);
                }
              }
            }
          }
        }
      }
      if (hasActiveOverlay && activeOverlayDialogEl && !activeOverlayDialogEl.isConnected) {
        closeActiveOverlayNow();
      }
      if (addedStructural.length) {
        fastPrePaintClean(addedStructural);
      } else if (removedWhileOverlay && hasActiveOverlay) {
        scanning = true;
        try {
          syncSettingsOverlayAndBlur(window.innerWidth || 1280, window.innerHeight || 720, false);
        } finally {
          scanning = false;
        }
      }
      // Do not schedule heavy full-DOM scans while Settings overlay is open or fading out
      if (needFullScan && !hasActiveOverlay) scheduleScan(320);
    });
    if (document.body) {
      // Strictly childList only on document.body (NO attributes observer on body -> zero React class-churn overhead!)
      domObs.observe(document.body, { childList: true, subtree: true });
    }

    let pendingPostClickReconcile = false;

    const onPointerOver = (e) => {
      const t = e.target;
      if (!t || !t.closest || isOwnElement(t)) return;
      const region = t.closest('[data-agy-we-region="left-sidebar"], [data-agy-we-region="right-sidebar"], [data-agy-we-region="settings-nav"]');
      if (!region) {
        lastHoveredRow = null;
        lastHoveredRowSig = 0;
        return;
      }
      const row = findEnclosingSidebarRow(t, region, region.offsetWidth || 220);
      if (!row) return;
      const sig = row.getElementsByTagName('*').length;
      if (row === lastHoveredRow && sig === lastHoveredRowSig) return;
      lastHoveredRow = row;
      lastHoveredRowSig = sig;
      cleanHoverRowSubtree(row, region);
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      hoverRaf = requestAnimationFrame(() => {
        hoverRaf = null;
        if (lastHoveredRow === row && row.isConnected) {
          cleanHoverRowSubtree(row, region);
          lastHoveredRowSig = row.getElementsByTagName('*').length;
        }
      });
      if (pendingPostClickReconcile) {
        pendingPostClickReconcile = false;
        scheduleSidebarReconcile(100);
      }
    };

    const onPointerOut = (e) => {
      const t = e.target;
      if (!t || !t.closest || isOwnElement(t)) return;
      const region = t.closest('[data-agy-we-region="left-sidebar"], [data-agy-we-region="right-sidebar"], [data-agy-we-region="settings-nav"]');
      if (!region) return;
      const rel = e.relatedTarget;
      if (!rel || !region.contains(rel)) {
        lastHoveredRow = null;
        lastHoveredRowSig = 0;
        pendingPostClickReconcile = false;
        scheduleSidebarReconcile(100);
      }
    };

    const quickCheckOverlayClose = () => {
      if (scanning || !hasActiveOverlay) return;
      scanning = true;
      try { syncSettingsOverlayAndBlur(window.innerWidth || 1280, window.innerHeight || 720, false); } finally { scanning = false; }
    };

    const onEscapeOverlayCheck = (e) => {
      if (e.key === 'Escape' && hasActiveOverlay) {
        requestAnimationFrame(quickCheckOverlayClose);
        setTimeout(quickCheckOverlayClose, 45);
      }
    };

    const onSidebarClick = (e) => {
      const t = e.target;
      if (!t || !t.closest || isOwnElement(t)) return;
      if (hasActiveOverlay) {
        const clickedInsideDialog = Boolean(activeOverlayDialogEl && activeOverlayDialogEl.contains(t));
        const clickedCloseBtn = Boolean(
          clickedInsideDialog &&
          t.closest('button[aria-label*="close" i], button[aria-label*="关闭"], [data-slot="dialog-close"]')
        );
        if (!clickedInsideDialog || clickedCloseBtn) {
          requestAnimationFrame(quickCheckOverlayClose);
          setTimeout(quickCheckOverlayClose, 60);
        }
      }
      const region = t.closest('[data-agy-we-region="left-sidebar"], [data-agy-we-region="right-sidebar"], [data-agy-we-region="settings-nav"]');
      if (!region) return;
      const isSettingsNav = region.getAttribute('data-agy-we-region') === 'settings-nav';
      pendingPostClickReconcile = true;
      scheduleSidebarReconcile(isSettingsNav ? 90 : 60, isSettingsNav);
    };

    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointerout', onPointerOut, true);
    document.addEventListener('click', onSidebarClick, true);
    window.addEventListener('keydown', onEscapeOverlayCheck, true);

    const onResize = () => scheduleScan(180);
    window.addEventListener('resize', onResize);

    // Two-shot post-boot settling passes only (no endless periodic rescan that could jitter compositor)
    const settle1 = setTimeout(() => {
      const s = store.getSettings();
      if (s.enabled && store.getActiveWallpaper()) scanAndTagDom();
    }, 650);
    const settle2 = setTimeout(() => {
      const s = store.getSettings();
      if (s.enabled && store.getActiveWallpaper()) scanAndTagDom();
    }, 2000);

    return {
      apply,
      rescanDom: scanAndTagDom,
      destroy() {
        unsub();
        themeObs.disconnect();
        domObs.disconnect();
        detachOverlayAttrObs();
        document.removeEventListener('pointerover', onPointerOver, true);
        document.removeEventListener('pointerout', onPointerOut, true);
        document.removeEventListener('click', onSidebarClick, true);
        window.removeEventListener('keydown', onEscapeOverlayCheck, true);
        window.removeEventListener('resize', onResize);
        if (scanTimer) clearTimeout(scanTimer);
        if (sidebarReconcileTimer) clearTimeout(sidebarReconcileTimer);
        if (hoverRaf) cancelAnimationFrame(hoverRaf);
        if (overlayNavTimer) clearTimeout(overlayNavTimer);
        clearTimeout(settle1);
        clearTimeout(settle2);
        clearDomMarks();
        try { if (focusVeil) focusVeil.remove(); } catch {}
        try { styleEl.remove(); } catch {}
      },
    };
  }

  NS.createGlassEngine = createGlassEngine;
})();
