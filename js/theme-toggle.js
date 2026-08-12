// js/theme-toggle.js
/**
 * Gerenciador do Interruptor de Tema (Claro / Escuro)
 * Permite alternar o tema e persiste a escolha no localStorage
 */

(function () {
    let isInjecting = false;

    // 1. Aplicação antecipada e determinação do tema
    function getStoredOrPreferredTheme() {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            return "dark";
        }
        return "light";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        updateToggleButtons(theme);
    }

    // Aplica o tema imediatamente
    const initialTheme = getStoredOrPreferredTheme();
    document.documentElement.setAttribute("data-theme", initialTheme);

    // 2. Alterna o tema e grava no localStorage
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    }

    // 3. Atualiza os botões em tela
    function updateToggleButtons(theme) {
        const buttons = document.querySelectorAll(".theme-toggle-btn");
        buttons.forEach(btn => {
            const icon = btn.querySelector(".theme-icon");
            const label = btn.querySelector(".theme-label");
            const isDark = theme === "dark";

            if (icon) icon.textContent = isDark ? "🌙" : "☀️";
            if (label) label.textContent = isDark ? "Escuro" : "Claro";
            
            btn.setAttribute("aria-label", isDark ? "Mudar para tema claro" : "Mudar para tema escuro");
            btn.setAttribute("title", isDark ? "Mudar para tema claro" : "Mudar para tema escuro");
        });
    }

    // 4. Injeta o interruptor de tema nos cabeçalhos (.main-header, .page-header)
    function injectThemeSwitch() {
        if (isInjecting) return;
        isInjecting = true;
        try {
            const headers = document.querySelectorAll(".main-header, .page-header, header");
            if (!headers || headers.length === 0) return;

            headers.forEach(header => {
                if (header.querySelector(".theme-toggle-wrapper")) return;

                const wrapper = document.createElement("div");
                wrapper.className = "theme-toggle-wrapper";

                const isDark = document.documentElement.getAttribute("data-theme") === "dark";

                wrapper.innerHTML = `
                    <button type="button" class="theme-toggle-btn" id="btn-theme-toggle" aria-label="Alternar tema">
                        <span class="theme-icon">${isDark ? "🌙" : "☀️"}</span>
                        <span class="theme-label">${isDark ? "Escuro" : "Claro"}</span>
                        <span class="theme-switch-pill"></span>
                    </button>
                `;

                const btn = wrapper.querySelector(".theme-toggle-btn");
                btn.addEventListener("click", toggleTheme);

                header.appendChild(wrapper);
            });
        } finally {
            isInjecting = false;
        }
    }

    // Executa a injeção quando o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectThemeSwitch);
    } else {
        injectThemeSwitch();
    }

    // MutationObserver seguro para garantir injeção se novos cabeçalhos forem inseridos
    let themeTimer = null;
    const observer = new MutationObserver(() => {
        if (isInjecting) return;
        
        // Só executa se houver algum cabeçalho que ainda NÃO possui a classe do tema
        const unhandledHeader = Array.from(document.querySelectorAll(".main-header, .page-header, header"))
            .some(h => !h.querySelector(".theme-toggle-wrapper"));

        if (!unhandledHeader) return;

        if (themeTimer) cancelAnimationFrame(themeTimer);
        themeTimer = requestAnimationFrame(() => {
            injectThemeSwitch();
        });
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    }

    // Expõe no escopo global
    window.toggleTheme = toggleTheme;
})();
