(()=>{
  let client=null;

  function config(){
    return window.BERL_SUPABASE||{};
  }

  function hasSupabaseConfig(){
    const c=config();
    return Boolean(c.url&&c.publishableKey);
  }

  function getClient(){
    const c=config();
    if(!c.url||!c.publishableKey||!window.supabase?.createClient)return null;
    if(!client){
      client=window.supabase.createClient(c.url,c.publishableKey,{
        global:{fetch:(url,options={})=>fetch(url,{...options,cache:'no-store'})}
      });
    }
    return client;
  }

  async function fallbackNews(){
    return BERL.json('data/news.json');
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

  async function news(){
    const c=config();
    if(!c.url||!c.publishableKey)return fallbackNews();

    try{
      const url=new URL(`${c.url}/rest/v1/news`);
      url.searchParams.set('select','id,slug,date,category,title,summary,image,body,is_published,created_at,updated_at');
      url.searchParams.set('is_published','eq.true');
      url.searchParams.set('order','date.desc,created_at.desc');
      const r=await fetch(url.toString(),{
        method:'GET',
        headers:{apikey:c.publishableKey,Accept:'application/json'},
        cache:'no-store'
      });
      if(!r.ok)throw new Error(`news: ${r.status}`);
      const data=await r.json();
      return (data||[]).map(normalizeNewsRow);
    }catch(err){
      console.warn('Supabase news unavailable; using data/news.json instead.',err);
      return fallbackNews();
    }
  }

  window.BERLData={
    hasSupabaseConfig,
    getClient,
    news
  };
})();
