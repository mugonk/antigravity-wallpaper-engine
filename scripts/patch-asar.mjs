#!/usr/bin/env node
/**
 * Coexistence-safe zero-dependency ASAR 1-line hook injector & surgical remover
 * for Antigravity Wallpaper Engine.
 *
 * - Uses independent marker `/* AGY_WE_HOOK_V1 *\/` so it coexists cleanly with
 *   `antigravity-zh-cn` (`/* AGY_ZH_CN_HOOK_V1 *\/`) and other plugins.
 * - Recomputes authentic SHA-256 integrity metadata (hash + 4MB blocks).
 * - Surgical removal (--remove / --restore) strips ONLY this plugin's line
 *   without touching other plugins' hooks.
 *
 * Usage:
 *   node patch-asar.mjs [--target <path>]
 *   node patch-asar.mjs --check [--target <path>]
 *   node patch-asar.mjs --remove [--target <path>]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ASAR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'Programs',
  'antigravity',
  'resources',
  'app.asar'
);

export const MARKER = '/* AGY_WE_HOOK_V1 */';
export const ZH_CN_MARKER = '/* AGY_ZH_CN_HOOK_V1 */';
const INJECT_LINE =
  `${MARKER} try{global.__AGY_WE_MODE__='asar';require(require('path').join(require('os').homedir(),'.gemini','config','plugins','antigravity-wallpaper-engine','runtime','hook.cjs'));}catch{}\n`;
const BLOCK_SIZE = 4 * 1024 * 1024;

function align4(n) {
  return (n + 3) & ~3;
}

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function computeIntegrity(buf) {
  const blocks = [];
  if (buf.length === 0) {
    blocks.push(sha256Hex(buf));
  } else {
    for (let off = 0; off < buf.length; off += BLOCK_SIZE) {
      blocks.push(sha256Hex(buf.subarray(off, Math.min(off + BLOCK_SIZE, buf.length))));
    }
  }
  return {
    algorithm: 'SHA256',
    hash: sha256Hex(buf),
    blockSize: BLOCK_SIZE,
    blocks,
  };
}

export function readAsar(filePath) {
  const buf = fs.readFileSync(filePath);
  const headerSize = buf.readUInt32LE(4);
  const strLen = buf.readUInt32LE(12);
  const headerJson = buf.subarray(16, 16 + strLen).toString('utf8');
  const header = JSON.parse(headerJson);
  const dataOffset = 8 + headerSize;
  return { buf, header, dataOffset };
}

function collectFiles(node, baseOffset, srcBuf, list = []) {
  for (const [, entry] of Object.entries(node.files || {})) {
    if (entry.files) {
      collectFiles(entry, baseOffset, srcBuf, list);
    } else if (!entry.unpacked && entry.offset !== undefined) {
      const off = Number(entry.offset);
      const sz = Number(entry.size);
      list.push({ entry, data: srcBuf.subarray(baseOffset + off, baseOffset + off + sz) });
    }
  }
  return list;
}

function writeAsar(header, fileList, outPath, expectWePresent) {
  let cursor = 0;
  for (const item of fileList) {
    item.entry.offset = String(cursor);
    item.entry.size = item.data.length;
    if (item.modified) {
      item.entry.integrity = computeIntegrity(item.data);
    }
    cursor += item.data.length;
  }

  const headerStrBuf = Buffer.from(JSON.stringify(header), 'utf8');
  const headerStrPaddedLen = align4(headerStrBuf.length);
  const headerPicklePayloadSize = 4 + headerStrPaddedLen;
  const headerPickleSize = 4 + headerPicklePayloadSize;

  const prefix = Buffer.alloc(16 + headerStrPaddedLen, 0);
  prefix.writeUInt32LE(4, 0);
  prefix.writeUInt32LE(headerPickleSize, 4);
  prefix.writeUInt32LE(headerPicklePayloadSize, 8);
  prefix.writeUInt32LE(headerStrBuf.length, 12);
  headerStrBuf.copy(prefix, 16);

  const tmpPath = `${outPath}.we.tmp`;
  fs.writeFileSync(tmpPath, Buffer.concat([prefix, ...fileList.map((i) => i.data)]));

  // Verify rebuilt archive parses & matches expected marker state
  const verify = readAsar(tmpPath);
  const vMain = verify.header?.files?.dist?.files?.['main.js'];
  if (!vMain || vMain.offset === undefined) {
    fs.unlinkSync(tmpPath);
    throw new Error('重建的 app.asar 校验失败，已中止写入');
  }
  const vSrc = verify.buf
    .subarray(verify.dataOffset + Number(vMain.offset), verify.dataOffset + Number(vMain.offset) + Number(vMain.size))
    .toString('utf8');
  const hasMarker = vSrc.includes(MARKER);
  if (expectWePresent !== hasMarker) {
    fs.unlinkSync(tmpPath);
    throw new Error('重建的 dist/main.js 钩子校验失败');
  }

  try {
    fs.renameSync(tmpPath, outPath);
  } catch {
    try {
      fs.copyFileSync(tmpPath, outPath);
      fs.unlinkSync(tmpPath);
    } catch (err2) {
      try { fs.unlinkSync(tmpPath); } catch {}
      throw err2;
    }
  }
}

function readAppVersionFromAsar(buf, header, dataOffset) {
  try {
    const pkgEntry = header?.files?.['package.json'];
    if (!pkgEntry || pkgEntry.offset === undefined) return '';
    const pkgRaw = buf
      .subarray(dataOffset + Number(pkgEntry.offset), dataOffset + Number(pkgEntry.offset) + Number(pkgEntry.size))
      .toString('utf8');
    const pkg = JSON.parse(pkgRaw);
    return typeof pkg?.version === 'string' ? pkg.version.trim() : '';
  } catch {
    return '';
  }
}

export function checkAsarStatus(asarPath = DEFAULT_ASAR) {
  const bakPath = `${asarPath}.bak`;
  if (!fs.existsSync(asarPath)) {
    return {
      exists: false,
      wePatched: false,
      zhCnPatched: false,
      backupExists: fs.existsSync(bakPath),
      appVersion: '',
      asarPath,
    };
  }
  const { buf, header, dataOffset } = readAsar(asarPath);
  const appVersion = readAppVersionFromAsar(buf, header, dataOffset);
  const mainEntry = header?.files?.dist?.files?.['main.js'];
  if (!mainEntry || mainEntry.offset === undefined) {
    return {
      exists: true,
      wePatched: false,
      zhCnPatched: false,
      backupExists: fs.existsSync(bakPath),
      appVersion,
      asarPath,
      error: 'missing dist/main.js',
    };
  }
  const mainSrc = buf
    .subarray(dataOffset + Number(mainEntry.offset), dataOffset + Number(mainEntry.offset) + Number(mainEntry.size))
    .toString('utf8');
  return {
    exists: true,
    wePatched: mainSrc.includes(MARKER),
    zhCnPatched: mainSrc.includes(ZH_CN_MARKER),
    backupExists: fs.existsSync(bakPath),
    appVersion,
    asarPath,
  };
}

export function patchAsar(asarPath = DEFAULT_ASAR) {
  const bakPath = `${asarPath}.bak`;
  if (!fs.existsSync(asarPath)) {
    return { ok: false, error: `未找到 app.asar: ${asarPath}` };
  }
  const { buf, header, dataOffset } = readAsar(asarPath);
  const mainEntry = header?.files?.dist?.files?.['main.js'];
  if (!mainEntry || mainEntry.offset === undefined) {
    return { ok: false, error: '无法在 app.asar 中定位 dist/main.js' };
  }
  const mainSrc = buf
    .subarray(dataOffset + Number(mainEntry.offset), dataOffset + Number(mainEntry.offset) + Number(mainEntry.size))
    .toString('utf8');

  if (mainSrc.includes(MARKER)) {
    return { ok: true, alreadyPatched: true, zhCnPreserved: mainSrc.includes(ZH_CN_MARKER), asarPath };
  }

  // Only create/refresh clean backup when archive has neither hook yet
  if (!mainSrc.includes(ZH_CN_MARKER) && !fs.existsSync(bakPath)) {
    try { fs.copyFileSync(asarPath, bakPath); } catch {}
  }

  const files = collectFiles(header, dataOffset, buf);
  for (const item of files) {
    if (item.entry === mainEntry) {
      item.data = Buffer.from(INJECT_LINE + mainSrc, 'utf8');
      item.modified = true;
      break;
    }
  }

  try {
    writeAsar(header, files, asarPath, true);
    return {
      ok: true,
      alreadyPatched: false,
      zhCnPreserved: mainSrc.includes(ZH_CN_MARKER),
      asarPath,
    };
  } catch (err) {
    return {
      ok: false,
      locked: err.code === 'EBUSY' || err.code === 'EPERM',
      error: err.message,
      code: err.code,
    };
  }
}

export function removeWeHookFromAsar(asarPath = DEFAULT_ASAR) {
  if (!fs.existsSync(asarPath)) {
    return { ok: false, error: `未找到 app.asar: ${asarPath}` };
  }
  const { buf, header, dataOffset } = readAsar(asarPath);
  const mainEntry = header?.files?.dist?.files?.['main.js'];
  if (!mainEntry || mainEntry.offset === undefined) {
    return { ok: false, error: '无法在 app.asar 中定位 dist/main.js' };
  }
  const mainSrc = buf
    .subarray(dataOffset + Number(mainEntry.offset), dataOffset + Number(mainEntry.offset) + Number(mainEntry.size))
    .toString('utf8');

  if (!mainSrc.includes(MARKER)) {
    return { ok: true, removed: false, zhCnPreserved: mainSrc.includes(ZH_CN_MARKER), asarPath };
  }

  const cleaned = mainSrc
    .split(/\r?\n/)
    .filter((line) => !line.includes(MARKER))
    .join('\n');

  const files = collectFiles(header, dataOffset, buf);
  for (const item of files) {
    if (item.entry === mainEntry) {
      item.data = Buffer.from(cleaned, 'utf8');
      item.modified = true;
      break;
    }
  }

  try {
    writeAsar(header, files, asarPath, false);
    return {
      ok: true,
      removed: true,
      zhCnPreserved: cleaned.includes(ZH_CN_MARKER),
      asarPath,
    };
  } catch (err) {
    return {
      ok: false,
      locked: err.code === 'EBUSY' || err.code === 'EPERM',
      error: err.message,
      code: err.code,
    };
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const argv = process.argv.slice(2);
  let target = DEFAULT_ASAR;
  const tIdx = argv.indexOf('--target');
  if (tIdx !== -1 && argv[tIdx + 1]) target = argv[tIdx + 1];

  if (argv.includes('--check')) {
    console.log(JSON.stringify(checkAsarStatus(target), null, 2));
    process.exit(0);
  }
  if (argv.includes('--remove') || argv.includes('--restore')) {
    const res = removeWeHookFromAsar(target);
    if (!argv.includes('--quiet')) console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  }
  const res = patchAsar(target);
  if (!argv.includes('--quiet')) console.log(JSON.stringify(res, null, 2));
  process.exit(res.ok ? 0 : 1);
}
