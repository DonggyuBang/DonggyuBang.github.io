document.addEventListener('DOMContentLoaded',async()=>{
  const all=[...(await BERLData.news())].sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.created_at||'').localeCompare(String(a.created_at||'')));
  const id=new URLSearchParams(location.search).get('id'),n=all.find(x=>x.slug===id)||all[0];
  if(!n)return;
  document.title=`${n.title} | BERL`;
  const imageMap=['assets/images/generated/hero-clean-tech.png','assets/images/generated/research-bioenergy.png','assets/images/generated/research-remediation.png','assets/images/generated/research-microbial.png','assets/images/generated/research-circular.jpg','assets/images/generated/research-organic.jpg','assets/images/generated/research-ai.png'];

  function safeUrl(v,image=false){
    const s=String(v||'').trim();
    if(/^https?:\/\//i.test(s))return s;
    if(!image&&/^mailto:/i.test(s))return s;
    if(image&&/^(assets\/|\.\/|\.\.\/)/.test(s))return s;
    return'';
  }

  function sanitizeRich(raw){
    const box=document.createElement('div');box.innerHTML=String(raw||'');
    const allowed=new Set(['P','H2','H3','BR','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE','A','FIGURE','IMG','FIGCAPTION']);
    const walk=node=>{
      [...node.children].forEach(child=>{
        walk(child);
        if(!allowed.has(child.tagName)){child.replaceWith(...child.childNodes);return;}
        const href=child.tagName==='A'?safeUrl(child.getAttribute('href')):'';
        const src=child.tagName==='IMG'?safeUrl(child.getAttribute('src'),true):'';
        const alt=child.tagName==='IMG'?child.getAttribute('alt')||'':'';
        [...child.attributes].forEach(a=>child.removeAttribute(a.name));
        if(child.tagName==='A'&&href){child.setAttribute('href',href);child.setAttribute('target','_blank');child.setAttribute('rel','noopener')}
        if(child.tagName==='IMG'&&src){child.setAttribute('src',src);child.setAttribute('alt',alt);child.setAttribute('loading','lazy')}
        if(child.tagName==='IMG'&&!src)child.remove();
      });
    };
    walk(box);
    return box.innerHTML;
  }

  const block=b=>b.type==='rich'?`<div class="article-block article-rich">${sanitizeRich(b.html)}</div>`:b.type==='heading'?`<h2 class="article-block">${BERL.esc(b.text)}</h2>`:b.type==='paragraph'?`<p class="article-block">${BERL.esc(b.text)}</p>`:b.type==='bullets'?`<ul class="article-block">${(b.items||[]).map(x=>`<li>${BERL.esc(x)}</li>`).join('')}</ul>`:b.type==='image'?`<figure class="article-image article-block"><div style="background-image:url('${BERL.esc(b.url||imageMap[Math.max(0,Math.min(6,b.photo_index||0))])}')"></div>${b.caption?`<figcaption>${BERL.esc(b.caption)}</figcaption>`:''}</figure>`:'';
  const i=all.indexOf(n),newer=all[i-1],older=all[i+1];
  document.getElementById('news-article').innerHTML=`<div class="article-top"><a class="article-back" href="news.html">← News</a><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category)}</div><h1>${BERL.esc(n.title)}</h1><p class="article-lede">${BERL.esc(n.summary)}</p></div><div class="article-cover" style="background-image:url('${BERL.esc(n.image||'assets/images/generated/hero-landscape.png')}')"></div><article class="article-body">${(n.body||[]).map(block).join('')}</article><nav class="article-nav">${newer?`<a href="news-detail.html?id=${encodeURIComponent(newer.slug)}"><span>Newer</span><strong>← ${BERL.esc(newer.title)}</strong></a>`:'<span></span>'}${older?`<a class="next" href="news-detail.html?id=${encodeURIComponent(older.slug)}"><span>Older</span><strong>${BERL.esc(older.title)} →</strong></a>`:'<span></span>'}</nav>`;
});
