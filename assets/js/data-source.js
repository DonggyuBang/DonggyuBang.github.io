(()=>{
  let client=null;

  function hasSupabaseConfig(){
    const c=window.BERL_SUPABASE||{};
    return Boolean(c.url&&c.publishableKey&&window.supabase?.createClient);
  }

  function getClient(){
    if(!hasSupabaseConfig())return null;
    if(!client){
      client=window.supabase.createClient(
        window.BERL_SUPABASE.url,
        window.BERL_SUPABASE.publishableKey
      );
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
    const sb=getClient();
    if(!sb)return fallbackNews();

    try{
      const {data,error}=await sb
        .from('news')
        .select('id,slug,date,category,title,summary,image,body,is_published,created_at,updated_at')
        .eq('is_published',true)
        .order('date',{ascending:false});

      if(error)throw error;
      if(!data?.length)return fallbackNews();
      return data.map(normalizeNewsRow);
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
