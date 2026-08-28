document.addEventListener("DOMContentLoaded",async()=>{
  const cfg=await BERL.json("data/site.json"),form=document.getElementById("contact-form");form.action=cfg.formspree_endpoint;
  document.getElementById("direct-email").href=`mailto:${cfg.contact_email}`;document.getElementById("direct-email").textContent=cfg.contact_email;
  const wanted=new URLSearchParams(location.search).get("type");if(wanted){const s=document.getElementById("inquiry");[...s.options].forEach(o=>{if(o.value===wanted)s.value=wanted})}
});
