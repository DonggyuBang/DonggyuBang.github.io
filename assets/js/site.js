const BERL={
  async json(path){
    const r=await fetch(path);
    if(!r.ok)throw new Error(`${path}: ${r.status}`);
    return r.json();
  },

  esc(v=''){
    return String(v).replace(/[&<>"']/g,c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[c]));
  },

  fmt(n){return Number(n||0).toLocaleString()},

  photo(img){
    img.onerror=null;
    img.src='assets/images/default-avatar.svg';
  },

  loadScript(src,id){
    return new Promise((resolve,reject)=>{
      if(id&&document.getElementById(id))return resolve();
      const s=document.createElement('script');
      if(id)s.id=id;
      s.src=src;
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
  },

  cmsPath(){
    return location.pathname.endsWith('/')?location.pathname+'index.html':location.pathname;
  },

  cmsStyle(e,o={}){
    Object.entries(o||{}).forEach(([k,v])=>{
      if(v==null)return;
      k.startsWith('--')?e.style.setProperty(k,v):(k in e.style&&(e.style[k]=v));
    });
  },

  cmsPutText(e,t){
    t=String(t??'').replace(/\r/g,'');
    const cur=String(e?.innerText??e?.textContent??'').replace(/\u00a0/g,' ');
    if(cur===t)return;
    e.replaceChildren();
    t.split('\n').forEach((x,i)=>{
      if(i)e.append(document.createElement('br'));
      e.append(document.createTextNode(x));
    });
  },

  cmsBlock(r){
    let e;
    const t=r.block_type||'legacy';
    if(t==='text_box'){
      e=document.createElement('div');
      e.className='berl-cms-block berl-free-item berl-text-box';
      e.textContent=r.text_content||'Text box';
    }else if(t==='heading'){
      e=document.createElement('h2');
      e.className='berl-cms-block berl-free-item berl-heading-box';
      e.textContent=r.text_content||'Heading';
    }else if(t==='button'){
      e=document.createElement('a');
      e.className='berl-cms-block berl-free-item btn btn-primary';
      e.href=r.href||'#';
      e.textContent=r.text_content||'Button';
    }else if(t==='image'){
      e=document.createElement('img');
      e.className='berl-cms-block berl-free-item berl-image-box';
      e.src=r.image_url||'';
      e.alt=r.text_content||'';
    }else if(t==='box'){
      e=document.createElement('div');
      e.className='berl-cms-block berl-free-item berl-shape-box';
      e.textContent=r.text_content||'';
    }else if(t==='card'){
      e=document.createElement('div');
      e.className='berl-cms-block berl-free-item card berl-card-box';
      e.textContent=r.text_content||'Card text';
    }else if(t==='divider'){
      e=document.createElement('div');
      e.className='berl-cms-block berl-free-item berl-divider-box';
    }else if(t==='spacer'){
      e=document.createElement('div');
      e.className='berl-cms-block berl-free-item berl-spacer-box';
    }else{
      const h=document.createElement('div');
      h.innerHTML=(r.html||'').trim();
      e=h.firstElementChild||document.createElement('div');
      e.classList.add('berl-cms-block');
    }
    e.dataset.berlBlockKey=r.block_key;
    e.dataset.berlBlockType=t;
    this.cmsStyle(e,r.styles);
    return e;
  },

  cmsApplyOverride(r){
    if(!r?.selector||r.selector.startsWith('[data-berl-block-key='))return;
    let e;
    try{e=document.querySelector(r.selector)}catch{return}
    if(!e)return;
    if(r.content_text!=null)this.cmsPutText(e,r.content_text);
    else if(r.content_html!=null)e.innerHTML=r.content_html;
    if(r.href!=null&&'href'in e)e.href=r.href;
    if(r.image_url!=null){
      if(e.tagName==='IMG')e.src=r.image_url;
      else e.style.backgroundImage=`url("${String(r.image_url).replace(/"/g,'\\"')}")`;
    }
    this.cmsStyle(e,r.styles);
    e.classList.toggle('berl-hidden-by-editor',!!r.is_hidden);
  },

  cmsApplyBlock(r){
    if(!r?.block_key)return;
    const key=window.CSS?.escape?CSS.escape(r.block_key):r.block_key;
    document.querySelector(`[data-berl-block-key="${key}"]`)?.remove();
    if(r.is_published===false)return;
    let a;
    try{a=document.querySelector(r.anchor_selector)}catch{}
    a=a||document.querySelector('main>section:last-of-type')||document.querySelector('main');
    if(!a)return;
    const e=this.cmsBlock(r);
    r.position==='before'?a.before(e):
    r.position==='prepend'?a.prepend(e):
    r.position==='append'?a.append(e):a.after(e);
  },

  cmsApply(rows){
    (rows.blocks||[]).forEach(r=>this.cmsApplyBlock(r));
    (rows.overrides||[]).forEach(r=>this.cmsApplyOverride(r));
  },

  async cmsFetch(table,path,order=''){
    const c=window.BERL_SUPABASE||{};
    if(!c.url||!c.publishableKey)return[];
    const u=new URL(`${c.url}/rest/v1/${table}`);
    u.searchParams.set('select','*');
    u.searchParams.set('page_path',`eq.${path}`);
    if(order)u.searchParams.set('order',order);

    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),1500);
    try{
      const r=await fetch(u,{
        headers:{apikey:c.publishableKey},
        cache:'no-store',
        signal:ctl.signal
      });
      if(!r.ok)throw new Error(`${table}: ${r.status}`);
      return r.json();
    }finally{
      clearTimeout(timer);
    }
  },

  async syncCms(){
    const path=this.cmsPath();
    try{
      if(!window.BERL_SUPABASE?.url){
        await this.loadScript('assets/js/supabase-config.js?v=20260903perf1','berlSupabaseConfig');
      }
      const c=window.BERL_SUPABASE||{};
      if(!c.url||!c.publishableKey)return;

      try{sessionStorage.removeItem(`berl-cms:${path}`)}catch{}

      const [overrides,blocks]=await Promise.all([
        this.cmsFetch('site_overrides',path),
        this.cmsFetch('site_blocks',path,'sort_order.asc')
      ]);
      const rows={overrides,blocks};
      this.cmsApply(rows);

      [80,260,700].forEach(ms=>setTimeout(()=>this.cmsApply(rows),ms));
    }catch(err){
      if(err?.name!=='AbortError')console.warn('BERL CMS preload unavailable; showing static fallback.',err);
    }finally{
      document.documentElement.classList.add('berl-cms-ready');
    }
  },

  async loadEditor(openLogin=false){
    if(this._editorPromise){
      await this._editorPromise;
    }else{
      this._editorPromise=(async()=>{
        if(!document.querySelector('link[data-inline-editor]')){
          const l=document.createElement('link');
          l.rel='stylesheet';
          l.href='assets/css/inline-editor.css?v=20260903perf1';
          l.dataset.inlineEditor='1';
          document.head.appendChild(l);
        }
        await this.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','berlSupabaseSdk');
        if(!window.BERL_SUPABASE?.url){
          await this.loadScript('assets/js/supabase-config.js?v=20260903perf1','berlSupabaseConfig');
        }
        await this.loadScript('assets/js/editor-keys.js?v=20260902k','berlEditorKeys');
        await this.loadScript('assets/js/inline-editor.js?v=20260903perf1','berlInlineEditor');
        const b=document.getElementById('berl-header-admin');
        if(b&&b.textContent==='Admin')b.textContent='Login';
      })();
      await this._editorPromise;
    }

    if(openLogin){
      setTimeout(()=>{
        const b=document.getElementById('berl-header-admin');
        if(b&&b.textContent!=='Editor')b.click();
      },220);
    }
  },

  initEditorAccess(){
    if(document.body.dataset.noInlineEditor==='true')return;
    const n=document.querySelector('.nav-tools');
    if(!n||document.getElementById('berl-editor-loader')||document.getElementById('berl-header-admin'))return;

    const b=document.createElement('button');
    b.id='berl-editor-loader';
    b.type='button';
    b.textContent='Login';
    b.setAttribute('aria-label','Website editor login');
    Object.assign(b.style,{
      border:'1px solid rgba(255,255,255,.18)',
      background:'rgba(6,24,39,.72)',
      color:'#fff',
      borderRadius:'999px',
      padding:'9px 13px',
      font:'700 12px/1 Arial,sans-serif',
      cursor:'pointer'
    });
    b.onclick=async()=>{
      b.disabled=true;
      b.textContent='Loading…';
      b.remove();
      try{await this.loadEditor(true)}
      catch(err){console.error(err);location.reload()}
    };
    n.prepend(b);

    try{
      const c=window.BERL_SUPABASE||{};
      const ref=c.url?new URL(c.url).hostname.split('.')[0]:'';
      const hasSession=ref&&localStorage.getItem(`sb-${ref}-auth-token`);
      if(hasSession){
        b.remove();
        const run=()=>this.loadEditor(false).catch(console.error);
        if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:1000});
        else setTimeout(run,250);
      }
    }catch{}
  },

  initMotion(){
    const header=document.querySelector('.site-header');
    const bar=document.getElementById('scrollProgressBar');
    const glow=document.createElement('div');
    glow.className='cursor-glow';
    document.body.appendChild(glow);

    if(matchMedia('(pointer:fine)').matches){
      addEventListener('pointermove',e=>{
        glow.style.left=e.clientX+'px';
        glow.style.top=e.clientY+'px';
        glow.style.opacity='1';
      });
    }

    const reveal=document.querySelectorAll(
      'main section:not(.hero-showcase):not(.page-hero):not(.contact-award):not(.publication-browser),.card,.metric,.article-block'
    );
    reveal.forEach(el=>el.classList.add('reveal'));

    if('IntersectionObserver'in window){
      const io=new IntersectionObserver(es=>es.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      }),{threshold:.04,rootMargin:'0px 0px -3%'});
      reveal.forEach(x=>io.observe(x));
    }else{
      reveal.forEach(x=>x.classList.add('in-view'));
    }

    const onScroll=()=>{
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
      const p=scrollY/max;
      if(bar)bar.style.transform=`scaleX(${p})`;
      header?.classList.toggle('scrolled',scrollY>24);
    };
    addEventListener('scroll',onScroll,{passive:true});
    onScroll();
  },

  initMenu(){
    const items=[...document.querySelectorAll('.nav-item.has-dropdown')];
    if(matchMedia('(max-width:980px)').matches){
      items.forEach(item=>item.querySelector(':scope>.nav-link').addEventListener('click',e=>{
        e.preventDefault();
        items.forEach(x=>x!==item&&x.classList.remove('open'));
        item.classList.toggle('open');
      }));
    }else{
      items.forEach(item=>{
        let t;
        const open=()=>{clearTimeout(t);item.classList.add('open')};
        const close=()=>t=setTimeout(()=>item.classList.remove('open'),420);
        item.addEventListener('mouseenter',open);
        item.addEventListener('mouseleave',close);
        item.querySelector('.dropdown')?.addEventListener('mouseenter',open);
        item.querySelector('.dropdown')?.addEventListener('mouseleave',close);
      });
    }
  },

  async init(){
    const failSafe=setTimeout(()=>document.documentElement.classList.add('berl-cms-ready'),750);
    try{
      if(!document.querySelector('link[data-editorial]')){
        const l=document.createElement('link');
        l.rel='stylesheet';
        l.href='assets/css/editorial.css?v=20260903sync1';
        l.dataset.editorial='1';
        document.head.appendChild(l);
      }
      if(!document.querySelector('link[data-polish]')){
        const l=document.createElement('link');
        l.rel='stylesheet';
        l.href='assets/css/polish.css?v=20260903about3';
        l.dataset.polish='1';
        document.head.appendChild(l);
      }

      const cfg=await this.json('data/site.json');
      this.cfg=cfg;
      const page=document.body.dataset.page||'';

      const nav=[
        {label:'About BERL',page:'about',url:'about.html'},
        {label:'Research',page:'research',url:'research.html',items:[
          ['research.html','Research Areas','Six core research themes'],
          ['projects.html','Projects','Current BERL research projects']
        ]},
        {label:'People',page:'people',url:'people.html',items:[
          ['people.html#advisor','Advisor','Principal investigator'],
          ['people.html#research-professors','Research Professors','Research faculty'],
          ['people.html#postdoctoral-researchers','Postdoctoral Researchers','Postdoctoral scholars'],
          ['people.html#phd-students','Ph.D. Students','Doctoral researchers'],
          ['people.html#integrated-ms-phd-students','Integrated M.S./Ph.D. Students','Integrated degree researchers'],
          ['people.html#ms-students','M.S. Students','Master’s researchers'],
          ['people.html#alumni','Alumni','Former BERL members']
        ]},
        {label:'Publications',page:'publications',url:'publications.html'},
        {label:'News',page:'news',url:'news.html'},
        {label:'Contact',page:'contact',url:'contact.html'}
      ];

      document.getElementById('site-header').innerHTML=`<header class="site-header"><div class="scroll-progress"><span id="scrollProgressBar"></span></div><div class="navbar"><a class="brand" href="index.html"><img src="assets/images/berl-mark.svg" alt="BERL"><span><span class="brand-name">BERL</span><span class="brand-sub">${this.esc(cfg.lab_name)}</span></span></a><nav class="nav-links" id="navLinks">${nav.map(n=>`<div class="nav-item ${n.items?'has-dropdown':''}"><a class="nav-link ${page===n.page?'active':''}" href="${n.url}">${n.label}${n.items?'<span class="nav-caret">⌄</span>':''}</a>${n.items?`<div class="dropdown">${n.items.map(([u,t,d])=>`<a href="${u}"><strong>${this.esc(t)}</strong><span>${this.esc(d)}</span></a>`).join('')}</div>`:''}</div>`).join('')}</nav><div class="nav-tools"><a class="icon-btn" href="search.html" aria-label="Search">⌕</a><button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">☰</button></div></div></header>`;

      document.getElementById('site-footer').innerHTML=`<footer class="site-footer"><div class="container"><div class="footer-grid"><div><h4>BERL</h4><p>${this.esc(cfg.lab_name)}<br>${this.esc(cfg.department)}<br>${this.esc(cfg.institution)}</p></div><div><h4>Explore</h4><p><a href="about.html">About</a><br><a href="research.html">Research</a><br><a href="people.html">People</a><br><a href="publications.html">Publications</a><br><a href="news.html">News</a></p></div><div><h4>Contact</h4><p><a href="mailto:${this.esc(cfg.contact_email)}">${this.esc(cfg.contact_email)}</a><br>${this.esc(cfg.telephone)}<br>Seoul, Republic of Korea</p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} BERL</span><span>Hanyang University</span></div></div></footer>`;

      document.getElementById('menuBtn').onclick=()=>document.getElementById('navLinks').classList.toggle('open');
      this.initMenu();
      this.initMotion();

      await this.syncCms();
      this.initEditorAccess();
    }finally{
      clearTimeout(failSafe);
      document.documentElement.classList.add('berl-cms-ready');
    }
  }
};

document.addEventListener('DOMContentLoaded',()=>BERL.init().catch(err=>{
  console.error(err);
  document.documentElement.classList.add('berl-cms-ready');
}));
