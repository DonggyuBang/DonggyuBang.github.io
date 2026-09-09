document.addEventListener('DOMContentLoaded',async()=>{
  const id=new URLSearchParams(location.search).get('id');
  const noStoreJson=async path=>{const r=await fetch(`${path}${path.includes('?')?'&':'?'}v=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()};
  const normalizeOpenAlex=v=>String(v||'').replace('https://openalex.org/authors/','').replace('https://openalex.org/','').replace('authors/','').replace(/^\/+|\/+$/g,'').trim().toUpperCase();
  const membersPromise=BERLPeople.rows();
  const metricsPromise=noStoreJson('data/member-metrics.json').catch(()=>({}));
  const pubsPromise=noStoreJson('data/publications.json').catch(e=>{console.warn('Publication cache unavailable',e);return[]});
  const [members,memberMetrics]=await Promise.all([membersPromise,metricsPromise]);
  const current=members.filter(x=>x.group!=='Alumni');
  const m=members.find(x=>(x.slug||x.id)===id)||current[0]||members[0];
  if(!m){document.getElementById('member-profile').innerHTML='<div class="empty">Member not found.</div>';return;}
  document.title=`${m.name} | BERL`;
  const targetId=normalizeOpenAlex(m.openalex_id);
  const openalexUrl=targetId?`https://openalex.org/authors/${BERL.esc(targetId)}`:'';

  document.getElementById('member-profile').innerHTML=`<div class="profile-layout"><div class="profile-photo"><img src="${BERL.esc(m.photo||'assets/images/default-avatar.svg')}" alt="${BERL.esc(m.name)}" onerror="BERL.photo(this)"></div><div class="profile-info"><div class="kicker">${BERL.esc(m.group)}</div><h2>${BERL.esc(m.name)}</h2><div class="role">${BERL.esc(m.position)}</div><p class="profile-bio">${BERL.esc(m.bio||'')}</p><div class="profile-links">${m.email?`<a href="mailto:${BERL.esc(m.email)}">Email</a>`:''}${m.scholar_url?`<a href="${BERL.esc(m.scholar_url)}" target="_blank" rel="noopener">Google Scholar ↗</a>`:''}${m.orcid_url?`<a href="${BERL.esc(m.orcid_url)}" target="_blank" rel="noopener">ORCID ↗</a>`:''}${m.researchgate_url?`<a href="${BERL.esc(m.researchgate_url)}" target="_blank" rel="noopener">ResearchGate ↗</a>`:''}${openalexUrl?`<a href="${openalexUrl}" target="_blank" rel="noopener">OpenAlex ↗</a>`:''}</div><div class="detail-list"><div class="detail-row"><strong>Affiliation</strong><span>${BERL.esc(m.affiliation||'')}</span></div><div class="detail-row"><strong>Department</strong><span>${BERL.esc(m.department||'')}</span></div>${m.degree_program?`<div class="detail-row"><strong>Program</strong><span>${BERL.esc(m.degree_program)}</span></div>`:''}${m.research_topic?`<div class="detail-row"><strong>Research topic</strong><span>${BERL.esc(m.research_topic)}</span></div>`:''}${m.office?`<div class="detail-row"><strong>Office</strong><span>${BERL.esc(m.office)}</span></div>`:''}${m.joined?`<div class="detail-row"><strong>Joined</strong><span>${BERL.esc(m.joined)}</span></div>`:''}<div class="detail-row"><strong>Research</strong><span>${BERL.esc((m.research_interests||[]).join(' · '))}</span></div>${(m.education||[]).length?`<div class="detail-row"><strong>Education</strong><span>${(m.education||[]).map(BERL.esc).join('<br>')}</span></div>`:''}</div></div></div>`;

  const metricsEl=document.getElementById('profile-metrics');
  const renderMetrics=mm=>{metricsEl.innerHTML=[['Publications',mm.publications],['Citations',mm.citations],['h-index',mm.h_index],['i10-index',mm.i10_index]].map(([l,v])=>`<div class="metric"><div class="metric-value">${BERL.fmt(v)}</div><div class="metric-label">${l}</div></div>`).join('')};
  const fetchLiveMetrics=async aid=>{const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),6000);try{const r=await fetch(`https://api.openalex.org/authors/${encodeURIComponent(aid)}`,{headers:{Accept:'application/json'},cache:'no-store',signal:ctl.signal});if(!r.ok)throw new Error(`OpenAlex ${r.status}`);const p=await r.json();const s=p.summary_stats||{};return{publications:Number(p.works_count||0),citations:Number(p.cited_by_count||0),h_index:Number(s.h_index||0),i10_index:Number(s.i10_index||0)}}finally{clearTimeout(timer)}};
  let mm=memberMetrics[m.slug||m.id];
  if(mm){renderMetrics(mm)}else if(targetId){metricsEl.innerHTML='<div class="empty">Updating scholarly metrics…</div>';try{mm=await fetchLiveMetrics(targetId);renderMetrics(mm)}catch(e){console.warn('OpenAlex live metrics unavailable',e);metricsEl.innerHTML='<div class="empty">Scholarly metrics are temporarily unavailable.</div>'}}else{metricsEl.innerHTML=''}

  const pubsEl=document.getElementById('member-pubs');
  pubsEl.innerHTML=targetId?'<div class="empty">Loading linked publications…</div>':'';
  if(!targetId)return;

  const pubMarkup=p=>`<article class="publication"><div class="pub-year">${p.year||''}</div><div><div class="pub-title">${BERL.esc(p.title||'Untitled')}</div><div class="pub-meta">${BERL.esc((Array.isArray(p.authors)?p.authors:[]).join(', '))}${p.journal?' · '+BERL.esc(p.journal):''}${p.cited_by_count?` · ${BERL.fmt(p.cited_by_count)} citations`:''}</div></div><div class="pub-links">${p.doi?`<a href="https://doi.org/${BERL.esc(String(p.doi).replace(/^https?:\/\/doi\.org\//i,''))}" target="_blank" rel="noopener">DOI ↗</a>`:''}${p.id?`<a href="https://openalex.org/works/${BERL.esc(String(p.id).split('/').pop())}" target="_blank" rel="noopener">OpenAlex ↗</a>`:''}</div></article>`;
  const renderBatched=(items,batchSize=30)=>{
    let shown=0;
    pubsEl.innerHTML=`<div class="pub-list-status">${BERL.fmt(items.length)} linked publication${items.length===1?'':'s'}</div><div id="member-pub-items"></div>${items.length>batchSize?'<div class="pub-more-wrap"><button class="btn btn-light" id="member-pub-more" type="button">Show more</button></div>':''}`;
    const list=document.getElementById('member-pub-items');
    const more=document.getElementById('member-pub-more');
    const add=()=>{const next=Math.min(shown+batchSize,items.length);list.insertAdjacentHTML('beforeend',items.slice(shown,next).map(pubMarkup).join(''));shown=next;if(more){more.textContent=shown<items.length?`Show more (${BERL.fmt(items.length-shown)} remaining)`:'All publications shown';more.disabled=shown>=items.length;more.hidden=shown>=items.length}};
    if(more)more.onclick=add;
    add();
  };
  const normalizeLiveWork=w=>({id:String(w.id||'').split('/').pop(),year:w.publication_year||'',title:w.title||w.display_name||'Untitled',authors:(w.authorships||[]).map(x=>x.author?.display_name).filter(Boolean),author_ids:(w.authorships||[]).map(x=>normalizeOpenAlex(x.author?.id)).filter(Boolean),journal:w.primary_location?.source?.display_name||'',doi:String(w.doi||'').replace(/^https?:\/\/doi\.org\//i,''),cited_by_count:Number(w.cited_by_count||0)});
  try{
    const pubs=await pubsPromise;
    let mine=(Array.isArray(pubs)?pubs:[]).filter(p=>(Array.isArray(p.author_ids)?p.author_ids:[]).some(a=>normalizeOpenAlex(a)===targetId)).sort((a,b)=>(b.year||0)-(a.year||0));
    if(!mine.length){
      const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),10000);
      try{const u=new URL('https://api.openalex.org/works');u.searchParams.set('filter',`author.id:${targetId}`);u.searchParams.set('per_page','100');u.searchParams.set('sort','publication_date:desc');const r=await fetch(u,{headers:{Accept:'application/json'},cache:'no-store',signal:ctl.signal});if(!r.ok)throw new Error(`OpenAlex works ${r.status}`);const payload=await r.json();mine=(payload.results||[]).map(normalizeLiveWork)}finally{clearTimeout(timer)}
    }
    if(mine.length)renderBatched(mine);else pubsEl.innerHTML='<div class="empty">No linked publications were found for this OpenAlex profile.</div>';
  }catch(e){console.error('Linked publications failed',e);pubsEl.innerHTML='<div class="empty">Linked publications are temporarily unavailable. OpenAlex profile data is still connected.</div>'}
});