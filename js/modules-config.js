// js/modules-config.js
/**
 * Configuração Global dos Módulos e Status das Ferramentas
 * Recursos Avançados:
 * 1. Agendamento Automático e Validade de Tags (validFrom, validUntil)
 * 2. Controle de Acesso por Perfil/Nível - RBAC (roleRequired: 'public' | 'user' | 'pro' | 'admin')
 * 3. Validação de Schema em Tempo de Execução (Zero Bugs)
 */

window.MODULES_CONFIG = [
    {
        id: "dominio-sistema",
        title: "Ferramentas Dominio Sistema",
        path: "pages/dominioSistema/hub_dominio.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "analise-fiscal",
        title: "Análise de Situação Fiscal",
        path: "pages/analise-fiscal.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "analise-ponto",
        title: "Análise de ponto",
        path: "pages/jornada.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "simuladores",
        title: "Simuladores",
        path: "pages/simuladores/hub.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "utilidades",
        title: "Utilidades",
        path: "pages/utilidades/hub.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "consultas",
        title: "Consulta",
        path: "pages/consultas.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "modelos",
        title: "Modelos de documentos",
        path: "pages/modelos.html",
        accessible: true,
        roleRequired: "public"
    },
    // Sub-módulos em hubs secundários
    {
        id: "afastamentos",
        title: "Análise de Afastamentos",
        path: "afastamentos.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "programacao-ferias",
        title: "Análise de Programação de Férias",
        path: "programacao-ferias.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "importacao-txt",
        title: "Importação TXT (Domínio)",
        path: "importacao-txt.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "analise-xml",
        title: "Analise de XML",
        path: "analise_XML.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "custo-funcionario",
        title: "Simulador de Funcionário",
        path: "custo-funcionario.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "prolabore",
        title: "Simulador de Pró-labore",
        path: "prolabore.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "entenda-descontos",
        title: "Entenda os Descontos",
        path: "detalhamento-calculos.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "cota-aprendiz",
        title: "Cota aprendiz",
        path: "cota-aprendiz.html",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "rescisao",
        title: "Simulador de Rescisão",
        path: "rescisao.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "comparador-rescisao",
        title: "Comparador Multicenários",
        path: "comparador-rescisao.html",
        status: "Beta",
        statusLabel: "Beta",
        accessible: true,
        roleRequired: "public"
    },
    {
        id: "calculadora-ferias",
        title: "Calculadora de Férias",
        path: "ferias.html",
        accessible: true,
        roleRequired: "public"
    }
];

/* ==========================================================================
   1. VALIDAÇÃO DE SCHEMA EM TEMPO DE EXECUÇÃO (ZERO BUGS)
   ========================================================================== */
function validateModulesConfig(configs) {
    if (!Array.isArray(configs)) {
        console.error(`<svg class="lucide lucide-x-circle" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m15 9-6 6" /> <path d="m9 9 6 6" /> </svg> [MODULES_CONFIG Error] window.MODULES_CONFIG deve ser um Array.`);
        return false;
    }

    const errors = [];
    const ids = new Set();
    const validRoles = ['public', 'user', 'pro', 'premium', 'admin'];

    configs.forEach((mod, index) => {
        const prefix = `Módulo #${index + 1} (${mod.id || 'Sem ID'})`;

        // 1. ID obrigatório e único
        if (!mod.id || typeof mod.id !== 'string') {
            errors.push(`${prefix}: O campo 'id' é obrigatório e deve ser uma string.`);
        } else if (ids.has(mod.id)) {
            errors.push(`${prefix}: ID duplicado '${mod.id}'. Os IDs dos módulos devem ser únicos.`);
        } else {
            ids.add(mod.id);
        }

        // 2. Título obrigatório
        if (!mod.title || typeof mod.title !== 'string') {
            errors.push(`${prefix}: O campo 'title' é obrigatório.`);
        }

        // 3. Validação de Datas (validFrom / validUntil)
        if (mod.validFrom && isNaN(Date.parse(mod.validFrom))) {
            errors.push(`${prefix}: 'validFrom' é uma data inválida: "${mod.validFrom}". Use YYYY-MM-DD ou ISO.`);
        }
        if (mod.validUntil && isNaN(Date.parse(mod.validUntil))) {
            errors.push(`${prefix}: 'validUntil' é uma data inválida: "${mod.validUntil}". Use YYYY-MM-DD ou ISO.`);
        }

        // 4. Validação de Roles/Perfis (RBAC)
        if (mod.roleRequired) {
            const rolesToCheck = Array.isArray(mod.roleRequired) ? mod.roleRequired : [mod.roleRequired];
            rolesToCheck.forEach(r => {
                if (!validRoles.includes(String(r).toLowerCase())) {
                    errors.push(`${prefix}: Role '${r}' não reconhecida. Roles válidas: ${validRoles.join(', ')}.`);
                }
            });
        }
    });

    if (errors.length > 0) {
        console.group(`<svg class="lucide lucide-alert-triangle" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" /> </svg> [MODULES_CONFIG] Erros de validação detectados:`);
        errors.forEach(e => console.warn(" • " + e));
        console.groupEnd();
        return false;
    }

    return true;
}

/* ==========================================================================
   2. AGENDAMENTO AUTOMÁTICO E VALIDADE DE TAGS
   ========================================================================== */
function getEffectiveStatus(config) {
    if (!config) return { status: '', statusLabel: '', isExpired: false, isPending: false };

    const now = new Date();

    // Verificação de início de validade (validFrom)
    if (config.validFrom) {
        const startDate = new Date(config.validFrom);
        if (!isNaN(startDate.getTime()) && now < startDate) {
            return { status: '', statusLabel: '', isPending: true };
        }
    }

    // Verificação de fim de validade (validUntil)
    if (config.validUntil) {
        let endDate = new Date(config.validUntil);
        if (typeof config.validUntil === 'string' && config.validUntil.length === 10) {
            endDate = new Date(config.validUntil + 'T23:59:59.999');
        }
        if (!isNaN(endDate.getTime()) && now > endDate) {
            return { status: '', statusLabel: '', isExpired: true };
        }
    }

    return {
        status: config.status ? config.status.toLowerCase() : '',
        statusLabel: config.statusLabel || config.status || '',
        isExpired: false,
        isPending: false
    };
}

/* ==========================================================================
   3. CONTROLE DE ACESSO POR PERFIL / NÍVEL (RBAC) E SUPER ADMIN
   ========================================================================== */
const ROLE_HIERARCHY = {
    'public': 0,
    'user': 1,
    'gratuito': 1,
    'pro': 2,
    'premium': 2,
    'vip': 2,
    'admin': 3,
    'administrador': 3
};

/**
 * Obtém o e-mail do usuário atualmente conectado
 */
function getCurrentUserEmail() {
    const directEmail = localStorage.getItem('user_email') || localStorage.getItem('currentUserEmail');
    if (directEmail) return directEmail.toLowerCase().trim();

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                const itemData = JSON.parse(localStorage.getItem(key));
                if (itemData?.user?.email) {
                    return itemData.user.email.toLowerCase().trim();
                }
            }
        }
    } catch (e) {}

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('profile_')) {
                const profile = JSON.parse(localStorage.getItem(key));
                if (profile?.email) {
                    return profile.email.toLowerCase().trim();
                }
            }
        }
    } catch (e) {}

    return null;
}

/**
 * Verifica se o usuário atual é o super-administrador Alcides
 */
function isAlcidesUser() {
    const email = getCurrentUserEmail();
    if (email && (email.includes('alcides') || email.includes('alcidesdiogenes@gmail.com'))) {
        return true;
    }
    const role = (localStorage.getItem('user_role') || localStorage.getItem('user_plan') || '').toLowerCase();
    if (role === 'admin' || role === 'superadmin' || role === 'alcides') {
        return true;
    }
    return false;
}

function getCurrentUserRole() {
    if (isAlcidesUser()) {
        return 'admin';
    }

    if (typeof window.getUserRole === 'function') {
        return window.getUserRole();
    }

    const token = sessionStorage.getItem('@FerramentasDP:token') || localStorage.getItem('@FerramentasDP:token');
    const hasSbSession = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

    if (!token && !hasSbSession) {
        return 'public';
    }

    const savedRole = localStorage.getItem('user_role') || localStorage.getItem('user_plan');
    if (savedRole) {
        return savedRole.toLowerCase();
    }

    return 'user';
}

function checkUserRoleAccess(roleRequired, userRole) {
    if (!roleRequired || roleRequired === 'public') return true;

    const userLevel = ROLE_HIERARCHY[String(userRole).toLowerCase()] ?? 0;

    if (Array.isArray(roleRequired)) {
        return roleRequired.some(req => {
            const reqLevel = ROLE_HIERARCHY[String(req).toLowerCase()] ?? 0;
            return userLevel >= reqLevel;
        });
    }

    const reqLevel = ROLE_HIERARCHY[String(roleRequired).toLowerCase()] ?? 0;
    return userLevel >= reqLevel;
}

function getModuleAccessibility(config) {
    if (!config) return { accessible: true };

    // Super Admin / Usuário Alcides possui ACESSO TOTAL e ILIMITADO a todos os módulos sem limitações
    if (isAlcidesUser()) {
        return { accessible: true, isSuperAdmin: true };
    }

    // 1. Desabilitação explícita / manutenção para usuários comuns
    if (config.accessible === false) {
        return {
            accessible: false,
            reason: config.message || 'Módulo em manutenção ou temporariamente indisponível.',
            isMaintenance: true
        };
    }

    // 2. Controle de acesso por perfil / autenticação (RBAC)
    const userRole = getCurrentUserRole();
    const roleRequired = config.roleRequired || 'public';
    const hasAccess = checkUserRoleAccess(roleRequired, userRole);

    if (!hasAccess) {
        const isAuthRequired = roleRequired === 'user' || roleRequired === 'pro' || roleRequired === 'admin';
        return {
            accessible: false,
            reason: config.message || (isAuthRequired 
                ? 'A Central de Dados requer login efetuado para ser acessada.' 
                : `Acesso restrito. Este recurso requer perfil "${String(roleRequired).toUpperCase()}".`),
            isRoleRestricted: true,
            requiredRole: roleRequired
        };
    }

    return { accessible: true };
}

/* ==========================================================================
   4. APLICAÇÃO VISUAL NOS CARDS, HEADERS E MENU LATERAL
   ========================================================================== */
let isApplyingConfig = false;

/**
 * Aplica e sincroniza os selos de status (status badges) nos cards de módulos
 * e trata bloqueios por manutenção ou nível de permissão (RBAC).
 */
function applyModuleStatusBadges() {
    const cards = document.querySelectorAll('.module-card');
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        const titleEl = card.querySelector('h3');
        if (!titleEl) return;

        const titleText = titleEl.textContent.trim().toLowerCase();
        
        const cardId = card.getAttribute('data-module-id');
        const config = window.MODULES_CONFIG.find(m => {
            if (cardId && m.id === cardId) return true;
            const configTitle = m.title.toLowerCase();
            return titleText.includes(configTitle) || configTitle.includes(titleText);
        });

        if (!config) return;

        card.setAttribute('data-module-id', config.id);
        card.setAttribute('data-config-processed', 'true');

        const accessInfo = getModuleAccessibility(config);
        const statusInfo = getEffectiveStatus(config);

        let statusType = statusInfo.status;
        let statusLabel = statusInfo.statusLabel;

        // Se o recurso está restrito por perfil, exibe a tag da permissão
        if (!accessInfo.accessible && accessInfo.isRoleRestricted) {
            statusType = String(accessInfo.requiredRole).toLowerCase();
            statusLabel = `
<svg class="lucide lucide-lock" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" /> </svg> ${String(accessInfo.requiredRole).toUpperCase()}`;
        }

        // Sincroniza ou cria o badge no card
        let badge = card.querySelector('.status-badge');
        if (statusLabel) {
            card.classList.add('has-badge');
            if (!badge) {
                badge = document.createElement('span');
                let badgeContainer = card.querySelector('.module-card-badge-container') || card.querySelector('.card-header-badge');
                if (!badgeContainer) {
                    badgeContainer = document.createElement('div');
                    badgeContainer.className = 'module-card-badge-container';
                    card.insertBefore(badgeContainer, card.firstChild);
                }
                badgeContainer.appendChild(badge);
            }
            badge.className = `status-badge status-badge-${statusType}`;
            badge.textContent = statusLabel;
        } else if (badge) {
            badge.remove();
        }

        // Aplica restrições no botão do card
        if (!accessInfo.accessible) {
            card.classList.add('module-disabled');
            const btn = card.querySelector('.btn-action, a, button');
            if (btn) {
                btn.classList.add('btn-disabled');
                btn.removeAttribute('href');
                btn.textContent = accessInfo.isRoleRestricted ? 'Acesso Restrito' : 'Indisponível';
                btn.style.pointerEvents = 'auto';
                btn.setAttribute('title', accessInfo.reason);
                btn.setAttribute('aria-disabled', 'true');
                
                if (!btn.dataset.hasRestriction) {
                    btn.dataset.hasRestriction = "true";
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        alert(accessInfo.reason);
                    });
                }
            }
        }
    });
}

/**
 * Sincroniza automaticamente o selo de status no cabeçalho da página (H1)
 */
function applyPageHeaderBadges() {
    const currentPath = window.location.pathname;
    const config = window.MODULES_CONFIG.find(m => {
        if (!m.path) return false;
        const pageFileName = m.path.split('/').pop();
        return currentPath.endsWith(pageFileName) || currentPath.includes('/' + pageFileName);
    });

    if (!config) return;

    const accessInfo = getModuleAccessibility(config);
    const statusInfo = getEffectiveStatus(config);

    let statusType = statusInfo.status;
    let statusLabel = statusInfo.statusLabel;

    if (!accessInfo.accessible && accessInfo.isRoleRestricted) {
        statusType = String(accessInfo.requiredRole).toLowerCase();
        statusLabel = `
<svg class="lucide lucide-lock" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" /> </svg> ${String(accessInfo.requiredRole).toUpperCase()}`;
    }

    if (!statusLabel) return;

    const pageHeaderTitleRow = document.querySelector('.page-header-title-row, .page-header');
    if (!pageHeaderTitleRow) return;

    const h1 = pageHeaderTitleRow.querySelector('h1');
    if (!h1) return;

    let badge = pageHeaderTitleRow.querySelector('.status-badge');
    
    let parent = h1.parentElement;
    if (parent && !parent.classList.contains('page-title-badge-wrapper')) {
        if (parent.tagName !== 'DIV' || !parent.style.display.includes('flex')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'page-title-badge-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';
            wrapper.style.flexWrap = 'wrap';
            h1.parentNode.insertBefore(wrapper, h1);
            wrapper.appendChild(h1);
            parent = wrapper;
        }
    }

    if (!badge) {
        badge = document.createElement('span');
        h1.insertAdjacentElement('afterend', badge);
    }

    badge.className = `status-badge status-badge-${statusType}`;
    badge.textContent = statusLabel;
}

/**
 * Trata o bloqueio de navegação no menu lateral (sidebar)
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

        if (!config) return;

        const accessInfo = getModuleAccessibility(config);

        if (!accessInfo.accessible) {
            item.classList.add('menu-item-disabled');
            item.setAttribute('title', accessInfo.reason);
            
            if (!item.querySelector('.sidebar-badge')) {
                const sBadge = document.createElement('span');
                sBadge.className = accessInfo.isRoleRestricted ? 'sidebar-badge status-badge-pro' : 'sidebar-badge status-badge-maintenance';
                sBadge.innerHTML = accessInfo.isRoleRestricted ? '<svg class="lucide lucide-lock" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" /> </svg> PRO' : 'Indisponível';
                item.appendChild(sBadge);
            }

            if (!item.dataset.hasRestriction) {
                item.dataset.hasRestriction = "true";
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert(accessInfo.reason);
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

    // Super Admin (alcides) tem acesso liberado incondicional
    if (isAlcidesUser()) {
        return;
    }

    // Checagem padrão para demais módulos configurados
    for (const mod of window.MODULES_CONFIG) {
        if (mod.path && currentPath.includes(mod.path.split('/').pop())) {
            const accessInfo = getModuleAccessibility(mod);
            if (!accessInfo.accessible) {
                alert(accessInfo.reason);
                const pathParts = currentPath.split('/').filter(p => p.length > 0);
                const pagesIndex = pathParts.indexOf('pages');
                const depth = pagesIndex === -1 ? 0 : (pathParts.length - pagesIndex - 1);
                const prefix = depth === 0 ? '' : '../'.repeat(depth);
                window.location.href = prefix + 'index.html';
                break;
            }
        }
    }
}

function safeApplyConfigs() {
    if (isApplyingConfig) return;
    isApplyingConfig = true;
    try {
        applyModuleStatusBadges();
        applyPageHeaderBadges();
        applySidebarModuleRestrictions();
    } catch (err) {
        console.error("Erro ao aplicar configurações de módulos:", err);
    } finally {
        isApplyingConfig = false;
    }
}

// 1. Executa validação de schema
validateModulesConfig(window.MODULES_CONFIG);

// 2. Executa verificação de acesso à URL atual
checkDirectPageAccess();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeApplyConfigs);
} else {
    safeApplyConfigs();
}

// Observer para atualizações dinâmicas na DOM
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
