// js/command-palette.js
/**
 * Command Palette (Ctrl+K), Atalhos Globais de Teclado e Filtro em Tempo Real
 */
(function () {
    // Lista completa de destinos do sistema para o Command Palette (Ctrl+K)
    const getSystemNavigationItems = () => {
        const currentPath = window.location.pathname;
        let prefix = '';
        if (currentPath.includes('/pages/central-de-dados/') || currentPath.includes('/pages/gestao/')) prefix = '../../';
        else if (currentPath.includes('/pages/')) prefix = '../';

        return [
            { id: 'home', title: 'Painel Principal (Início)', category: 'Navegação', path: prefix + 'index.html', icon: '🏠', keywords: 'home inicio painel controle dashboard' },
            { id: 'dominio-sistema', title: 'Ferramentas Domínio Sistema', category: 'Módulos', path: prefix + 'pages/dominioSistema/hub_dominio.html', icon: '🖥️', keywords: 'dominio sistema relatorio txt xml' },
            { id: 'afastamentos', title: 'Análise de Afastamentos', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/afastamentos.html', icon: '🏥', keywords: 'afastamento atestado licenca inss' },
            { id: 'programacao-ferias', title: 'Programação de Férias', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/programacao-ferias.html', icon: '✈️', keywords: 'ferias descanso agendamento gozo' },
            { id: 'importacao-txt', title: 'Importação TXT (Domínio)', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/importacao-txt.html', icon: '📄', keywords: 'txt arquivo relatorio dominio' },
            { id: 'analise-xml', title: 'Análise de XML', category: 'Domínio Sistema', path: prefix + 'pages/dominioSistema/analise_XML.html', icon: '⚡', keywords: 'xml esocial envio lote' },
            { id: 'analise-fiscal', title: 'Análise de Situação Fiscal', category: 'Módulos', path: prefix + 'pages/analise-fiscal.html', icon: '⚖️', keywords: 'receita federal cnd debito pendencia tributaria' },
            { id: 'analise-ponto', title: 'Análise de Ponto (Jornada)', category: 'Módulos', path: prefix + 'pages/jornada.html', icon: '⏱️', keywords: 'ponto horas extras espelho marcação atraso' },
            { id: 'simuladores', title: 'Simuladores de Cálculos', category: 'Módulos', path: prefix + 'pages/simuladores/hub.html', icon: '🧮', keywords: 'simulador calculo folha encargo' },
            { id: 'custo-funcionario', title: 'Simulador de Funcionário', category: 'Simuladores', path: prefix + 'pages/simuladores/custo-funcionario.html', icon: '👤', keywords: 'custo funcionario contratação salario' },
            { id: 'prolabore', title: 'Simulador de Pró-Labore', category: 'Simuladores', path: prefix + 'pages/simuladores/prolabore.html', icon: '💼', keywords: 'prolabore socio inss irrf retiradas' },
            { id: 'entenda-descontos', title: 'Entenda os Descontos', category: 'Simuladores', path: prefix + 'pages/simuladores/detalhamento-calculos.html', icon: '📊', keywords: 'descontos holerite inss irrf' },
            { id: 'cota-aprendiz', title: 'Cota Aprendiz', category: 'Simuladores', path: prefix + 'pages/simuladores/cota-aprendiz.html', icon: '🎓', keywords: 'aprendiz cota jovem mte' },
            { id: 'rescisao', title: 'Simulador de Rescisão', category: 'Simuladores', path: prefix + 'pages/simuladores/rescisao.html', icon: '📜', keywords: 'rescisao demissao aviso previo verbas avos 13 ferias fgts' },
            { id: 'consultas', title: 'Central de Consultas', category: 'Módulos', path: prefix + 'pages/consultas.html', icon: '🔎', keywords: 'consulta certidao cndt fgts esocial cbo' },
            { id: 'modelos', title: 'Modelos de Documentos', category: 'Módulos', path: prefix + 'pages/modelos.html', icon: '📋', keywords: 'modelo documento advertencia procuracao aviso' },
            { id: 'central-dados', title: 'Central de Dados', category: 'Módulos', path: prefix + 'pages/central-de-dados/acesso-central.html', icon: '📊', keywords: 'dados gestao relatorio exportar' },
            { id: 'ajuda', title: 'Central de Ajuda & Atalhos', category: 'Suporte', path: prefix + 'pages/ajuda.html', icon: '❓', keywords: 'ajuda atalhos manual instrucoes teclado' }
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
                    <span class="cmd-search-icon">🔍</span>
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
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems.length > 0 && filteredItems[activeIndex]) {
                    window.location.href = filteredItems[activeIndex].path;
                    closeCommandPalette();
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

        // Eventos de hover nos itens
        resultsList.querySelectorAll('.cmd-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                const idx = parseInt(el.getAttribute('data-index'), 10);
                if (!isNaN(idx)) {
                    activeIndex = idx;
                    updateActiveCommandItem();
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
                <div style="font-size: 2.2rem; margin-bottom: 10px;">🔍</div>
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
                            <span class="submodule-tag-title">🎯 Submódulo(s) encontrado(s):</span>
                            <div class="submodule-pills">
                                ${matchingSubmodules.map(sub => `
                                    <a href="${sub.url}" class="submodule-pill" title="Acessar ${sub.name}">
                                        <span>${sub.name}</span>
                                        <span class="pill-arrow">➔</span>
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
            const toggleBtn = document.getElementById('toggle-sidebar');
            if (toggleBtn) {
                toggleBtn.click();
            } else {
                const sidebarFirstLink = document.querySelector('.sidebar nav a');
                if (sidebarFirstLink) sidebarFirstLink.focus();
            }
            return;
        }

        // Alt + H -> Ir para o Painel Principal (Home)
        if (e.altKey && (e.key === 'h' || e.key === 'H')) {
            e.preventDefault();
            const currentPath = window.location.pathname;
            let prefix = '';
            if (currentPath.includes('/pages/central-de-dados/') || currentPath.includes('/pages/gestao/')) prefix = '../../';
            else if (currentPath.includes('/pages/')) prefix = '../';
            window.location.href = prefix + 'index.html';
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
