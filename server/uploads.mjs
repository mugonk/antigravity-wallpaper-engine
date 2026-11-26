/**
 * Custom local wallpaper uploads & URL imports manager.
 * Stores uploaded files in ~/.antigravity-wallpaper-engine/uploads/ and metadata in config.json.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { getUploadsDir, readConfig, updateConfig } from './settings.mjs';

export const UPLOAD_MAX_BYTES = 150 * 1024 * 1024; // 150 MiB
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.mkv']);

export function detectUploadType(filename) {
  const ext = extname(filename || '').toLowerCase();
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (VIDEO_EXTS.has(ext)) return 'video';
  return null;
}

export async function saveUploadedBuffer({ filename, title, buffer }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('上传内容为空');
  }
  if (buffer.length > UPLOAD_MAX_BYTES) {
    throw new Error(`文件超出上限（最大 ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)} MB）`);
  }
  const safeBase = basename(String(filename || 'wallpaper.png')).replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, '_');
  const type = detectUploadType(safeBase);
  if (!type) {
    throw new Error('不支持的文件格式，请上传 JPG/PNG/WebP/GIF/AVIF 图片或 MP4/WebM/MOV 视频');
  }
  const ext = extname(safeBase).toLowerCase();
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const id = `upload_${Date.now().toString(36)}_${hash}`;
  const storedName = `${id}${ext}`;
  const dir = getUploadsDir();
  mkdirSync(dir, { recursive: true });
  const fileAbs = join(dir, storedName);
  writeFileSync(fileAbs, buffer);

  const entry = {
    id,
    title: String(title || safeBase.replace(ext, '')).trim().slice(0, 120) || id,
    type,
    fileName: storedName,
    fileAbs,
    size: buffer.length,
    source: 'upload',
    createdAt: new Date().toISOString(),
  };

  await updateConfig((cfg) => {
    cfg.uploads = Array.isArray(cfg.uploads) ? cfg.uploads : [];
    cfg.uploads.unshift(entry);
    return cfg;
  });

  return entry;
}

export async function saveUrlWallpaper({ url, title, type }) {
  const trimmed = String(url || '').trim();
  let parsed;
  try { parsed = new URL(trimmed); } catch { throw new Error('无效的壁纸 URL'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('仅支持 http:// 或 https:// 链接');
  }
  const guessedType = type === 'video' || type === 'web' || type === 'image'
    ? type
    : (/\.(mp4|webm|mov)(\?|$)/i.test(parsed.pathname) ? 'video' : 'image');
  const id = `url_${Date.now().toString(36)}_${createHash('sha1').update(trimmed).digest('hex').slice(0, 8)}`;
  const entry = {
    id,
    title: String(title || parsed.pathname.split('/').pop() || parsed.hostname).trim().slice(0, 120) || '网络壁纸',
    type: guessedType,
    urlSource: trimmed,
    source: 'url',
    createdAt: new Date().toISOString(),
  };
  await updateConfig((cfg) => {
    cfg.uploads = Array.isArray(cfg.uploads) ? cfg.uploads : [];
    cfg.uploads.unshift(entry);
    return cfg;
  });
  return entry;
}

export function listUploads() {
  const cfg = readConfig();
  return (cfg.uploads || []).filter((u) => {
    if (!u || typeof u !== 'object') return false;
    if (u.source === 'url') return typeof u.urlSource === 'string' && u.urlSource.length > 0;
    return typeof u.fileAbs === 'string' && existsSync(u.fileAbs);
  });
}

export async function removeUpload(id) {
  let removed = null;
  await updateConfig((cfg) => {
    const next = [];
    for (const u of cfg.uploads || []) {
      if (u && u.id === id) {
        removed = u;
        continue;
      }
      next.push(u);
    }
    cfg.uploads = next;
    return cfg;
  });
  if (removed && removed.fileAbs && existsSync(removed.fileAbs)) {
    try { unlinkSync(removed.fileAbs); } catch {}
  }
  return Boolean(removed);
}
