(()=>{
  let timer=null;
  let currentSignature='';

  const detail=n=>`news-detail.html?id=${encodeURIComponent(n.slug)}`;
  const sortRows=rows=>[...(rows||[])].sort((a,b)=>
    String(b.date||'').localeCompare(String(a.date||''))||
    String(b.created_at||'').localeCompare(String(a.created_at||''))||
    Number(b.id||0)-Number(a.id||0)
  );
  const signature=rows=>rows.slice(0,5).map(n=>`${n.id||''}:${n.updated_at||n.created_at||''}:${n.slug||''}`).join('|');

  function renderHero(latest){
    const featured=document.getElementById('hero-featured-news');
    const queue=document.getElementById('hero-news-list');
    if(!featured||!queue||!latest.length)return;

    let index=0;
    const selected=latest[0];
    featured.innerHTML=`<a class="featured-news-card" href="${detail(selected)}"><div class="featured-news-image" style="background-image:url('${BERL.esc(selected.image||'assets/images/generated/hero-clean-tech.png')}')"></div><div class="featured-news-shade"></div><div class="featured-news-copy"><span class="date">${BERL.esc(selected.date)} · ${BERL.esc(selected.category||'News')}</span><h4>${BERL.esc(selected.title)}</h4><span class="featured-news-read">Read story →</span></div></a>`;
    queue.innerHTML=latest.slice(1).map((item,i)=>`<a class="hero-news-item" data-news-index="${i+1}" href="${detail(item)}"><span class="hero-news-thumb" style="background-image:url('${BERL.esc(item.image||'assets/images/generated/hero-clean-tech.png')}')"></span><span class="hero-news-row-copy"><span class="date">${BERL.esc(item.date)}</span><strong>${BERL.esc(item.title)}</strong></span><span class="hero-news-arrow">↗</span></a>`).join('');

    const resetProgress=()=>{
      const p=document.querySelector('.news-progress span');
      if(!p)return;
      p.style.animation='none';
      void p.offsetWidth;
      p.style.animation='featuredNewsProgress 4.6s linear forwards';
    };

    const draw=i=>{
      index=(i+latest.length)%latest.length;
      const n=latest[index];
      featured.innerHTML=`<a class="featured-news-card" href="${detail(n)}"><div class="featured-news-image" style="background-image:url('${BERL.esc(n.image||'assets/images/generated/hero-clean-tech.png')}')"></div><div class="featured-news-shade"></div><div class="featured-news-copy"><span class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category||'News')}</span><h4>${BERL.esc(n.title)}</h4><span class="featured-news-read">Read story →</span></div></a>`;
      queue.innerHTML=latest.map((item,j)=>({item,j})).filter(x=>x.j!==index).map(({item,j})=>`<a class="hero-news-item" data-news-index="${j}" href="${detail(item)}"><span class="hero-news-thumb" style="background-image:url('${BERL.esc(item.image||'assets/images/generated/hero-clean-tech.png')}')"></span><span class="hero-news-row-copy"><span class="date">${BERL.esc(item.date)}</span><strong>${BERL.esc(item.title)}</strong></span><span class="hero-news-arrow">↗</span></a>`).join('');
      queue.querySelectorAll('.hero-news-item').forEach(row=>row.addEventListener('mouseenter',()=>{
        draw(Number(row.dataset.newsIndex));
        restart();
      }));
      resetProgress();
    };

    const restart=()=>{
      clearInterval(timer);
      timer=setInterval(()=>draw(index+1),4600);
    };

    draw(0);
    restart();
  }

  function renderGrid(latest){
    const grid=document.getElementById('home-news');
    if(!grid)return;
    grid.innerHTML=latest.slice(0,3).map(n=>`<a class="card news-card" href="${detail(n)}"><div class="news-image" style="background-image:url('${BERL.esc(n.image||'assets/images/generated/hero-landscape.png')}')"></div><div class="news-copy"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category||'News')}</div><h3>${BERL.esc(n.title)}</h3><span class="read-more">Read story →</span></div></a>`).join('');
  }

  async function refresh(force=false){
    if(!window.BERLData?.news)return;
    try{
      const latest=sortRows(await BERLData.news()).slice(0,5);
      const sig=signature(latest);
      if(!force&&sig===currentSignature)return;
      currentSignature=sig;
      renderHero(latest);
      renderGrid(latest);
    }catch(err){
      console.warn('Homepage news refresh failed.',err);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>refresh(true),300));
  addEventListener('pageshow',()=>refresh(true));
  addEventListener('storage',e=>{
    if(e.key==='berl-news-revision'||e.key==='berl-public-news-v2')refresh(true);
  });
  addEventListener('berl:news-changed',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')refresh();
  });
  setInterval(()=>refresh(),30000);
})();
