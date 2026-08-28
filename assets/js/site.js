const BERL={
  async json(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json()},
  esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))},
  fmt(n){return Number(n||0).toLocaleString()},
  photo(img){img.onerror=null;img.src="assets/images/default-avatar.svg"},
  async init(){
    const cfg=await this.json("data/site.json");this.cfg=cfg;
    const page=document.body.dataset.page||"";
    const nav=[["about.html","About","about"],["research.html","Research","research"],["people.html","People","people"],["publications.html","Publications","publications"],["projects.html","Projects","projects"],["facilities.html","Facilities","facilities"],["news.html","News","news"],["join.html","Join","join"],["contact.html","Contact","contact"]];
    document.getElementById("site-header").innerHTML=`<header class="site-header"><div class="container navbar">
      <a class="brand" href="index.html"><img src="assets/images/berl-mark.svg" alt="BERL"><span><span class="brand-name">BERL</span><span class="brand-sub">${this.esc(cfg.lab_name)}</span></span></a>
      <nav class="nav-links" id="navLinks">${nav.map(([u,t,p])=>`<a class="${page===p?"active":""}" href="${u}">${t}</a>`).join("")}</nav>
      <div class="nav-tools"><a class="icon-btn" href="search.html" aria-label="Search">⌕</a><button class="icon-btn" id="themeBtn" aria-label="Toggle theme">◐</button><button class="icon-btn menu-btn" aria-label="Menu" onclick="document.getElementById('navLinks').classList.toggle('open')">☰</button></div>
    </div></header>`;
    document.getElementById("site-footer").innerHTML=`<footer class="site-footer"><div class="container">
      <div class="footer-grid"><div><h4>${this.esc(cfg.short_name)} · ${this.esc(cfg.lab_name)}</h4><p>${this.esc(cfg.department)}<br>${this.esc(cfg.institution)}<br>${this.esc(cfg.city)}</p></div>
      <div><h4>Explore</h4><p><a href="research.html">Research</a><br><a href="people.html">People</a><br><a href="publications.html">Publications</a><br><a href="projects.html">Projects</a></p></div>
      <div><h4>Connect</h4><p><a href="mailto:${this.esc(cfg.contact_email)}">${this.esc(cfg.contact_email)}</a><br>${this.esc(cfg.telephone)}<br><a href="${this.esc(cfg.google_scholar_lab_url)}" target="_blank" rel="noopener">Google Scholar ↗</a></p></div></div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${this.esc(cfg.copyright_name)}. All rights reserved.</span><span>Hanyang University · GitHub Pages</span></div></div></footer>`;
    const saved=localStorage.getItem("berl-theme");if(saved==="dark")document.body.classList.add("dark");
    document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("berl-theme",document.body.classList.contains("dark")?"dark":"light")};
  }
};
document.addEventListener("DOMContentLoaded",()=>BERL.init().catch(console.error));
