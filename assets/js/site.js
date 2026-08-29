const BERL={
  async json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()},
  esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))},
  fmt(n){return Number(n||0).toLocaleString()},
  spritePos(i){const n=Math.max(0,Math.min(6,Number(i)||0));return `${(n*100/6).toFixed(4)}% center`},
  photo(img){img.onerror=null;img.src='assets/images/default-avatar.svg'},
  initMotion(){
    const targets=document.querySelectorAll('main section:not(.hero-award):not(.page-hero), .card, .publication, .article-block');
    targets.forEach(el=>el.classList.add('reveal'));
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -4% 0px'});
      targets.forEach(el=>io.observe(el));
    }else targets.forEach(el=>el.classList.add('in-view'));
  },
  initMenu(){
    const items=[...document.querySelectorAll('.nav-item.has-dropdown')];
    if(matchMedia('(max-width:900px)').matches){
      items.forEach(item=>item.querySelector(':scope > .nav-link').addEventListener('click',e=>{e.preventDefault();items.forEach(x=>{if(x!==item)x.classList.remove('open')});item.classList.toggle('open')}));
    }else{
      items.forEach(item=>{let timer;const open=()=>{clearTimeout(timer);item.classList.add('open')};const close=()=>{clearTimeout(timer);timer=setTimeout(()=>item.classList.remove('open'),420)};item.addEventListener('mouseenter',open);item.addEventListener('mouseleave',close);item.querySelector('.dropdown')?.addEventListener('mouseenter',open);item.querySelector('.dropdown')?.addEventListener('mouseleave',close)});
    }
  },
  injectAwardStyles(){
    ['assets/css/award-core.css?v=20260829','assets/css/award-pages.css?v=20260829'].forEach((href,i)=>{if(document.querySelector(`link[data-award="${i}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.award=String(i);document.head.appendChild(l)});
  },
  async loadResearchSprite(){
    try{
      const r=await fetch('assets/images/research-photo-sprite.jpg.base64.txt',{cache:'force-cache'});
      if(!r.ok) throw new Error('sprite '+r.status);
      const b64=(await r.text()).trim();
      document.documentElement.style.setProperty('--research-sprite',`url("data:image/jpeg;base64,${b64}")`);
      document.body.classList.add('photo-sprite-ready');
    }catch(e){console.warn('Research image sprite unavailable',e)}
  },
  async init(){
    this.injectAwardStyles();
    await this.loadResearchSprite();
    const cfg=await this.json('data/site.json');this.cfg=cfg;
    const page=document.body.dataset.page||'';
    const peopleItems=[['people.html#advisor','Advisor','Principal investigator'],['people.html#research-professors','Research Professors','Research faculty'],['people.html#postdoctoral-researchers','Postdoctoral Researchers','Postdoctoral scholars'],['people.html#phd-students','Ph.D. Students','Doctoral researchers'],['people.html#integrated-ms-phd-students','Integrated M.S./Ph.D.','Integrated degree researchers'],['people.html#ms-students','M.S. Students','Master’s degree researchers']];
    const nav=[
      {label:'About BERL',page:'about',url:'about.html'},
      {label:'Research',page:'research',url:'research.html',items:[['research.html','Research Areas','Six connected research themes'],['projects.html','Research Programs','Current research programs']]},
      {label:'People',page:'people',url:'people.html',items:peopleItems},
      {label:'Publications',page:'publications',url:'publications.html'},
      {label:'News',page:'news',url:'news.html'},
      {label:'Contact',page:'contact',url:'contact.html'}
    ];
    const navHTML=nav.map(n=>`<div class="nav-item ${n.items?'has-dropdown':''}"><a class="nav-link ${page===n.page?'active':''}" href="${n.url}">${n.label}${n.items?'<span class="nav-caret">▾</span>':''}</a>${n.items?`<div class="dropdown">${n.items.map(([u,t,d])=>`<a href="${u}"><strong>${this.esc(t)}</strong><span>${this.esc(d)}</span></a>`).join('')}</div>`:''}</div>`).join('');
    document.getElementById('site-header').innerHTML=`<header class="site-header" id="header"><div class="scroll-progress"><span id="scrollProgressBar"></span></div><div class="navbar"><a class="brand" href="index.html"><img src="assets/images/berl-mark.svg" alt="BERL"><span><span class="brand-name">BERL</span><span class="brand-sub">${this.esc(cfg.lab_name)}</span></span></a><nav class="nav-links" id="navLinks">${navHTML}</nav><div class="nav-tools"><a class="icon-btn" href="search.html" aria-label="Search">⌕</a><button class="icon-btn" id="themeBtn" aria-label="Toggle theme">◐</button><button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">☰</button></div></div></header>`;
    document.getElementById('site-footer').innerHTML=`<footer class="site-footer"><div class="container"><div class="footer-grid"><div><h4>${this.esc(cfg.short_name)} · ${this.esc(cfg.lab_name)}</h4><p>${this.esc(cfg.department)}<br>${this.esc(cfg.institution)}<br>${this.esc(cfg.city)}</p></div><div><h4>Explore</h4><p><a href="about.html">About BERL</a><br><a href="research.html">Research</a><br><a href="people.html">People</a><br><a href="publications.html">Publications</a><br><a href="news.html">News</a></p></div><div><h4>Connect</h4><p><a href="contact.html">Contact BERL</a><br><a href="mailto:${this.esc(cfg.contact_email)}">${this.esc(cfg.contact_email)}</a><br>${this.esc(cfg.telephone)}</p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${this.esc(cfg.copyright_name)}</span><span>Hanyang University · Seoul · Korea</span></div></div></footer>`;
    const header=document.getElementById('header'),bar=document.getElementById('scrollProgressBar');
    const updateScroll=()=>{const noDarkHero=!document.querySelector('.hero-award,.page-hero');header.classList.toggle('scrolled',scrollY>50||noDarkHero);const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);bar.style.transform=`scaleX(${Math.min(1,scrollY/max)})`;document.documentElement.style.setProperty('--parallax',`${Math.min(120,scrollY*.08)}px`)};
    addEventListener('scroll',updateScroll,{passive:true});updateScroll();
    const saved=localStorage.getItem('berl-theme');if(saved==='dark')document.body.classList.add('dark');
    document.getElementById('themeBtn').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('berl-theme',document.body.classList.contains('dark')?'dark':'light')};
    document.getElementById('menuBtn').onclick=()=>document.getElementById('navLinks').classList.toggle('open');
    this.initMenu();this.initMotion();
  }
};
document.addEventListener('DOMContentLoaded',()=>BERL.init().catch(console.error));
