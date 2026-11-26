#!/usr/bin/env node
/**
 * Post-update survival guard spawned on Antigravity before-quit when a pending
 * update exists. Waits for the update to finish replacing app.asar and cleanly
 * re-injects /* AGY_WE_HOOK_V1 *\/ without disturbing other plugins.
 */
import { checkAsarStatus, patchAsar } from './patch-asar.mjs';

const MAX_ATTEMPTS = 40;
const INTERVAL_MS = 3000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  await sleep(4000);
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const st = checkAsarStatus();
      if (st.exists && !st.wePatched) {
        const res = patchAsar();
        if (res.ok) return;
      } else if (st.exists && st.wePatched && i >= 6) {
        return;
      }
    } catch {}
    await sleep(INTERVAL_MS);
  }
}

run().catch(() => {});
