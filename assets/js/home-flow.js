(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  let ticking=false;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const update=()=>{
    const y=window.scrollY||0;
    document.documentElement.style.setProperty('--hero-y',`${clamp(y*.16,0,110)}px`);
    const scene=document.getElementById('motion-scene');
    if(scene){
      const r=scene.getBoundingClientRect();
      const p=clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
      scene.style.setProperty('--scene-bg-y',`${(p-.5)*120}px`);
      scene.style.setProperty('--scene-copy-y',`${(0.5-p)*42}px`);
      scene.style.setProperty('--scene-art-y',`${(p-.5)*50}px`);
      scene.style.setProperty('--scene-scale',`${0.965+p*.055}`);
      const cards=[...scene.querySelectorAll('.ecosystem-card')];
      cards.forEach((card,i)=>{
        const depth=Number(card.dataset.depth||1);
        const side=i%2===0?-1:1;
        const x=(.5-p)*26*depth*side;
        const yy=(.5-p)*(34+i*4)*depth;
        card.style.setProperty('--card-x',`${x}px`);
        card.style.setProperty('--card-y',`${yy}px`);
      });
      const core=scene.querySelector('.ecosystem-core');
      if(core)core.style.transform=`translate(-50%,-50%) scale(${.97+p*.045}) rotate(${(p-.5)*2.5}deg)`;
    }
    ticking=false;
  };
  const request=()=>{if(ticking)return;ticking=true;requestAnimationFrame(update)};
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request,{passive:true});
  request();
})();