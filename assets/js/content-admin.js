document.addEventListener('DOMContentLoaded',async()=>{
  const root=document.body;
  const type=root.dataset.contentType;
  if(!['research','projects'].includes(type))return;
  const cfg=window.BERL_SUPABASE||{};
  const sb=(cfg.url&&cfg.publishableKey&&window.supabase?.createClient)?window.supabase.createClient(cfg.url,cfg.publishableKey,{global:{fetch:(url,options={})=>fetch(url,{...options,cache:'no-store'})}}):null;
  const table=type==='research'?'research_items':'projects';
  const $=id=>document.getElementById(id);
  let admin=false;

  async function checkAdmin(){
    admin=false;
    if(sb){try{const {data:{session}}=await sb.auth.getSession();if(session){const {data,error}=await sb.rpc('is_admin');admin=!error&&data===true}}catch{}}
    document.querySelectorAll('[data-admin-content]').forEach(el=>el.hidden=!admin);
    return admin;
  }

  async function uploadImage(file,slug){
    if(!file)return'';
    if(file.size>10*1024*1024)throw new Error('Images must be 10 MB or smaller.');
    if(!/^image\/(jpeg|png|webp|gif)$/i.test(file.type))throw new Error('Use JPG, PNG, WEBP, or GIF.');
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=`${table}/${slug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g,'-')}.${ext}`;
    const {error}=await sb.storage.from('site-images').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type});
    if(error)throw error;
    return sb.storage.from('site-images').getPublicUrl(path).data.publicUrl;
  }

  const slugify=t=>String(t||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,90);
  const splitList=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean);

  const write=$('content-write');
  const close=$('content-modal-close');
  const save=$('content-save');
  const modal=$('content-modal');
  if(write)write.addEventListener('click',async()=>{if(!(await checkAdmin()))return;modal.hidden=false;modal.setAttribute('aria-hidden','false')});
  if(close)close.addEventListener('click',()=>{modal.hidden=true;modal.setAttribute('aria-hidden','true')});
  if(save)save.addEventListener('click',async()=>{
    if(!(await checkAdmin()))return;
    const title=$('content-title').value.trim();
    if(!title)return $('content-error').textContent='Please enter a title.';
    const slug=slugify($('content-slug').value||title);
    const sort_order=Number($('content-order').value||0);
    const is_published=$('content-published').checked;
    save.disabled=true;$('content-error').textContent='';
    try{
      let image=$('content-image-url').value.trim();
      const f=$('content-image-file').files?.[0];
      if(f)image=await uploadImage(f,slug);
      const row=type==='research'?{
        slug,title,code:$('content-code').value.trim(),tag:$('content-tag').value.trim(),summary:$('content-summary').value.trim(),topics:splitList($('content-list').value),image,sort_order,is_published,updated_at:new Date().toISOString()
      }:{
        slug,title,status:$('content-status').value.trim()||'Ongoing',period:$('content-period').value.trim(),lead:$('content-lead').value.trim()||'BERL',area:$('content-area').value.trim(),summary:$('content-summary').value.trim(),keywords:splitList($('content-list').value),image,sort_order,is_published,updated_at:new Date().toISOString()
      };
      const {error}=await sb.from(table).insert(row);if(error)throw error;
      location.reload();
    }catch(e){$('content-error').textContent=e.message||String(e)}finally{save.disabled=false}
  });
  await checkAdmin();
  sb?.auth.onAuthStateChange(()=>setTimeout(checkAdmin,0));
});