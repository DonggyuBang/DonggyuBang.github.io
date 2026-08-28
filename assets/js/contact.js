document.addEventListener("DOMContentLoaded",async()=>{
  const cfg=await BERL.json("data/site.json");
  const form=document.getElementById("contact-form");
  form.action=cfg.formspree_endpoint;
  document.getElementById("direct-email").textContent=cfg.contact_email;
  document.getElementById("direct-email").href=`mailto:${cfg.contact_email}`;
  form.addEventListener("submit",(e)=>{
    if(cfg.formspree_endpoint.includes("REPLACE_WITH_YOUR_FORM_ID")){
      e.preventDefault();
      alert("Formspree is not configured yet. Open data/site.json and replace REPLACE_WITH_YOUR_FORM_ID with your Formspree form ID.");
    }
  });
});
