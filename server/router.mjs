/**
 * Lightweight HTTP router + CORS + bounded body reader for Antigravity Wallpaper Engine.
 */

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, X-File-Name, X-Wallpaper-Title, X-Agy-We-Token');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag, X-WE-GPU-W, X-WE-GPU-H, X-WE-GPU-AR');
  res.setHeader('Access-Control-Max-Age', '600');
}

export function sendJson(res, status, data) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export function sendText(res, status, text, contentType = 'text/plain; charset=utf-8') {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.end(String(text ?? ''));
}

export function readBufferBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };
    req.on('data', (chunk) => {
      if (settled) return;
      total += chunk.length;
      if (total > maxBytes) {
        fail(Object.assign(new Error(`body too large (max ${maxBytes} bytes)`), { statusCode: 413 }));
        try { req.destroy(); } catch {}
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on('error', fail);
  });
}

export async function readJsonBody(req, maxBytes = 512 * 1024) {
  const buf = await readBufferBody(req, maxBytes);
  if (!buf.length) return {};
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    throw Object.assign(new Error('invalid json body'), { statusCode: 400 });
  }
}

export function createRouter() {
  const routes = [];

  function register({ kind = 'exact', method = null, path, handler }) {
    const entry = {
      kind,
      method: method ? method.toUpperCase() : null,
      path,
      handler,
    };
    routes.push(entry);
    return () => {
      const idx = routes.indexOf(entry);
      if (idx !== -1) routes.splice(idx, 1);
    };
  }

  function dispatch(req, res) {
    setCorsHeaders(req, res);
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    let pathname = '/';
    try {
      pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
    } catch {
      sendText(res, 400, 'bad request');
      return;
    }

    // Match exact first, then longest prefix
    let matched = null;
    for (const r of routes) {
      if (r.method && r.method !== method) continue;
      if (r.kind === 'exact' && r.path === pathname) {
        matched = r;
        break;
      }
    }
    if (!matched) {
      let bestLen = -1;
      for (const r of routes) {
        if (r.kind !== 'prefix') continue;
        if (r.method && r.method !== method) continue;
        if (pathname === r.path || pathname.startsWith(r.path + '/')) {
          if (r.path.length > bestLen) {
            bestLen = r.path.length;
            matched = r;
          }
        }
      }
    }

    if (!matched) {
      sendJson(res, 404, { error: 'not-found', path: pathname });
      return;
    }

    try {
      const maybePromise = matched.handler(req, res, pathname);
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch((err) => {
          const code = (err && err.statusCode) || 500;
          sendJson(res, code, { error: String((err && err.message) || err) });
        });
      }
    } catch (err) {
      const code = (err && err.statusCode) || 500;
      sendJson(res, code, { error: String((err && err.message) || err) });
    }
  }

  return { register, dispatch };
}
