document.addEventListener('DOMContentLoaded',async()=>{
  const members=await BERL.json('data/members.json');
  const order=['Advisor','Research Professors','Postdoctoral Researchers','Ph.D. Students','Integrated M.S./Ph.D. Students','M.S. Students'];
  const slug=s=>s.toLowerCase().replace(/\./g,'').replace(/\//g,'-').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  document.getElementById('people-groups').innerHTML=order.map(g=>{
    const list=members.filter(m=>m.group===g);
    if(!list.length)return'';
    return `<div class="people-group" id="${slug(g)}"><div class="section-head people-group-head"><div><h2>${BERL.esc(g)}</h2></div></div><div class="grid-3">${list.map(m=>`<a class="card person-card" href="member.html?id=${encodeURIComponent(m.id)}"><div class="portrait"><img src="${BERL.esc(m.photo||'assets/images/default-avatar.svg')}" alt="${BERL.esc(m.name)}" onerror="BERL.photo(this)"></div><div class="person-copy">${m.example?'<span class="example-badge">Placeholder</span>':''}<h3>${BERL.esc(m.name)}</h3><div class="role">${BERL.esc(m.position)}</div><p>${BERL.esc((m.research_interests||[]).slice(0,3).join(' · '))}</p></div></a>`).join('')}</div></div>`;
  }).join('');

  const alumni=members.filter(m=>m.group==='Alumni');
  const search=document.getElementById('alumni-search');
  const body=document.getElementById('alumni-table-body');
  const count=document.getElementById('alumni-count');

  const render=()=>{
    const q=(search?.value||'').trim().toLowerCase();
    const filtered=alumni.filter(m=>[m.name,m.affiliation,m.email].some(v=>String(v||'').toLowerCase().includes(q)));
    body.innerHTML=filtered.map(m=>`<tr><td class="alumni-name">${BERL.esc(m.name||'')}</td><td>${BERL.esc(m.affiliation||'')}</td><td>${m.email?`<a href="mailto:${BERL.esc(m.email)}">${BERL.esc(m.email)}</a>`:''}</td></tr>`).join('');
    if(count)count.textContent=alumni.length?`${filtered.length} of ${alumni.length}`:'';
  };

  search?.addEventListener('input',render);
  render();
});
