document.addEventListener("DOMContentLoaded",async()=>{
  const data=await BERL.json("data/research.json");
  document.getElementById("research-list").innerHTML=data.map(r=>`
    <article class="card" id="${BERL.esc(r.slug)}" style="scroll-margin-top:95px">
      <div class="research-icon">${BERL.esc(r.icon)}</div><span class="tag">${BERL.esc(r.tag)}</span>
      <h3>${BERL.esc(r.title)}</h3><p>${BERL.esc(r.summary)}</p>
      <ul class="list-clean" style="margin-top:16px">${(r.topics||[]).map(t=>`<li>${BERL.esc(t)}</li>`).join("")}</ul>
    </article>`).join("");
});
