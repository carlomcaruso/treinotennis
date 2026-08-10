const CACHE='treino-v2';
const ASSETS=['./','index.html','semana.html','partidas.html','revanche.html','plano.html','academia.html',
  'app.css','app.js','data.js','manifest.webmanifest','icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
    if(r&&r.status===200&&r.type==='basic'){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}
    return r;}).catch(()=>caches.match('index.html'))));
});
