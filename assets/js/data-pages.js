async function renderCards(path, target, renderer){
  const data=await BERL.json(path);
  document.getElementById(target).innerHTML=data.map(renderer).join("");
}
