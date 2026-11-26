/**
 * Settings schema, defaults, sanitization, and atomic persistence
 * stored in ~/.antigravity-wallpaper-engine/config.json (zero token overhead to Agent).
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export function getDataDir() {
  const override = process.env.AGY_WE_DATA_DIR && process.env.AGY_WE_DATA_DIR.trim();
  return override || join(homedir(), '.antigravity-wallpaper-engine');
}

export function getConfigPath() {
  return join(getDataDir(), 'config.json');
}

export function getCacheDir() {
  return join(getDataDir(), 'cache');
}

export function getUploadsDir() {
  return join(getDataDir(), 'uploads');
}

export function getPresetsDir() {
  return join(getDataDir(), 'presets');
}

export const DEFAULT_SETTINGS = Object.freeze({
  // Master toggles
  enabled: true,
  wallpaperId: '',
  paused: false,

  // Playback & Display (aligned to DeepSeek Harness reference screenshots)
  objectFit: 'cover',            // cover | contain | stretch
  flip: false,
  layerScale: 100,               // 100..200 (%)
  layerPositionX: 50,            // 0..100 (%)
  layerPositionY: 50,            // 0..100 (%)
  wallpaperBlur: 0,              // 0..40 (px)
  wallpaperOpacity: 100,         // 10..100 (%)
  backgroundBrightness: 85,      // 30..160 (%)
  backgroundContrast: 110,       // 50..160 (%)
  backgroundSaturate: 150,       // 0..220 (%)
  wallpaperFilter: 'none',       // none | blur | grayscale | sepia | vivid | warm | cool | invert | brighten | darken | contrast
  playbackRate: 1,               // 0.25..2
  videoVolume: 0,                // 0..100
  videoAudioEnabled: false,
  switchTransition: 'cut',       // cut | fade | slide | zoom
  switchTransitionSpeed: 'normal', // fast | normal | slow

  // Scene / Web Live Rendering
  sceneLive: true,
  sceneLiveFps: 60,              // 15 | 30 | 60
  sceneAutoQuality: false,
  scenePointerInteract: true,

  // Power Saving / Occlusion
  pauseOnHidden: true,
  pauseOnBlur: false,
  pauseOnBattery: false,
  startPaused: false,

  // Rotation / Slideshow
  rotationEnabled: false,
  rotationIntervalSec: 300,      // 15..7200
  rotationSource: 'all',         // all | favorites | playlist:<name>
  pictureSlideSeconds: 30,       // 5..3600

  // Liquid Glass Appearance (aligned to DeepSeek Harness reference screenshots)
  glassEnabled: true,
  activePreset: 'agy-crystal',
  accent: '#75e6f5',
  scrim: 0.5,                    // 0..0.85 (50%)
  blur: 9,                       // 0..48 (px)
  glassAlpha: 40,                // 0..100 (%)
  glassFidelity: 20,             // 0..100 (%)
  border: 0.35,                  // 0..1 (35%)
  glassColorLight: '#ffffff',
  glassColorDark: '#0a1622',
  leftSidebarGlass: true,
  rightSidebarGlass: true,
  headerGlass: false,
  composerGlass: true,
  chatCardGlass: true,
  modalGlass: true,
  leftSidebarRadius: 20,         // 0 | 6 | 12 | 20
  leftSidebarCorners: [0, 1, 1, 0], // [tl, tr, br, bl]
  rightSidebarRadius: 20,        // 0 | 6 | 12 | 20
  rightSidebarCorners: [1, 0, 0, 1],
  textColorPrimary: '#f9fafb',
  textColorMuted: '#75e6f5',
  extraGlassSelectors: '',
  themeFollow: false,

  // Trigger / Rope Mascot UI
  ropeShown: true,
  ropeStyle: 'mascot',           // mascot | pill | orb | minimal
  mascotForm: 'whale',           // gemini | whale | deepseek | claude | qwen | kimi | gpt | grok | glm | phoebe | custom
  mascotScale: 115,              // 50..180 (%)
  mascotCustomTs: 0,
  ropeX: -1,                     // -1 = auto top-docked right edge
  ropeY: 0,

  // Extensions: Click & Trail FX
  fxEnabled: false,
  fxClick: true,
  fxClickStyle: 'ripple',        // ripple | spark | both
  fxClickSize: 140,              // 40..400
  fxClickGlow: 60,               // 0..100
  fxTrail: true,
  fxTrailStyle: 'comet',         // comet | dust
  fxTrailLength: 420,            // 80..2000
  fxTrailWidth: 3,               // 1..12
  fxTrailGlow: 60,               // 0..100
  fxOpacity: 85,                 // 10..100
  fxBlend: 'screen',             // screen | lighter | normal | overlay
  fxColorMode: 'accent',         // accent | rainbow | custom
  fxColor: '#4f8cff',

  // Extensions: 3D Parallax
  parallaxEnabled: false,
  parallaxBg: 1.8,               // 0..10 (%)
  parallaxRope: true,
  parallaxUi: false,
  parallaxUiSidebarDepth: 1.2,   // 0..6
  parallaxUiComposerDepth: 1.6,  // 0..6
  parallaxUiChatDepth: 0.8,      // 0..6
  parallaxSmooth: 85,            // 0..96

  // Extensions: Typography / Custom Fonts
  fontCustom: true,
  uiFontFamily: '',              // '' | builtin:<id> | sys:<family>
  monoFontFamily: '',            // '' | builtin:<id> | sys:<family>
  uiFontScale: 100,              // 85..125 (%)
  caretColor: '',                // '' or #rrggbb

  // Extensions: Performance Monitor
  perfEnabled: false,
  perfFloat: false,
  perfFloatX: -1,
  perfFloatY: -1,

  // Library Filters & User Lists
  typeFilter: ['scene', 'web', 'video', 'image'],
  contentRatingFilter: ['everyone', 'pg13', 'mature', 'unrated'],
  orientationFilter: 'all',      // all | landscape | portrait
  hiddenIds: [],
  favoriteIds: [],
  userProps: {},                 // { [token]: { [propName]: value } }

  // Custom Steam / WE directories (optional manual override)
  customSteamRoot: '',
  customWallpaperDirs: [],
});

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function cleanColor(v, fallback) {
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  if (s === '' && fallback === '') return '';
  return /^#[0-9a-f]{6}$/i.test(s) ? s : fallback;
}

function cleanEnum(v, allowed, fallback) {
  return typeof v === 'string' && allowed.includes(v) ? v : fallback;
}

function cleanStringArray(v, maxLen = 5000) {
  if (!Array.isArray(v)) return [];
  const out = [];
  const seen = new Set();
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const s = item.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= maxLen) break;
  }
  return out;
}

export function sanitizeSettings(raw, base = DEFAULT_SETTINGS) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const d = { ...DEFAULT_SETTINGS, ...(base || {}) };
  const out = { ...d };

  const boolKeys = [
    'enabled', 'paused', 'flip', 'videoAudioEnabled', 'sceneLive', 'sceneAutoQuality',
    'scenePointerInteract', 'pauseOnHidden', 'pauseOnBlur', 'pauseOnBattery', 'startPaused',
    'rotationEnabled', 'glassEnabled', 'leftSidebarGlass', 'rightSidebarGlass', 'headerGlass',
    'composerGlass', 'chatCardGlass', 'modalGlass', 'themeFollow', 'ropeShown',
    'fxEnabled', 'fxClick', 'fxTrail', 'parallaxEnabled', 'parallaxRope', 'parallaxUi',
    'fontCustom', 'perfEnabled', 'perfFloat',
  ];
  for (const k of boolKeys) {
    if (typeof src[k] === 'boolean') out[k] = src[k];
  }

  if (typeof src.wallpaperId === 'string') out.wallpaperId = src.wallpaperId.slice(0, 512);
  if (typeof src.activePreset === 'string') out.activePreset = src.activePreset.slice(0, 128);
  if (typeof src.extraGlassSelectors === 'string') out.extraGlassSelectors = src.extraGlassSelectors.slice(0, 2000);
  if (typeof src.rotationSource === 'string') out.rotationSource = src.rotationSource.slice(0, 256);
  if (typeof src.uiFontFamily === 'string') out.uiFontFamily = src.uiFontFamily.slice(0, 200);
  if (typeof src.monoFontFamily === 'string') out.monoFontFamily = src.monoFontFamily.slice(0, 200);
  if (typeof src.customSteamRoot === 'string') out.customSteamRoot = src.customSteamRoot.trim().slice(0, 1024);

  if ('objectFit' in src) out.objectFit = cleanEnum(src.objectFit, ['cover', 'contain', 'stretch'], d.objectFit);
  if ('wallpaperFilter' in src) {
    out.wallpaperFilter = cleanEnum(src.wallpaperFilter, [
      'none', 'blur', 'grayscale', 'sepia', 'vivid', 'warm', 'cool', 'invert', 'brighten', 'darken', 'contrast',
    ], d.wallpaperFilter);
  }
  if ('switchTransition' in src) out.switchTransition = cleanEnum(src.switchTransition, ['cut', 'fade', 'slide', 'zoom'], d.switchTransition);
  if ('switchTransitionSpeed' in src) out.switchTransitionSpeed = cleanEnum(src.switchTransitionSpeed, ['fast', 'normal', 'slow'], d.switchTransitionSpeed);
  if ('ropeStyle' in src) out.ropeStyle = cleanEnum(src.ropeStyle, ['mascot', 'pill', 'orb', 'minimal'], d.ropeStyle);
  if ('mascotForm' in src) {
    out.mascotForm = cleanEnum(src.mascotForm, [
      'gemini', 'whale', 'deepseek', 'claude', 'qwen', 'kimi', 'gpt', 'grok', 'glm', 'phoebe', 'custom',
    ], d.mascotForm);
  }
  if ('fxClickStyle' in src) out.fxClickStyle = cleanEnum(src.fxClickStyle, ['ripple', 'spark', 'both'], d.fxClickStyle);
  if ('fxTrailStyle' in src) out.fxTrailStyle = cleanEnum(src.fxTrailStyle, ['comet', 'dust'], d.fxTrailStyle);
  if ('fxBlend' in src) out.fxBlend = cleanEnum(src.fxBlend, ['screen', 'lighter', 'normal', 'overlay'], d.fxBlend);
  if ('fxColorMode' in src) out.fxColorMode = cleanEnum(src.fxColorMode, ['accent', 'rainbow', 'custom'], d.fxColorMode);
  if ('orientationFilter' in src) out.orientationFilter = cleanEnum(src.orientationFilter, ['all', 'landscape', 'portrait'], d.orientationFilter);

  const numSpecs = {
    layerScale: [100, 200],
    layerPositionX: [0, 100],
    layerPositionY: [0, 100],
    wallpaperBlur: [0, 40],
    wallpaperOpacity: [10, 100],
    backgroundBrightness: [30, 160],
    backgroundContrast: [50, 160],
    backgroundSaturate: [0, 220],
    playbackRate: [0.25, 2],
    videoVolume: [0, 100],
    sceneLiveFps: [10, 120],
    rotationIntervalSec: [10, 7200],
    pictureSlideSeconds: [3, 3600],
    scrim: [0, 0.85],
    blur: [0, 48],
    glassAlpha: [0, 100],
    glassFidelity: [0, 100],
    border: [0, 1],
    leftSidebarRadius: [0, 32],
    rightSidebarRadius: [0, 32],
    mascotScale: [50, 180],
    mascotCustomTs: [0, 9999999999999],
    ropeX: [-1, 10000],
    ropeY: [-1, 10000],
    fxClickSize: [40, 400],
    fxClickGlow: [0, 100],
    fxTrailLength: [80, 2000],
    fxTrailWidth: [1, 12],
    fxTrailGlow: [0, 100],
    fxOpacity: [10, 100],
    parallaxBg: [0, 10],
    parallaxUiSidebarDepth: [0, 6],
    parallaxUiComposerDepth: [0, 6],
    parallaxUiChatDepth: [0, 6],
    parallaxSmooth: [0, 96],
    uiFontScale: [85, 125],
    perfFloatX: [-1, 10000],
    perfFloatY: [-1, 10000],
  };
  for (const [k, [mn, mx]] of Object.entries(numSpecs)) {
    if (k in src) out[k] = clampNum(src[k], mn, mx, d[k]);
  }

  if ('accent' in src) out.accent = cleanColor(src.accent, d.accent);
  if ('glassColorLight' in src) out.glassColorLight = cleanColor(src.glassColorLight, d.glassColorLight);
  if ('glassColorDark' in src) out.glassColorDark = cleanColor(src.glassColorDark, d.glassColorDark);
  if ('fxColor' in src) out.fxColor = cleanColor(src.fxColor, d.fxColor);
  if ('caretColor' in src) out.caretColor = cleanColor(src.caretColor, '');
  if ('textColorPrimary' in src) out.textColorPrimary = cleanColor(src.textColorPrimary, '');
  if ('textColorMuted' in src) out.textColorMuted = cleanColor(src.textColorMuted, '');
  if (Array.isArray(src.leftSidebarCorners) && src.leftSidebarCorners.length === 4) {
    out.leftSidebarCorners = src.leftSidebarCorners.map((x) => (x ? 1 : 0));
  }
  if (Array.isArray(src.rightSidebarCorners) && src.rightSidebarCorners.length === 4) {
    out.rightSidebarCorners = src.rightSidebarCorners.map((x) => (x ? 1 : 0));
  }

  if (Array.isArray(src.typeFilter)) {
    const valid = src.typeFilter.filter((x) => ['scene', 'web', 'video', 'image'].includes(x));
    out.typeFilter = valid.length ? [...new Set(valid)] : [...DEFAULT_SETTINGS.typeFilter];
  }
  if (Array.isArray(src.contentRatingFilter)) {
    const valid = src.contentRatingFilter.filter((x) => ['everyone', 'pg13', 'mature', 'unrated'].includes(x));
    out.contentRatingFilter = valid.length ? [...new Set(valid)] : [...DEFAULT_SETTINGS.contentRatingFilter];
  }
  if (Array.isArray(src.hiddenIds)) out.hiddenIds = cleanStringArray(src.hiddenIds);
  if (Array.isArray(src.favoriteIds)) out.favoriteIds = cleanStringArray(src.favoriteIds);
  if (Array.isArray(src.customWallpaperDirs)) out.customWallpaperDirs = cleanStringArray(src.customWallpaperDirs, 50);

  if (src.userProps && typeof src.userProps === 'object' && !Array.isArray(src.userProps)) {
    const cleaned = {};
    for (const [tok, map] of Object.entries(src.userProps)) {
      if (map && typeof map === 'object' && !Array.isArray(map)) {
        cleaned[String(tok).slice(0, 512)] = { ...map };
      }
    }
    out.userProps = cleaned;
  }

  return out;
}

let writeQueue = Promise.resolve();

export function readConfig() {
  const file = getConfigPath();
  try {
    if (!existsSync(file)) return { settings: { ...DEFAULT_SETTINGS }, uploads: [] };
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return { settings: { ...DEFAULT_SETTINGS }, uploads: [] };
    return {
      ...parsed,
      settings: sanitizeSettings(parsed.settings || {}),
      uploads: Array.isArray(parsed.uploads) ? parsed.uploads : [],
    };
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, uploads: [] };
  }
}

export function readSettings() {
  return readConfig().settings;
}

export function atomicWriteJsonSync(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  try {
    renameSync(tmp, filePath);
  } catch {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}

export function updateConfig(mutator) {
  const job = writeQueue.then(() => {
    const cfg = readConfig();
    const next = mutator(cfg) || cfg;
    next.settings = sanitizeSettings(next.settings || {});
    atomicWriteJsonSync(getConfigPath(), next);
    return next;
  });
  writeQueue = job.catch(() => {});
  return job;
}

export function mergeSettings(patch) {
  return updateConfig((cfg) => {
    cfg.settings = sanitizeSettings(patch, cfg.settings);
    return cfg;
  }).then((cfg) => cfg.settings);
}
