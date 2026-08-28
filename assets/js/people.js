document.addEventListener("DOMContentLoaded",async()=>{
 const members=await BERL.json("data/members.json");
 const order=["Advisor","M.S. Students","Ph.D. Students","Integrated M.S./Ph.D. Students","Postdoctoral Researchers","Research Professors"];
 const slug=s=>s.toLowerCase().replace(/\./g,"").replace(/\//g,"-").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 document.getElementById("people-groups").innerHTML=order.map(g=>{
   const list=members.filter(m=>m.group===g);if(!list.length)return"";
   return `<section class="people-group" id="${slug(g)}"><div class="section-head"><div><div class="kicker">BERL People</div><h2>${BERL.esc(g)}</h2></div></div><div class="grid-3">${list.map(m=>`<a class="card person-card" href="member.html?id=${encodeURIComponent(m.id)}"><div class="portrait"><img src="${BERL.esc(m.photo||"assets/images/default-avatar.svg")}" alt="${BERL.esc(m.name)}" onerror="BERL.photo(this)"></div><div class="person-copy">${m.example?'<span class="example-badge">Example input format</span>':""}<h3>${BERL.esc(m.name)}</h3><div class="role">${BERL.esc(m.position)}</div><p>${BERL.esc((m.research_interests||[]).slice(0,3).join(" · "))}</p></div></a>`).join("")}</div></section>`
 }).join("");
});
