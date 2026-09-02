(()=>{
  const weightLabels={300:'Light',400:'Regular',500:'Medium',600:'Semi-bold',700:'Bold',800:'Extra-bold',900:'Black'};
  function enhancePanel(panel){
    if(!panel||panel.dataset.berlControlsEnhanced==='1')return;
    panel.dataset.berlControlsEnhanced='1';

    const size=panel.querySelector('#bpFontSize');
    if(size){
      const n=parseFloat(size.value)||16;
      size.type='number';
      size.min='8';size.max='240';size.step='1';size.value=String(Math.round(n));
      size.inputMode='numeric';
      const label=size.closest('label');
      if(label&&!label.querySelector('.berl-unit')){const u=document.createElement('span');u.className='berl-unit';u.textContent='px';label.appendChild(u)}
    }

    const oldWeight=panel.querySelector('#bpWeight');
    if(oldWeight&&oldWeight.tagName!=='SELECT'){
      const current=parseInt(oldWeight.value,10)||400;
      const sel=document.createElement('select');
      sel.id='bpWeight';
      [300,400,500,600,700,800,900].forEach(v=>{const o=document.createElement('option');o.value=String(v);o.textContent=`${weightLabels[v]} (${v})`;if(v===current)o.selected=true;sel.appendChild(o)});
      oldWeight.replaceWith(sel);
    }
  }

  const observer=new MutationObserver(()=>document.querySelectorAll('.berl-prop-panel').forEach(enhancePanel));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.querySelectorAll('.berl-prop-panel').forEach(enhancePanel);

  document.addEventListener('click',e=>{
    const save=e.target.closest('#bpSave');
    if(!save)return;
    const panel=save.closest('.berl-prop-panel');
    const size=panel?.querySelector('#bpFontSize');
    if(size){
      const n=parseFloat(size.value);
      if(Number.isFinite(n))size.value=`${Math.max(8,Math.min(240,n))}px`;
    }
  },true);
})();