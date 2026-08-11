/* ---------- storage (funciona no GitHub Pages; degrada em silêncio no preview) ---------- */
const DB = {
  get(k, fb){ try{ const v=localStorage.getItem('tt.'+k); return v?JSON.parse(v):fb; }catch(e){ return fb; } },
  set(k, v){ try{ localStorage.setItem('tt.'+k, JSON.stringify(v)); return true; }catch(e){ return false; } },
  ok(){ try{ localStorage.setItem('tt.probe','1'); localStorage.removeItem('tt.probe'); return true; }catch(e){ return false; } }
};

/* ---------- partidas: histórico + novas ---------- */
function novas(){ return DB.get('novas', []); }
function todas(){ return HIST.concat(novas()); }

/* ---------- datas ---------- */
function parseD(s){
  const t = String(s||'').trim();
  if(!t) return null;
  // ISO: 2026-07-29
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m){ const d=new Date(+m[1], +m[2]-1, +m[3]); return isNaN(d)?null:d; }
  // legado: M/D/YY
  const p = t.split('/');
  if (p.length!==3) return null;
  let [mm,dd,yy] = p.map(Number);
  if (yy<100) yy += 2000;
  const d = new Date(yy, mm-1, dd);
  return isNaN(d) ? null : d;
}
function fmtD(s){
  const d = parseD(s);
  if(!d) return s;
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getFullYear()).slice(2);
}
function ordena(arr){
  return arr.slice().sort((a,b)=>{
    const x=parseD(a.data), y=parseD(b.data);
    if(!x) return 1; if(!y) return -1;
    return y-x;
  });
}

/* ---------- estatísticas ---------- */
function stats(arr){
  const n=arr.length, v=arr.filter(m=>m.res==='V').length;
  const by=q=>{ const s=arr.filter(m=>m.quadra===q); return {n:s.length, v:s.filter(m=>m.res==='V').length}; };
  return { n, v, d:n-v, pct: n? v/n*100 : 0, dura:by('DURA'), saibro:by('SAIBRO') };
}
function pct(v,n){ return n? (v/n*100).toFixed(1)+'%' : '—'; }

function saldoOponentes(arr){
  const map={};
  arr.forEach(m=>{
    if(!map[m.oponente]) map[m.oponente]={v:0,d:0,ult:null};
    map[m.oponente][m.res==='V'?'v':'d']++;
    const d=parseD(m.data);
    if(d && (!map[m.oponente].ult || d>map[m.oponente].ult)) map[m.oponente].ult=d;
  });
  return Object.entries(map).map(([nome,r])=>({nome,...r,saldo:r.v-r.d,n:r.v+r.d}));
}

/* ---------- nav ---------- */
const PAGES = [
  ['index.html','Painel'], ['semana.html','Semana'], ['partidas.html','Partidas'],
  ['revanche.html','Revanche'], ['plano.html','Plano'], ['academia.html','Academia']
];
function nav(atual){
  const el=document.getElementById('nav');
  if(!el) return;
  el.innerHTML = PAGES.map(([h,t])=>
    `<a class="navlink${h===atual?' on':''}" href="${h}">${t}</a>`).join('');
}

/* ---------- util ---------- */
function esc(s){ return String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function baixar(nome, txt, tipo){
  const b=new Blob([txt],{type:(tipo||'text/plain')+';charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(b); a.download=nome; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function flag(id){
  const e=document.getElementById(id); if(!e) return;
  e.classList.add('on'); setTimeout(()=>e.classList.remove('on'),1600);
}
/* ---------- atualização automática ---------- */
function aviso(worker){
  if(document.getElementById('upd')) return;
  const d=document.createElement('div');
  d.id='upd'; d.className='upd';
  d.innerHTML='<span>Nova versão disponível</span><button class="upd-btn">Atualizar</button>';
  document.body.appendChild(d);
  requestAnimationFrame(()=>d.classList.add('on'));
  d.querySelector('.upd-btn').addEventListener('click',()=>{
    d.querySelector('.upd-btn').textContent='Atualizando…';
    worker.postMessage({type:'SKIP_WAITING'});
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      // procura versão nova a cada hora e sempre que o app volta ao primeiro plano
      setInterval(()=>reg.update().catch(()=>{}), 60*60*1000);
      document.addEventListener('visibilitychange',()=>{
        if(!document.hidden) reg.update().catch(()=>{});
      });
      reg.addEventListener('updatefound',()=>{
        const nw = reg.installing;
        if(!nw) return;
        nw.addEventListener('statechange',()=>{
          // só avisa se já havia uma versão instalada antes (não na 1ª visita)
          if(nw.state==='installed' && navigator.serviceWorker.controller) aviso(nw);
        });
      });
    } catch(e){}
  });
  let recarregando=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(recarregando) return; recarregando=true; location.reload();
  });
}
