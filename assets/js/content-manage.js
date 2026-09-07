document.addEventListener('DOMContentLoaded',async()=>{
  const type=document.body.dataset.contentType;
  if(!['research','projects'].includes(type))return;
  const cfg=window.BERL_SUPABASE||{};
  const sb=(cfg.url&&cfg.publishableKey&&window.supabase?.createClient)?window.supabase.createClient(cfg.url,cfg.publishableKey,{global:{fetch:(url,options={})=>fetch(url,{...options,cache:'no-store'})}}):null;
  const table=type==='research'?'research_items':'projects';
  const $=id=>document.getElementById(id);
  let rows=[],current=null,coverFile=null;
  const esc=v=>BERL.esc(v??'');
  const slugify=t=>String(t||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,90);
  const splitList=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean);
  const joinList=v=>Array.isArray(v)?v.join(', '):'';
  async function requireAdmin(){if(!sb){location.replace(type==='research'?'research.html':'projects.html');return false}try{const {data:{session}}=await sb.auth.getSession();if(!session)throw 0;const {data,error}=await sb.rpc('is_admin');if(error||data!==true)throw 0;return true}catch{location.replace(type==='research'?'research.html':'projects.html');return false}}
  function status(t){$('content-manage-status').textContent=t||''}
  function imagePreview(url,label='Current image'){
    const box=$('content-image-preview');if(!box)return;
    const safe=String(url||'').trim();
    box.innerHTML=safe?`<div class="content-image-preview-label">${esc(label)}</div><img src="${esc(safe)}" alt="Project image preview" loading="lazy"><div class="content-image-preview-url">${esc(safe)}</div>`:'<div class="content-image-preview-empty">No image assigned.</div>';
  }
  async function load(){status('Loading…');const {data,error}=await sb.from(table).select('*').order('status',{ascending:false}).order('sort_order',{ascending:true}).order('created_at',{ascending:true});if(error)throw error;rows=data||[];render();status(`${rows.length} items`)}
  function render(){const list=$('content-manage-list');list.innerHTML=rows.map(r=>`<button class="content-manage-row ${current?.id===r.id?'active':''}" type="button" data-id="${r.id}"><small>${r.is_published?'Published':'Draft'} · ${type==='projects'?esc(r.status||'Ongoing')+' · ':''}Order ${r.sort_order??0}</small><strong>${esc(r.title)}</strong></button>`).join('')||'<div style="padding:24px;color:#8fa7b1">No items.</div>';list.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>open(Number(b.dataset.id)))}
  function open(id){current=rows.find(r=>Number(r.id)===Number(id));if(!current)return;coverFile=null;$('content-manage-editor').hidden=false;$('content-title').value=current.title||'';$('content-slug').value=current.slug||'';$('content-summary').value=current.summary||'';$('content-order').value=current.sort_order??0;$('content-image-url').value=current.image||'';$('content-image-file').value='';$('content-published').checked=current.is_published!==false;if(type==='research'){$('content-code').value=current.code||'';$('content-tag').value=current.tag||'';$('content-list').value=joinList(current.topics)}else{$('content-status').value=current.status||'';$('content-period').value=current.period||'';$('content-lead').value=current.lead||'';$('content-area').value=current.area||'';$('content-host').value=current.host_institution||'';$('content-pi').value=current.principal_investigator||'';$('content-role').value=current.participation_role||'';$('content-list').value=joinList(current.keywords)}imagePreview(current.image||'');render()}
  function safeFilename(file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';let base=file.name.replace(/\.[^.]+$/,'').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,50);if(!base)base='image';return{base,ext}}
  async function upload(file){
    if(!file)return $('content-image-url').value.trim();
    if(!current?.id)throw new Error('Select a project before uploading an image.');
    if(file.size>10*1024*1024)throw new Error('Images must be 10 MB or smaller.');
    if(!/^image\/(jpeg|png|webp|gif)$/i.test(file.type))throw new Error('Use JPG, PNG, WEBP, or GIF.');
    const {base,ext}=safeFilename(file);
    const entity=`${type==='projects'?'project':'research'}-${Number(current.id)}`;
    const unique=(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9-]/g,'');
    const path=`${table}/${entity}/${Date.now()}-${unique}-${base}.${ext}`;
    status('Uploading image…');
    const {data:uploaded,error}=await sb.storage.from('site-images').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
    if(error){console.error('Storage upload failed',error);throw new Error(`Image upload failed: ${error.message||'Storage error'}`)}
    const storedPath=uploaded?.path||path;
    const publicUrl=sb.storage.from('site-images').getPublicUrl(storedPath).data?.publicUrl||'';
    if(!publicUrl)throw new Error('Image uploaded, but a public URL could not be created.');
    $('content-image-url').value=publicUrl;
    imagePreview(publicUrl,'New image');
    return publicUrl;
  }
  async function save(){
    if(!current)return;
    const title=$('content-title').value.trim(),slug=slugify($('content-slug').value||title);if(!title||!slug)return;
    const saveBtn=$('content-save');saveBtn.disabled=true;
    try{
      const hadNewImage=!!coverFile;
      const image=await upload(coverFile);
      status('Saving project…');
      const patch=type==='research'?{slug,title,code:$('content-code').value.trim(),tag:$('content-tag').value.trim(),summary:$('content-summary').value.trim(),topics:splitList($('content-list').value),image,sort_order:Number($('content-order').value||0),is_published:$('content-published').checked,updated_at:new Date().toISOString()}:{slug,title,status:$('content-status').value.trim()||'Ongoing',period:$('content-period').value.trim(),lead:'',area:'',host_institution:$('content-host').value.trim(),principal_investigator:$('content-pi').value.trim(),participation_role:$('content-role').value.trim(),summary:$('content-summary').value.trim(),keywords:splitList($('content-list').value),image,sort_order:Number($('content-order').value||0),is_published:$('content-published').checked,updated_at:new Date().toISOString()};
      const {data,error}=await sb.from(table).update(patch).eq('id',current.id).select('*').single();if(error)throw error;
      if(String(data.image||'')!==String(image||''))throw new Error('Project saved, but the image URL was not persisted. Please retry.');
      rows=rows.map(r=>r.id===data.id?data:r);current=data;coverFile=null;$('content-image-file').value='';$('content-image-url').value=data.image||'';imagePreview(data.image||'',hadNewImage?'Saved image':'Current image');render();status(hadNewImage?'Saved · image updated':'Saved');
    }finally{saveBtn.disabled=false}
  }
  async function del(){if(!current||!confirm(`Delete “${current.title}”? This cannot be undone.`))return;const {error}=await sb.from(table).delete().eq('id',current.id);if(error)throw error;rows=rows.filter(r=>r.id!==current.id);current=null;$('content-manage-editor').hidden=true;render();status('Deleted')}
  $('content-save').onclick=()=>save().catch(e=>{console.error(e);status(e.message||String(e))});$('content-delete').onclick=()=>del().catch(e=>status(e.message||String(e)));$('content-image-file').onchange=e=>{coverFile=e.target.files?.[0]||null;if(coverFile){const localUrl=URL.createObjectURL(coverFile);imagePreview(localUrl,`Selected: ${coverFile.name}`);status('Image selected · click Save changes to upload')}};$('content-image-url').addEventListener('input',e=>{if(!coverFile)imagePreview(e.target.value||'','Image URL preview')});$('content-refresh').onclick=()=>load().catch(e=>status(e.message||String(e)));if(await requireAdmin())await load();
});