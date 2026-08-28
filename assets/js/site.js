const BERL = {
  async json(path){ const r=await fetch(path,{cache:"no-store"}); if(!r.ok) throw new Error(`Failed to load ${path}`); return r.json(); },
  esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));},
  fmt(n){return Number(n||0).toLocaleString();},
  currentPage(){return document.body.dataset.page || "";},
  async init(){
    const cfg=await this.json("data/site.json");
    this.cfg=cfg;
    const page=this.currentPage();
    const nav=[
      ["about.html","About","about"],["research.html","Research","research"],["people.html","People","people"],
      ["publications.html","Publications","publications"],["projects.html","Projects","projects"],
      ["facilities.html","Facilities","facilities"],["news.html","News","news"],["join.html","Join Us","join"],["contact.html","Contact","contact"]
    ];
    document.getElementById("site-header").innerHTML=`
      <header class="site-header">
        <div class="container navbar">
          <a class="brand" href="index.html">
            <span class="brand-mark">BERL</span>
            <span>${this.esc(cfg.short_name)}<span class="brand-sub">${this.esc(cfg.lab_name)}</span></span>
          </a>
          <nav class="nav-links" id="navLinks">
            ${nav.map(([u,t,p])=>`<a href="${u}" class="${page===p?"active":""}">${t}</a>`).join("")}
          </nav>
          <div class="nav-actions">
            <a class="icon-btn" href="search.html" aria-label="Search"><span class="search-label">Search</span>⌕</a>
            <button class="icon-btn menu-toggle" aria-label="Menu" onclick="document.getElementById('navLinks').classList.toggle('open')">☰</button>
          </div>
        </div>
      </header>`;
    document.getElementById("site-footer").innerHTML=`
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <h4>${this.esc(cfg.short_name)} · ${this.esc(cfg.lab_name)}</h4>
              <p>${this.esc(cfg.department)}<br>${this.esc(cfg.institution)}<br>${this.esc(cfg.city)}</p>
            </div>
            <div>
              <h4>Navigate</h4>
              <p><a href="research.html">Research</a><br><a href="people.html">People</a><br><a href="publications.html">Publications</a><br><a href="join.html">Join Us</a></p>
            </div>
            <div>
              <h4>Contact</h4>
              <p><a href="mailto:${this.esc(cfg.contact_email)}">${this.esc(cfg.contact_email)}</a><br>${this.esc(cfg.telephone)}</p>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} ${this.esc(cfg.copyright_name)}. All rights reserved.</span>
            <span>Hosted with GitHub Pages</span>
          </div>
        </div>
      </footer>`;
  }
};
document.addEventListener("DOMContentLoaded",()=>BERL.init().catch(console.error));
