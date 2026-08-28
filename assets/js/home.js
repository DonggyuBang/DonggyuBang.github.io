document.addEventListener("DOMContentLoaded",async()=>{
  try{
    const [cfg,metrics,pubs,research,news]=await Promise.all([BERL.json("data/site.json"),BERL.json("data/metrics.json"),BERL.json("data/publications.json"),BERL.json("data/research.json"),BERL.json("data/news.json")]);
    document.getElementById("hero-kicker").textContent=cfg.tagline||"Bioenergy · Remediation · Circular Systems";
    document.getElementById("hero-title").innerHTML=BERL.esc(cfg.hero_title||"Engineering cleaner systems for a circular future.").replace("circular future.","<em>circular future.</em>");
    document.getElementById("hero-desc").textContent=cfg.hero_description||"";
    document.getElementById("hero-stats").innerHTML=[["Bioenergy","Waste-to-resource"],["Remediation","Environmental materials"],["Biotechnology","Microbial systems"],["Data","AI-driven engineering"]].map(([a,b])=>`<span class="hero-stat">${a} · ${b}</span>`).join("");
    const heroPhotoIndexes=[1,0,2,3,4,5];
    document.getElementById("hero-slides").innerHTML=heroPhotoIndexes.map((idx,i)=>`<div class="hero-slide ${i===0?"active":""}" style="background-position:${BERL.spritePos(idx)}"></div>`).join("");
    document.getElementById("hero-dots").innerHTML=heroPhotoIndexes.map((_,i)=>`<button class="hero-dot ${i===0?"active":""}" data-index="${i}" aria-label="Background slide ${i+1}"></button>`).join("");
    let heroIndex=0;const heroSlides=[...document.querySelectorAll(".hero-slide")],heroDots=[...document.querySelectorAll(".hero-dot")];
    const setHero=i=>{heroIndex=(i+heroSlides.length)%heroSlides.length;heroSlides.forEach((el,j)=>el.classList.toggle("active",j===heroIndex));heroDots.forEach((el,j)=>el.classList.toggle("active",j===heroIndex))};
    let heroTimer;const resetHero=()=>{clearInterval(heroTimer);heroTimer=setInterval(()=>setHero(heroIndex+1),5600)};
    heroDots.forEach(d=>d.onclick=()=>{setHero(Number(d.dataset.index));resetHero()});setHero(0);resetHero();
    const latest=[...news].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5);
    document.getElementById("hero-news-list").innerHTML=latest.map((n,i)=>`<a class="hero-news-item ${i===0?"active":""}" data-index="${i}" href="${BERL.esc(n.url||"news.html")}"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category||"News")}</div><strong>${BERL.esc(n.title)}</strong><p>${BERL.esc(n.summary||"")}</p></a>`).join("");
    let newsIndex=0;const newsEls=[...document.querySelectorAll(".hero-news-item")];
    const setNews=i=>{newsIndex=(i+newsEls.length)%newsEls.length;newsEls.forEach((el,j)=>el.classList.toggle("active",j===newsIndex));const p=document.querySelector(".news-progress span");if(p)p.style.transform=`translateX(${newsIndex*100}%)`};
    let newsTimer;const resetNews=()=>{clearInterval(newsTimer);newsTimer=setInterval(()=>setNews(newsIndex+1),3900)};
    newsEls.forEach((el,i)=>el.addEventListener("mouseenter",()=>{setNews(i);resetNews()}));setNews(0);resetNews();
    document.getElementById("research-track").innerHTML=research.map((r,i)=>`<a class="carousel-card" href="research.html#${BERL.esc(r.slug)}"><div class="media sprite-photo" style="background-position:${BERL.spritePos(r.photo_index??i)}"></div><div class="overlay"><span class="pill">${BERL.esc(r.tag)}</span><h3>${BERL.esc(r.title)}</h3><p>${BERL.esc(r.summary)}</p><span class="small">${BERL.esc((r.topics||[]).slice(0,3).join(" · "))}</span></div></a>`).join("");
    const track=document.getElementById("research-track"),dots=document.getElementById("research-dots");let page=0,perView=3;
    const calc=()=>innerWidth<=720?1:(innerWidth<=1080?2:3),pages=()=>Math.max(1,Math.ceil(research.length/perView));
    function renderDots(){dots.innerHTML=Array.from({length:pages()},(_,i)=>`<button class="${i===page?"active":""}" data-index="${i}"></button>`).join("");[...dots.children].forEach(b=>b.onclick=()=>{page=Number(b.dataset.index);update();resetResearch()})}
    function update(){perView=calc();if(page>=pages())page=0;const first=track.querySelector(".carousel-card"),gap=18,w=first?first.getBoundingClientRect().width:0;track.style.transform=`translateX(-${(w+gap)*perView*page}px)`;[...dots.children].forEach((d,i)=>d.classList.toggle("active",i===page))}
    document.getElementById("research-prev").onclick=()=>{page=(page-1+pages())%pages();update();resetResearch()};document.getElementById("research-next").onclick=()=>{page=(page+1)%pages();update();resetResearch()};
    addEventListener("resize",()=>{const old=perView;perView=calc();if(old!==perView){page=0;renderDots()}update()});perView=calc();renderDots();update();
    let researchTimer;const resetResearch=()=>{clearInterval(researchTimer);researchTimer=setInterval(()=>{page=(page+1)%pages();update()},4400)};resetResearch();
    document.getElementById("metrics").innerHTML=[["Publications",metrics.publications],["Citations",metrics.citations],["h-index",metrics.h_index],["Open Access",metrics.open_access_works]].map(([l,v])=>`<div class="metric"><div class="metric-value">${BERL.fmt(v)}</div><div class="metric-label">${l}</div></div>`).join("");
    document.getElementById("metric-status").textContent=metrics.last_updated?`OpenAlex updated ${new Date(metrics.last_updated).toLocaleDateString()}`:metrics.status;
    const recent=[...pubs].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,4);
    document.getElementById("home-pubs").innerHTML=recent.length?recent.map(p=>`<article class="publication"><div class="pub-year">${p.year||""}</div><div><div class="pub-title">${BERL.esc(p.title)}</div><div class="pub-meta">${BERL.esc((p.authors||[]).join(", "))}${p.journal?" · "+BERL.esc(p.journal):""}</div></div><div class="pub-links">${p.doi?`<a href="https://doi.org/${BERL.esc(p.doi)}" target="_blank">DOI ↗</a>`:""}</div></article>`).join(""):`<div class="empty">Publications are populated automatically from OpenAlex.</div>`;
    document.getElementById("home-news").innerHTML=latest.slice(0,3).map((n,i)=>`<a class="card news-card" href="${BERL.esc(n.url||"news.html")}"><div class="news-image sprite-photo" style="background-position:${BERL.spritePos(n.photo_index??i)}"></div><div class="news-copy"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category)}</div><h3>${BERL.esc(n.title)}</h3><p>${BERL.esc(n.summary)}</p></div></a>`).join("");
    const scene=document.getElementById("motion-scene"),objects=[...document.querySelectorAll(".motion-object")];
    const animateScene=()=>{if(!scene)return;const r=scene.getBoundingClientRect();const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));objects.forEach((el,i)=>{const dir=i%2?1:-1;el.style.transform=`translate3d(${dir*(1-p)*55}px,${(i-1)*18+(1-p)*55}px,0) rotate(${dir*(1-p)*4}deg)`});scene.style.setProperty("--scene-progress",p)};
    addEventListener("scroll",animateScene,{passive:true});animateScene();
  }catch(e){console.error(e)}
});
