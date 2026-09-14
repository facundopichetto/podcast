// service worker del podcast (facundo, 2026-09-12): la pwa del iphone.
// - la app (index, manifest, iconos, episodios.json) va de la red primero y cae al cache si no hay datos.
// - el audio de la red NO pasa por aca: el player lo pide directo, igual que antes del sw.
// - lo bajado vive en el cache `podcast-audio` bajo la ruta virtual `offline/<archivo>`, y eso lo atiende
//   este sw con respuestas 206: safari pide el mp3 por rangos y sin 206 no reproduce ni deja adelantar.
const VERSION = '1.14';
const APP = 'podcast-app-' + VERSION, AUDIO = 'podcast-audio';
const SCOPE = self.registration.scope;
const BASE = new URL(SCOPE).pathname;
const CASCARA = ['index.html', 'manifest.json', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'episodios.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => Promise.all(
    // uno por uno: si un icono falla no se cae la instalacion entera
    [''].concat(CASCARA).map(u => fetch(new Request(new URL(u, SCOPE).href, { cache: 'reload' }))
      .then(r => r.ok ? c.put(new URL(u, SCOPE).href, r) : null).catch(() => null))
  )).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('podcast-app-') && k !== APP).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  const resto = url.pathname.slice(BASE.length);
  if (resto.startsWith('offline/')) { e.respondWith(bajado(req, url, resto.slice('offline/'.length))); return; }
  if (req.mode === 'navigate' || resto === '' || CASCARA.includes(resto)) e.respondWith(redPrimero(req, resto));
});

// red primero; sin red (o si tarda mas de 5 s y hay copia) contesta lo guardado
async function redPrimero(req, resto) {
  const c = await caches.open(APP);
  const clave = new URL(resto, SCOPE).href;   // sin query: `episodios.json?t=...` pisa la misma copia
  const red = fetch(req).then(r => { if (r.ok) c.put(clave, r.clone()).catch(() => {}); return r; });
  const guardado = (await c.match(clave)) || (req.mode === 'navigate' ? await c.match(SCOPE) : null);
  if (!guardado) return red;
  return Promise.race([red, new Promise(ok => setTimeout(() => ok(null), 5000))])
    .then(r => r || guardado).catch(() => guardado);
}

// el mp3 bajado, entero o por rangos
async function bajado(req, url, archivo) {
  const c = await caches.open(AUDIO);
  const r = await c.match(url.origin + url.pathname);
  const rango = req.headers.get('range');
  if (!r) {
    // la copia se perdio (ios desaloja el cache si falta espacio): suena de la red
    const h = new Headers();
    if (rango) h.set('range', rango);
    return fetch(new URL(decodeURIComponent(archivo), SCOPE).href, { headers: h });
  }
  const blob = await r.blob(), total = blob.size;
  const base = { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes' };
  if (!rango) return new Response(blob, { status: 200, headers: { ...base, 'content-length': String(total) } });
  const m = /bytes=(\d*)-(\d*)/.exec(rango);
  let ini, fin;
  if (!m || (m[1] === '' && m[2] === '')) { ini = 0; fin = total - 1; }
  else if (m[1] === '') { ini = Math.max(0, total - +m[2]); fin = total - 1; }   // `bytes=-500`: los ultimos 500
  else { ini = +m[1]; fin = m[2] === '' ? total - 1 : Math.min(+m[2], total - 1); }
  if (ini >= total || ini > fin) {
    return new Response(null, { status: 416, headers: { ...base, 'content-range': `bytes */${total}` } });
  }
  return new Response(blob.slice(ini, fin + 1), { status: 206, headers: { ...base,
    'content-length': String(fin - ini + 1), 'content-range': `bytes ${ini}-${fin}/${total}` } });
}
