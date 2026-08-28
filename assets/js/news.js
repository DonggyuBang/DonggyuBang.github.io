document.addEventListener("DOMContentLoaded",async()=>{
 const news=[...(await BERL.json("data/news.json"))].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const f=news[0],rest=news.slice(1);
 document.getElementById("news-feature").innerHTML=f?`<a class="card news-feature" href="${BERL.esc(f.url||"news.html")}"><div class="news-image sprite-photo" style="background-position:${BERL.spritePos(f.photo_index??0)}"></div><div class="news-copy"><div class="date">${BERL.esc(f.date)} · ${BERL.esc(f.category)}</div><h2>${BERL.esc(f.title)}</h2><p>${BERL.esc(f.summary)}</p></div></a>`:"";
 document.getElementById("news-list").innerHTML=rest.map((n,i)=>`<a class="card news-card" href="${BERL.esc(n.url||"news.html")}"><div class="news-image sprite-photo" style="background-position:${BERL.spritePos(n.photo_index??i+1)}"></div><div class="news-copy"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category)}</div><h3>${BERL.esc(n.title)}</h3><p>${BERL.esc(n.summary)}</p></div></a>`).join("");
});
