// js/modules-config.js
/**
 * Configuração Global dos Módulos e Status das Ferramentas
 * Permite definir os estados (ex: 'Beta', 'Updated', 'Maintenance')
 * e controlar a acessibilidade dos módulos.
 */

window.MODULES_CONFIG = [
    {
        id: "dominio-sistema",
        title: "Ferramentas Dominio Sistema",
        path: "pages/dominioSistema/hub_dominio.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "analise-fiscal",
        title: "Análise de Situação Fiscal",
        path: "pages/analise-fiscal.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true
    },
    {
        id: "analise-ponto",
        title: "Análise de ponto",
        path: "pages/jornada.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "simuladores",
        title: "Simuladores",
        path: "pages/simuladores/hub.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "consultas",
        title: "Consulta",
        path: "pages/consultas.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "modelos",
        title: "Modelos de documentos",
        path: "pages/modelos.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "central-dados",
        title: "Central de dados",
        path: "pages/gestao/acesso-central.html",
        status: "Maintenance",
        statusLabel: "Em Manutenção",
        accessible: false,
        message: "A Central de dados está em desenvolvimento e temporariamente indisponível."
    },
    // Sub-módulos em hubs secundários
    {
        id: "afastamentos",
        title: "Análise de Afastamentos",
        path: "afastamentos.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "programacao-ferias",
        title: "Análise de Programação de Férias",
        path: "programacao-ferias.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "importacao-txt",
        title: "Importação TXT (Domínio)",
        path: "importacao-txt.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true
    },
    {
        id: "analise-xml",
        title: "Analise de XML",
        path: "analise_XML.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true
    },
    {
        id: "custo-funcionario",
        title: "Simulador de Funcionário",
        path: "custo-funcionario.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "prolabore",
        title: "Simulador de Pró-labore",
        path: "prolabore.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "entenda-descontos",
        title: "Entenda os Descontos",
        path: "detalhamento-calculos.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    },
    {
        id: "cota-aprendiz",
        title: "Cota aprendiz",
        path: "cota-aprendiz.html",
        status: "Updated",
        statusLabel: "Atualizado",
        accessible: true
    }
];

let isApplyingConfig = false;

/**
 * Aplica os selos de status (status badges) nos cards de módulos
 * e trata restrições de acesso para módulos indisponíveis.
 */
function applyModuleStatusBadges() {
    const cards = document.querySelectorAll('.module-card:not([data-config-processed="true"])');
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        card.setAttribute('data-config-processed', 'true');

        const titleEl = card.querySelector('h3');
        if (!titleEl) return;

        const titleText = titleEl.textContent.trim().toLowerCase();
        
        // Localiza a configuração correspondente pelo título ou data-module-id
        const cardId = card.getAttribute('data-module-id');
        const config = window.MODULES_CONFIG.find(m => {
            if (cardId && m.id === cardId) return true;
            const configTitle = m.title.toLowerCase();
            return titleText.includes(configTitle) || configTitle.includes(titleText);
        });

        if (!config) return;

        card.setAttribute('data-module-id', config.id);

        if (!card.querySelector('.status-badge')) {
            card.classList.add('has-badge');

            const badge = document.createElement('span');
            const statusType = config.status.toLowerCase();
            badge.className = `status-badge status-badge-${statusType}`;
            badge.textContent = config.statusLabel || config.status;

            let badgeContainer = card.querySelector('.module-card-badge-container');
            if (!badgeContainer) {
                badgeContainer = document.createElement('div');
                badgeContainer.className = 'module-card-badge-container';
                card.insertBefore(badgeContainer, card.firstChild);
            }
            badgeContainer.appendChild(badge);
        }

        if (config.accessible === false) {
            card.classList.add('module-disabled');
            const btn = card.querySelector('.btn-action, a, button');
            if (btn) {
                btn.classList.add('btn-disabled');
                btn.removeAttribute('href');
                btn.textContent = 'Indisponível';
                btn.style.pointerEvents = 'auto';
                btn.setAttribute('title', config.message || 'Módulo temporariamente indisponível');
                btn.setAttribute('aria-disabled', 'true');
                
                if (!btn.dataset.hasRestriction) {
                    btn.dataset.hasRestriction = "true";
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        alert(config.message || 'Este módulo está temporariamente indisponível.');
                    });
                }
            }
        }
    });
}

/**
 * Trata o bloqueio de navegação no menu lateral (sidebar) para módulos não acessíveis
 */
function applySidebarModuleRestrictions() {
    const menuItems = document.querySelectorAll('.menu-list a:not([data-config-processed="true"])');
    if (!menuItems || menuItems.length === 0) return;

    menuItems.forEach(item => {
        item.setAttribute('data-config-processed', 'true');

        const textEl = item.querySelector('.menu-text');
        if (!textEl) return;

        const text = textEl.textContent.trim().toLowerCase();
        const config = window.MODULES_CONFIG.find(m => {
            const configTitle = m.title.toLowerCase();
            return text.includes(configTitle) || configTitle.includes(text);
        });

        if (config && config.accessible === false) {
            item.classList.add('menu-item-disabled');
            item.setAttribute('title', config.message || 'Módulo indisponível');
            
            if (!item.querySelector('.sidebar-badge')) {
                const sBadge = document.createElement('span');
                sBadge.className = 'sidebar-badge status-badge-maintenance';
                sBadge.textContent = 'Indisponível';
                item.appendChild(sBadge);
            }

            if (!item.dataset.hasRestriction) {
                item.dataset.hasRestriction = "true";
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert(config.message || 'Este módulo está temporariamente indisponível.');
                });
            }
        }
    });
}

/**
 * Redireciona caso o usuário tente acessar diretamente a URL de um módulo não acessível
 */
function checkDirectPageAccess() {
    const currentPath = window.location.pathname;
    const restrictedModules = window.MODULES_CONFIG.filter(m => m.accessible === false);

    for (const mod of restrictedModules) {
        if (mod.path && currentPath.includes(mod.path)) {
            alert(mod.message || 'Este módulo não está acessível no momento.');
            let prefix = '';
            if (currentPath.includes('/pages/gestao/')) prefix = '../../';
            else if (currentPath.includes('/pages/')) prefix = '../';
            window.location.href = prefix + 'index.html';
            break;
        }
    }
}

function safeApplyConfigs() {
    if (isApplyingConfig) return;
    isApplyingConfig = true;
    try {
        applyModuleStatusBadges();
        applySidebarModuleRestrictions();
    } catch (err) {
        console.error("Erro ao aplicar configurações de módulos:", err);
    } finally {
        isApplyingConfig = false;
    }
}

// Executa verificação de URL imediatamente
checkDirectPageAccess();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeApplyConfigs);
} else {
    safeApplyConfigs();
}

// Observer seguro com RAF (Evita re-loops e consumo excessivo de CPU)
let configTimer = null;
const configObserver = new MutationObserver(() => {
    if (isApplyingConfig) return;
    if (configTimer) cancelAnimationFrame(configTimer);
    configTimer = requestAnimationFrame(() => {
        safeApplyConfigs();
    });
});

if (document.body) {
    configObserver.observe(document.body, { childList: true, subtree: true });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body) configObserver.observe(document.body, { childList: true, subtree: true });
    });
}
