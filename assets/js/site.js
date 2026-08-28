const BERL={
  async json(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()},
  esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))},
  fmt(n){return Number(n||0).toLocaleString()},
  photo(img){img.onerror=null;img.src="assets/images/default-avatar.svg"},
  spritePos(i){return `${Math.max(0,Math.min(5,Number(i)||0))*20}% center`},
  async loadResearchSprite(){
    try{
      const r=await fetch("assets/images/research-photo-sprite.jpg.base64.txt",{cache:"force-cache"});
      if(!r.ok)return;
      const b64=(await r.text()).trim();
      document.documentElement.style.setProperty("--research-sprite",`url("data:image/jpeg;base64,${b64}")`);
      document.body.classList.add("photo-sprite-ready");
    }catch(e){console.warn("Research photo sprite unavailable",e)}
  },
  initMotion(){
    const targets=document.querySelectorAll("main section:not(.hero-showcase):not(.page-hero), .card, .metric, .publication");
    targets.forEach(el=>el.classList.add("reveal"));
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in-view");io.unobserve(e.target)}}),{threshold:.12,rootMargin:"0px 0px -5% 0px"});
    targets.forEach(el=>io.observe(el));
    const bar=document.getElementById("scrollProgressBar");
    const update=()=>{
      const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
      const p=Math.min(1,scrollY/max);
      if(bar)bar.style.transform=`scaleX(${p})`;
      document.documentElement.style.setProperty("--scroll-shift",`${Math.min(70,scrollY*.06)}px`);
    };
    addEventListener("scroll",update,{passive:true});update();
  },
  initMenu(){
    const items=[...document.querySelectorAll(".nav-item.has-dropdown")];
    if(window.matchMedia("(max-width:980px)").matches){
      items.forEach(item=>{
        const link=item.querySelector(":scope > .nav-link");
        link.addEventListener("click",e=>{e.preventDefault();items.forEach(x=>{if(x!==item)x.classList.remove("open")});item.classList.toggle("open")});
      });
    }else{
      items.forEach(item=>{
        let timer;
        item.addEventListener("mouseenter",()=>{clearTimeout(timer);item.classList.add("open")});
        item.addEventListener("mouseleave",()=>{timer=setTimeout(()=>item.classList.remove("open"),260)});
        const menu=item.querySelector(".dropdown");
        menu?.addEventListener("mouseenter",()=>clearTimeout(timer));
        menu?.addEventListener("mouseleave",()=>{timer=setTimeout(()=>item.classList.remove("open"),260)});
      });
    }
  },
  async init(){
    const cfg=await this.json("data/site.json");this.cfg=cfg;
    const page=document.body.dataset.page||"";
    const peopleItems=[
      ["people.html#advisor","Advisor","Principal investigator"],
      ["people.html#ms-students","M.S. Students","Master's degree researchers"],
      ["people.html#phd-students","Ph.D. Students","Doctoral researchers"],
      ["people.html#integrated-ms-phd-students","Integrated M.S./Ph.D.","Integrated degree researchers"],
      ["people.html#postdoctoral-researchers","Postdoctoral Researchers","Postdoctoral scholars"],
      ["people.html#research-professors","Research Professors","Research faculty"]
    ];
    const nav=[
      {label:"About BERL",page:"about",url:"about.html"},
      {label:"Research",page:"research",url:"research.html",items:[["research.html","Research Areas","Six core research themes"],["projects.html","Research Programs","Current BERL research programs"]]},
      {label:"People",page:"people",url:"people.html",items:peopleItems},
      {label:"Publications",page:"publications",url:"publications.html"},
      {label:"News",page:"news",url:"news.html"},
      {label:"Contact",page:"contact",url:"contact.html"}
    ];
    const navHtml=nav.map(n=>`<div class="nav-item ${n.items?"has-dropdown":""}"><a class="nav-link ${page===n.page?"active":""}" href="${n.url}">${n.label}${n.items?'<span class="nav-caret">▾</span>':""}</a>${n.items?`<div class="dropdown">${n.items.map(([u,t,d])=>`<a href="${u}"><strong>${this.esc(t)}</strong><span>${this.esc(d)}</span></a>`).join("")}</div>`:""}</div>`).join("");
    document.getElementById("site-header").innerHTML=`<header class="site-header"><div class="scroll-progress"><span id="scrollProgressBar"></span></div><div class="container navbar"><a class="brand" href="index.html"><img src="assets/images/berl-mark.svg" alt="BERL"><span><span class="brand-name">BERL</span><span class="brand-sub">${this.esc(cfg.lab_name)}</span></span></a><nav class="nav-links" id="navLinks">${navHtml}</nav><div class="nav-tools"><a class="icon-btn" href="search.html" aria-label="Search">⌕</a><button class="icon-btn" id="themeBtn" aria-label="Toggle theme">◐</button><button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">☰</button></div></div></header>`;
    document.getElementById("site-footer").innerHTML=`<footer class="site-footer"><div class="container"><div class="footer-grid"><div><h4>${this.esc(cfg.short_name)} · ${this.esc(cfg.lab_name)}</h4><p>${this.esc(cfg.department)}<br>${this.esc(cfg.institution)}<br>${this.esc(cfg.city)}</p></div><div><h4>Explore</h4><p><a href="about.html">About BERL</a><br><a href="research.html">Research</a><br><a href="people.html">People</a><br><a href="publications.html">Publications</a><br><a href="news.html">News</a></p></div><div><h4>Connect</h4><p><a href="contact.html">Contact BERL</a><br><a href="mailto:${this.esc(cfg.contact_email)}">${this.esc(cfg.contact_email)}</a><br>${this.esc(cfg.telephone)}</p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${this.esc(cfg.copyright_name)}. All rights reserved.</span><span>Hanyang University · GitHub Pages</span></div></div></footer>`;
    const saved=localStorage.getItem("berl-theme");if(saved==="dark")document.body.classList.add("dark");
    document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("berl-theme",document.body.classList.contains("dark")?"dark":"light")};
    document.getElementById("menuBtn").onclick=()=>document.getElementById("navLinks").classList.toggle("open");
    await this.loadResearchSprite();
    this.initMenu();this.initMotion();
  }
};
document.addEventListener("DOMContentLoaded",()=>BERL.init().catch(console.error));
