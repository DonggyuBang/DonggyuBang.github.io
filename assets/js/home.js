document.addEventListener('DOMContentLoaded',async()=>{
  try{
    const [cfg,metrics,pubs,research,news]=await Promise.all([
      BERL.json('data/site.json'),BERL.json('data/metrics.json'),BERL.json('data/publications.json'),BERL.json('data/research.json'),BERL.json('data/news.json')
    ]);
    const detail=n=>`news-detail.html?id=${encodeURIComponent(n.slug)}`;
    document.getElementById('hero-desc').textContent=cfg.hero_description||document.getElementById('hero-desc').textContent;
    const heroIndexes=[0,1,2,3,4,6];
    const heroWrap=document.getElementById('hero-slides');
    heroWrap.innerHTML=heroIndexes.map((idx,i)=>`<div class="hero-slide ${i===0?'active':''}" style="background-position:${BERL.spritePos(idx)}"></div>`).join('');
    document.getElementById('hero-dots').innerHTML=heroIndexes.map((_,i)=>`<button class="hero-dot ${i===0?'active':''}" data-i="${i}" aria-label="Scene ${i+1}"></button>`).join('');
    const heroSlides=[...document.querySelectorAll('.hero-slide')],heroDots=[...document.querySelectorAll('.hero-dot')];let heroIndex=0,heroTimer;
    const setHero=i=>{heroIndex=(i+heroSlides.length)%heroSlides.length;heroSlides.forEach((x,j)=>x.classList.toggle('active',j===heroIndex));heroDots.forEach((x,j)=>x.classList.toggle('active',j===heroIndex))};
    const resetHero=()=>{clearInterval(heroTimer);heroTimer=setInterval(()=>setHero(heroIndex+1),6500)};heroDots.forEach(b=>b.onclick=()=>{setHero(Number(b.dataset.i));resetHero()});resetHero();

    const latest=[...news].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5);
    document.getElementById('hero-news-list').innerHTML=latest.map((n,i)=>`<a class="hero-news-item ${i===0?'active':''}" href="${detail(n)}"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category)}</div><strong>${BERL.esc(n.title)}</strong><p>${BERL.esc(n.summary)}</p></a>`).join('');
    const newsEls=[...document.querySelectorAll('.hero-news-item')];let newsIndex=0,newsTimer;const setNews=i=>{newsIndex=(i+newsEls.length)%newsEls.length;newsEls.forEach((x,j)=>x.classList.toggle('active',j===newsIndex))};const resetNews=()=>{clearInterval(newsTimer);newsTimer=setInterval(()=>setNews(newsIndex+1),3800)};newsEls.forEach((x,i)=>x.addEventListener('mouseenter',()=>{setNews(i);resetNews()}));resetNews();

    const railWords=['Bioenergy','Resource Recovery','Environmental Remediation','Microbial Systems','Circular Materials','Organic Matter','AI & Modeling'];document.getElementById('rail-track').innerHTML=[...railWords,...railWords].map(x=>`<div class="rail-item">${BERL.esc(x)}</div>`).join('');

    const track=document.getElementById('research-track');
    track.innerHTML=research.map(r=>`<a class="research-panel" href="research.html#${BERL.esc(r.slug)}"><div class="sprite-photo" style="width:100%;height:100%;background-position:${BERL.spritePos(r.image_index)}"></div><div class="research-panel-copy"><div class="research-code">${BERL.esc(r.code)}</div><div><div class="kicker" style="color:var(--acid)">${BERL.esc(r.tag)}</div><h3>${BERL.esc(r.title)}</h3><p>${BERL.esc(r.summary)}</p></div><div class="research-link">↗</div></div></a>`).join('');
    const story=document.getElementById('research-story'),progress=document.getElementById('research-progress'),counter=document.getElementById('research-counter');
    const updateResearch=()=>{if(innerWidth<=1050){track.style.transform='none';progress.style.transform='scaleX(1)';return}const r=story.getBoundingClientRect(),maxScroll=story.offsetHeight-innerHeight,p=Math.max(0,Math.min(1,-r.top/Math.max(1,maxScroll))),maxX=Math.max(0,track.scrollWidth-innerWidth+48);track.style.transform=`translate3d(${-p*maxX}px,0,0)`;progress.style.transform=`scaleX(${p})`;const idx=Math.min(research.length-1,Math.floor(p*research.length));counter.textContent=`${String(idx+1).padStart(2,'0')} — ${String(research.length).padStart(2,'0')}`};addEventListener('scroll',updateResearch,{passive:true});addEventListener('resize',updateResearch);updateResearch();

    const metricData=[['Publications',metrics.publications],['Citations',metrics.citations],['h-index',metrics.h_index],['Open Access',metrics.open_access_works]];document.getElementById('metrics').innerHTML=metricData.map(([l,v])=>`<div class="metric"><div class="metric-value" data-count="${Number(v||0)}">0</div><div class="metric-label">${l}</div></div>`).join('');document.getElementById('metric-status').textContent=metrics.last_updated?`OpenAlex updated ${new Date(metrics.last_updated).toLocaleDateString()}. Metrics refresh automatically through the GitHub workflow.`:'Research metrics populate automatically when the OpenAlex workflow runs.';
    const animateCount=el=>{const target=Number(el.dataset.count||0),t0=performance.now(),dur=1100;const loop=now=>{const q=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-q,3);el.textContent=BERL.fmt(Math.round(target*e));if(q<1)requestAnimationFrame(loop)};requestAnimationFrame(loop)};if('IntersectionObserver'in window){const cio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){animateCount(e.target);cio.unobserve(e.target)}}),{threshold:.45});document.querySelectorAll('[data-count]').forEach(x=>cio.observe(x))}else document.querySelectorAll('[data-count]').forEach(animateCount);

    const recent=[...pubs].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,5);document.getElementById('home-pubs').innerHTML=recent.length?recent.map(p=>`<article class="publication"><div class="pub-year">${p.year||''}</div><div><div class="pub-title">${BERL.esc(p.title)}</div><div class="pub-meta">${BERL.esc((p.authors||[]).join(', '))}${p.journal?' · '+BERL.esc(p.journal):''}</div></div><div class="pub-links">${p.doi?`<a href="https://doi.org/${BERL.esc(p.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:''}</div></article>`).join(''):'<div class="empty">Publications will appear after the OpenAlex synchronization workflow runs.</div>';
    document.getElementById('home-news').innerHTML=latest.slice(0,5).map(n=>`<a class="news-card" href="${detail(n)}"><div class="news-image"><div class="news-image-bg sprite-photo" style="background-position:${BERL.spritePos(n.cover_index)}"></div></div><div class="news-copy"><div class="news-date">${BERL.esc(n.date)} · ${BERL.esc(n.category)}</div><h3>${BERL.esc(n.title)}</h3><p>${BERL.esc(n.summary)}</p><span class="read-more">Read story ↗</span></div></a>`).join('');
  }catch(e){console.error(e)}
});
