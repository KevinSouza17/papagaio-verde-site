document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());
const toggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".navigation");
toggle?.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");toggle?.setAttribute("aria-expanded","false");}));
