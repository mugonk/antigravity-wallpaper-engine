#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAsarStatus } from './patch-asar.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
    setTimeout(() => resolve(data), 500);
  });
}

async function main() {
  await readStdin();
  try {
    const asar = checkAsarStatus();
    if (asar.exists && !asar.wePatched) {
      const ver = asar.appVersion || '新版本';
      const cmdPath = path.join(PLUGIN_ROOT, 'scripts', '应用壁纸插件并重启.cmd');
      const msg = [
        `> [!NOTE]`,
        `> **Antigravity 壁纸引擎插件检测到 \`app.asar\`（${ver}）尚未挂载壁纸钩子**（可能刚完成官方自动更新）。`,
        `> 完全退出后通过桌面/开始菜单图标重新打开即可自动补回，或直接双击运行：\`${cmdPath}\``,
      ].join('\n');
      process.stdout.write(JSON.stringify({
        injectSteps: [{ systemMessage: { systemMessage: '', metadata: { user_markdown: msg } } }],
      }) + '\n');
      return;
    }
  } catch {}
  process.stdout.write('{}\n');
}

main();
