document.addEventListener("DOMContentLoaded",async()=>{
  const [pubs,members,research,news]=await Promise.all([
    BERL.json("data/publications.json"),BERL.json("data/members.json"),BERL.json("data/research.json"),BERL.json("data/news.json")
  ]);
  const items=[
    ...pubs.map(x=>({type:"Publication",title:x.title,desc:[...(x.authors||[]),x.journal||""].join(" · "),url:x.doi?`https://doi.org/${x.doi}`:"publications.html"})),
    ...members.map(x=>({type:"People",title:x.name,desc:[x.position,...(x.research_interests||[])].join(" · "),url:`member.html?id=${encodeURIComponent(x.id)}`})),
    ...research.map(x=>({type:"Research",title:x.title,desc:x.summary,url:`research.html#${x.slug}`})),
    ...news.map(x=>({type:"News",title:x.title,desc:x.summary,url:x.url||"news.html"}))
  ];
  const input=document.getElementById("site-search");
  const params=new URLSearchParams(location.search); if(params.get("q")) input.value=params.get("q");
  function render(){
    const q=input.value.trim().toLowerCase();
    const out=q?items.filter(x=>`${x.type} ${x.title} ${x.desc}`.toLowerCase().includes(q)).slice(0,80):[];
    document.getElementById("search-results").innerHTML=q?(out.length?out.map(x=>`
      <div class="search-result"><div class="type">${BERL.esc(x.type)}</div><h3><a href="${BERL.esc(x.url)}">${BERL.esc(x.title)}</a></h3><div class="muted small">${BERL.esc(x.desc)}</div></div>`).join(""):`<div class="empty">No results found.</div>`)
      :`<div class="empty">Type a keyword such as “anaerobic digestion”, a member name, or a paper title.</div>`;
  }
  input.addEventListener("input",render); render();
});
