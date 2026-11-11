/* =====================================================================
   ENTRELÍNEAS · SERVICE WORKER
   No guarda nada en caché: así siempre llega la versión publicada.
   Solo hace dos cosas: permite instalar la app en Android y, si el
   celular está sin conexión, muestra una página que lo explica en vez
   del error del navegador.
   ===================================================================== */
const SIN_CONEXION = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1A1238">
<title>Sin conexión · Entrelíneas</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1A1238;color:#F4EFFF;font:16px/1.5 system-ui,sans-serif;padding:1.5rem;text-align:center}
h1{font-size:1.6rem;margin:.5rem 0}p{color:#C3B8EC;max-width:22rem;margin:0 auto 1.2rem}
button{background:#FF4FA3;color:#1A1238;border:0;border-radius:999px;padding:.8rem 1.4rem;font:700 1rem system-ui,sans-serif}</style></head>
<body><main><div style="font-size:2.6rem">📶</div><h1>Sin conexión</h1>
<p>Entrelíneas necesita internet para traer tus retos y guardar tu avance. Revisa tu conexión y vuelve a intentarlo.</p>
<button onclick="location.reload()">Intentar de nuevo</button></main></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(SIN_CONEXION, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
