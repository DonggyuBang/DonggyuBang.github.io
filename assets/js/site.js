const BERL={
  async json(path){
    const r=await fetch(path);
    if(!r.ok)throw new Error(`${path}: ${r.status}`);
    return r.json();
  },

  esc(v=''){
    return String(v).replace(/[&<>"']/g,c=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'
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

  loadStyle(src,id){
    if(id&&document.getElementById(id))return;
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href=src;
    if(id)l.id=id;
    document.head.appendChild(l);
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

  async authClient(){
    if(this._authClient)return this._authClient;
    await this.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','berlSupabaseSdk');
    if(!window.BERL_SUPABASE?.url){
      await this.loadScript('assets/js/supabase-config.js?v=20260903perf1','berlSupabaseConfig');
    }
    const c=window.BERL_SUPABASE||{};
    if(!c.url||!c.publishableKey)throw new Error('BERL authentication is unavailable.');
    this._authClient=window.supabase.createClient(c.url,c.publishableKey);
    return this._authClient;
  },

  async sessionRole(sb){
    const {data:{session}}=await sb.auth.getSession();
    if(!session)return'guest';
    const adminResult=await sb.rpc('is_admin');
    if(!adminResult.error&&adminResult.data===true)return'admin';
    const managerResult=await sb.rpc('can_manage_content');
    if(!managerResult.error&&managerResult.data===true)return'content';
    return'none';
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

  configureContentAccess(button,sb){
    button.disabled=false;
    button.textContent='Manager';
    button.setAttribute('aria-label','Content manager menu');
    button.onclick=e=>{
      e.stopPropagation();
      document.getElementById('berl-content-menu')?.remove();
      const rect=button.getBoundingClientRect();
      const menu=document.createElement('div');
      menu.id='berl-content-menu';
      Object.assign(menu.style,{
        position:'fixed',
        top:`${Math.min(innerHeight-260,rect.bottom+10)}px`,
        right:`${Math.max(12,innerWidth-rect.right)}px`,
        zIndex:'30000',
        width:'230px',
        padding:'8px',
        border:'1px solid rgba(255,255,255,.16)',
        borderRadius:'14px',
        background:'#071d2a',
        boxShadow:'0 18px 50px rgba(0,0,0,.32)'
      });
      const itemStyle='display:block;padding:11px 12px;border-radius:9px;color:#fff;text-decoration:none;font:700 12px/1.35 Arial,sans-serif;';
      menu.innerHTML=`<a href="news.html" style="${itemStyle}">News</a><a href="people.html" style="${itemStyle}">People</a><a href="research.html" style="${itemStyle}">Research Areas</a><a href="projects.html" style="${itemStyle}">Projects</a><div style="height:1px;background:rgba(255,255,255,.12);margin:6px 4px"></div><button id="berl-content-logout" type="button" style="${itemStyle}width:100%;border:0;background:transparent;text-align:left;cursor:pointer;">Log out</button>`;
      document.body.appendChild(menu);
      menu.querySelector('#berl-content-logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
      setTimeout(()=>document.addEventListener('click',ev=>{if(!menu.contains(ev.target)&&ev.target!==button)menu.remove()},{once:true}),0);
    };
  },

  async openRoleLogin(button){
    document.querySelector('.berl-login-screen')?.remove();
    this.loadStyle('assets/css/inline-editor.css?v=20260903perf1','berl-role-login-css');
    let sb;
    try{sb=await this.authClient()}catch(err){console.error(err);return}
    const d=document.createElement('div');
    d.className='berl-login-screen';
    d.innerHTML=`<div class="berl-login-card"><button class="berl-login-close">×</button><div class="berl-login-brand">BERL</div><h2>Sign in</h2><p>Use an approved BERL account. Access is assigned automatically by account role.</p><label>Email<input id="beMail" type="email" autocomplete="username"></label><label>Password<input id="bePass" type="password" autocomplete="current-password"></label><button class="berl-login-submit">Sign in</button><div class="berl-login-msg"></div></div>`;
    document.body.append(d);
    d.querySelector('.berl-login-close').onclick=()=>d.remove();
    const submit=async()=>{
      const m=d.querySelector('.berl-login-msg');
      const submitButton=d.querySelector('.berl-login-submit');
      submitButton.disabled=true;
      m.textContent='Signing in…';
      try{
        const {error}=await sb.auth.signInWithPassword({
          email:d.querySelector('#beMail').value.trim(),
          password:d.querySelector('#bePass').value
        });
        if(error){m.textContent=error.message;return}
        const role=await this.sessionRole(sb);
        if(role==='admin'){
          d.remove();
          button.remove();
          await this.loadEditor(false);
          return;
        }
        if(role==='content'){
          d.remove();
          this.configureContentAccess(button,sb);
          location.reload();
          return;
        }
        await sb.auth.signOut();
        m.textContent='This account does not have BERL management permissions.';
      }catch(err){
        console.error(err);
        m.textContent=err?.message||'Unable to sign in.';
      }finally{
        submitButton.disabled=false;
      }
    };
    d.querySelector('.berl-login-submit').onclick=submit;
    d.querySelector('#bePass').addEventListener('keydown',e=>{if(e.key==='Enter')submit()});
    d.querySelector('#beMail').focus();
  },

  initEditorAccess(){
    if(document.body.dataset.noInlineEditor==='true')return;
    const n=document.querySelector('.nav-tools');
    if(!n||document.getElementById('berl-editor-loader')||document.getElementById('berl-header-admin'))return;

    const b=document.createElement('button');
    b.id='berl-editor-loader';
    b.type='button';
    b.textContent='Login';
    b.setAttribute('aria-label','BERL management login');
    Object.assign(b.style,{
      border:'1px solid rgba(255,255,255,.18)',
      background:'rgba(6,24,39,.72)',
      color:'#fff',
      borderRadius:'999px',
      padding:'9px 13px',
      font:'700 12px/1 Arial,sans-serif',
      cursor:'pointer'
    });
    b.onclick=()=>this.openRoleLogin(b);
    n.prepend(b);

    try{
      const c=window.BERL_SUPABASE||{};
      const ref=c.url?new URL(c.url).hostname.split('.')[0]:'';
      const hasSession=ref&&localStorage.getItem(`sb-${ref}-auth-token`);
      if(hasSession){
        const run=async()=>{
          try{
            const sb=await this.authClient();
            const role=await this.sessionRole(sb);
            if(role==='admin'){
              b.remove();
              await this.loadEditor(false);
            }else if(role==='content'){
              this.configureContentAccess(b,sb);
            }else if(role==='none'){
              await sb.auth.signOut();
            }
          }catch(err){console.error(err)}
        };
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

      const navLinks=document.getElementById('navLinks');
      document.querySelectorAll('#navLinks .dropdown a,#navLinks .nav-item:not(.has-dropdown)>.nav-link').forEach(link=>{
        link.addEventListener('click',()=>{
          navLinks?.classList.remove('open');
          document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
        });
      });

      document.addEventListener('keydown',e=>{
        if(e.key==='Escape'){
          navLinks?.classList.remove('open');
          items.forEach(x=>x.classList.remove('open'));
          document.getElementById('menuBtn')?.setAttribute('aria-expanded','false');
        }
      });
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

  fixMobileHash(){
    if(!matchMedia('(max-width:980px)').matches||!location.hash)return;
    const scrollToHash=()=>{
      try{
        const target=document.querySelector(location.hash);
        if(target)target.scrollIntoView({block:'start'});
      }catch{}
    };
    [80,350,850].forEach(ms=>setTimeout(scrollToHash,ms));
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
      this.loadStyle('assets/css/mobile.css?v=20260910mobile1','berl-mobile-css');

      const cfg=await this.json('data/site.json');
      this.cfg=cfg;
      const page=document.body.dataset.page||'';

      const nav=[
        {label:'About BERL',page:'about',url:'about.html'},
        {label:'Research',page:'research',url:'research.html',items:[
          ['research.html','Research Areas','Core research themes'],
          ['projects.html','Projects','Current BERL research projects']
        ]},
        {label:'People',page:'people',url:'people.html',items:[
          ['people.html#advisor','Advisor','Principal investigator'],
          ['people.html#research-professors','Research Professors','Research faculty'],
          ['people.html#postdoctoral-researchers','Postdoctoral Researchers','Postdoctoral scholars'],
          ['people.html#phd-students','Ph.D. Students','Doctoral researchers'],
          ['people.html#integrated-ms-phd-students','Integrated M.S./Ph.D. Students','Integrated degree researchers'],
          ['people.html#ms-students','M.S. Students','Master’s researchers'],
          ['people.html#administrative-staff','Administrative Staff','Laboratory administration'],
          ['people.html#alumni','Alumni','Former BERL members']
        ]},
        {label:'Publications',page:'publications',url:'publications.html'},
        {label:'News',page:'news',url:'news.html'},
        {label:'Contact',page:'contact',url:'contact.html'}
      ];

      document.getElementById('site-header').innerHTML=`<header class="site-header"><div class="scroll-progress"><span id="scrollProgressBar"></span></div><div class="navbar"><a class="brand" href="index.html"><img src="assets/images/berl-mark.svg" alt="BERL"><span><span class="brand-name">BERL</span><span class="brand-sub">${this.esc(cfg.lab_name)}</span></span></a><nav class="nav-links" id="navLinks">${nav.map(n=>`<div class="nav-item ${n.items?'has-dropdown':''}"><a class="nav-link ${page===n.page?'active':''}" href="${n.url}">${n.label}${n.items?'<span class="nav-caret">⌄</span>':''}</a>${n.items?`<div class="dropdown">${n.items.map(([u,t,d])=>`<a href="${u}"><strong>${this.esc(t)}</strong><span>${this.esc(d)}</span></a>`).join('')}</div>`:''}</div>`).join('')}</nav><div class="nav-tools"><a class="icon-btn" href="search.html" aria-label="Search">⌕</a><button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false">☰</button></div></div></header>`;

      document.getElementById('site-footer').innerHTML=`<footer class="site-footer"><div class="container"><div class="footer-grid"><div><h4>BERL</h4><p>${this.esc(cfg.lab_name)}<br>${this.esc(cfg.department)}<br>${this.esc(cfg.institution)}</p></div><div><h4>Explore</h4><p><a href="about.html">About</a><br><a href="research.html">Research</a><br><a href="people.html">People</a><br><a href="publications.html">Publications</a><br><a href="news.html">News</a></p></div><div><h4>Contact</h4><p><a href="mailto:${this.esc(cfg.contact_email)}">${this.esc(cfg.contact_email)}</a><br>${this.esc(cfg.telephone)}<br>Seoul, Republic of Korea</p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} BERL</span><span>Hanyang University</span></div></div></footer>`;

      document.getElementById('menuBtn').onclick=()=>{
        const navLinks=document.getElementById('navLinks');
        const isOpen=navLinks.classList.toggle('open');
        document.getElementById('menuBtn').setAttribute('aria-expanded',String(isOpen));
      };
      this.initMenu();
      this.initMotion();

      await this.syncCms();
      this.initEditorAccess();
      this.fixMobileHash();
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