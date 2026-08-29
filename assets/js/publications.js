document.addEventListener('DOMContentLoaded',async()=>{
  const listEl=document.getElementById('pub-list');
  const countEl=document.getElementById('pub-count');
  const statusEl=document.getElementById('pub-status');
  try{
    const [rawPubs,metrics]=await Promise.all([BERL.json('data/publications.json'),BERL.json('data/metrics.json')]);
    const pubs=Array.isArray(rawPubs)?rawPubs:[];
    document.getElementById('publication-metrics').innerHTML=[['Publications',metrics.publications],['Citations',metrics.citations],['h-index',metrics.h_index],['Open Access',metrics.open_access_works]].map(([l,v])=>`<div class="metric"><div class="metric-value">${BERL.fmt(v)}</div><div class="metric-label">${l}</div></div>`).join('');

    const q=document.getElementById('pub-search');
    const year=document.getElementById('pub-year');
    const type=document.getElementById('pub-type');

    [...new Set(pubs.map(p=>p.year).filter(Boolean))].sort((a,b)=>Number(b)-Number(a)).forEach(y=>year.insertAdjacentHTML('beforeend',`<option value="${BERL.esc(y)}">${BERL.esc(y)}</option>`));
    [...new Set(pubs.map(p=>p.type).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b))).forEach(t=>type.insertAdjacentHTML('beforeend',`<option value="${BERL.esc(t)}">${BERL.esc(t)}</option>`));

    if(statusEl)statusEl.textContent=metrics.last_updated?`Updated ${new Date(metrics.last_updated).toLocaleDateString()} via OpenAlex`:'';

    const render=()=>{
      const s=q.value.trim().toLowerCase();
      const selectedYear=year.value;
      const selectedType=type.value;
      const filtered=[...pubs].sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)).filter(p=>{
        const hay=[p.title,p.journal,(p.authors||[]).join(' '),p.doi,(p.topics||[]).join(' ')].filter(Boolean).join(' ').toLowerCase();
        return(!s||hay.includes(s))&&(!selectedYear||String(p.year)===selectedYear)&&(!selectedType||String(p.type)===selectedType);
      });

      countEl.textContent=`${BERL.fmt(filtered.length)} publication${filtered.length===1?'':'s'}`;
      listEl.innerHTML=filtered.length?filtered.map(p=>{
        const doi=String(p.doi||'').replace(/^https?:\/\/(dx\.)?doi\.org\//i,'');
        const source=p.url||p.openalex_url||'';
        return `<article class="publication"><div class="pub-year">${BERL.esc(p.year||'')}</div><div class="pub-main"><div class="pub-title">${BERL.esc(p.title||'Untitled publication')}</div><div class="pub-meta">${BERL.esc((p.authors||[]).join(', '))}${p.journal?' · '+BERL.esc(p.journal):''}${p.cited_by_count?` · ${BERL.fmt(p.cited_by_count)} citations`:''}</div></div><div class="pub-links">${doi?`<a href="https://doi.org/${BERL.esc(doi)}" target="_blank" rel="noopener">DOI ↗</a>`:''}${source?`<a href="${BERL.esc(source)}" target="_blank" rel="noopener">Source ↗</a>`:''}</div></article>`;
      }).join(''):`<div class="empty">${pubs.length?'No publications match the selected filters.':'No publication data are available yet.'}</div>`;
    };

    q.addEventListener('input',render);
    year.addEventListener('change',render);
    type.addEventListener('change',render);
    render();
  }catch(err){
    console.error('BERL publication rendering failed',err);
    countEl.textContent='Publication data could not be loaded.';
    listEl.innerHTML='<div class="empty">Unable to load the publication list. Please refresh the page or try again shortly.</div>';
  }
});
