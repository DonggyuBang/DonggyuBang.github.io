(()=>{
  const cfg=window.BERL_SUPABASE||{};
  if(!cfg.url||!cfg.publishableKey||!window.supabase?.createClient)return;
  const sb=window.supabase.createClient(cfg.url,cfg.publishableKey);
  const pagePath=location.pathname.endsWith('/')?location.pathname+'index.html':location.pathname;
  let isAdmin=false,editMode=false,overrides=new Map(),observer=null;
  const ignoreSelector='#berl-admin-bar,.berl-editor-backdrop,.berl-login-box,script,style,link,meta,head,html,body';
  const styleProps=['fontFamily','fontSize','fontWeight','color','backgroundColor','textAlign','lineHeight','letterSpacing','borderRadius'];
  function cssPath(el){
    if(el.id)return '#'+CSS.escape(el.id);
    const parts=[];let cur=el;
    while(cur&&cur!==document.body){
      let p=cur.tagName.toLowerCase();
      if(cur.classList.length)p+='.'+[...cur.classList].slice(0,2).map(CSS.escape).join('.');
      const sib=cur.parentElement?[...cur.parentElement.children].filter(x=>x.tagName===cur.tagName):[];
      if(sib.length>1)p+=`:nth-of-type(${sib.indexOf(cur)+1})`;
      parts.unshift(p);cur=cur.parentElement;
    }
    return parts.join(' > ');
  }
  function resolve(sel){try{return document.querySelector(sel)}catch{return null}}
  function applyOverride(row){
    const el=resolve(row.selector);if(!el)return;
    if(row.content_html!=null)el.innerHTML=row.content_html; else if(row.content_text!=null)el.textContent=row.content_text;
    if(row.href!=null&&'href'in el)el.setAttribute('href',row.href);
    if(row.image_url!=null){if(el.tagName==='IMG')el.src=row.image_url;else el.style.backgroundImage=`url("${row.image_url.replace(/"/g,'\\"')}")`;}
    Object.entries(row.styles||{}).forEach(([k,v])=>{if(v!=null&&k in el.style)el.style[k]=v});
    el.classList.toggle('berl-hidden-by-editor',!!row.is_hidden);
  }
  function applyAll(){overrides.forEach(applyOverride)}
  async function loadOverrides(){
    const {data,error}=await sb.from('site_overrides').select('*').eq('page_path',pagePath);
    if(error){console.warn('BERL editor overrides',error);return}
    overrides=new Map((data||[]).map(r=>[r.selector,r]));applyAll();
  }
  function markEditable(root=document){
    const candidates=root.querySelectorAll?.('h1,h2,h3,h4,h5,h6,p,span,a,button,img,li,strong,em,small,div[class*="card"],section,figure')||[];
    candidates.forEach(el=>{if(el.closest(ignoreSelector)||el.closest('#berl-admin-bar,.berl-editor-backdrop,.berl-login-box'))return;if(el.children.length>6)return;el.dataset.berlEditable='1'});
  }
  function startObserver(){
    if(observer)return;
    let queued=false;
    observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyAll();if(isAdmin)markEditable()})});
    observer.observe(document.body,{childList:true,subtree:true});
  }
  function setEditMode(on){editMode=on;document.body.classList.toggle('berl-edit-mode',on);const b=document.getElementById('berlEditToggle');if(b)b.textContent=on?'Exit edit mode':'Edit page';if(on)markEditable()}
  function makeBar(){
    const bar=document.createElement('div');bar.id='berl-admin-bar';
    bar.innerHTML=`<span class="berl-admin-status" id="berlAdminStatus">BERL</span><button id="berlLoginBtn">Admin login</button><button id="berlEditToggle" class="berl-admin-primary" hidden>Edit page</button><button id="berlLogoutBtn" hidden>Log out</button>`;
    document.body.appendChild(bar);
    document.getElementById('berlLoginBtn').onclick=openLogin;
    document.getElementById('berlEditToggle').onclick=()=>setEditMode(!editMode);
    document.getElementById('berlLogoutBtn').onclick=async()=>{await sb.auth.signOut();location.reload()};
  }
  function openLogin(){
    if(document.querySelector('.berl-login-box'))return;
    const box=document.createElement('div');box.className='berl-login-box';box.innerHTML=`<h3>BERL administrator</h3><input id="berlEmail" type="email" placeholder="Email"><input id="berlPassword" type="password" placeholder="Password"><div class="berl-login-actions"><button class="berl-editor-btn secondary" id="berlLoginCancel">Cancel</button><button class="berl-editor-btn primary" id="berlLoginSubmit">Sign in</button></div><div class="berl-login-msg" id="berlLoginMsg"></div>`;document.body.appendChild(box);
    box.querySelector('#berlLoginCancel').onclick=()=>box.remove();
    box.querySelector('#berlLoginSubmit').onclick=async()=>{const msg=box.querySelector('#berlLoginMsg');msg.textContent='Signing in…';const {error}=await sb.auth.signInWithPassword({email:box.querySelector('#berlEmail').value.trim(),password:box.querySelector('#berlPassword').value});if(error){msg.textContent=error.message;return}const {data,error:e2}=await sb.rpc('is_admin');if(e2||data!==true){await sb.auth.signOut();msg.textContent='This account is not approved as an administrator.';return}box.remove();activateAdmin()};
  }
  function activateAdmin(){isAdmin=true;document.getElementById('berlAdminStatus').textContent='Admin';document.getElementById('berlLoginBtn').hidden=true;document.getElementById('berlEditToggle').hidden=false;document.getElementById('berlLogoutBtn').hidden=false;markEditable()}
  function selectedStyles(el){const cs=getComputedStyle(el);return Object.fromEntries(styleProps.map(p=>[p,cs[p]]))}
  async function uploadImage(file){const ext=(file.name.split('.').pop()||'bin').toLowerCase();const key=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;const {error}=await sb.storage.from('site-images').upload(key,file,{upsert:false});if(error)throw error;return sb.storage.from('site-images').getPublicUrl(key).data.publicUrl}
  function openEditor(el){
    if(!isAdmin||!editMode)return;const selector=cssPath(el),existing=overrides.get(selector)||{},styles={...selectedStyles(el),...(existing.styles||{})};
    const isImg=el.tagName==='IMG';const isLink='href'in el;const hasBg=getComputedStyle(el).backgroundImage!=='none';
    const wrap=document.createElement('div');wrap.className='berl-editor-backdrop';wrap.innerHTML=`<div class="berl-editor-panel"><div class="berl-editor-head"><div><small>Live page editor</small><h3>${el.tagName.toLowerCase()} · ${selector}</h3></div><button class="berl-editor-close">×</button></div><div class="berl-editor-body">
      <label>Text / HTML<textarea id="beContent">${(existing.content_html??existing.content_text??(el.children.length?el.innerHTML:el.textContent)||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></label><div class="berl-editor-hint">Plain text is easiest. Existing inline HTML can also be preserved.</div>
      ${isLink?`<label>Link URL<input id="beHref" value="${(existing.href??el.getAttribute('href')??'').replace(/"/g,'&quot;')}"></label>`:''}
      ${(isImg||hasBg)?`<label>Image URL<input id="beImage" value="${(existing.image_url??(isImg?el.getAttribute('src'):'')??'').replace(/"/g,'&quot;')}"></label><label>Upload image<input id="beUpload" type="file" accept="image/*"></label>`:''}
      <div class="berl-editor-grid"><label>Font family<input id="beFont" value="${styles.fontFamily.replace(/"/g,'&quot;')}"></label><label>Font size<input id="beSize" value="${styles.fontSize}"></label><label>Font weight<input id="beWeight" value="${styles.fontWeight}"></label><label>Text color<input id="beColor" type="color" value="${rgbToHex(styles.color)}"></label><label>Background color<input id="beBg" value="${styles.backgroundColor}"></label><label>Text align<select id="beAlign"><option>left</option><option>center</option><option>right</option><option>justify</option></select></label><label>Line height<input id="beLine" value="${styles.lineHeight}"></label><label>Letter spacing<input id="beLetter" value="${styles.letterSpacing}"></label></div>
      <label><input id="beHidden" type="checkbox" ${existing.is_hidden?'checked':''}> Hide this element</label>
      <div class="berl-editor-actions"><button class="berl-editor-btn danger" id="beReset">Reset this element</button><div><button class="berl-editor-btn secondary" id="beCancel">Cancel</button><button class="berl-editor-btn primary" id="beSave">Save changes</button></div></div><div id="beMsg" class="berl-editor-hint"></div>
    </div></div>`;document.body.appendChild(wrap);wrap.querySelector('#beAlign').value=styles.textAlign||'left';
    const close=()=>wrap.remove();wrap.querySelector('.berl-editor-close').onclick=close;wrap.querySelector('#beCancel').onclick=close;wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
    wrap.querySelector('#beReset').onclick=async()=>{const {error}=await sb.from('site_overrides').delete().eq('page_path',pagePath).eq('selector',selector);if(error){wrap.querySelector('#beMsg').textContent=error.message;return}location.reload()};
    wrap.querySelector('#beSave').onclick=async()=>{const msg=wrap.querySelector('#beMsg');msg.textContent='Saving…';let imageUrl=wrap.querySelector('#beImage')?.value.trim()||null;const file=wrap.querySelector('#beUpload')?.files?.[0];try{if(file)imageUrl=await uploadImage(file);const value=wrap.querySelector('#beContent').value;const row={page_path:pagePath,selector,content_html:value,content_text:null,href:wrap.querySelector('#beHref')?.value.trim()||null,image_url:imageUrl,styles:{fontFamily:wrap.querySelector('#beFont').value.trim(),fontSize:wrap.querySelector('#beSize').value.trim(),fontWeight:wrap.querySelector('#beWeight').value.trim(),color:wrap.querySelector('#beColor').value,backgroundColor:wrap.querySelector('#beBg').value.trim(),textAlign:wrap.querySelector('#beAlign').value,lineHeight:wrap.querySelector('#beLine').value.trim(),letterSpacing:wrap.querySelector('#beLetter').value.trim()},is_hidden:wrap.querySelector('#beHidden').checked,updated_at:new Date().toISOString()};const {data:{user}}=await sb.auth.getUser();row.updated_by=user?.id||null;const {data,error}=await sb.from('site_overrides').upsert(row,{onConflict:'page_path,selector'}).select().single();if(error)throw error;overrides.set(selector,data);applyOverride(data);close()}catch(err){msg.textContent=err.message||String(err)}};
  }
  function rgbToHex(v){const m=String(v).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(!m)return '#000000';return '#'+[m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,'0')).join('')}
  document.addEventListener('click',e=>{if(!editMode||!isAdmin)return;const el=e.target.closest('[data-berl-editable="1"]');if(!el||el.closest('#berl-admin-bar,.berl-editor-backdrop,.berl-login-box'))return;e.preventDefault();e.stopPropagation();openEditor(el)},true);
  (async()=>{makeBar();await loadOverrides();startObserver();const {data:{session}}=await sb.auth.getSession();if(session){const {data}=await sb.rpc('is_admin');if(data===true)activateAdmin()}})();
})();