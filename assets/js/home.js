document.addEventListener("DOMContentLoaded",async()=>{
  try{
    const [cfg,metrics,pubs,research,news]=await Promise.all([BERL.json("data/site.json"),BERL.json("data/metrics.json"),BERL.json("data/publications.json"),BERL.json("data/research.json"),BERL.json("data/news.json")]);
    document.getElementById("hero-title").innerHTML=BERL.esc(cfg.hero_title).replace("circular future.","<em>circular future.</em>");
    document.getElementById("hero-desc").textContent=cfg.hero_description;
    document.getElementById("research-grid").innerHTML=research.map(r=>`<a class="card research-card" href="research.html#${BERL.esc(r.slug)}"><div class="card-code">${BERL.esc(r.code)}</div><h3>${BERL.esc(r.title)}</h3><p>${BERL.esc(r.summary)}</p><span class="pill">${BERL.esc(r.tag)}</span></a>`).join("");
    const metricItems=[["Publications",metrics.publications],["Citations",metrics.citations],["h-index",metrics.h_index],["Open Access",metrics.open_access_works]];
    document.getElementById("metrics").innerHTML=metricItems.map(([l,v])=>`<div class="metric"><div class="metric-value">${BERL.fmt(v)}</div><div class="metric-label">${l}</div></div>`).join("");
    document.getElementById("metric-status").textContent=metrics.last_updated?`OpenAlex updated ${new Date(metrics.last_updated).toLocaleDateString()}`:metrics.status;
    const recent=[...pubs].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,4);
    document.getElementById("home-pubs").innerHTML=recent.length?recent.map(p=>`<article class="publication"><div class="pub-year">${p.year||""}</div><div><div class="pub-title">${BERL.esc(p.title)}</div><div class="pub-meta">${BERL.esc((p.authors||[]).join(", "))}${p.journal?" · "+BERL.esc(p.journal):""}</div></div><div class="pub-links">${p.doi?`<a href="https://doi.org/${BERL.esc(p.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:""}</div></article>`).join(""):`<div class="empty">Publication sync has not run yet. Run the GitHub Actions workflow once after upload.</div>`;
    document.getElementById("home-news").innerHTML=[...news].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3).map(n=>`<article class="card news-card"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category||"News")}</div><h3>${BERL.esc(n.title)}</h3><p>${BERL.esc(n.summary)}</p></article>`).join("");
  }catch(e){console.error(e)}
});
