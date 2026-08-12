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
        <button id="toggle-sidebar" class="toggle-btn" title="Minimizar Menu">☰</button>
    </div>
    
    <nav class="sidebar-nav">
        <ul class="menu-list">
            <li><a href="index.html" class="menu-item"><span class="menu-icon">📊</span><span class="menu-text">Painel Geral</span></a></li>
            <li><a href="pages/dominioSistema/hub_dominio.html" class="menu-item"><span class="menu-icon">🖥️</span><span class="menu-text">Ferramentas Dominio Sistema</span></a></li>
            <li><a href="pages/analise-fiscal.html" class="menu-item"><span class="menu-icon">⚖️</span><span class="menu-text">Análise Fiscal</span></a></li>
            <li><a href="pages/jornada.html" class="menu-item"><span class="menu-icon">⏱️</span><span class="menu-text">Análise de ponto</span></a></li>
            <li><a href="pages/simuladores/hub.html" class="menu-item"><span class="menu-icon">🧮</span><span class="menu-text">Simuladores</span></a></li>
            <li><a href="pages/consultas.html" class="menu-item"><span class="menu-icon">🔎</span><span class="menu-text">Consultas</span></a></li>
            <li><a href="pages/modelos.html" class="menu-item"><span class="menu-icon">📋</span><span class="menu-text">Modelos de documentos</span></a></li>
            <li><a href="pages/ajuda.html" class="menu-item"><span class="menu-icon">❓</span><span class="menu-text">Ajuda & Atalhos</span></a></li>
        </ul>
    </nav>

    <div class="sidebar-user-section">
        <div id="user-logged-in" style="display: none; flex-direction: column; gap: 10px;">
            <div class="user-profile-info">
                <span class="user-label">Conectado como:</span>
                <span id="sidebar-user-email" class="user-email">Carregando...</span>
            </div>
            <div class="sidebar-actions">
                <button id="btn-atualizar-dados" class="sidebar-action-btn" title="Atualizar dados">
                    <span class="menu-icon">🔄</span>
                    <span class="menu-text">Atualizar</span>
                </button>
                <button id="btn-sidebar-logout" class="sidebar-action-btn btn-danger-action" title="Sair">
                    <span class="menu-icon">🚪</span>
                    <span class="menu-text">Sair</span>
                </button>
            </div>
        </div>

        <div id="user-logged-out" style="display: block; width: 100%;">
            <a href="pages/auth/login.html" class="menu-item" style="border-left: none; padding: 12px 15px; background-color: rgba(2, 132, 199, 0.2); border-radius: 6px; text-decoration: none;">
                <span class="menu-icon">🔑</span>
                <span class="menu-text" style="color: #38bdf8; font-weight: bold;">Fazer Login</span>
            </a>
        </div>
    </div>
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
                    document.documentElement.classList.toggle("menu-fechado");
                    localStorage.setItem("menuRetraido", document.documentElement.classList.contains("menu-fechado"));
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
