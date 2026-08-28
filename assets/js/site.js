const BERL={
  async json(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()},
  esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))},
  fmt(n){return Number(n||0).toLocaleString()},
  photo(img){img.onerror=null;img.src="assets/images/default-avatar.svg"},
  initMenu(){
    if(!window.matchMedia("(max-width: 980px)").matches)return;
    document.querySelectorAll(".nav-item.has-dropdown > .nav-link").forEach(link=>{
      link.addEventListener("click",e=>{
        e.preventDefault();
        const item=link.parentElement;
        document.querySelectorAll(".nav-item.has-dropdown").forEach(x=>{if(x!==item)x.classList.remove("open")});
        item.classList.toggle("open");
      });
    });
  },
  async init(){
    const cfg=await this.json("data/site.json");this.cfg=cfg;
    const page=document.body.dataset.page||"";
    const nav=[
      {label:"About",page:"about",url:"about.html",items:[["about.html#overview","Overview","Mission, vision, and laboratory identity"],["about.html#approach","Research Approach","How BERL connects mechanism and process"],["contact.html","Contact","Laboratory contact information"]]},
      {label:"Research",page:"research",url:"research.html",items:[["research.html","Research Themes","Six core BERL research themes"],["projects.html","Research Programs","Current research programs"],["publications.html","Research Output","Publications and indexed impact"]]},
      {label:"People",page:"people",url:"people.html",items:[["people.html","All Members","Faculty and researchers"],["member.html?id=byung-hun-jeon","Principal Investigator","Professor Byung-Hun Jeon"],["join.html","Join BERL","Graduate and collaboration opportunities"]]},
      {label:"Publications",page:"publications",url:"publications.html",items:[["publications.html","All Publications","OpenAlex synchronized publication list"],[cfg.google_scholar_lab_url||"#","Google Scholar","External scholarly profile"],["search.html?q=publication","Search Output","Search publications and topics"]]},
      {label:"News",page:"news",url:"news.html",items:[["news.html","Latest News","Recent BERL updates and research spotlights"],["index.html#home-news-section","Homepage Highlights","Recent homepage news"],["projects.html","Research Programs","Explore ongoing research directions"]]},
      {label:"Contact",page:"contact",url:"contact.html",items:[["contact.html","Contact BERL","General contact form"],["contact.html?type=Graduate Admission","Graduate Admission","Prospective graduate students"],["contact.html?type=Research Collaboration","Collaboration","Academic and research collaboration"]]}
    ];
    const navHtml=nav.map(n=>`<div class="nav-item has-dropdown"><a class="nav-link ${page===n.page?"active":""}" href="${n.url}">${n.label}<span class="nav-caret">▾</span></a><div class="dropdown">${n.items.map(([u,t,d])=>`<a href="${u}" ${String(u).startsWith("http")?'target="_blank" rel="noopener"':""}><strong>${this.esc(t)}</strong><span>${this.esc(d)}</span></a>`).join("")}</div></div>`).join("");
    document.getElementById("site-header").innerHTML=`<header class="site-header"><div class="container navbar"><a class="brand" href="index.html"><img src="assets/images/berl-mark.svg" alt="BERL"><span><span class="brand-name">BERL</span><span class="brand-sub">${this.esc(cfg.lab_name)}</span></span></a><nav class="nav-links" id="navLinks">${navHtml}</nav><div class="nav-tools"><a class="icon-btn" href="search.html" aria-label="Search">⌕</a><button class="icon-btn" id="themeBtn" aria-label="Toggle theme">◐</button><button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">☰</button></div></div></header>`;
    document.getElementById("site-footer").innerHTML=`<footer class="site-footer"><div class="container"><div class="footer-grid"><div><h4>${this.esc(cfg.short_name)} · ${this.esc(cfg.lab_name)}</h4><p>${this.esc(cfg.department)}<br>${this.esc(cfg.institution)}<br>${this.esc(cfg.city)}</p></div><div><h4>Explore</h4><p><a href="about.html">About</a><br><a href="research.html">Research</a><br><a href="people.html">People</a><br><a href="publications.html">Publications</a><br><a href="news.html">News</a></p></div><div><h4>Connect</h4><p><a href="mailto:${this.esc(cfg.contact_email)}">${this.esc(cfg.contact_email)}</a><br>${this.esc(cfg.telephone)}<br><a href="${this.esc(cfg.google_scholar_lab_url)}" target="_blank" rel="noopener">Google Scholar ↗</a></p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${this.esc(cfg.copyright_name)}. All rights reserved.</span><span>Hanyang University · GitHub Pages</span></div></div></footer>`;
    const saved=localStorage.getItem("berl-theme");if(saved==="dark")document.body.classList.add("dark");
    document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("berl-theme",document.body.classList.contains("dark")?"dark":"light")};
    document.getElementById("menuBtn").onclick=()=>document.getElementById("navLinks").classList.toggle("open");
    this.initMenu();
  }
};
document.addEventListener("DOMContentLoaded",()=>BERL.init().catch(console.error));
