// js/page-loader.js
/**
 * Componente Visual de Loading (Spinner) para NAVEGAÇÃO
 * Exibe o spinner durante a transição ao clicar em um link
 * e garante exibição única, sem duplicar na entrada da nova página.
 */

(function () {
    let spinnerEl = null;
    let spinnerMsgEl = null;
    let safetyTimeout = null;

    // Injeta o HTML do Spinner no DOM (inicia oculto por padrão)
    function injectSpinnerHTML() {
        if (document.getElementById('app-page-spinner')) {
            spinnerEl = document.getElementById('app-page-spinner');
            spinnerMsgEl = document.getElementById('spinner-text');
            return;
        }

        const div = document.createElement('div');
        div.id = 'app-page-spinner';
        div.className = 'app-page-spinner hidden'; // Inicia oculto para evitar animação dupla
        div.setAttribute('role', 'status');
        div.setAttribute('aria-live', 'polite');
        div.innerHTML = `
            <div class="spinner-box">
                <div class="spinner-ring"></div>
                <div class="spinner-brand">Ferramentas DP</div>
                <div id="spinner-text" class="spinner-text">Carregando conteúdo...</div>
            </div>
        `;

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(div);
        } else if (document.body) {
            document.body.appendChild(div);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                const mc = document.querySelector('.main-content') || document.body;
                if (mc && !document.getElementById('app-page-spinner')) {
                    mc.appendChild(div);
                }
            });
        }

        spinnerEl = div;
        spinnerMsgEl = div.querySelector('#spinner-text');
    }

    // Exibe o spinner de carregamento apenas durante a transição
    function showPageLoading(message) {
        if (!spinnerEl) injectSpinnerHTML();
        if (spinnerEl) {
            if (spinnerMsgEl && message) {
                spinnerMsgEl.textContent = message;
            } else if (spinnerMsgEl) {
                spinnerMsgEl.textContent = 'Carregando conteúdo...';
            }
            spinnerEl.classList.remove('hidden');

            // Timer de segurança para evitar que o spinner fique preso se a navegação falhar
            if (safetyTimeout) clearTimeout(safetyTimeout);
            safetyTimeout = setTimeout(hidePageLoading, 4000);
        }
    }

    // Oculta o spinner de carregamento
    function hidePageLoading() {
        if (safetyTimeout) clearTimeout(safetyTimeout);
        if (!spinnerEl) spinnerEl = document.getElementById('app-page-spinner');
        if (spinnerEl) {
            spinnerEl.classList.add('hidden');
        }
    }

    // Injeta e garante estado oculto ao carregar a nova página
    injectSpinnerHTML();
    hidePageLoading();

    // Eventos para garantir que o spinner fique escondido se a página for restaurada do cache (Back/Forward)
    window.addEventListener('pageshow', hidePageLoading);
    window.addEventListener('popstate', hidePageLoading);

    // Intercepta cliques em links internos para exibir o spinner durante a saída da página
    document.addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Ignora links inválidos, externos, âncoras ou desabilitados
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('javascript:') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') || 
            target === '_blank' || 
            link.classList.contains('btn-disabled') || 
            link.classList.contains('menu-item-disabled')) {
            return;
        }

        // Exibe o spinner apenas no momento do clique para transição entre páginas
        showPageLoading('Carregando página...');
    }, true);

    // Torna acessível globalmente
    window.showPageLoading = showPageLoading;
    window.hidePageLoading = hidePageLoading;
})();
