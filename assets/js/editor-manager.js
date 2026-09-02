(()=>{
  const c=window.BERL_SUPABASE||{};
  if(!c.url||!c.publishableKey||!window.supabase?.createClient)return;
  const sb=window.supabase.createClient(c.url,c.publishableKey);
  const pagePath=location.pathname.endsWith('/')?location.pathname+'index.html':location.pathname;
  const esc=(v='')=>String(v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[x]));
  const cssEsc=v=>window.CSS?.escape?CSS.escape(v):String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&');
  const toast=t=>{document.querySelector('.berl-cms-toast')?.remove();const d=document.createElement('div');d.className='berl-cms-toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)};
  const stripId=o=>{const x={...(o||{})};delete x.id;return x};
  const plainHtml=h=>{const d=document.createElement('div');d.innerHTML=String(h||'').replace(/<br\s*\/?>/gi,'\n');return d.textContent||''};
  const safeOverrideKey=k=>String(k||'').startsWith('#')||String(k||'').includes('#berl-edit-');
  function style(){if(document.getElementById('berl-manager-style'))return;const s=document.createElement('style');s.id='berl-manager-style';s.textContent=`.berl-manager-screen{position:fixed;inset:0;z-index:100030;background:rgba(2,12,22,.88);backdrop-filter:blur(10px);display:grid;place-items:center;padding:22px}.berl-manager-card{width:min(900px,100%);max-height:82vh;overflow:auto;background:#0b2235;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:18px;font:12px/1.45 Inter,system-ui}.berl-manager-head{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:-18px;background:#0b2235;padding:14px 0;z-index:2}.berl-manager-head h2{margin:0;font-size:20px}.berl-manager-head button,.berl-manager-row button{border:1px solid rgba(255,255,255,.13);background:#102d45;color:#fff;border-radius:9px;padding:8px 10px;cursor:pointer;font-weight:800}.berl-manager-head .close{background:transparent;border:0;font-size:24px}.berl-manager-section{margin:14px 0 22px}.berl-manager-section h3{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#82e2da}.berl-manager-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:11px;margin:7px 0;background:#071b2c}.berl-manager-row strong,.berl-manager-row code{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.berl-manager-row small{color:#91a9bb}.berl-manager-actions{display:flex;gap:6px}.berl-manager-row .danger{color:#ffb0b0}.berl-history-restore{background:#153e58!important}.berl-history-unsafe{opacity:.55}`;document.head.appendChild(s)}
  function close(){document.querySelector('.berl-manager-screen')?.remove()}
  async function openElements(){
    style();close();
    const [{data:blocks,error:bErr},{data:hidden,error:hErr}]=await Promise.all([
      sb.from('site_blocks').select('block_key,block_type,text_content,sort_order').eq('page_path',pagePath).order('sort_order'),
      sb.from('site_overrides').select('selector,content_text').eq('page_path',pagePath).eq('is_hidden',true).order('updated_at',{ascending:false})
    ]);
    if(bErr||hErr){toast((bErr||hErr).message);return}
    const d=document.createElement('div');d.className='berl-manager-screen';
    d.innerHTML=`<div class="berl-manager-card"><div class="berl-manager-head"><h2>Page elements</h2><button class="close">×</button></div><div class="berl-manager-section"><h3>Added elements</h3>${(blocks||[]).map(x=>`<div class="berl-manager-row" data-block="${esc(x.block_key)}"><div><strong>${esc(x.block_type||'block')} · ${esc((x.text_content||'').slice(0,80)||'Untitled')}</strong><small>${esc(x.block_key)}</small></div><div class="berl-manager-actions"><button data-select>Select</button><button data-delete class="danger">Delete</button></div></div>`).join('')||'<p>No added elements on this page.</p>'}</div><div class="berl-manager-section"><h3>Hidden original elements</h3>${(hidden||[]).map(x=>`<div class="berl-manager-row" data-hidden="${esc(x.selector)}"><div><strong>${esc((x.content_text||'Hidden element').slice(0,80))}</strong><small>${esc(x.selector)}</small></div><div class="berl-manager-actions"><button data-restore>Restore</button></div></div>`).join('')||'<p>No hidden original elements.</p>'}</div></div>`;
    document.body.appendChild(d);d.querySelector('.close').onclick=close;
    d.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{const k=b.closest('[data-block]').dataset.block,el=document.querySelector(`[data-berl-block-key="${cssEsc(k)}"]`);if(!el){toast('Element is not currently visible');return}close();el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el.click(),350)});
    d.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{const k=b.closest('[data-block]').dataset.block;if(!confirm('Delete this added element permanently?'))return;const{error}=await sb.from('site_blocks').delete().eq('block_key',k);if(error){toast(error.message);return}b.closest('.berl-manager-row').remove();document.querySelector(`[data-berl-block-key="${cssEsc(k)}"]`)?.remove();toast('Deleted')});
    d.querySelectorAll('[data-restore]').forEach(b=>b.onclick=async()=>{const s=b.closest('[data-hidden]').dataset.hidden;const{error}=await sb.from('site_overrides').update({is_hidden:false,updated_at:new Date().toISOString()}).eq('page_path',pagePath).eq('selector',s);if(error){toast(error.message);return}toast('Restored');location.reload()});
  }
  async function restoreRevision(r){
    if(r.entity_type==='override'&&!safeOverrideKey(r.entity_key)){toast('This old container snapshot is intentionally blocked');return}
    const snap=stripId(r.snapshot||{});
    const{data:{user}}=await sb.auth.getUser();
    if(r.action==='insert'){
      const res=r.entity_type==='block'?await sb.from('site_blocks').delete().eq('block_key',r.entity_key):await sb.from('site_overrides').delete().eq('page_path',pagePath).eq('selector',r.entity_key);
      if(res.error){toast(res.error.message);return}
    }else if(r.entity_type==='block'){
      snap.updated_by=user?.id||snap.updated_by||null;snap.updated_at=new Date().toISOString();delete snap.created_at;
      const{error}=await sb.from('site_blocks').upsert(snap,{onConflict:'block_key'});if(error){toast(error.message);return}
    }else{
      if(snap.content_text==null&&snap.content_html!=null){snap.content_text=plainHtml(snap.content_html);snap.content_html=null}
      snap.updated_by=user?.id||snap.updated_by||null;snap.updated_at=new Date().toISOString();
      const{error}=await sb.from('site_overrides').upsert(snap,{onConflict:'page_path,selector'});if(error){toast(error.message);return}
    }
    toast('Revision restored');location.reload();
  }
  async function openRevisions(){
    style();close();const{data,error}=await sb.from('site_history').select('*').eq('page_path',pagePath).order('created_at',{ascending:false}).limit(50);if(error){toast(error.message);return}
    const d=document.createElement('div');d.className='berl-manager-screen';d.innerHTML=`<div class="berl-manager-card"><div class="berl-manager-head"><h2>Revision history</h2><button class="close">×</button></div><div class="berl-manager-section">${(data||[]).map(x=>{const safe=x.entity_type==='block'||safeOverrideKey(x.entity_key);return `<div class="berl-manager-row ${safe?'':'berl-history-unsafe'}" data-history="${x.id}"><div><strong>${esc(x.entity_type)} · ${esc(x.action)}</strong><small>${esc(x.entity_key)} · ${new Date(x.created_at).toLocaleString()}</small></div><div class="berl-manager-actions">${safe?'<button class="berl-history-restore" data-undo>Undo change</button>':'<small>Legacy snapshot</small>'}</div></div>`}).join('')||'<p>No history yet.</p>'}</div></div>`;document.body.appendChild(d);d.querySelector('.close').onclick=close;d.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>{const id=+b.closest('[data-history]').dataset.history,r=(data||[]).find(x=>x.id===id);if(r&&confirm('Restore the state before this change?'))restoreRevision(r)})
  }
  function install(){const w=document.getElementById('berl-workspace');if(!w||document.getElementById('berlElements'))return;style();const right=w.querySelector('.berl-toolbar-right')||w;const e=document.createElement('button');e.id='berlElements';e.textContent='Elements';e.onclick=openElements;right.prepend(e);const h=document.getElementById('berlHistory');if(h){h.textContent='Revisions';h.onclick=openRevisions}}
  let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(install,40)}).observe(document.documentElement,{childList:true,subtree:true});install();
})();