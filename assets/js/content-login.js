document.addEventListener('DOMContentLoaded',async()=>{
  const cfg=window.BERL_SUPABASE||{};
  const $=id=>document.getElementById(id);
  const form=$('cm-login');
  const dashboard=$('cm-dashboard');
  const status=$('cm-status');
  const userLabel=$('cm-user');
  const logout=$('cm-logout');

  if(!cfg.url||!cfg.publishableKey||!window.supabase?.createClient){
    status.textContent='Authentication is unavailable.';
    return;
  }

  const sb=window.supabase.createClient(cfg.url,cfg.publishableKey);

  async function role(){
    const [{data:isAdmin,error:adminError},{data:canManage,error:manageError}]=await Promise.all([
      sb.rpc('is_admin'),
      sb.rpc('can_manage_content')
    ]);
    if(adminError)throw adminError;
    if(manageError)throw manageError;
    return {isAdmin:isAdmin===true,canManage:canManage===true};
  }

  async function showSession(){
    const {data:{session}}=await sb.auth.getSession();
    if(!session){
      form.hidden=false;
      dashboard.hidden=true;
      return false;
    }
    try{
      const r=await role();
      if(!r.canManage){
        await sb.auth.signOut();
        form.hidden=false;
        dashboard.hidden=true;
        status.textContent='This account is not approved for BERL content management.';
        return false;
      }
      form.hidden=true;
      dashboard.hidden=false;
      status.textContent='';
      userLabel.textContent=`Signed in as ${session.user.email}${r.isAdmin?' · Full Administrator':' · Content Manager'}`;
      return true;
    }catch(err){
      status.textContent=err.message||String(err);
      return false;
    }
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    status.textContent='Signing in…';
    const email=$('cm-email').value.trim();
    const password=$('cm-password').value;
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error){status.textContent=error.message;return;}
    await showSession();
  });

  logout.addEventListener('click',async()=>{
    await sb.auth.signOut();
    location.reload();
  });

  sb.auth.onAuthStateChange(()=>setTimeout(showSession,0));
  await showSession();
});