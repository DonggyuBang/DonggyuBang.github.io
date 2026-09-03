document.addEventListener('DOMContentLoaded',async()=>{
  try{
    const[cfg,metrics,pubs,research,news]=await Promise.all([
      BERL.json('data/site.json'),BERL.json('data/metrics.json'),BERL.json('data/publications.json'),BERL.json('data/research.json'),BERLData.news()
    ]);
    const detail=n=>`news-detail.html?id=${encodeURIComponent(n.slug)}`;

    document.getElementById('hero-kicker').textContent=cfg.tagline||'Bioenergy · Environmental Engineering · AI';
    document.getElementById('hero-title').innerHTML='BIOENERGY &amp;<br>ENVIRONMENTAL ENGINEERING<br><em>RESEARCH LAB</em>';
    document.getElementById('hero-desc').textContent=cfg.hero_description||'BIOENERGY & ENVIRONMENTAL ENGINEERING RESEARCH LAB at Hanyang University advances bioenergy, environmental engineering, microbial systems, circular materials, remediation, and data-driven research.';
    document.getElementById('hero-stats').innerHTML=[['Bioenergy','Resource recovery'],['Environmental Engineering','Treatment & remediation'],['Microbial','Biotechnology'],['AI','Prediction & optimization']].map(([a,b])=>`<span class="hero-stat">${a} · ${b}</span>`).join('');

    const heroImages=['assets/images/generated/hero-clean-tech.png','assets/images/generated/hero-landscape.png','assets/images/generated/research-bioenergy.png','assets/images/generated/research-remediation.png','assets/images/generated/research-microbial.png','assets/images/generated/research-ai.png'];
    document.getElementById('hero-slides').innerHTML=heroImages.map((src,i)=>`<div class="hero-slide ${i===0?'active':''}" style="background-image:url('${src}')"></div>`).join('');
    document.getElementById('hero-dots').innerHTML=heroImages.map((_,i)=>`<button class="hero-dot ${i===0?'active':''}" data-index="${i}" aria-label="Hero slide ${i+1}"></button>`).join('');
    document.querySelector('.hero-showcase').insertAdjacentHTML('beforeend',`<div class="hero-slide-nav"><button id="hero-prev" aria-label="Previous">←</button><span id="hero-count">01 / ${String(heroImages.length).padStart(2,'0')}</span><button id="hero-next" aria-label="Next">→</button></div>`);
    let hi=0;const hs=[...document.querySelectorAll('.hero-slide')],hd=[...document.querySelectorAll('.hero-dot')];
    const setHero=i=>{hi=(i+hs.length)%hs.length;hs.forEach((e,j)=>e.classList.toggle('active',j===hi));hd.forEach((e,j)=>e.classList.toggle('active',j===hi));document.getElementById('hero-count').textContent=`${String(hi+1).padStart(2,'0')} / ${String(hs.length).padStart(2,'0')}`};
    let ht;const resetHero=()=>{clearInterval(ht);ht=setInterval(()=>setHero(hi+1),6200)};
    hd.forEach(d=>d.onclick=()=>{setHero(+d.dataset.index);resetHero()});
    document.getElementById('hero-prev').onclick=()=>{setHero(hi-1);resetHero()};
    document.getElementById('hero-next').onclick=()=>{setHero(hi+1);resetHero()};
    resetHero();

    const latest=[...news].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5);
    const featured=document.getElementById('hero-featured-news');
    const queue=document.getElementById('hero-news-list');
    let ni=0,nt;
    const resetNewsProgress=()=>{const p=document.querySelector('.news-progress span');if(!p)return;p.style.animation='none';void p.offsetWidth;p.style.animation='featuredNewsProgress 4.6s linear forwards'};
    const renderNews=()=>{
      if(!latest.length)return;
      const n=latest[ni];
      featured.innerHTML=`<a class="featured-news-card" href="${detail(n)}"><div class="featured-news-image" style="background-image:url('${BERL.esc(n.image||'assets/images/generated/hero-clean-tech.png')}')"></div><div class="featured-news-shade"></div><div class="featured-news-copy"><span class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category||'News')}</span><h4>${BERL.esc(n.title)}</h4><span class="featured-news-read">Read story →</span></div></a>`;
      queue.innerHTML=latest.map((item,i)=>({item,i})).filter(x=>x.i!==ni).map(({item,i})=>`<a class="hero-news-item" data-news-index="${i}" href="${detail(item)}"><span class="hero-news-thumb" style="background-image:url('${BERL.esc(item.image||'assets/images/generated/hero-clean-tech.png')}')"></span><span class="hero-news-row-copy"><span class="date">${BERL.esc(item.date)}</span><strong>${BERL.esc(item.title)}</strong></span><span class="hero-news-arrow">↗</span></a>`).join('');
      [...queue.querySelectorAll('.hero-news-item')].forEach(row=>row.addEventListener('mouseenter',()=>{ni=Number(row.dataset.newsIndex);renderNews();resetNewsTimer()}));
      resetNewsProgress();
    };
    const setNews=i=>{ni=(i+latest.length)%latest.length;renderNews()};
    const resetNewsTimer=()=>{clearInterval(nt);nt=setInterval(()=>setNews(ni+1),4600)};
    renderNews();resetNewsTimer();

    document.getElementById('research-track').innerHTML=research.map(r=>`<a class="carousel-card" href="research.html#${BERL.esc(r.slug)}"><div class="media" style="background-image:url('${BERL.esc(r.image||'assets/images/generated/hero-clean-tech.png')}')"></div><div class="overlay"><span class="pill">${BERL.esc(r.tag)}</span><h3>${BERL.esc(r.title)}</h3><p>${BERL.esc((r.topics||[]).slice(0,3).join(' · '))}</p></div></a>`).join('');
    const track=document.getElementById('research-track'),dots=document.getElementById('research-dots');
    let page=0,pv=innerWidth<=720?1:(innerWidth<=1100?2:3);const pages=()=>Math.ceil(research.length/pv);
    const draw=()=>{dots.innerHTML=Array.from({length:pages()},(_,i)=>`<button class="${i===page?'active':''}" data-i="${i}"></button>`).join('');[...dots.children].forEach(b=>b.onclick=()=>{page=+b.dataset.i;update()})};
    const update=()=>{pv=innerWidth<=720?1:(innerWidth<=1100?2:3);if(page>=pages())page=0;const first=track.firstElementChild,w=first?first.getBoundingClientRect().width:0;track.style.transform=`translateX(-${(w+18)*pv*page}px)`;[...dots.children].forEach((b,i)=>b.classList.toggle('active',i===page))};
    document.getElementById('research-prev').onclick=()=>{page=(page-1+pages())%pages();update()};
    document.getElementById('research-next').onclick=()=>{page=(page+1)%pages();update()};
    addEventListener('resize',()=>{page=0;draw();update()});draw();update();setInterval(()=>{page=(page+1)%pages();update()},5000);

    const metricData=[['Publications',metrics.publications],['Citations',metrics.citations],['h-index',metrics.h_index],['Open Access',metrics.open_access_works]];
    document.getElementById('metrics').innerHTML=metricData.map(([l,v])=>`<div class="metric"><div class="metric-value" data-count="${Number(v||0)}">0</div><div class="metric-label">${l}</div></div>`).join('');
    document.getElementById('metric-status').textContent=metrics.last_updated?`Updated ${new Date(metrics.last_updated).toLocaleDateString()}`:'';
    if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,t=+el.dataset.count,s=performance.now();const step=n=>{const q=Math.min(1,(n-s)/1000);el.textContent=BERL.fmt(Math.round(t*(1-Math.pow(1-q,3))));if(q<1)requestAnimationFrame(step)};requestAnimationFrame(step);io.unobserve(el)}),{threshold:.35});document.querySelectorAll('[data-count]').forEach(x=>io.observe(x))}

    const recent=[...pubs].sort((a,b)=>(b.year||0)-(a.year||0)).slice(0,4);
    document.getElementById('home-pubs').innerHTML=recent.length?recent.map(p=>`<article class="publication"><div class="pub-year">${p.year||''}</div><div><div class="pub-title">${BERL.esc(p.title)}</div><div class="pub-meta">${BERL.esc((p.authors||[]).join(', '))}${p.journal?' · '+BERL.esc(p.journal):''}</div></div><div class="pub-links">${p.doi?`<a href="https://doi.org/${BERL.esc(p.doi)}" target="_blank" rel="noopener">DOI ↗</a>`:''}</div></article>`).join(''):'<div class="empty">Publication data is refreshed by OpenAlex.</div>';
    document.getElementById('home-news').innerHTML=latest.slice(0,3).map(n=>`<a class="card news-card" href="${detail(n)}"><div class="news-image" style="background-image:url('${BERL.esc(n.image||'assets/images/generated/hero-landscape.png')}')"></div><div class="news-copy"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category)}</div><h3>${BERL.esc(n.title)}</h3><span class="read-more">Read story →</span></div></a>`).join('');
  }catch(e){console.error(e)}
});