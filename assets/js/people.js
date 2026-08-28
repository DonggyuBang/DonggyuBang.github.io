document.addEventListener("DOMContentLoaded",async()=>{
  const members=await BERL.json("data/members.json");
  const groups=[...new Set(members.map(m=>m.group))];
  const root=document.getElementById("people-groups");
  root.innerHTML=groups.map(g=>`
    <section style="padding:0 0 56px">
      <div class="section-head"><div><div class="kicker">BERL People</div><h2>${BERL.esc(g)}</h2></div></div>
      <div class="grid-3">
        ${members.filter(m=>m.group===g).map(m=>`
          <a class="card card-hover person-card" href="member.html?id=${encodeURIComponent(m.id)}">
            <div class="portrait">${m.photo?`<img src="${BERL.esc(m.photo)}" alt="${BERL.esc(m.name)}">`:"Photo"}</div>
            <h3>${BERL.esc(m.name)}</h3><div class="role">${BERL.esc(m.position)}</div>
            <p>${BERL.esc((m.research_interests||[]).slice(0,3).join(" · "))}</p>
          </a>`).join("")}
      </div>
    </section>`).join("");
});
