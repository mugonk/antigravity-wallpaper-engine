/**
 * Cross-platform OS font enumeration with disk caching (adapted from dsh-wallpaper-engine).
 * Supports Windows (PowerShell InstalledFontCollection -> Registry -> C:\Windows\Fonts),
 * macOS (CoreText / system_profiler), and Linux (fc-list / font dirs).
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { atomicWriteJsonSync, getCacheDir } from './settings.mjs';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_VER = 1;
const FONT_FILE_RE = /\.(ttf|otf|ttc|dfont)$/i;
const SAFE_FONT_RE = /^[^"'\\;{}()<>`$\r\n\t]+$/;

export const BUILTIN_FONTS = [
  { id: '', label: '默认（保持 Antigravity 原生）', stack: '' },
  { id: 'builtin:system-ui', label: '系统无衬线 (System UI)', stack: 'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei UI", "PingFang SC", sans-serif' },
  { id: 'builtin:yahei', label: '微软雅黑 (Microsoft YaHei)', stack: '"Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", sans-serif' },
  { id: 'builtin:pingfang', label: '苹方 / 思源黑体', stack: '"PingFang SC", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei UI", sans-serif' },
  { id: 'builtin:serif', label: '人文衬线 / 宋体', stack: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", "SimSun", Georgia, serif' },
  { id: 'builtin:kaiti', label: '楷体优雅风', stack: '"LXGW WenKai", "Kaiti SC", "KaiTi", "STKaiti", serif' },
  { id: 'builtin:rounded', label: '圆润现代 (Rounded)', stack: '"HarmonyOS Sans SC", "MiSans", "PingFang SC", "Microsoft YaHei UI", sans-serif' },
];

export const BUILTIN_MONO_FONTS = [
  { id: '', label: '默认（保持原生等宽）', stack: '' },
  { id: 'builtin:jetbrains', label: 'JetBrains Mono / Cascadia', stack: '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace' },
  { id: 'builtin:cascadia', label: 'Cascadia Code / Consolas', stack: '"Cascadia Code", "Cascadia Mono", Consolas, "Courier New", monospace' },
  { id: 'builtin:fira', label: 'Fira Code', stack: '"Fira Code", "JetBrains Mono", Consolas, monospace' },
  { id: 'builtin:maple', label: 'Maple Mono / Sarasa Gothic', stack: '"Maple Mono NF CN", "Sarasa Mono SC", "JetBrains Mono", Consolas, monospace' },
];

function runCmd(cmd, args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let done = false;
    const chunks = [];
    let bytes = 0;
    const finish = (ok, out = '') => {
      if (done) return;
      done = true;
      resolve({ ok, out });
    };
    let child;
    try {
      child = spawn(cmd, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      finish(false);
      return;
    }
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      finish(false);
    }, timeoutMs);
    child.stdout.on('data', (c) => {
      bytes += c.length;
      if (bytes <= 8 * 1024 * 1024) chunks.push(c);
    });
    child.on('error', () => { clearTimeout(timer); finish(false); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) { finish(false); return; }
      finish(true, Buffer.concat(chunks).toString('utf8'));
    });
  });
}

function normalizeFamilies(names) {
  const seen = new Set();
  const out = [];
  for (const raw of names || []) {
    const s = String(raw || '').trim();
    if (!s || s.startsWith('.') || s.startsWith('@') || s.length > 80) continue;
    if (!SAFE_FONT_RE.test(s)) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= 1500) break;
  }
  out.sort((a, b) => a.localeCompare(b, 'zh-CN'));
  return out;
}

function scanFontDirsFallback() {
  const dirs = process.platform === 'win32'
    ? [join(process.env.SystemRoot || 'C:\\Windows', 'Fonts'), process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Microsoft', 'Windows', 'Fonts') : '']
    : ['/usr/share/fonts', '/System/Library/Fonts', join(homedir(), '.fonts')];
  const names = [];
  for (const d of dirs.filter(Boolean)) {
    if (!existsSync(d)) continue;
    try {
      for (const f of readdirSync(d)) {
        if (!FONT_FILE_RE.test(f)) continue;
        names.push(f.replace(FONT_FILE_RE, '').replace(/[-_]+/g, ' ').trim());
      }
    } catch {}
  }
  return normalizeFamilies(names);
}

let inflight = null;
let memCache = null;

export async function getSystemFonts(forceRefresh = false) {
  const cachePath = join(getCacheDir(), 'system-fonts.json');
  if (!forceRefresh && memCache && Date.now() - memCache.t < CACHE_TTL_MS) {
    return memCache;
  }
  if (!forceRefresh && !memCache && existsSync(cachePath)) {
    try {
      const disk = JSON.parse(readFileSync(cachePath, 'utf8'));
      if (disk && disk.v === CACHE_VER && Array.isArray(disk.families) && Date.now() - Number(disk.t || 0) < CACHE_TTL_MS) {
        memCache = disk;
        return disk;
      }
    } catch {}
  }
  if (inflight) return inflight;

  inflight = (async () => {
    let families = [];
    let source = 'none';
    let approximate = false;

    if (process.platform === 'win32') {
      const ps = await runCmd('powershell.exe', [
        '-NoProfile', '-NonInteractive', '-Command',
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }',
      ]);
      if (ps.ok && ps.out.trim()) {
        families = normalizeFamilies(ps.out.split(/\r?\n/));
        source = 'powershell-fonts';
      } else {
        const reg = await runCmd('reg.exe', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts']);
        if (reg.ok && reg.out.trim()) {
          const parsed = [];
          for (const line of reg.out.split(/\r?\n/)) {
            const m = /^\s*(.*?)\s+REG_\w+\s+/.exec(line);
            if (m) parsed.push(m[1].replace(/\s*\((?:TrueType|OpenType|Type 1|All res)\)\s*$/i, ''));
          }
          families = normalizeFamilies(parsed);
          source = 'registry';
          approximate = true;
        }
      }
    } else if (process.platform === 'linux') {
      const fc = await runCmd('fc-list', ['--format=%{family}\n']);
      if (fc.ok && fc.out.trim()) {
        const parsed = [];
        for (const l of fc.out.split(/\r?\n/)) for (const p of l.split(',')) parsed.push(p);
        families = normalizeFamilies(parsed);
        source = 'fc-list';
      }
    }

    if (!families.length) {
      families = scanFontDirsFallback();
      source = 'font-dirs';
      approximate = true;
    }

    const result = { v: CACHE_VER, t: Date.now(), ok: true, source, approximate, families, builtin: BUILTIN_FONTS, builtinMono: BUILTIN_MONO_FONTS };
    memCache = result;
    try { atomicWriteJsonSync(cachePath, result); } catch {}
    return result;
  })().finally(() => { inflight = null; });

  return inflight;
}
