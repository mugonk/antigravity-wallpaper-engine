/**
 * Liquid Glass Presets store:
 * Loads built-in Antigravity presets + upstream dsh-wallpaper-engine factory presets
 * + user-created presets in ~/.antigravity-wallpaper-engine/presets/*.json.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWriteJsonSync, getPresetsDir, sanitizeSettings } from './settings.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPSTREAM_PRESETS_DIR = join(__dirname, 'upstream', 'presets');

const BUILTIN_AGY_PRESETS = [
  {
    id: 'agy-crystal',
    name: 'DeepSeek 冰透晶玻 (推荐)',
    builtin: true,
    values: {
      glassEnabled: true,
      themeFollow: false,
      accent: '#75e6f5',
      caretColor: '',
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
      wallpaperBlur: 0,
      wallpaperOpacity: 100,
      sceneAutoQuality: false,
      sceneLiveFps: 60,
      leftSidebarRadius: 20,
      leftSidebarCorners: [0, 1, 1, 0],
      rightSidebarRadius: 20,
      rightSidebarCorners: [1, 0, 0, 1],
      textColorPrimary: '#f9fafb',
      textColorMuted: '#75e6f5',
      fontCustom: true,
      backgroundBrightness: 85,
      backgroundContrast: 110,
      backgroundSaturate: 150,
      layerPositionX: 50,
      layerPositionY: 50,
      layerScale: 100,
      playbackRate: 1,
      objectFit: 'cover',
      flip: false,
      switchTransition: 'cut',
      videoVolume: 0,
      videoAudioEnabled: false,
    },
  },
  {
    id: 'agy-hd-raw',
    name: '高清原画 (零模糊)',
    builtin: true,
    values: {
      glassEnabled: true,
      accent: '#7dd3fc',
      scrim: 0.04,
      blur: 0,
      glassAlpha: 82,
      glassFidelity: 25,
      border: 0.30,
      glassColorLight: '#ffffff',
      glassColorDark: '#0a1622',
      leftSidebarGlass: false,
      rightSidebarGlass: false,
      headerGlass: false,
      composerGlass: true,
      chatCardGlass: true,
      modalGlass: true,
      wallpaperBlur: 0,
      sceneAutoQuality: false,
      backgroundBrightness: 103,
      backgroundContrast: 104,
      backgroundSaturate: 110,
    },
  },
  {
    id: 'agy-minimal-clear',
    name: '极简轻霜',
    builtin: true,
    values: {
      glassEnabled: true,
      accent: '#38bdf8',
      scrim: 0.06,
      blur: 6,
      glassAlpha: 72,
      glassFidelity: 28,
      border: 0.28,
      glassColorLight: '#ffffff',
      glassColorDark: '#09121e',
      leftSidebarGlass: true,
      rightSidebarGlass: true,
      headerGlass: false,
      composerGlass: true,
      chatCardGlass: true,
      modalGlass: true,
      wallpaperBlur: 0,
      sceneAutoQuality: false,
      backgroundBrightness: 104,
      backgroundContrast: 103,
      backgroundSaturate: 112,
    },
  },
  {
    id: 'agy-obsidian-frost',
    name: '深空冷霜 (高可读)',
    builtin: true,
    values: {
      glassEnabled: true,
      accent: '#818cf8',
      scrim: 0.20,
      blur: 14,
      glassAlpha: 42,
      glassFidelity: 65,
      border: 0.42,
      glassColorLight: '#f8fafc',
      glassColorDark: '#0b1120',
      leftSidebarGlass: true,
      rightSidebarGlass: true,
      headerGlass: true,
      composerGlass: true,
      chatCardGlass: true,
      modalGlass: true,
      wallpaperBlur: 0,
      sceneAutoQuality: false,
      backgroundBrightness: 96,
      backgroundContrast: 104,
      backgroundSaturate: 106,
    },
  },
];

function mapUpstreamPreset(raw) {
  if (!raw || typeof raw !== 'object' || !raw.id || !raw.values) return null;
  const v = raw.values;
  const mapped = {
    glassEnabled: true,
    accent: v.accent || '#4f8cff',
    scrim: typeof v.scrim === 'number' ? v.scrim : 0.30,
    blur: typeof v.blur === 'number' ? v.blur : 20,
    glassAlpha: typeof v.glassAlpha === 'number' ? v.glassAlpha : 55,
    glassFidelity: typeof v.glassFidelity === 'number' ? v.glassFidelity : 80,
    border: typeof v.border === 'number' ? v.border : 0.40,
    glassColorLight: (v.glassColor && v.glassColor.light) || '#ffffff',
    glassColorDark: (v.glassColor && v.glassColor.dark) || '#0f172a',
    leftSidebarGlass: typeof v.leftSidebarGlass === 'boolean' ? v.leftSidebarGlass : true,
    rightSidebarGlass: typeof v.sidebarGlass === 'boolean' ? v.sidebarGlass : true,
    headerGlass: typeof v.titlebarGlass === 'boolean' ? v.titlebarGlass : false,
    composerGlass: true,
    chatCardGlass: true,
    modalGlass: true,
    backgroundBrightness: typeof v.backgroundBrightness === 'number' ? v.backgroundBrightness : 100,
    backgroundContrast: typeof v.backgroundContrast === 'number' ? v.backgroundContrast : 100,
    backgroundSaturate: typeof v.backgroundSaturate === 'number' ? v.backgroundSaturate : 100,
    wallpaperBlur: typeof v.wallpaperBlur === 'number' ? v.wallpaperBlur : 0,
    fxEnabled: typeof v.fxEnabled === 'boolean' ? v.fxEnabled : false,
    fxClick: typeof v.fxClick === 'boolean' ? v.fxClick : true,
    fxClickStyle: v.fxClickStyle || 'ripple',
    fxTrail: typeof v.fxTrail === 'boolean' ? v.fxTrail : true,
    fxTrailStyle: v.fxTrailStyle || 'comet',
    fxColorMode: v.fxColorMode || 'accent',
    fxColor: v.fxColor || '#4f8cff',
    parallaxEnabled: typeof v.parallaxEnabled === 'boolean' ? v.parallaxEnabled : false,
    parallaxBg: typeof v.parallaxBg === 'number' ? v.parallaxBg : 1.5,
  };
  return {
    id: String(raw.id),
    name: String(raw.name || raw.id),
    builtin: true,
    upstream: true,
    values: mapped,
  };
}

export function listPresets() {
  const byId = new Map();
  for (const p of BUILTIN_AGY_PRESETS) byId.set(p.id, p);

  if (existsSync(UPSTREAM_PRESETS_DIR)) {
    for (const file of readdirSync(UPSTREAM_PRESETS_DIR)) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = JSON.parse(readFileSync(join(UPSTREAM_PRESETS_DIR, file), 'utf8'));
        const mapped = mapUpstreamPreset(raw);
        if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
      } catch { /* skip corrupt */ }
    }
  }

  const userDir = getPresetsDir();
  if (existsSync(userDir)) {
    for (const file of readdirSync(userDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = JSON.parse(readFileSync(join(userDir, file), 'utf8'));
        if (raw && raw.id && raw.values && typeof raw.values === 'object') {
          byId.set(String(raw.id), {
            id: String(raw.id),
            name: String(raw.name || raw.id),
            builtin: false,
            values: raw.values,
          });
        }
      } catch { /* skip */ }
    }
  }

  return Array.from(byId.values());
}

export function saveUserPreset(payload) {
  const name = String((payload && payload.name) || '').trim().slice(0, 64) || '自定义预设';
  const rawId = String((payload && payload.id) || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = rawId || `user-${Date.now().toString(36)}`;
  const rawValues = payload && payload.values && typeof payload.values === 'object' ? payload.values : {};
  // Keep only sanitized appearance/extension keys
  const sanitized = sanitizeSettings(rawValues);
  const preset = {
    $schema: 'agy-we/preset@1',
    id,
    name,
    updatedAt: new Date().toISOString(),
    values: sanitized,
  };
  const dir = getPresetsDir();
  mkdirSync(dir, { recursive: true });
  atomicWriteJsonSync(join(dir, `${id}.json`), preset);
  return { ...preset, builtin: false };
}

export function deleteUserPreset(id) {
  const clean = String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!clean) return false;
  const target = join(getPresetsDir(), `${clean}.json`);
  if (!existsSync(target)) return false;
  unlinkSync(target);
  return true;
}
