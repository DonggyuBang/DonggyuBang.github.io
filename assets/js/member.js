document.addEventListener('DOMContentLoaded',async()=>{
  const id=new URLSearchParams(location.search).get('id');
  const [members,pubs,memberMetrics]=await Promise.all([
    BERLPeople.rows(),
    BERL.json('data/publications.json'),
    BERL.json('data/member-metrics.json').catch(()=>({}))
  ]);
  const current=members.filter(x=>x.group!=='Alumni');
  const m=members.find(x=>(x.slug||x.id)===id)||current[0]||members[0];
  if(!m){document.getElementById('member-profile').innerHTML='<div class="empty">Member not found.</div>';return;}
  document.title=`${m.name} | BERL`;
  const targetId=String(m.openalex_id||'').replace('https://openalex.org/authors/','').replace('https://openalex.org/','').replace('authors/','').replace(/^\/+|\/+$/g,'').trim();
  const openalexUrl=targetId?`https://openalex.org/${BERL.esc(targetId)}`:'';

  document.getElementById('member-profile').innerHTML=`<div class="profile-layout"><div class="profile-photo"><img src="${BERL.esc(m.photo||'assets/images/default-avatar.svg')}" alt="${BERL.esc(m.name)}" onerror="BERL.photo(this)"></div><div class="profile-info"><div class="kicker">${BERL.esc(m.group)}</div><h2>${BERL.esc(m.name)}</h2><div class="role">${BERL.esc(m.position)}</div><p class="profile-bio">${BERL.esc(m.bio||'')}</p><div class="profile-links">${m.email?`<a href="mailto:${BERL.esc(m.email)}">Email</a>`:''}${m.scholar_url?`<a href="${BERL.esc(m.scholar_url)}" target="_blank" rel="noopener">Google Scholar ↗</a>`:''}${m.orcid_url?`<a href="${BERL.esc(m.orcid_url)}" target="_blank" rel="noopener">ORCID ↗</a>`:''}${m.researchgate_url?`<a href="${BERL.esc(m.researchgate_url)}" target="_blank" rel="noopener">ResearchGate ↗</a>`:''}${openalexUrl?`<a href="${openalexUrl}" target="_blank" rel="noopener">OpenAlex ↗</a>`:''}</div><div class="detail-list"><div class="detail-row"><strong>Affiliation</strong><span>${BERL.esc(m.affiliation||'')}</span></div><div class="detail-row"><strong>Department</strong><span>${BERL.esc(m.department||'')}</span></div>${m.degree_program?`<div class="detail-row"><strong>Program</strong><span>${BERL.esc(m.degree_program)}</span></div>`:''}${m.research_topic?`<div class="detail-row"><strong>Research topic</strong><span>${BERL.esc(m.research_topic)}</span></div>`:''}${m.office?`<div class="detail-row"><strong>Office</strong><span>${BERL.esc(m.office)}</span></div>`:''}${m.joined?`<div class="detail-row"><strong>Joined</strong><span>${BERL.esc(m.joined)}</span></div>`:''}<div class="detail-row"><strong>Research</strong><span>${BERL.esc((m.research_interests||[]).join(' · '))}</span></div>${(m.education||[]).length?`<div class="detail-row"><strong>Education</strong><span>${(m.education||[]).map(BERL.esc).join('<br>')}</span></div>`:''}</div></div></div>`;

  const metricsEl=document.getElementById('profile-metrics');
  const mm=memberMetrics[m.slug||m.id];
  if(mm){metricsEl.innerHTML=[['Publications',mm.publications],['Citations',mm.citations],['h-index',mm.h_index],['i10-index',mm.i10_index]].map(([l,v])=>`<div class="metric"><div class="metric-value">${BERL.fmt(v)}</div><div class="metric-label">${l}</div></div>`).join('')}else metricsEl.innerHTML='';

  const mine=targetId?pubs.filter(p=>(p.author_ids||[]).some(a=>String(a).replace('https://openalex.org/authors/','').replace('https://openalex.org/','').replace('authors/','').replace(/^\/+|\/+$/g,'').trim()===targetId)).sort((a,b)=>(b.year||0)-(a.year||0)):[];
  document.getElementById('member-pubs').innerHTML=mine.length?mine.map(p=>`<article class="publication"><div class="pub-year">${p.year||''}</div><div><div class="pub-title">${BERL.esc(p.title)}</div><div class="pub-meta">${BERL.esc((p.authors||[]).join(', '))}${p.journal?' · '+BERL.esc(p.journal):''}${p.cited_by_count?` · ${BERL.fmt(p.cited_by_count)} citations`:''}</div></div><div class="pub-links">${p.doi?`<a href="https://doi.org/${BERL.esc(p.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:''}${p.id?`<a href="https://openalex.org/works/${BERL.esc(p.id)}" target="_blank" rel="noopener">OpenAlex ↗</a>`:''}</div></article>`).join(''):'';
});