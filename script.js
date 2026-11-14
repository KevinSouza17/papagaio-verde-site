document.getElementById("year").textContent=new Date().getFullYear();
const menuButton=document.querySelector(".menu-toggle"),navigation=document.querySelector(".navigation");
menuButton?.addEventListener("click",()=>{const open=navigation.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open))});
navigation?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{navigation.classList.remove("open");menuButton.setAttribute("aria-expanded","false")}));
const form=document.getElementById("order-request-form"),feedback=document.getElementById("request-feedback");
form?.addEventListener("submit",async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(form).entries()),btn=form.querySelector("button");btn.disabled=true;btn.textContent="Enviando...";
try{const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}),v=await r.json();if(!r.ok)throw new Error(v.error||"Falha ao enviar.");feedback.textContent="Pedido registrado! Seu código é "+v.order_number+". Guarde-o para acompanhar.";form.reset();window.open("https://wa.me/5511972885199?text="+encodeURIComponent("Olá! Enviei uma solicitação pelo site. Código: "+v.order_number),"_blank","noopener")}
catch(err){console.error(err);feedback.textContent=err.message||"Não foi possível registrar. Tente novamente ou chame no WhatsApp."}finally{btn.disabled=false;btn.innerHTML='Enviar solicitação <span>↗</span>'}});
