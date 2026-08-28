document.addEventListener("DOMContentLoaded", async ()=>{
  try{
    const [metrics,pubs,news,research]=await Promise.all([
      BERL.json("data/metrics.json"),BERL.json("data/publications.json"),BERL.json("data/news.json"),BERL.json("data/research.json")
    ]);
    document.getElementById("metrics").innerHTML=[
      ["Publications",metrics.publications],["Citations",metrics.citations],["h-index",metrics.h_index],["Open Access",metrics.open_access_works]
    ].map(([l,v])=>`<div class="metric"><div class="metric-value">${BERL.fmt(v)}</div><div class="metric-label">${l}</div></div>`).join("");
    document.getElementById("research-grid").innerHTML=research.slice(0,6).map(r=>`
      <a class="card card-hover" href="research.html#${BERL.esc(r.slug)}">
        <div class="research-icon">${BERL.esc(r.icon)}</div><span class="tag">${BERL.esc(r.tag)}</span>
        <h3>${BERL.esc(r.title)}</h3><p>${BERL.esc(r.summary)}</p>
      </a>`).join("");
    const p=[...pubs].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,4);
    document.getElementById("home-pubs").innerHTML=p.map(x=>`
      <div class="publication"><div class="pub-year">${x.year||""}</div><div>
      <div class="pub-title">${BERL.esc(x.title)}</div>
      <div class="pub-meta">${BERL.esc((x.authors||[]).join(", "))}${x.journal?" · "+BERL.esc(x.journal):""}</div></div>
      <div class="pub-links">${x.doi?`<a href="https://doi.org/${BERL.esc(x.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:""}</div></div>`).join("");
    document.getElementById("home-news").innerHTML=[...news].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(n=>`
      <article class="card news-card"><div class="date">${BERL.esc(n.date)}</div><h3>${BERL.esc(n.title)}</h3><p>${BERL.esc(n.summary)}</p><br><a href="${BERL.esc(n.url||"news.html")}">Read more →</a></article>`).join("");
  }catch(e){console.error(e)}
});
