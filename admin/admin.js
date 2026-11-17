const $=id=>document.getElementById(id);
const labels={received:"Solicitação recebida",reviewing:"Em análise",awaiting_approval:"Aguardando aprovação",in_production:"Em produção",ready:"Pronto para retirada",delivered:"Entregue",cancelled:"Cancelado"};
let orders=[],selected=null;
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=s=>new Date(s).toLocaleDateString("pt-BR");
function msg(id,s){$(id).textContent=s||""}
async function api(path,options={}){const r=await fetch(path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Erro na solicitação.");return d}
function render(){const q=$("search-orders").value.toLowerCase(),f=$("filter-status").value,v=orders.filter(o=>(!f||o.status===f)&&[o.order_number,o.customer_name,o.contact_phone,o.service].join(" ").toLowerCase().includes(q));
$("orders-body").innerHTML=v.length?v.map(o=>'<tr><td><strong>'+esc(o.order_number)+'</strong><small>'+esc(o.contact_phone)+'</small></td><td><strong>'+esc(o.customer_name)+'</strong><small>'+esc(o.customer_email)+'</small></td><td>'+esc(o.service)+'</td><td>'+date(o.created_at)+'</td><td><span class="status '+o.status+'">'+labels[o.status]+'</span></td><td><button class="edit" data-id="'+o.id+'">Atualizar ↗</button></td></tr>').join(""):'<tr><td colspan="6">Nenhum pedido encontrado.</td></tr>';
const active=orders.filter(o=>!["delivered","cancelled"].includes(o.status)).length;$("stats").innerHTML=[["Total",orders.length],["Em andamento",active],["Prontos",orders.filter(o=>o.status==="ready").length],["Entregues",orders.filter(o=>o.status==="delivered").length]].map(([a,b])=>'<div class="stat"><span>'+a+'</span><strong>'+b+'</strong></div>').join("")}
async function load(){msg("dashboard-message","Carregando...");const d=await api("/api/admin/orders");orders=d.orders||[];render();msg("dashboard-message",orders.length+" pedido(s).")}
async function sync(){const d=await api("/api/admin/session");$("login-view").hidden=d.authenticated;$("dashboard-view").hidden=!d.authenticated;if(d.authenticated)await load()}
$("login-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),b=e.currentTarget.querySelector("button");b.disabled=true;try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({identifier:f.get("identifier"),password:f.get("password")})});msg("login-message","");await sync()}catch(err){msg("login-message",err.message)}finally{b.disabled=false}};
$("logout-button").onclick=async()=>{await api("/api/admin/logout",{method:"POST"});await sync()};
$("refresh-button").onclick=()=>load().catch(e=>msg("dashboard-message",e.message));$("search-orders").oninput=render;$("filter-status").onchange=render;
$("orders-body").onclick=e=>{const b=e.target.closest("[data-id]");if(!b)return;selected=orders.find(o=>o.id===b.dataset.id);$("dialog-order-number").textContent=selected.order_number;$("dialog-customer").textContent=selected.customer_name+" · "+selected.service;$("new-status").value=selected.status;$("status-note").value="";$("order-dialog").showModal()};
$("close-dialog").onclick=()=>$("order-dialog").close();
$("status-form").onsubmit=async e=>{e.preventDefault();if(!selected)return;const b=$("save-status");b.disabled=true;try{await api("/api/admin/orders",{method:"PATCH",body:JSON.stringify({id:selected.id,status:$("new-status").value,note:$("status-note").value.trim()})});$("order-dialog").close();await load()}catch(err){msg("dashboard-message",err.message)}finally{b.disabled=false}};
sync().catch(e=>{msg("login-message",e.message);$("login-view").hidden=false;$("dashboard-view").hidden=true});
