document.addEventListener('DOMContentLoaded',async()=>{
  const input=document.getElementById('site-search'),results=document.getElementById('search-results');
  const qp=new URLSearchParams(location.search).get('q');if(qp)input.value=qp;
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const text=v=>Array.isArray(v)?v.map(text).join(' '):(v&&typeof v==='object'?Object.values(v).map(text).join(' '):clean(v));
  const stripHtml=s=>{const d=document.createElement('div');d.innerHTML=String(s||'');return clean(d.textContent||'')};
  const norm=s=>clean(s).normalize('NFKC').toLocaleLowerCase('ko-KR');
  const words=s=>norm(s).split(/[\s,./()\[\]{}:;·&|+_-]+/).filter(Boolean);
  const synonyms={
    '혐기성':'anaerobic','혐기성소화':'anaerobic digestion','소화':'digestion','바이오가스':'biogas','메탄':'methane','공동소화':'co-digestion codigestion','전처리':'pretreatment',
    '자원회수':'resource recovery','폐기물':'waste','폐배터리':'spent battery battery recycling','배터리':'battery batteries','리튬':'lithium','금속':'metal metals',
    '미생물':'microbial microbiome microorganism','미생물군집':'microbial community microbiome','군집':'community microbiome','다중오믹스':'multi-omics multiomics','메타오믹스':'meta-omics multi-omics',
    '효소':'enzyme','생분해':'biodegradation biodegradable','플라스틱':'plastic polymer','생분해플라스틱':'biodegradable plastic','유기물':'organic matter','용존유기물':'dissolved organic matter DOM',
    '퇴비화':'composting','질소':'nitrogen','흡착':'adsorption','수처리':'water treatment','오염물질':'contaminant remediation','환경복원':'environmental remediation','복원':'remediation',
    '탄소':'carbon','이산화탄소':'carbon dioxide CO2','촉매':'catalyst catalytic','전기화학':'electrochemical','바이오에너지':'bioenergy','재생에너지':'renewable energy',
    '인공지능':'AI artificial intelligence','에이아이':'AI artificial intelligence','머신러닝':'machine learning','기계학습':'machine learning','데이터':'data data-driven','최적화':'optimization','예측':'prediction modeling',
    '연구':'research','연구분야':'research areas','프로젝트':'projects research program','과제':'projects research program','논문':'publication publications paper','출판':'publication publications','뉴스':'news journal',
    '사람':'people member researcher','연구원':'people researcher member','교수':'professor advisor','박사':'Ph.D. doctoral','석사':'M.S. master','행정':'administrative staff','직원':'administrative staff','동문':'alumni',
    '연락처':'contact email phone','문의':'contact inquiry','주소':'contact location','소개':'about BERL','연구실':'BERL laboratory lab','한양대':'Hanyang University','한양대학교':'Hanyang University','자원환경공학과':'Earth Resources Environmental Engineering'
  };
  function queryGroups(q){
    const base=norm(q),rawWords=words(base),groups=[];
    for(const w of rawWords){const g=new Set([w]);Object.entries(synonyms).forEach(([ko,en])=>{const k=norm(ko);if(w===k||w.includes(k)||k.includes(w))words(en).forEach(x=>g.add(x))});groups.push([...g])}
    Object.entries(synonyms).forEach(([ko,en])=>{const k=norm(ko);if(base.includes(k)&&!rawWords.includes(k))groups.push([k,...words(en)])});
    return groups;
  }
  const items=[];const add=item=>{const title=clean(item.title),desc=clean(item.desc),extra=clean(item.extra),url=item.url||'#';if(!title&&!desc&&!extra)return;items.push({...item,title,desc,extra,url,haystack:norm(`${item.type||''} ${title} ${desc} ${extra}`)})};
  const staticPages=[['Home','index.html'],['About','about.html'],['Research','research.html'],['Projects','projects.html'],['People','people.html'],['Publications','publications.html'],['News','news.html'],['Contact','contact.html']];
  async function indexStaticPage(type,url){try{const r=await fetch(url,{cache:'no-store'});if(!r.ok)return;const d=new DOMParser().parseFromString(await r.text(),'text/html');d.querySelectorAll('script,style,noscript,svg').forEach(x=>x.remove());const main=d.querySelector('main'),title=clean(d.querySelector('title')?.textContent||type),body=clean(main?.textContent||'');add({type:`Page · ${type}`,title,desc:body.slice(0,700),extra:body,url});[...(main?.querySelectorAll('section')||[])].forEach(s=>{const h=clean(s.querySelector('h1,h2,h3')?.textContent||''),t=clean(s.textContent||'');if(!h||t.length<15)return;add({type:`${type} section`,title:h,desc:t.slice(0,500),extra:t,url:`${url}${s.id?`#${encodeURIComponent(s.id)}`:''}`})})}catch(e){console.warn('Static page search indexing failed:',url,e)}}
  const safe=async(fn,fallback)=>{try{const v=await fn();return Array.isArray(v)?v:[]}catch{return fallback?fallback():[]}};
  const [pubs,members,research,projects,news]=await Promise.all([
    BERL.json('data/publications.json').catch(()=>[]),
    safe(()=>window.BERLPeople.rows(),()=>BERL.json('data/members.json')),
    safe(()=>window.BERLContent.rows('research'),()=>BERL.json('data/research.json')),
    safe(()=>window.BERLContent.rows('projects'),()=>BERL.json('data/projects.json')),
    safe(()=>window.BERLData.news(),()=>BERL.json('data/news.json'))
  ]);
  pubs.forEach(x=>add({type:'Publication',title:x.title,desc:[text(x.authors),x.journal,x.year,x.type].filter(Boolean).join(' · '),extra:text(x),url:x.doi?`https://doi.org/${x.doi}`:'publications.html'}));
  members.forEach(x=>add({type:`People${x.group?` · ${x.group}`:''}`,title:x.name,desc:[x.position,x.affiliation,x.department,text(x.research_interests)].filter(Boolean).join(' · '),extra:[x.bio,x.degree_program,x.research_topic,x.office,x.joined,text(x.education),x.email].filter(Boolean).join(' '),url:`member.html?id=${encodeURIComponent(x.slug||x.id)}`}));
  research.forEach(x=>add({type:'Research',title:x.title,desc:[x.tag,x.summary,text(x.topics)].filter(Boolean).join(' · '),extra:text(x),url:`research.html#${encodeURIComponent(x.slug||'')}`}));
  projects.forEach(x=>add({type:'Project',title:x.title,desc:[x.status,x.period,x.host_institution||x.host,x.principal_investigator||x.pi,x.summary,text(x.keywords)].filter(Boolean).join(' · '),extra:text(x),url:'projects.html'}));
  news.forEach(x=>add({type:'News',title:x.title,desc:[x.date,x.category,x.summary].filter(Boolean).join(' · '),extra:[text(x.body),text(x)].join(' '),url:`news-detail.html?id=${encodeURIComponent(x.slug||x.id)}`}));
  await Promise.all(staticPages.map(([t,u])=>indexStaticPage(t,u)));
  try{const cfg=window.BERL_SUPABASE||{};if(cfg.url&&cfg.publishableKey){const headers={apikey:cfg.publishableKey,Accept:'application/json'};const [or,bl]=await Promise.all([fetch(`${cfg.url}/rest/v1/site_overrides?select=page_path,content_text,content_html&is_hidden=eq.false`,{headers,cache:'no-store',credentials:'omit'}).then(r=>r.ok?r.json():[]).catch(()=>[]),fetch(`${cfg.url}/rest/v1/site_blocks?select=page_path,text_content,html&is_published=eq.true`,{headers,cache:'no-store',credentials:'omit'}).then(r=>r.ok?r.json():[]).catch(()=>[])]);[...or,...bl].forEach(r=>{const page=(r.page_path||'/').replace(/^\//,'')||'index.html',content=clean(r.content_text||r.text_content||stripHtml(r.content_html||r.html||''));if(content)add({type:'Page content',title:content.slice(0,90),desc:content.slice(0,500),extra:content,url:page})})}}catch(e){console.warn('CMS search indexing failed',e)}
  const dedupe=new Map();for(const x of items){const k=`${x.url}|${x.title}`,old=dedupe.get(k);if(!old||x.haystack.length>old.haystack.length)dedupe.set(k,x)}const index=[...dedupe.values()];
  function score(item,groups,raw){let s=0;const title=norm(item.title),desc=norm(item.desc),hay=item.haystack;if(raw&&title===raw)s+=120;if(raw&&title.includes(raw))s+=55;if(raw&&desc.includes(raw))s+=22;for(const group of groups){const hits=group.filter(t=>t&&hay.includes(t));if(!hits.length)return 0;let best=0;for(const t of hits){let p=5;if(title===t)p=50;else if(title.includes(t))p=24;else if(desc.includes(t))p=10;best=Math.max(best,p)}s+=best}if(/^research|^people|^project|^publication|^news/i.test(item.type||''))s+=2;return s}
  function render(){const q=input.value.trim();if(!q){results.innerHTML='';return}const raw=norm(q),groups=queryGroups(q);const out=index.map(x=>({x,s:score(x,groups,raw)})).filter(r=>r.s>0).sort((a,b)=>b.s-a.s||a.x.title.localeCompare(b.x.title,'ko')).slice(0,100);results.innerHTML=out.length?`<div class="search-meta">${BERL.esc(q)} · ${out.length} result${out.length===1?'':'s'}</div>`+out.map(({x})=>`<article class="search-result"><div class="type">${BERL.esc(x.type)}</div><h3><a href="${BERL.esc(x.url)}">${BERL.esc(x.title)}</a></h3><div class="small muted">${BERL.esc((x.desc||x.extra||'').slice(0,360))}</div></article>`).join(''):'<div class="empty">검색 결과가 없습니다. 다른 한국어 또는 영어 검색어를 입력해 보세요.</div>'}
  input.addEventListener('input',render);input.addEventListener('keydown',e=>{if(e.key==='Enter'){const u=new URL(location.href);u.searchParams.set('q',input.value.trim());history.replaceState(null,'',u)}});render();
});