document.addEventListener('DOMContentLoaded',async()=>{
  const $=id=>document.getElementById(id);
  const cfg=window.BERL_SUPABASE||{};
  const sb=(cfg.url&&cfg.publishableKey&&window.supabase?.createClient)
    ?window.supabase.createClient(cfg.url,cfg.publishableKey,{global:{fetch:(url,options={})=>fetch(url,{...options,cache:'no-store'})}})
    :null;

  let rows=[];
  let current=null;
  let coverFile=null;
  let lastRange=null;

  const esc=v=>BERL.esc(v??'');
  const slugify=text=>String(text||'').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,90);
  const safeFileName=name=>String(name||'image').toLowerCase().replace(/[^a-z0-9._-]+/g,'-')
    .replace(/-+/g,'-').replace(/^-|-$/g,'').slice(-80)||'image';

  function showStatus(text,type=''){
    const el=$('manage-status');
    el.textContent=text||'';
    el.dataset.type=type;
  }

  async function requireAdmin(){
    if(!sb){location.replace('news.html');return false;}
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(!session){location.replace('news.html');return false;}
      const {data,error}=await sb.rpc('is_admin');
      if(error||data!==true){location.replace('news.html');return false;}
      document.documentElement.classList.add('news-manage-authorized');
      return true;
    }catch(err){
      console.error(err);
      location.replace('news.html');
      return false;
    }
  }

  async function loadRows(){
    showStatus('Loading news…');
    const {data,error}=await sb.from('news')
      .select('id,slug,date,category,title,summary,image,body,is_published,created_at,updated_at')
      .order('date',{ascending:false})
      .order('created_at',{ascending:false});
    if(error){showStatus(error.message,'error');throw error;}
    rows=data||[];
    renderList();
    showStatus(`${rows.length} stories`);
  }

  function renderList(){
    const list=$('manage-list');
    if(!rows.length){
      list.innerHTML='<div class="manage-empty">No news stories found.</div>';
      $('manage-select-all').checked=false;
      updateDeleteButton();
      return;
    }
    list.innerHTML=rows.map(r=>`
      <article class="manage-row" data-id="${r.id}">
        <label class="manage-check" aria-label="Select ${esc(r.title)}">
          <input type="checkbox" class="manage-row-check" value="${r.id}">
        </label>
        <button class="manage-row-open" type="button" data-open="${r.id}">
          <span class="manage-row-main">
            <span class="manage-row-meta">${esc(r.date)} · ${esc(r.category)} · ${r.is_published?'Published':'Draft'}</span>
            <strong>${esc(r.title)}</strong>
            <small>${esc(r.summary)}</small>
          </span>
          <span class="manage-row-arrow">Edit →</span>
        </button>
      </article>
    `).join('');
    list.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openEditor(Number(b.dataset.open))));
    list.querySelectorAll('.manage-row-check').forEach(c=>c.addEventListener('change',()=>{
      syncSelectAll();
      updateDeleteButton();
    }));
    $('manage-select-all').checked=false;
    updateDeleteButton();
  }

  function selectedIds(){
    return [...document.querySelectorAll('.manage-row-check:checked')].map(x=>Number(x.value)).filter(Number.isFinite);
  }

  function syncSelectAll(){
    const all=[...document.querySelectorAll('.manage-row-check')];
    const checked=all.filter(x=>x.checked);
    $('manage-select-all').checked=all.length>0&&checked.length===all.length;
    $('manage-select-all').indeterminate=checked.length>0&&checked.length<all.length;
  }

  function updateDeleteButton(){
    const n=selectedIds().length;
    const b=$('manage-delete');
    b.disabled=n===0;
    b.textContent=n?`Delete selected (${n})`:'Delete selected';
  }

  function bodyToHtml(body){
    if(!Array.isArray(body))return'';
    const rich=body.find(x=>x&&x.type==='rich'&&typeof x.html==='string');
    if(rich)return rich.html;
    return body.map(b=>{
      if(!b)return'';
      if(b.type==='heading')return `<h2>${esc(b.text||'')}</h2>`;
      if(b.type==='paragraph')return `<p>${esc(b.text||'')}</p>`;
      if(b.type==='bullets')return `<ul>${(b.items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
      if(b.type==='image'){
        const src=String(b.url||'').trim();
        return src?`<figure><img src="${esc(src)}" alt=""><figcaption>${esc(b.caption||'')}</figcaption></figure>`:'';
      }
      return'';
    }).join('');
  }

  function autoGrow(el){
    el.style.height='auto';
    el.style.height=Math.max(el.scrollHeight,el===$('manage-title')?110:78)+'px';
  }

  function openEditor(id){
    const r=rows.find(x=>Number(x.id)===Number(id));
    if(!r)return;
    current=r;
    coverFile=null;
    lastRange=null;
    $('manage-editor-error').textContent='';
    $('manage-title').value=r.title||'';
    $('manage-summary').value=r.summary||'';
    $('manage-date').value=r.date||'';
    $('manage-category').value=r.category||'News';
    $('manage-slug').value=r.slug||'';
    $('manage-image-url').value=r.image||'';
    $('manage-published').checked=r.is_published!==false;
    $('manage-body-editor').innerHTML=bodyToHtml(r.body);
    setCoverPreview(r.image||'');
    autoGrow($('manage-title'));
    autoGrow($('manage-summary'));
    $('manage-editor').hidden=false;
    $('manage-editor').scrollIntoView({behavior:'smooth',block:'start'});
    $('manage-title').focus();
  }

  function closeEditor(){
    current=null;
    coverFile=null;
    $('manage-editor').hidden=true;
    $('manage-editor-error').textContent='';
  }

  function setCoverPreview(url){
    const p=$('manage-cover-preview');
    p.innerHTML='';
    p.style.backgroundImage=url?`url("${String(url).replace(/"/g,'\\"')}")`:'';
    if(!url)p.innerHTML='<span>No cover image</span>';
  }

  function cleanUrl(url){
    const v=String(url||'').trim();
    if(!v)return'';
    if(/^https?:\/\//i.test(v)||/^mailto:/i.test(v))return v;
    return 'https://'+v.replace(/^\/+/, '');
  }

  function sanitizeRichHtml(){
    const source=$('manage-body-editor').cloneNode(true);
    const allowed=new Set(['P','H2','H3','BR','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE','A','FIGURE','IMG','FIGCAPTION']);
    const walk=node=>{
      [...node.children].forEach(child=>{
        walk(child);
        if(!allowed.has(child.tagName)){child.replaceWith(...child.childNodes);return;}
        const href=child.tagName==='A'?cleanUrl(child.getAttribute('href')):'';
        const src=child.tagName==='IMG'?String(child.getAttribute('src')||'').trim():'';
        const alt=child.tagName==='IMG'?String(child.getAttribute('alt')||''):'';
        [...child.attributes].forEach(a=>child.removeAttribute(a.name));
        if(child.tagName==='A'&&href){
          child.setAttribute('href',href);
          child.setAttribute('target','_blank');
          child.setAttribute('rel','noopener');
        }
        if(child.tagName==='IMG'){
          if(/^https?:\/\//i.test(src)){
            child.setAttribute('src',src);
            child.setAttribute('alt',alt);
          }else child.remove();
        }
      });
    };
    walk(source);
    return source.innerHTML.trim();
  }

  function rememberRange(){
    const s=getSelection();
    if(s.rangeCount&&$('manage-body-editor').contains(s.anchorNode))lastRange=s.getRangeAt(0).cloneRange();
  }

  function restoreRange(){
    if(!lastRange)return false;
    const s=getSelection();
    s.removeAllRanges();
    s.addRange(lastRange);
    return true;
  }

  function editorCommand(cmd,value=null){
    $('manage-body-editor').focus();
    restoreRange();
    document.execCommand(cmd,false,value);
    rememberRange();
  }

  async function uploadCover(file){
    if(!file)return $('manage-image-url').value.trim();
    if(file.size>10*1024*1024)throw new Error('Images must be 10 MB or smaller.');
    if(!/^image\/(jpeg|png|webp|gif)$/i.test(file.type))throw new Error('Please use JPG, PNG, WEBP, or GIF.');
    const base=slugify($('manage-slug').value||$('manage-title').value)||'story';
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=`news/${base}/${Date.now()}-cover-${safeFileName(file.name.replace(/\.[^.]+$/,''))}.${ext}`;
    const {error}=await sb.storage.from('site-images').upload(path,file,{
      cacheControl:'31536000',upsert:false,contentType:file.type
    });
    if(error)throw error;
    const {data}=sb.storage.from('site-images').getPublicUrl(path);
    if(!data?.publicUrl)throw new Error('Could not create the cover image URL.');
    return data.publicUrl;
  }

  async function ensureUniqueSlug(slug,id){
    const {data,error}=await sb.from('news').select('id').eq('slug',slug).neq('id',id).limit(1);
    if(error)throw error;
    if(data?.length)throw new Error('This URL slug is already used by another story.');
    return slug;
  }

  async function saveCurrent(){
    if(!current)return;
    const title=$('manage-title').value.trim();
    const summary=$('manage-summary').value.trim();
    const date=$('manage-date').value;
    const category=$('manage-category').value.trim()||'News';
    let slug=slugify($('manage-slug').value)||slugify(title);

    $('manage-editor-error').textContent='';
    if(!title){$('manage-editor-error').textContent='Please enter a title.';return;}
    if(!summary){$('manage-editor-error').textContent='Please enter a summary.';return;}
    if(!date){$('manage-editor-error').textContent='Please choose a date.';return;}
    if(!slug){$('manage-editor-error').textContent='Please enter a URL slug.';return;}

    const rich=sanitizeRichHtml();
    if(!rich&&!$('manage-body-editor').innerText.trim()){
      $('manage-editor-error').textContent='Please write the article body.';
      return;
    }

    const save=$('manage-save');
    save.disabled=true;
    showStatus('Saving…');

    try{
      slug=await ensureUniqueSlug(slug,current.id);
      const image=await uploadCover(coverFile);
      const patch={
        title,summary,date,category,slug,image,
        body:[{type:'rich',html:rich}],
        is_published:$('manage-published').checked,
        updated_at:new Date().toISOString()
      };
      const {data,error}=await sb.from('news').update(patch).eq('id',current.id)
        .select('id,slug,date,category,title,summary,image,body,is_published,created_at,updated_at').single();
      if(error)throw error;
      rows=rows.map(x=>x.id===data.id?data:x).sort((a,b)=>
        String(b.date).localeCompare(String(a.date))||String(b.created_at||'').localeCompare(String(a.created_at||''))
      );
      current=data;
      coverFile=null;
      renderList();
      openEditor(data.id);
      showStatus('Saved');
    }catch(err){
      console.error(err);
      $('manage-editor-error').textContent=err.message||String(err);
      showStatus('Save failed','error');
    }finally{
      save.disabled=false;
    }
  }

  async function deleteSelected(){
    const ids=selectedIds();
    if(!ids.length)return;
    if(!confirm(`Delete ${ids.length} selected news ${ids.length===1?'story':'stories'}? This cannot be undone.`))return;

    const b=$('manage-delete');
    b.disabled=true;
    showStatus('Deleting…');
    try{
      const {data,error}=await sb.from('news').delete().in('id',ids).select('id');
      if(error)throw error;
      const deleted=new Set((data||[]).map(x=>Number(x.id)));
      rows=rows.filter(x=>!deleted.has(Number(x.id)));
      if(current&&deleted.has(Number(current.id)))closeEditor();
      renderList();
      showStatus(`${deleted.size} ${deleted.size===1?'story':'stories'} deleted`);
    }catch(err){
      console.error(err);
      showStatus(err.message||String(err),'error');
    }finally{
      updateDeleteButton();
    }
  }

  $('manage-select-all').addEventListener('change',e=>{
    document.querySelectorAll('.manage-row-check').forEach(c=>c.checked=e.target.checked);
    updateDeleteButton();
  });
  $('manage-delete').addEventListener('click',deleteSelected);
  $('manage-refresh').addEventListener('click',()=>loadRows().catch(console.error));
  $('manage-editor-close').addEventListener('click',closeEditor);
  $('manage-save').addEventListener('click',saveCurrent);
  $('manage-title').addEventListener('input',e=>autoGrow(e.target));
  $('manage-summary').addEventListener('input',e=>autoGrow(e.target));
  $('manage-slug').addEventListener('input',e=>e.target.value=slugify(e.target.value));
  $('manage-image-url').addEventListener('input',e=>{if(!coverFile)setCoverPreview(e.target.value.trim())});
  $('manage-cover-select').addEventListener('click',()=>$('manage-cover-input').click());
  $('manage-cover-input').addEventListener('change',e=>{
    const file=e.target.files?.[0];
    e.target.value='';
    if(!file)return;
    coverFile=file;
    setCoverPreview(URL.createObjectURL(file));
  });
  $('manage-cover-remove').addEventListener('click',()=>{
    coverFile=null;
    $('manage-image-url').value='';
    setCoverPreview('');
  });
  $('manage-body-editor').addEventListener('keyup',rememberRange);
  $('manage-body-editor').addEventListener('mouseup',rememberRange);
  $('manage-body-editor').addEventListener('focus',rememberRange);
  $('manage-editor-toolbar').querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('mousedown',e=>{
    e.preventDefault();
    editorCommand(b.dataset.cmd,b.dataset.value||null);
  }));
  $('manage-add-link').addEventListener('mousedown',e=>{
    e.preventDefault();
    const url=prompt('Link URL');
    if(url)editorCommand('createLink',cleanUrl(url));
  });

  if(await requireAdmin())await loadRows();
});