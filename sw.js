/* Versão muda a cada publicação — é o que dispara a atualização nos aparelhos */
const VERSION = '2026-08-18-1002';
const CACHE   = 'treino-' + VERSION;
const ASSETS  = ['./','index.html','semana.html','partidas.html','revanche.html',
  'plano.html','academia.html','app.css','app.js','data.js','manifest.webmanifest','icon.png'];

self.addEventListener('install', e => {
  // NÃO chamamos skipWaiting aqui: o SW novo espera o usuário confirmar
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* cache-first: abre instantâneo e funciona sem sinal.
   A atualização vem pelo ciclo de vida do SW, não por rede a cada visita. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r && r.status === 200 && r.type === 'basic') {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match('index.html')))
  );
});
