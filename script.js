document.addEventListener("DOMContentLoaded", () => {
    // Atualiza o ano no rodapé
    const anoSpan = document.getElementById("ano-atual");
    if (anoSpan) {
        anoSpan.textContent = new Date().getFullYear();
    }

    // Menu mobile
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });

        // Fecha o menu ao clicar em um link
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
            });
        });
    }

    // Envio do formulário de contato
    const contactForm = document.getElementById("contact-form");
    const feedback = document.getElementById("form-feedback");

    if (contactForm && feedback) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome").value.trim();
            feedback.textContent = `Obrigado, ${nome}! Sua mensagem foi enviada com sucesso.`;
            contactForm.reset();
        });
    }
});
