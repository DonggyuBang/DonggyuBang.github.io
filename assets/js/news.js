document.addEventListener('DOMContentLoaded',async()=>{
  const PAGE_SIZE=7;
  const detail=n=>`news-detail.html?id=${encodeURIComponent(n.slug)}`;
  const $=id=>document.getElementById(id);
  const cfg=window.BERL_SUPABASE||{};
  const sb=(cfg.url&&cfg.publishableKey&&window.supabase?.createClient)?window.supabase.createClient(cfg.url,cfg.publishableKey):null;
  let news=[];
  let page=Math.max(1,parseInt(new URLSearchParams(location.search).get('page')||'1',10)||1);
  let admin=false;
  let coverFile=null;
  let coverUrl='';
  let slugTouched=false;
  let lastRange=null;

  const escAttr=v=>BERL.esc(v||'');
  const slugify=text=>String(text||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,90);
  const safeFileName=name=>String(name||'image').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-90);
  const today=()=>new Date().toISOString().slice(0,10);

  function pageNumbers(total,current){
    if(total<=7)return Array.from({length:total},(_,i)=>i+1);
    const out=[1];
    if(current>4)out.push('…');
    for(let n=Math.max(2,current-2);n<=Math.min(total-1,current+2);n++)out.push(n);
    if(current<total-3)out.push('…');
    out.push(total);
    return out;
  }

  function renderPagination(){
    const el=$('news-pagination');
    const total=Math.max(1,Math.ceil(news.length/PAGE_SIZE));
    page=Math.min(page,total);
    if(total<=1){el.innerHTML='';return;}
    const nums=pageNumbers(total,page);
    el.innerHTML=`<button class="news-page-btn arrow" type="button" data-page="${page-1}" ${page===1?'disabled':''} aria-label="Previous page">←</button>${nums.map(n=>n==='…'?'<span class="news-page-ellipsis">…</span>':`<button class="news-page-btn ${n===page?'active':''}" type="button" data-page="${n}" aria-label="Page ${n}" ${n===page?'aria-current="page"':''}>${n}</button>`).join('')}<button class="news-page-btn arrow" type="button" data-page="${page+1}" ${page===total?'disabled':''} aria-label="Next page">→</button>`;
    el.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>goPage(+b.dataset.page)));
  }

  function goPage(next){
    const total=Math.max(1,Math.ceil(news.length/PAGE_SIZE));
    page=Math.max(1,Math.min(total,next));
    const u=new URL(location.href);
    page===1?u.searchParams.delete('page'):u.searchParams.set('page',page);
    history.replaceState({},'',u);
    renderNews();
    document.querySelector('#news-feature')?.closest('section')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderNews(){
    const start=(page-1)*PAGE_SIZE;
    const items=news.slice(start,start+PAGE_SIZE);
    const f=items[0];
    $('news-feature').innerHTML=f?`<a class="news-feature" href="${detail(f)}"><div class="news-image" style="background-image:url('${escAttr(f.image||'assets/images/generated/hero-landscape.png')}')"></div><div class="news-copy"><div class="date">${BERL.esc(f.date)} · ${BERL.esc(f.category)}</div><h2>${BERL.esc(f.title)}</h2><p>${BERL.esc(f.summary)}</p><span class="read-more">Read full story →</span></div></a>`:'';
    $('news-list').innerHTML=items.slice(1).map(n=>`<a class="card news-card" href="${detail(n)}"><div class="news-image" style="background-image:url('${escAttr(n.image||'assets/images/generated/research-microbial.png')}')"></div><div class="news-copy"><div class="date">${BERL.esc(n.date)} · ${BERL.esc(n.category)}</div><h3>${BERL.esc(n.title)}</h3><span class="read-more">Read story →</span></div></a>`).join('');
    renderPagination();
  }

  async function loadNews(){
    news=[...(await BERLData.news())].sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.created_at||'').localeCompare(String(a.created_at||'')));
    const total=Math.max(1,Math.ceil(news.length/PAGE_SIZE));
    page=Math.min(page,total);
    renderNews();
  }

  async function checkAdmin(){
    admin=false;
    if(sb){
      try{
        const {data:{session}}=await sb.auth.getSession();
        if(session){
          const {data,error}=await sb.rpc('is_admin');
          admin=!error&&data===true;
        }
      }catch{}
    }
    const btn=$('news-write-btn'),note=$('news-write-note');
    btn.disabled=!admin;
    note.textContent=admin?'Administrator':'Login required';
    return admin;
  }

  function autoGrow(el){
    el.style.height='auto';
    el.style.height=Math.max(el.scrollHeight,el=== $('news-title')?150:92)+'px';
  }

  function resetComposer(){
    coverFile=null;coverUrl='';slugTouched=false;lastRange=null;
    $('news-title').value='';$('news-summary').value='';$('news-date').value=today();$('news-category').value='Lab Update';$('news-slug').value='';$('news-body-editor').innerHTML='';$('news-editor-error').textContent='';$('news-composer-status').textContent='';
    $('news-cover-preview').style.backgroundImage='';$('news-cover-preview').innerHTML='<span>No cover image</span>';
    autoGrow($('news-title'));autoGrow($('news-summary'));
  }

  async function openComposer(){
    if(!(await checkAdmin()))return;
    resetComposer();
    $('news-composer').hidden=false;$('news-composer').setAttribute('aria-hidden','false');document.body.classList.add('news-composer-open');
    $('news-title').focus();
  }

  function closeComposer(){
    if(($('news-title').value.trim()||$('news-body-editor').innerText.trim())&&!confirm('Close without publishing this story?'))return;
    $('news-composer').hidden=true;$('news-composer').setAttribute('aria-hidden','true');document.body.classList.remove('news-composer-open');
  }

  function restoreRange(){
    if(!lastRange)return false;
    const s=getSelection();s.removeAllRanges();s.addRange(lastRange);return true;
  }

  function rememberRange(){
    const s=getSelection();
    if(s.rangeCount&&$('news-body-editor').contains(s.anchorNode))lastRange=s.getRangeAt(0).cloneRange();
  }

  function editorCommand(cmd,value=null){
    $('news-body-editor').focus();restoreRange();
    document.execCommand(cmd,false,value);
    rememberRange();
  }

  function cleanUrl(url){
    const v=String(url||'').trim();
    if(!v)return'';
    if(/^https?:\/\//i.test(v)||/^mailto:/i.test(v))return v;
    return 'https://'+v.replace(/^\/+/, '');
  }

  function sanitizeRichHtml(){
    const source=$('news-body-editor').cloneNode(true);
    const allowed=new Set(['P','H2','H3','BR','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE','A','FIGURE','IMG','FIGCAPTION']);
    const walk=node=>{
      [...node.children].forEach(child=>{
        walk(child);
        if(!allowed.has(child.tagName)){
          child.replaceWith(...child.childNodes);
          return;
        }
        [...child.attributes].forEach(a=>child.removeAttribute(a.name));
        if(child.tagName==='A'){
          const original=source.querySelector?null:null;
        }
      });
    };
    walk(source);
    const srcNodes=$('news-body-editor').querySelectorAll('a,img');
    const cleanNodes=source.querySelectorAll('a,img');
    cleanNodes.forEach((node,i)=>{
      const src=srcNodes[i];
      if(node.tagName==='A'){
        const href=cleanUrl(src?.getAttribute('href'));
        if(href){node.setAttribute('href',href);node.setAttribute('target','_blank');node.setAttribute('rel','noopener')}else node.removeAttribute('href');
      }else if(node.tagName==='IMG'){
        const url=String(src?.getAttribute('src')||'');
        if(/^https?:\/\//i.test(url)){node.setAttribute('src',url);node.setAttribute('alt',src?.getAttribute('alt')||'')}else node.remove();
      }
    });
    source.querySelectorAll('figcaption').forEach(x=>x.removeAttribute('contenteditable'));
    return source.innerHTML.trim();
  }

  async function uploadImage(file,kind='body'){
    if(!file||!sb)throw new Error('Image upload is unavailable.');
    if(file.size>10*1024*1024)throw new Error('Images must be 10 MB or smaller.');
    const base=slugify($('news-slug').value||$('news-title').value)||'story';
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
    const path=`news/${base}/${Date.now()}-${kind}-${safeFileName(file.name.replace(/\.[^.]+$/,''))}.${ext}`;
    const {error}=await sb.storage.from('site-images').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type});
    if(error)throw error;
    const {data}=sb.storage.from('site-images').getPublicUrl(path);
    if(!data?.publicUrl)throw new Error('Could not create the image URL.');
    return data.publicUrl;
  }

  async function addInlineImage(file){
    if(!file)return;
    $('news-composer-status').textContent='Uploading image…';
    $('news-editor-error').textContent='';
    try{
      const url=await uploadImage(file,'body');
      const fig=document.createElement('figure');
      const img=document.createElement('img');img.src=url;img.alt='';
      const cap=document.createElement('figcaption');cap.contentEditable='true';cap.textContent='Add a caption';
      fig.append(img,cap);
      $('news-body-editor').focus();
      if(restoreRange()){
        const s=getSelection(),r=s.getRangeAt(0);r.deleteContents();r.insertNode(fig);r.setStartAfter(fig);r.collapse(true);s.removeAllRanges();s.addRange(r);
      }else $('news-body-editor').append(fig);
      rememberRange();
      $('news-composer-status').textContent='Image added';setTimeout(()=>$('news-composer-status').textContent='',1100);
    }catch(err){$('news-editor-error').textContent=err.message||String(err);$('news-composer-status').textContent='';}
  }

  async function uniqueSlug(base){
    let s=base||`news-${Date.now()}`;
    const {data,error}=await sb.from('news').select('slug').eq('slug',s).limit(1);
    if(error)throw error;
    if(!data?.length)return s;
    return `${s}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Date.now()).slice(-4)}`;
  }

  async function publish(){
    if(!(await checkAdmin()))return;
    const title=$('news-title').value.trim(),summary=$('news-summary').value.trim(),date=$('news-date').value||today(),category=$('news-category').value.trim()||'News';
    $('news-editor-error').textContent='';
    if(!title){$('news-editor-error').textContent='Please enter a title.';$('news-title').focus();return;}
    if(!summary){$('news-editor-error').textContent='Please enter a short summary for the news card.';$('news-summary').focus();return;}
    const rich=sanitizeRichHtml();
    if(!rich&& !$('news-body-editor').innerText.trim()){$('news-editor-error').textContent='Please write the article body.';$('news-body-editor').focus();return;}
    const publishBtn=$('news-publish');publishBtn.disabled=true;$('news-composer-status').textContent='Publishing…';
    try{
      let slug=slugify($('news-slug').value)||slugify(title);slug=await uniqueSlug(slug);
      let image=coverUrl;
      if(coverFile){$('news-composer-status').textContent='Uploading cover…';image=await uploadImage(coverFile,'cover');}
      const row={slug,date,category,title,summary,image:image||'',body:[{type:'rich',html:rich}],is_published:true,updated_at:new Date().toISOString()};
      const {error}=await sb.from('news').insert(row);
      if(error)throw error;
      $('news-composer-status').textContent='Published';
      $('news-composer').hidden=true;$('news-composer').setAttribute('aria-hidden','true');document.body.classList.remove('news-composer-open');
      const u=new URL(location.href);u.searchParams.delete('page');history.replaceState({},'',u);page=1;
      await loadNews();
      document.querySelector('#news-feature')?.closest('section')?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){$('news-editor-error').textContent=err.message||String(err);$('news-composer-status').textContent='';}
    finally{publishBtn.disabled=false;}
  }

  $('news-write-btn').addEventListener('click',openComposer);
  $('news-composer-close').addEventListener('click',closeComposer);
  $('news-publish').addEventListener('click',publish);
  $('news-title').addEventListener('input',e=>{autoGrow(e.target);if(!slugTouched)$('news-slug').value=slugify(e.target.value)});
  $('news-summary').addEventListener('input',e=>autoGrow(e.target));
  $('news-slug').addEventListener('input',e=>{slugTouched=true;e.target.value=slugify(e.target.value)});
  $('news-body-editor').addEventListener('keyup',rememberRange);$('news-body-editor').addEventListener('mouseup',rememberRange);$('news-body-editor').addEventListener('focus',rememberRange);
  $('news-editor-toolbar').querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('mousedown',e=>{e.preventDefault();editorCommand(b.dataset.cmd,b.dataset.value||null)}));
  $('news-add-link').addEventListener('mousedown',e=>{e.preventDefault();const url=prompt('Link URL');if(url)editorCommand('createLink',cleanUrl(url))});
  $('news-add-image').addEventListener('mousedown',e=>{e.preventDefault();rememberRange();$('news-inline-image-input').click()});
  $('news-inline-image-input').addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';addInlineImage(file)});
  $('news-cover-select').addEventListener('click',()=>$('news-cover-input').click());
  $('news-cover-input').addEventListener('change',e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;coverFile=file;coverUrl='';const url=URL.createObjectURL(file);$('news-cover-preview').innerHTML='';$('news-cover-preview').style.backgroundImage=`url("${url}")`});
  $('news-cover-remove').addEventListener('click',()=>{coverFile=null;coverUrl='';$('news-cover-preview').style.backgroundImage='';$('news-cover-preview').innerHTML='<span>No cover image</span>'});

  if(sb){
    sb.auth.onAuthStateChange(()=>setTimeout(checkAdmin,0));
    setInterval(checkAdmin,4000);
  }
  await Promise.all([loadNews(),checkAdmin()]);
});
