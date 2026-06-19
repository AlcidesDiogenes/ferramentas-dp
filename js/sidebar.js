/**
 * MOTOR GLOBAL - CONTROLE DA BARRA LATERAL (SIDEBAR) V3 (Anti-Flicker)
 */

document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-sidebar");

    if (toggleBtn) {
        // Escuta o clique no botão de hambúrguer (☰)
        toggleBtn.addEventListener("click", () => {
            // Alterna a classe na raiz absoluta do site
            document.documentElement.classList.toggle("menu-fechado");
            
            // Salva a nova preferência
            const estaFechado = document.documentElement.classList.contains("menu-fechado");
            localStorage.setItem("menuRetraido", estaFechado);
        });
    }
});