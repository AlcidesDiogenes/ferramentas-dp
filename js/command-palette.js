// js/command-palette.js
/**
 * Command Palette (Ctrl+K), Atalhos Globais de Teclado e Filtro em Tempo Real
 */
(function () {
    // Lista completa de destinos do sistema para o Command Palette (Ctrl+K)
    // Calcula quantos níveis de diretório separam a página atual da raiz do site (ex:
    // pages/simuladores/rescisao.html está 2 níveis abaixo da raiz, não 1) — mesmo algoritmo
    // usado em js/loader.js, para não gerar links quebrados como ../pages/pages/....
    const getPathPrefix = () => {
        const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
        const pagesIndex = pathParts.indexOf('pages');
        const depth = pagesIndex === -1 ? 0 : (pathParts.length - pagesIndex - 1);
        return depth === 0 ? '' : '../'.repeat(depth);
    };

    const getSystemNavigationItems = () => {
        const prefix = getPathPrefix();

        return [
            { id: 'home', title: 'Painel Principal (Início)', category: 'Navegação', path: prefix + 'index.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>', keywords: 'home inicio painel controle dashboard' },
            { id: 'dominio-sistema', title: 'Ferramentas Domínio Sistema', category: 'Módulos', path: prefix + 'pages/dominioSistema/hub_dominio.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg>', keywords: 'dominio sistema relatorio txt xml' },
            { id: 'afastamentos', title: 'Análise de Afastamentos', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/afastamentos.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>', keywords: 'afastamento atestado licenca inss' },
            { id: 'programacao-ferias', title: 'Programação de Férias', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/programacao-ferias.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>', keywords: 'ferias descanso agendamento gozo' },
            { id: 'importacao-txt', title: 'Importação TXT (Domínio)', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/importacao-txt.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>', keywords: 'txt arquivo relatorio dominio' },
            { id: 'analise-xml', title: 'Análise de XML', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/analise_XML.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>', keywords: 'xml esocial envio lote' },
            { id: 'analise-fiscal', title: 'Análise de Situação Fiscal', category: 'Módulos', path: prefix + 'pages/analise-fiscal.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg>', keywords: 'receita federal cnd debito pendencia tributaria' },
            { id: 'analise-ponto', title: 'Análise de Ponto (Jornada)', category: 'Módulos', path: prefix + 'pages/jornada.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>', keywords: 'ponto horas extras espelho marcação atraso' },
            { id: 'simuladores', title: 'Simuladores de Cálculos', category: 'Módulos', path: prefix + 'pages/simuladores/hub.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"></rect><line x1="8" x2="16" y1="6" y2="6"></line><line x1="16" x2="16.01" y1="10" y2="10"></line><line x1="16" x2="16.01" y1="14" y2="14"></line><line x1="16" x2="16.01" y1="18" y2="18"></line><line x1="8" x2="8.01" y1="10" y2="10"></line><line x1="12" x2="12.01" y1="10" y2="10"></line><line x1="8" x2="8.01" y1="14" y2="14"></line><line x1="12" x2="12.01" y1="14" y2="14"></line><line x1="8" x2="8.01" y1="18" y2="18"></line><line x1="12" x2="12.01" y1="18" y2="18"></line></svg>', keywords: 'simulador calculo folha encargo' },
            { id: 'custo-funcionario', title: 'Simulador de Funcionário', category: 'Simuladores', path: prefix + 'pages/simuladores/custo-funcionario.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>', keywords: 'custo funcionario contratação salario' },
            { id: 'prolabore', title: 'Simulador de Pró-Labore', category: 'Simuladores', path: prefix + 'pages/simuladores/prolabore.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>', keywords: 'prolabore socio inss irrf retiradas' },
            { id: 'entenda-descontos', title: 'Entenda os Descontos', category: 'Simuladores', path: prefix + 'pages/simuladores/detalhamento-calculos.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>', keywords: 'descontos holerite inss irrf' },
            { id: 'cota-aprendiz', title: 'Cota Aprendiz', category: 'Simuladores', path: prefix + 'pages/simuladores/cota-aprendiz.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>', keywords: 'aprendiz cota jovem mte' },
            { id: 'rescisao', title: 'Simulador de Rescisão', category: 'Simuladores', path: prefix + 'pages/simuladores/rescisao.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>', keywords: 'rescisao demissao aviso previo verbas avos 13 ferias fgts' },
            { id: 'comparador-rescisao', title: 'Comparador Multicenários de Demissão', category: 'Simuladores', path: prefix + 'pages/simuladores/comparador-rescisao.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"></path><path d="M8 3H3v5"></path><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.828L3 3"></path><path d="m15 9 6-6"></path></svg>', keywords: 'comparador cenario demissao acordo justa causa pedido aviso' },
            { id: 'ferias', title: 'Calculadora de Férias', category: 'Simuladores', path: prefix + 'pages/simuladores/ferias.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="m4.93 19.07 14.14-14.14"></path><path d="M2 12h20"></path><path d="m4.93 4.93 14.14 14.14"></path></svg>', keywords: 'ferias abono pecuniario medias faltas terco gozo' },
            { id: 'focus-mode', title: 'Modo Foco (Recolher / Expandir Menu Lateral)', category: 'Ações Rápidas', path: '#focus-mode', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>', keywords: 'modo foco recolher expandir menu lateral minimizar alt+m' },
            { id: 'pwa-install', title: 'Instalar Aplicativo (PWA Offline)', category: 'Ações Rápidas', path: '#pwa-install', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>', keywords: 'instalar app pwa offline aplicativo computador celular desktop' },
            { id: 'consultas', title: 'Central de Consultas', category: 'Módulos', path: prefix + 'pages/consultas.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>', keywords: 'consulta certidao cndt fgts esocial cbo' },
            { id: 'modelos', title: 'Modelos de Documentos', category: 'Módulos', path: prefix + 'pages/modelos.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path></svg>', keywords: 'modelo documento advertencia procuracao aviso' },
            { id: 'ajuda', title: 'Central de Ajuda & Atalhos', category: 'Suporte', path: prefix + 'pages/ajuda.html', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>', keywords: 'ajuda atalhos manual instrucoes teclado' }
        ];
    };

    let activeIndex = 0;
    let filteredItems = [];

    // Cria a estrutura HTML do Command Palette no DOM se não existir
    const createCommandPaletteUI = () => {
        if (document.getElementById('command-palette-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'command-palette-overlay';
        overlay.className = 'cmd-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Pesquisa Rápida de Módulos');

        overlay.innerHTML = `
            <div class="cmd-modal">
                <div class="cmd-header">
                    <span class="cmd-search-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
                    <input type="text" id="cmd-input" placeholder="Digite para buscar um módulo ou página (ex: Ponto, Férias, Rescisão, Ajuda)..." autocomplete="off" />
                    <kbd class="cmd-esc-badge">ESC</kbd>
                </div>
                <div class="cmd-results" id="cmd-results-list"></div>
                <div class="cmd-footer">
                    <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
                    <span><kbd>↵</kbd> selecionar</span>
                    <span><kbd>ESC</kbd> fechar</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector('#cmd-input');
        const resultsList = overlay.querySelector('#cmd-results-list');

        // Fecha ao clicar fora do modal
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeCommandPalette();
            }
        });

        // Evento de digitação na busca do Command Palette
        input.addEventListener('input', () => {
            renderCommandPaletteResults(input.value.trim());
        });

        // Eventos de teclado dentro do input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCommandPalette();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (filteredItems.length > 0) {
                    activeIndex = (activeIndex + 1) % filteredItems.length;
                    updateActiveCommandItem();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (filteredItems.length > 0) {
                    activeIndex = (activeIndex - 1 + filteredItems.length) % filteredItems.length;
                    updateActiveCommandItem();
                }
            } else if (e.key === 'Tab') {
                // A navegação entre resultados é feita por ↑/↓, não por Tab. Bloquear o Tab
                // aqui prende o foco no campo de busca em vez de deixá-lo escapar para o
                // conteúdo da página por trás do overlay (WCAG 2.4.3 — sem armadilha de foco).
                e.preventDefault();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems.length > 0 && filteredItems[activeIndex]) {
                    const selectedItem = filteredItems[activeIndex];
                    if (selectedItem.path === '#focus-mode') {
                        if (window.toggleFocusMode) {
                            window.toggleFocusMode(true);
                        } else {
                            const toggleBtn = document.getElementById('toggle-sidebar');
                            if (toggleBtn) toggleBtn.click();
                        }
                        closeCommandPalette();
                    } else if (selectedItem.path === '#pwa-install') {
                        if (window.promptPWAInstall) {
                            window.promptPWAInstall();
                        }
                        closeCommandPalette();
                    } else {
                        window.location.href = selectedItem.path;
                        closeCommandPalette();
                    }
                }
            }
        });
    };

    const openCommandPalette = () => {
        createCommandPaletteUI();
        const overlay = document.getElementById('command-palette-overlay');
        const input = document.getElementById('cmd-input');
        if (!overlay || !input) return;

        overlay.classList.add('active');
        input.value = '';
        renderCommandPaletteResults('');
        setTimeout(() => input.focus(), 50);
    };

    const closeCommandPalette = () => {
        const overlay = document.getElementById('command-palette-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    };

    const renderCommandPaletteResults = (query) => {
        const resultsList = document.getElementById('cmd-results-list');
        if (!resultsList) return;

        const allItems = getSystemNavigationItems();
        const termo = query.toLowerCase();

        filteredItems = allItems.filter(item => {
            if (!termo) return true;
            const fullText = `${item.title} ${item.category} ${item.keywords}`.toLowerCase();
            return fullText.includes(termo);
        });

        activeIndex = 0;

        if (filteredItems.length === 0) {
            resultsList.innerHTML = `<div class="cmd-empty">Nenhum resultado encontrado para "<strong>${escapeHtml(query)}</strong>"</div>`;
            return;
        }

        resultsList.innerHTML = filteredItems.map((item, index) => `
            <a href="${item.path}" class="cmd-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="cmd-item-left">
                    <span class="cmd-item-icon">${item.icon}</span>
                    <div>
                        <span class="cmd-item-title">${escapeHtml(item.title)}</span>
                        <span class="cmd-item-category">${escapeHtml(item.category)}</span>
                    </div>
                </div>
                <span class="cmd-item-badge">Acessar</span>
            </a>
        `).join('');

        // Eventos de hover e clique nos itens
        resultsList.querySelectorAll('.cmd-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                const idx = parseInt(el.getAttribute('data-index'), 10);
                if (!isNaN(idx)) {
                    activeIndex = idx;
                    updateActiveCommandItem();
                }
            });

            el.addEventListener('click', (e) => {
                const href = el.getAttribute('href');
                if (href === '#focus-mode') {
                    e.preventDefault();
                    if (window.toggleFocusMode) {
                        window.toggleFocusMode(true);
                    } else {
                        const toggleBtn = document.getElementById('toggle-sidebar');
                        if (toggleBtn) toggleBtn.click();
                    }
                    closeCommandPalette();
                } else if (href === '#pwa-install') {
                    e.preventDefault();
                    if (window.promptPWAInstall) {
                        window.promptPWAInstall();
                    }
                    closeCommandPalette();
                }
            });
        });
    };

    const updateActiveCommandItem = () => {
        const resultsList = document.getElementById('cmd-results-list');
        if (!resultsList) return;

        const items = resultsList.querySelectorAll('.cmd-item');
        items.forEach((item, idx) => {
            if (idx === activeIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    };

    const escapeHtml = (str) => {
        return str.replace(/[&<>"']/g, (m) => {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    };

    // ==========================================
    // FILTRO EM TEMPO REAL NA PÁGINA INICIAL (INDEX)
    // ==========================================
    const initHomeRealtimeFilter = () => {
        const inputHome = document.getElementById('filtro-modulos-home');
        const clearBtn = document.getElementById('clear-home-search');
        const cards = document.querySelectorAll('.modules-grid .module-card');
        const grid = document.querySelector('.modules-grid');

        if (!inputHome || !cards.length) return;

        // Cria o container de estado vazio caso não exista
        let emptyState = document.getElementById('home-empty-search');
        if (!emptyState && grid) {
            emptyState = document.createElement('div');
            emptyState.id = 'home-empty-search';
            emptyState.className = 'empty-state';
            emptyState.style.display = 'none';
            emptyState.style.gridColumn = '1 / -1';
            emptyState.style.textAlign = 'center';
            emptyState.style.padding = '40px 20px';
            emptyState.innerHTML = `
                <div style="margin-bottom: 15px; color: var(--cor-texto-secundario);"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></div>
                <p style="font-weight: 600; color: var(--cor-texto-principal); margin-bottom: 4px;">Nenhum módulo encontrado</p>
                <p style="font-size: 0.88rem; color: var(--cor-texto-secundario); margin-bottom: 15px;">Não encontramos nenhum módulo com esse termo de pesquisa.</p>
                <button type="button" id="btn-reset-home-search" class="btn-action" style="max-width: 180px; margin: 0 auto; font-size: 0.85rem; padding: 8px 16px;">Limpar Pesquisa</button>
            `;
            grid.appendChild(emptyState);

            const resetBtn = emptyState.querySelector('#btn-reset-home-search');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    inputHome.value = '';
                    filtrarCardsHome();
                    inputHome.focus();
                });
            }
        }

        const filtrarCardsHome = () => {
            const termo = inputHome.value.trim().toLowerCase();
            let visiveis = 0;

            if (clearBtn) {
                clearBtn.style.display = termo !== '' ? 'inline-block' : 'none';
            }

            cards.forEach(card => {
                const title = card.querySelector('h3') ? card.querySelector('h3').innerText.toLowerCase() : '';
                const desc = card.querySelector('p') ? card.querySelector('p').innerText.toLowerCase() : '';
                const ariaLabel = card.getAttribute('aria-label') ? card.getAttribute('aria-label').toLowerCase() : '';
                const keywords = card.getAttribute('data-keywords') ? card.getAttribute('data-keywords').toLowerCase() : '';

                let submodules = [];
                try {
                    const rawSub = card.getAttribute('data-submodules');
                    if (rawSub) submodules = JSON.parse(rawSub);
                } catch (e) {
                    submodules = [];
                }

                // Identifica submódulos que correspondem ao termo digitado
                const matchingSubmodules = submodules.filter(sub => {
                    if (!termo) return false;
                    const subText = `${sub.name} ${sub.keywords || ''}`.toLowerCase();
                    return subText.includes(termo);
                });

                const fullText = `${title} ${desc} ${ariaLabel} ${keywords}`;
                const matchesCardText = termo === '' || fullText.includes(termo);
                const matchesSubmodule = matchingSubmodules.length > 0;

                let subContainer = card.querySelector('.submodules-matched');

                if (termo === '') {
                    card.style.display = 'flex';
                    if (subContainer) subContainer.remove();
                    visiveis++;
                } else if (matchesCardText || matchesSubmodule) {
                    card.style.display = 'flex';
                    visiveis++;

                    if (matchingSubmodules.length > 0) {
                        if (!subContainer) {
                            subContainer = document.createElement('div');
                            subContainer.className = 'submodules-matched';
                            const btn = card.querySelector('.btn-action');
                            if (btn) {
                                card.insertBefore(subContainer, btn);
                            } else {
                                card.appendChild(subContainer);
                            }
                        }
                        subContainer.innerHTML = `
                            <span class="submodule-tag-title">
<svg class="lucide lucide-target" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="6" /> <circle cx="12" cy="12" r="2" /> </svg> Submódulo(s) encontrado(s):</span>
                            <div class="submodule-pills">
                                ${matchingSubmodules.map(sub => `
                                    <a href="${sub.url}" class="submodule-pill" title="Acessar ${sub.name}">
                                        <span>${sub.name}</span>
                                        <span class="pill-arrow">
<svg class="lucide lucide-arrow-right" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 12h14" /> <path d="m12 5 7 7-7 7" /> </svg> </span>
                                    </a>
                                `).join('')}
                            </div>
                        `;
                    } else if (subContainer) {
                        subContainer.remove();
                    }
                } else {
                    card.style.display = 'none';
                    if (subContainer) subContainer.remove();
                }
            });

            if (emptyState) {
                emptyState.style.display = visiveis === 0 ? 'block' : 'none';
            }
        };

        inputHome.addEventListener('input', filtrarCardsHome);

        inputHome.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                inputHome.value = '';
                filtrarCardsHome();
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                inputHome.value = '';
                filtrarCardsHome();
                inputHome.focus();
            });
        }
    };

    // ==========================================
    // ESCUTA GLOBAL DE ATALHOS DE TECLADO
    // ==========================================
    document.addEventListener('keydown', (e) => {
        // Ctrl + K ou Cmd + K -> Abre a Pesquisa Rápida Global
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            const overlay = document.getElementById('command-palette-overlay');
            if (overlay && overlay.classList.contains('active')) {
                closeCommandPalette();
            } else {
                openCommandPalette();
            }
            return;
        }

        // Alt + M -> Foco / Alternar Menu Lateral (Sidebar)
        if (e.altKey && (e.key === 'm' || e.key === 'M')) {
            e.preventDefault();
            if (window.toggleFocusMode) {
                window.toggleFocusMode(true);
            } else {
                const toggleBtn = document.getElementById('toggle-sidebar');
                if (toggleBtn) {
                    toggleBtn.click();
                } else {
                    const sidebarFirstLink = document.querySelector('.sidebar nav a');
                    if (sidebarFirstLink) sidebarFirstLink.focus();
                }
            }
            return;
        }

        // Alt + H -> Ir para o Painel Principal (Home)
        if (e.altKey && (e.key === 'h' || e.key === 'H')) {
            e.preventDefault();
            window.location.href = getPathPrefix() + 'index.html';
            return;
        }

        // Alt + T -> Rolar suavemente até o Topo da Página
        if (e.altKey && (e.key === 't' || e.key === 'T')) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    });

    // Inicialização ao carregar o DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            createCommandPaletteUI();
            initHomeRealtimeFilter();
        });
    } else {
        createCommandPaletteUI();
        initHomeRealtimeFilter();
    }
})();
