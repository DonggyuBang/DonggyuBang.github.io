document.addEventListener("DOMContentLoaded",async()=>{
  const id=new URLSearchParams(location.search).get("id");
  const [members,pubs]=await Promise.all([BERL.json("data/members.json"),BERL.json("data/publications.json")]);
  const m=members.find(x=>x.id===id) || members[0];
  document.title=`${m.name} | BERL`;
  document.getElementById("member-profile").innerHTML=`
    <div class="profile-layout">
      <div class="profile-photo">${m.photo?`<img src="${BERL.esc(m.photo)}" alt="${BERL.esc(m.name)}">`:"Profile Photo"}</div>
      <div class="profile-info">
        <div class="kicker">${BERL.esc(m.group)}</div><h2>${BERL.esc(m.name)}</h2><div class="role">${BERL.esc(m.position)}</div>
        <p>${BERL.esc(m.bio||"")}</p>
        <div class="profile-links">
          ${m.email?`<a href="mailto:${BERL.esc(m.email)}">Email</a>`:""}
          ${m.scholar_url?`<a href="${BERL.esc(m.scholar_url)}" target="_blank" rel="noopener">Google Scholar ↗</a>`:""}
          ${m.orcid_url?`<a href="${BERL.esc(m.orcid_url)}" target="_blank" rel="noopener">ORCID ↗</a>`:""}
          ${m.researchgate_url?`<a href="${BERL.esc(m.researchgate_url)}" target="_blank" rel="noopener">ResearchGate ↗</a>`:""}
        </div>
        <div class="detail-list">
          <div class="detail-row"><strong>Affiliation</strong><span>${BERL.esc(m.affiliation||"")}</span></div>
          <div class="detail-row"><strong>Department</strong><span>${BERL.esc(m.department||"")}</span></div>
          <div class="detail-row"><strong>Research</strong><span>${BERL.esc((m.research_interests||[]).join(" · "))}</span></div>
        </div>
      </div>
    </div>`;
  const nameParts=m.name.toLowerCase().split(/\s+/).filter(x=>x.length>2);
  const mine=pubs.filter(p=>(p.authors||[]).some(a=>nameParts.every(part=>a.toLowerCase().includes(part))));
  document.getElementById("member-pubs").innerHTML=mine.length?mine.slice(0,12).map(x=>`
    <div class="publication"><div class="pub-year">${x.year||""}</div><div><div class="pub-title">${BERL.esc(x.title)}</div>
    <div class="pub-meta">${BERL.esc((x.authors||[]).join(", "))}${x.journal?" · "+BERL.esc(x.journal):""}</div></div>
    <div class="pub-links">${x.doi?`<a href="https://doi.org/${BERL.esc(x.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:""}</div></div>`).join("")
    :`<div class="empty">No linked publications yet. Configure author metadata or edit publications.json.</div>`;
});
