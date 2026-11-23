import type { RequestHandler } from 'express';

/**
 * Monitor de barrera mínimo, para probar el tiempo real antes de tener el
 * frontend: http://localhost:4000/monitor?siteId=<id de la sede>
 * Usa el cliente que Socket.IO sirve en /socket.io/socket.io.js.
 */
export const monitorPage: RequestHandler = (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>ParkOne · Monitor de barrera</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
  h1{margin:0 0 4px} #site{color:#94a3b8;margin-bottom:16px}
  #barrier{font-size:28px;font-weight:700;padding:24px;border-radius:12px;background:#334155;margin-bottom:16px}
  .open{background:#15803d!important}.closed{background:#b91c1c!important}
  li{padding:6px 0;border-bottom:1px solid #1e293b;font-family:ui-monospace,monospace;font-size:13px}
</style></head><body>
<h1>Monitor de barrera</h1><div id="site"></div>
<div id="barrier">Esperando eventos…</div><ul id="log"></ul>
<script src="/socket.io/socket.io.js"></script>
<script>
  const siteId = new URLSearchParams(location.search).get('siteId');
  document.getElementById('site').textContent = siteId ? 'Sede: ' + siteId : 'Falta ?siteId= en la URL';
  const socket = io();
  socket.on('connect', () => siteId && socket.emit('join-site', siteId));
  const log = (text) => { const li = document.createElement('li'); li.textContent = new Date().toLocaleTimeString() + '  ' + text; document.getElementById('log').prepend(li); };
  socket.on('ACCESS_DECIDED', (e) => {
    const box = document.getElementById('barrier');
    box.textContent = (e.direction === 'ENTRY' ? 'ENTRADA' : 'SALIDA') + ' · ' + e.plate + ' · ' + (e.barrierOpened ? 'ABIERTA' : 'CERRADA') + ' — ' + e.message;
    box.className = e.barrierOpened ? 'open' : 'closed';
    log('ACCESS_DECIDED ' + JSON.stringify(e));
  });
  socket.on('SPOTS_CHANGED', (e) => log('SPOTS_CHANGED ' + JSON.stringify(e)));
  socket.on('PAYMENT_CONFIRMED', (e) => log('PAYMENT_CONFIRMED ' + JSON.stringify(e)));
</script></body></html>`);
};
