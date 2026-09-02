(()=>{
  const cfg=window.BERL_SUPABASE||{};
  const setupNotice=document.getElementById('setupNotice');
  const loginPanel=document.getElementById('loginPanel');
  const dashboard=document.getElementById('dashboard');
  const logoutBtn=document.getElementById('logoutBtn');
  const loginStatus=document.getElementById('loginStatus');
  const dashboardStatus=document.getElementById('dashboardStatus');
  const editorDialog=document.getElementById('editorDialog');
  const editorStatus=document.getElementById('editorStatus');
  let sb=null;
  let cache=[];

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  if(!cfg.url||!cfg.publishableKey||!window.supabase?.createClient){
    setupNotice.hidden=false;
    loginPanel.hidden=true;
    return;
  }

  sb=window.supabase.createClient(cfg.url,cfg.publishableKey);

  async function isAdmin(){
    const {data,error}=await sb.rpc('is_admin');
    if(error)throw error;
    return data===true;
  }

  function showLoggedOut(){
    loginPanel.hidden=false;
    dashboard.hidden=true;
    logoutBtn.hidden=true;
  }

  function showLoggedIn(){
    loginPanel.hidden=true;
    dashboard.hidden=false;
    logoutBtn.hidden=false;
  }

  async function loadNews(){
    dashboardStatus.textContent='Loading…';
    const {data,error}=await sb
      .from('news')
      .select('*')
      .order('date',{ascending:false});
    if(error){dashboardStatus.textContent=error.message;return;}
    cache=data||[];
    renderList();
    dashboardStatus.textContent=`${cache.length} news item${cache.length===1?'':'s'}`;
  }

  function renderList(){
    const list=document.getElementById('newsAdminList');
    if(!cache.length){
      list.innerHTML='<div class="admin-card"><p>No Supabase news yet. Use “Import existing JSON” or add a new item.</p></div>';
      return;
    }
    list.innerHTML=cache.map(n=>`<article class="admin-list-item"><div><span class="admin-eyebrow">${esc(n.date||'')} · ${esc(n.category||'News')}</span><h3>${esc(n.title||'Untitled')}</h3><p>${n.is_published===false?'Draft':'Published'} · ${esc(n.slug||'')}</p></div><div class="admin-list-actions"><button class="admin-btn admin-btn-secondary" type="button" data-edit="${n.id}">Edit</button><button class="admin-btn admin-btn-danger" type="button" data-delete="${n.id}">Delete</button></div></article>`).join('');
    list.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEditor(cache.find(n=>String(n.id)===b.dataset.edit))));
    list.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>removeNews(b.dataset.delete)));
  }

  function slugify(text){
    return String(text||'')
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g,'')
      .trim()
      .replace(/\s+/g,'-')
      .replace(/-+/g,'-');
  }

  function openEditor(item=null){
    document.getElementById('editorTitle').textContent=item?'Edit news':'Add news';
    document.getElementById('newsId').value=item?.id||'';
    document.getElementById('newsTitle').value=item?.title||'';
    document.getElementById('newsDate').value=item?.date||new Date().toISOString().slice(0,10);
    document.getElementById('newsCategory').value=item?.category||'Lab Update';
    document.getElementById('newsSlug').value=item?.slug||'';
    document.getElementById('newsSummary').value=item?.summary||'';
    document.getElementById('newsImage').value=item?.image||'';
    document.getElementById('newsBody').value=JSON.stringify(item?.body||[],null,2);
    document.getElementById('newsPublished').checked=item?.is_published!==false;
    editorStatus.textContent='';
    editorDialog.showModal();
  }

  document.getElementById('newsTitle').addEventListener('input',e=>{
    if(!document.getElementById('newsId').value&&!document.getElementById('newsSlug').value){
      document.getElementById('newsSlug').value=slugify(e.target.value);
    }
  });

  document.getElementById('editorForm').addEventListener('submit',async e=>{
    e.preventDefault();
    editorStatus.textContent='Saving…';
    let body=[];
    try{body=JSON.parse(document.getElementById('newsBody').value||'[]');}
    catch{editorStatus.textContent='Article body JSON is invalid.';return;}
    if(!Array.isArray(body)){editorStatus.textContent='Article body must be a JSON array.';return;}

    const row={
      slug:document.getElementById('newsSlug').value.trim(),
      date:document.getElementById('newsDate').value,
      category:document.getElementById('newsCategory').value.trim()||'News',
      title:document.getElementById('newsTitle').value.trim(),
      summary:document.getElementById('newsSummary').value.trim(),
      image:document.getElementById('newsImage').value.trim(),
      body,
      is_published:document.getElementById('newsPublished').checked,
      updated_at:new Date().toISOString()
    };
    const id=document.getElementById('newsId').value;
    const query=id?sb.from('news').update(row).eq('id',id):sb.from('news').insert(row);
    const {error}=await query;
    if(error){editorStatus.textContent=error.message;return;}
    editorDialog.close();
    await loadNews();
  });

  async function removeNews(id){
    const item=cache.find(n=>String(n.id)===String(id));
    if(!confirm(`Delete “${item?.title||'this news item'}”?`))return;
    const {error}=await sb.from('news').delete().eq('id',id);
    if(error){dashboardStatus.textContent=error.message;return;}
    await loadNews();
  }

  document.getElementById('importBtn').addEventListener('click',async()=>{
    if(!confirm('Import the existing data/news.json items into Supabase? Existing matching slugs will be updated.'))return;
    dashboardStatus.textContent='Importing existing news…';
    try{
      const r=await fetch('../data/news.json',{cache:'no-store'});
      if(!r.ok)throw new Error(`news.json: ${r.status}`);
      const items=await r.json();
      const rows=items.map(n=>({
        slug:n.slug,
        date:n.date,
        category:n.category||'News',
        title:n.title,
        summary:n.summary||'',
        image:n.image||'',
        body:Array.isArray(n.body)?n.body:[],
        is_published:true,
        updated_at:new Date().toISOString()
      }));
      const {error}=await sb.from('news').upsert(rows,{onConflict:'slug'});
      if(error)throw error;
      dashboardStatus.textContent=`Imported ${rows.length} items.`;
      await loadNews();
    }catch(err){dashboardStatus.textContent=err.message||String(err);}
  });

  document.getElementById('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    loginStatus.textContent='Signing in…';
    const {error}=await sb.auth.signInWithPassword({
      email:document.getElementById('email').value.trim(),
      password:document.getElementById('password').value
    });
    if(error){loginStatus.textContent=error.message;return;}
    try{
      if(!(await isAdmin())){
        await sb.auth.signOut();
        loginStatus.textContent='This account is not registered as a BERL administrator.';
        return;
      }
      loginStatus.textContent='';
      showLoggedIn();
      await loadNews();
    }catch(err){
      await sb.auth.signOut();
      loginStatus.textContent=err.message||String(err);
    }
  });

  logoutBtn.addEventListener('click',async()=>{await sb.auth.signOut();showLoggedOut();});
  document.getElementById('newBtn').addEventListener('click',()=>openEditor());
  document.getElementById('closeEditorBtn').addEventListener('click',()=>editorDialog.close());
  document.getElementById('cancelEditorBtn').addEventListener('click',()=>editorDialog.close());

  (async()=>{
    const {data:{session}}=await sb.auth.getSession();
    if(!session){showLoggedOut();return;}
    try{
      if(await isAdmin()){
        showLoggedIn();
        await loadNews();
      }else{
        await sb.auth.signOut();
        showLoggedOut();
      }
    }catch(err){
      loginStatus.textContent=err.message||String(err);
      showLoggedOut();
    }
  })();
})();
