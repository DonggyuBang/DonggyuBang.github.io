(()=>{
  const SNAPSHOT_KEY='berl-public-news-v2';
  const REVISION_KEY='berl-news-revision';

  function config(){
    return window.BERL_SUPABASE||{};
  }

  function hasSupabaseConfig(){
    const c=config();
    return Boolean(c.url&&c.publishableKey);
  }

  function normalizeNewsRow(row){
    return {
      id:row.id,
      slug:row.slug,
      date:row.date,
      category:row.category||'News',
      title:row.title,
      summary:row.summary||'',
      image:row.image||'',
      body:Array.isArray(row.body)?row.body:[],
      is_published:row.is_published!==false,
      created_at:row.created_at,
      updated_at:row.updated_at
    };
  }

  function sortNews(rows){
    return [...(rows||[])].map(normalizeNewsRow).filter(r=>r.is_published!==false).sort((a,b)=>
      String(b.date||'').localeCompare(String(a.date||''))||
      String(b.created_at||'').localeCompare(String(a.created_at||''))||
      Number(b.id||0)-Number(a.id||0)
    );
  }

  function rememberNews(rows){
    const clean=sortNews(rows);
    try{
      localStorage.setItem(SNAPSHOT_KEY,JSON.stringify({saved_at:Date.now(),rows:clean}));
    }catch{}
    return clean;
  }

  function cachedNews(){
    try{
      const v=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'null');
      if(Array.isArray(v?.rows)&&v.rows.length)return sortNews(v.rows);
    }catch{}
    return null;
  }

  function announceChange(rows){
    if(Array.isArray(rows)&&rows.length)rememberNews(rows);
    try{localStorage.setItem(REVISION_KEY,String(Date.now()))}catch{}
    try{window.dispatchEvent(new CustomEvent('berl:news-changed'))}catch{}
  }

  async function fallbackNews(){
    const rows=await BERL.json('data/news.json');
    return sortNews(rows);
  }

  async function queryWithRest(){
    const c=config();
    if(!c.url||!c.publishableKey)return null;

    const url=new URL(`${c.url}/rest/v1/news`);
    url.searchParams.set('select','id,slug,date,category,title,summary,image,body,is_published,created_at,updated_at');
    url.searchParams.set('is_published','eq.true');
    url.searchParams.set('order','date.desc,created_at.desc,id.desc');

    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),5000);
    try{
      const r=await fetch(url.toString(),{
        method:'GET',
        headers:{
          apikey:c.publishableKey,
          Accept:'application/json',
          'Cache-Control':'no-cache, no-store, max-age=0',
          Pragma:'no-cache'
        },
        cache:'no-store',
        credentials:'omit',
        signal:ctl.signal
      });
      if(!r.ok)throw new Error(`news REST: ${r.status}`);
      return sortNews(await r.json());
    }finally{
      clearTimeout(timer);
    }
  }

  async function news(){
    if(hasSupabaseConfig()){
      let lastError=null;
      for(let attempt=0;attempt<2;attempt++){
        try{
          const rows=await queryWithRest();
          if(rows)return rememberNews(rows);
        }catch(err){
          lastError=err;
          if(attempt===0)await new Promise(r=>setTimeout(r,160));
        }
      }
      if(lastError)console.warn('Public Supabase news query failed; using last public snapshot.',lastError);
    }

    const cached=cachedNews();
    if(cached)return cached;

    try{return await fallbackNews()}
    catch(err){console.warn('Static news fallback failed.',err);return[]}
  }

  window.BERLData={
    hasSupabaseConfig,
    news,
    rememberNews,
    announceChange,
    cachedNews
  };
})();
