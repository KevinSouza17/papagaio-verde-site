// Configure o WhatsApp da loja usando DDI + DDD + número, somente números.
// Exemplo de formato: 5511999999999
const WHATSAPP_NUMBER = "";

document.getElementById("year").textContent = new Date().getFullYear();

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");
menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});
navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  navigation.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}));

const whatsappLink = document.getElementById("whatsapp-link");
const contactHint = document.getElementById("contact-hint");
if (WHATSAPP_NUMBER) {
  whatsappLink.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent("Olá! Gostaria de informações sobre a Papagaio Verde.");
  whatsappLink.target = "_blank";
  whatsappLink.rel = "noopener noreferrer";
  contactHint.textContent = "Atendimento pelo WhatsApp.";
} else {
  whatsappLink.addEventListener("click", event => {
    event.preventDefault();
    contactHint.textContent = "O número do WhatsApp ainda precisa ser configurado no arquivo script.js.";
  });
}