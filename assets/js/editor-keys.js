(()=>{
  const root=()=>document.querySelector('main');
  const clean=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'item';
  const safeId=v=>'berl-edit-'+clean(v);
  const editable='h1,h2,h3,h4,h5,h6,p,span,strong,em,small,li,time,a,button,img,.date,.kicker,.pill,.metric-value,.metric-label,.pub-title,.pub-meta,.read-more';
  function unique(base,el){let id=base,n=2;while(document.getElementById(id)&&document.getElementById(id)!==el)id=`${base}-${n++}`;return id}
  function setId(el,base){if(!el||el.id)return;el.id=unique(safeId(base),el)}
  function keyChildren(host,base){if(!host)return;let n=0;host.querySelectorAll(editable).forEach(el=>{if(el.id||el.closest('[data-berl-block-key]')!==host.closest('[data-berl-block-key]'))return;setId(el,`${base}-${el.tagName.toLowerCase()}-${++n}`)})}
  function assign(){const m=root();if(!m)return;
    m.querySelectorAll('[data-berl-block-key]').forEach(el=>{const k=el.dataset.berlBlockKey;setId(el,`block-${k}`);let n=0;el.querySelectorAll(editable).forEach(ch=>{if(!ch.id)setId(ch,`block-${k}-${ch.tagName.toLowerCase()}-${++n}`)})});
    m.querySelectorAll('a[href*="news-detail.html?id="]').forEach(el=>{let id;try{id=new URL(el.href,location.href).searchParams.get('id')}catch{};if(!id)return;setId(el,`news-${id}`);keyChildren(el,`news-${id}`)});
    m.querySelectorAll('a[href*="member.html?id="]').forEach(el=>{let id;try{id=new URL(el.href,location.href).searchParams.get('id')}catch{};if(!id)return;setId(el,`member-${id}`);keyChildren(el,`member-${id}`)});
    m.querySelectorAll('a.carousel-card[href*="research.html#"]').forEach(el=>{const id=(el.getAttribute('href')||'').split('#')[1];if(!id)return;setId(el,`research-carousel-${id}`);keyChildren(el,`research-carousel-${id}`)});
    m.querySelectorAll('#research-list > article').forEach((el,i)=>{const key=el.id||el.querySelector('h3')?.textContent||`research-${i+1}`;setId(el,`research-${key}`);keyChildren(el,`research-${key}`)});
    m.querySelectorAll('#project-list > article').forEach((el,i)=>{const key=el.querySelector('h3')?.textContent||`project-${i+1}`;setId(el,`project-${key}`);keyChildren(el,`project-${key}`)});
    m.querySelectorAll('.publication').forEach((el,i)=>{const doi=el.querySelector('a[href*="doi.org/"]')?.getAttribute('href')||'';const key=doi.split('doi.org/')[1]||el.querySelector('.pub-title')?.textContent||`publication-${i+1}`;setId(el,`publication-${key}`);keyChildren(el,`publication-${key}`)});
    m.querySelectorAll('.metric').forEach((el,i)=>{const key=el.querySelector('.metric-label')?.textContent||`metric-${i+1}`;setId(el,`metric-${key}`);keyChildren(el,`metric-${key}`)});
    m.querySelectorAll('.hero-stat').forEach((el,i)=>setId(el,`hero-stat-${el.textContent||i+1}`));
    m.querySelectorAll('.person-card,.news-card,.project-card').forEach((el,i)=>{if(!el.id){const key=el.querySelector('h2,h3')?.textContent||el.getAttribute('href')||`${el.className}-${i+1}`;setId(el,key);keyChildren(el,key)}});
  }
  let timer;const run=()=>{clearTimeout(timer);timer=setTimeout(assign,30)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',assign);else assign();
  const start=()=>{const m=root();if(m)new MutationObserver(run).observe(m,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  if(!document.getElementById('berlEditorManager')){const s=document.createElement('script');s.id='berlEditorManager';s.src='assets/js/editor-manager.js?v=20260902k';document.head.appendChild(s)}
})();