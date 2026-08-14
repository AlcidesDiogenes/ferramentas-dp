// js/loader.js
/**
 * Loader Otimizado para Sidebar (Zero Delay / Cache Instantâneo)
 * Carrega a barra lateral instantaneamente utilizando cache e fallback estático,
 * e atualiza em segundo plano via fetch assíncrono.
 */

(function () {
    const DEFAULT_SIDEBAR = `<aside class="sidebar">
    <div class="sidebar-brand">
        <h2 class="brand-text">Ferramentas DP</h2>
        <button id="toggle-sidebar" class="toggle-btn" title="Minimizar Menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg> </button>
    </div>
    
    <nav class="sidebar-nav">
        <ul class="menu-list">
            <li><a href="index.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg></span><span class="menu-text">Painel Geral</span></a></li>
            <li><a href="pages/dominioSistema/hub_dominio.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg></span><span class="menu-text">Ferramentas Dominio Sistema</span></a></li>
            <li><a href="pages/analise-fiscal.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg></span><span class="menu-text">Análise Fiscal</span></a></li>
            <li><a href="pages/jornada.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span><span class="menu-text">Análise de ponto</span></a></li>
            <li><a href="pages/simuladores/hub.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"></rect><line x1="8" x2="16" y1="6" y2="6"></line><line x1="16" x2="16.01" y1="10" y2="10"></line><line x1="16" x2="16.01" y1="14" y2="14"></line><line x1="16" x2="16.01" y1="18" y2="18"></line><line x1="8" x2="8.01" y1="10" y2="10"></line><line x1="12" x2="12.01" y1="10" y2="10"></line><line x1="8" x2="8.01" y1="14" y2="14"></line><line x1="12" x2="12.01" y1="14" y2="14"></line><line x1="8" x2="8.01" y1="18" y2="18"></line><line x1="12" x2="12.01" y1="18" y2="18"></line></svg></span><span class="menu-text">Simuladores</span></a></li>
            <li><a href="pages/consultas.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span><span class="menu-text">Consultas</span></a></li>
            <li><a href="pages/modelos.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg></span><span class="menu-text">Modelos de documentos</span></a></li>
            <li><a href="pages/ajuda.html" class="menu-item"><span class="menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg></span><span class="menu-text">Ajuda & Atalhos</span></a></li>
        </ul>
    </nav>
</aside>`;

    let isRendered = false;

    function getBasePath() {
        const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
        const depth = pathParts.includes('pages') ? (pathParts.length - (pathParts.indexOf('pages') + 1)) : 0;
        return depth === 0 ? './' : '../'.repeat(depth);
    }

    function renderSidebar(placeholder, rawHtml) {
        if (!placeholder) return;

        const basePath = getBasePath();
        placeholder.innerHTML = rawHtml;

        // Ajusta caminhos dos links
        const links = placeholder.querySelectorAll('a');
        const caminhoAtual = window.location.pathname;

        links.forEach(link => {
            let href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                href = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
                const finalHref = basePath + href;
                link.setAttribute('href', finalHref);

                if (caminhoAtual.endsWith(href)) {
                    link.classList.add('active');
                }
            }
        });

        // Botão de alternar menu e persistência
        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            if (localStorage.getItem("menuRetraido") === "true") {
                document.documentElement.classList.add("menu-fechado");
            }

            if (!toggleBtn.dataset.hasToggle) {
                toggleBtn.dataset.hasToggle = "true";
                toggleBtn.addEventListener('click', () => {
                    if (window.toggleFocusMode) {
                        window.toggleFocusMode(true);
                    } else {
                        document.documentElement.classList.toggle("menu-fechado");
                        localStorage.setItem("menuRetraido", document.documentElement.classList.contains("menu-fechado"));
                    }
                });
            }
        }

        // Liberação de animações e transições
        if (document.body && document.body.classList.contains('preload')) {
            document.body.classList.remove('preload');
        }

        isRendered = true;
        document.dispatchEvent(new CustomEvent('sidebarRendered'));
    }

    async function initSidebarLoader() {
        const placeholder = document.getElementById('sidebar-placeholder');
        if (!placeholder) return;

        // 1. Renderiza instantaneamente do cache ou fallback estático
        let cachedHtml = DEFAULT_SIDEBAR;
        try {
            const stored = localStorage.getItem('sidebar_cache');
            if (stored && stored.length > 50) {
                cachedHtml = stored;
            }
        } catch (e) {
            // localStorage inacessível ou erro
        }

        if (!placeholder.children.length || !isRendered) {
            renderSidebar(placeholder, cachedHtml);
        }

        // 2. Atualização assíncrona em segundo plano
        try {
            const basePath = getBasePath();
            const response = await fetch(`${basePath}components/sidebar.html`);
            if (response.ok) {
                const freshHtml = await response.text();
                if (freshHtml && freshHtml.length > 50) {
                    try {
                        localStorage.setItem('sidebar_cache', freshHtml);
                    } catch (e) {}

                    // Atualiza o DOM caso o HTML do servidor seja diferente
                    if (freshHtml !== cachedHtml) {
                        renderSidebar(placeholder, freshHtml);
                    }
                }
            }
        } catch (err) {
            // Se falhar o fetch, a sidebar já foi renderizada
        }
    }

    function tryExec() {
        const placeholder = document.getElementById('sidebar-placeholder');
        if (placeholder) {
            initSidebarLoader();
        }
    }

    // Executa imediatamente
    tryExec();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryExec);
    }

    window.initSidebarLoader = initSidebarLoader;
})();
