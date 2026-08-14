// js/theme-toggle.js
/**
 * Gerenciador dos Controles do Cabeçalho (Interruptor de Tema e Modo Foco / Recolher Menu)
 * Permite alternar tema e modo foco, persistindo escolhas no localStorage.
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

    // 3. Lógica do Modo Foco (Recolher / Expandir Menu)
    function toggleFocusMode(notify = true) {
        const isCollapsed = document.documentElement.classList.toggle("menu-fechado");
        localStorage.setItem("menuRetraido", isCollapsed ? "true" : "false");
        updateFocusModeButtons(isCollapsed);

        if (notify && window.showToast) {
            if (isCollapsed) {
                window.showToast("Modo Foco ativado: Menu lateral recolhido para maximizar a área de trabalho.", "info", 3200, `<svg class="lucide lucide-target" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" /> </svg> Modo Foco`);
            } else {
                window.showToast("Menu lateral expandido.", "info", 2500, `<svg class="lucide lucide-monitor" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="20" height="14" x="2" y="3" rx="2" /> <line x1="8" x2="16" y1="21" y2="21" /> <line x1="12" x2="12" y1="17" y2="21" /> </svg> Modo Normal`);
            }
        }

        document.dispatchEvent(new CustomEvent('focusModeChanged', { detail: { isCollapsed } }));
    }

    function updateFocusModeButtons(isCollapsed) {
        if (isCollapsed === undefined) {
            isCollapsed = document.documentElement.classList.contains("menu-fechado");
        }

        const focusBtns = document.querySelectorAll(".focus-toggle-btn");
        focusBtns.forEach(btn => {
            const icon = btn.querySelector(".focus-icon");
            const label = btn.querySelector(".focus-label");

            if (isCollapsed) {
                btn.classList.add("active");
                if (icon) icon.innerHTML = `<svg class="lucide lucide-monitor" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="20" height="14" x="2" y="3" rx="2" /> <line x1="8" x2="16" y1="21" y2="21" /> <line x1="12" x2="12" y1="17" y2="21" /> </svg> `;
                if (label) label.textContent = "Expandir Menu";
                btn.setAttribute("title", "Sair do Modo Foco / Expandir Menu Lateral (Alt+M)");
                btn.setAttribute("aria-label", "Sair do Modo Foco");
            } else {
                btn.classList.remove("active");
                if (icon) icon.innerHTML = `<svg class="lucide lucide-target" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" /> </svg> `;
                if (label) label.textContent = "Modo Foco";
                btn.setAttribute("title", "Ativar Modo Foco / Recolher Menu Lateral (Alt+M)");
                btn.setAttribute("aria-label", "Ativar Modo Foco");
            }
        });

        const sidebarToggleBtn = document.getElementById("toggle-sidebar");
        if (sidebarToggleBtn) {
            sidebarToggleBtn.setAttribute("title", isCollapsed ? "Expandir Menu Lateral (Alt+M)" : "Modo Foco / Recolher Menu (Alt+M)");
        }
    }

    // 4. Atualiza os botões de Tema em tela
    function updateToggleButtons(theme) {
        const buttons = document.querySelectorAll(".theme-toggle-btn");
        buttons.forEach(btn => {
            const icon = btn.querySelector(".theme-icon");
            const label = btn.querySelector(".theme-label");
            const isDark = theme === "dark";

            if (icon) icon.innerHTML = isDark ? `<svg class="lucide lucide-moon" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /> </svg> ` : `<svg class="lucide lucide-sun" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" /> </svg> `;
            if (label) label.textContent = isDark ? "Escuro" : "Claro";
            
            btn.setAttribute("aria-label", isDark ? "Mudar para tema claro" : "Mudar para tema escuro");
            btn.setAttribute("title", isDark ? "Mudar para tema claro" : "Mudar para tema escuro");
        });
    }

    // Bind listeners aos botões
    function bindHeaderControls() {
        const themeButtons = document.querySelectorAll(".theme-toggle-btn");
        themeButtons.forEach(btn => {
            if (!btn.dataset.themeBound) {
                btn.dataset.themeBound = "true";
                btn.addEventListener("click", toggleTheme);
            }
        });

        const focusButtons = document.querySelectorAll(".focus-toggle-btn");
        focusButtons.forEach(btn => {
            if (!btn.dataset.focusBound) {
                btn.dataset.focusBound = "true";
                btn.addEventListener("click", () => toggleFocusMode(true));
            }
        });
    }

    // 5. Injeta os controles do cabeçalho (Modo Foco + Tema) no canto superior da página
    function injectHeaderControls() {
        if (isInjecting) return;
        
        const existingControls = document.querySelectorAll(".header-controls-wrapper");
        if (existingControls.length > 0) {
            for (let i = 1; i < existingControls.length; i++) {
                existingControls[i].remove();
            }
            bindHeaderControls();
            updateToggleButtons(getStoredOrPreferredTheme());
            updateFocusModeButtons();
            return;
        }

        isInjecting = true;
        try {
            const topHeader = document.querySelector(".header-actions-right") || document.querySelector(".top-bar, .admin-navbar, .main-header, .page-header, header");
            if (!topHeader) return;

            const wrapper = document.createElement("div");
            wrapper.className = "header-controls-wrapper";

            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            const isCollapsed = document.documentElement.classList.contains("menu-fechado");

            wrapper.innerHTML = `
                <button type="button" class="focus-toggle-btn ${isCollapsed ? 'active' : ''}" id="btn-focus-toggle" aria-label="Modo Foco">
                    <span class="focus-icon">${isCollapsed ? `<svg class="lucide lucide-monitor" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="20" height="14" x="2" y="3" rx="2" /> <line x1="8" x2="16" y1="21" y2="21" /> <line x1="12" x2="12" y1="17" y2="21" /> </svg> ` : `<svg class="lucide lucide-target" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" /> </svg> `}</span>
                    <span class="focus-label">${isCollapsed ? "Expandir Menu" : "Modo Foco"}</span>
                </button>

                <button type="button" class="theme-toggle-btn" id="btn-theme-toggle" aria-label="Alternar tema">
                    <span class="theme-icon">${isDark ? `<svg class="lucide lucide-moon" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /> </svg> ` : `<svg class="lucide lucide-sun" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" /> </svg> `}</span>
                    <span class="theme-label">${isDark ? "Escuro" : "Claro"}</span>
                    <span class="theme-switch-pill"></span>
                </button>
            `;

            topHeader.appendChild(wrapper);
            bindHeaderControls();
            updateToggleButtons(isDark ? "dark" : "light");
            updateFocusModeButtons(isCollapsed);
        } finally {
            isInjecting = false;
        }
    }

    // Executa a injeção quando o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectHeaderControls);
    } else {
        injectHeaderControls();
    }

    // Listener para quando a sidebar renderizar
    document.addEventListener('sidebarRendered', () => {
        updateFocusModeButtons();
    });

    // MutationObserver seguro para garantir injeção se novos cabeçalhos forem inseridos
    let headerTimer = null;
    const observer = new MutationObserver(() => {
        if (isInjecting) return;
        
        const unhandledHeader = Array.from(document.querySelectorAll(".main-header, .page-header, header"))
            .some(h => !h.querySelector(".header-controls-wrapper"));

        if (!unhandledHeader) return;

        if (headerTimer) cancelAnimationFrame(headerTimer);
        headerTimer = requestAnimationFrame(() => {
            injectHeaderControls();
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
    window.toggleFocusMode = toggleFocusMode;
    window.updateFocusModeButtons = updateFocusModeButtons;
})();

