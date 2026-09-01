/* Service worker de la app de Reembolso de gastos.
   Sube el número de CACHE cada vez que publiques cambios:
   así el navegador tira la versión vieja en lugar de servirla. */
const CACHE = 'reembolso-v1';
const ARCHIVOS = [
  'reembolso.html',
  'manifest-reem.webmanifest',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // El Apps Script y las librerías nunca se cachean.
  if (url.hostname.indexOf('script.google.com') >= 0) return;

  // La app: red primero, caché como respaldo si no hay internet.
  if (ARCHIVOS.some(a => url.pathname.endsWith(a))) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
