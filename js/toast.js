// js/toast.js - Sistema de Notificações Toast Estilizadas (Substituição Inteligente para window.alert)

(function() {
    // Evita inicialização duplicada
    if (window.showToast) return;

    let container = null;

    function getOrCreateContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                document.body.appendChild(container);
            }
        }
        return container;
    }

    const SVG_ICONS = {
        success: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        error: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        warning: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        info: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    const TITLES_DEFAULT = {
        success: 'Sucesso',
        error: 'Erro',
        warning: 'Atenção',
        info: 'Informação'
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatMessage(msg) {
        if (!msg) return '';
        const lines = msg.split('\n');
        if (lines.length > 1) {
            let hasBullets = lines.some(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
            if (hasBullets) {
                let html = '';
                let inList = false;
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        if (!inList) { html += '<ul>'; inList = true; }
                        html += `<li>${escapeHtml(trimmed.substring(2))}</li>`;
                    } else if (trimmed) {
                        if (inList) { html += '</ul>'; inList = false; }
                        html += `<div>${escapeHtml(trimmed)}</div>`;
                    }
                });
                if (inList) html += '</ul>';
                return html;
            } else {
                return lines.map(l => escapeHtml(l)).join('<br>');
            }
        }
        return escapeHtml(msg);
    }

    /**
     * Exibe uma notificação Toast estilizada na tela.
     * @param {string} message 
     * @param {'success'|'error'|'warning'|'info'} type 
     * @param {number} duration Duração em ms (default: 4200)
     * @param {string|null} title Título opcional
     */
    function showToast(message, type = 'info', duration = 4200, title = null) {
        if (!message) return;

        if (!['success', 'error', 'warning', 'info'].includes(type)) {
            type = 'info';
        }

        if (!document.body) {
            window.addEventListener('DOMContentLoaded', () => showToast(message, type, duration, title));
            return;
        }

        const parent = getOrCreateContainer();

        // Limita a 5 notificações ativas para evitar poluição visual
        if (parent.children.length >= 5) {
            const oldest = parent.firstElementChild;
            if (oldest) dismissToast(oldest);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        toast.setAttribute('role', 'alert');

        const toastTitle = title || TITLES_DEFAULT[type];
        const formattedMsg = formatMessage(String(message));

        toast.innerHTML = `
            <div class="toast-icon-wrapper">
                ${SVG_ICONS[type]}
            </div>
            <div class="toast-content">
                ${toastTitle ? `<h4 class="toast-title">${escapeHtml(toastTitle)}</h4>` : ''}
                <div class="toast-message">${formattedMsg}</div>
            </div>
            <button type="button" class="toast-close-btn" aria-label="Fechar notificação">&times;</button>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

        const closeBtn = toast.querySelector('.toast-close-btn');
        closeBtn.addEventListener('click', () => dismissToast(toast));

        const progressBar = toast.querySelector('.toast-progress-bar');
        let remainingTime = duration;
        let startTime = Date.now();
        let timeoutId = null;

        function startTimer() {
            if (duration <= 0) return;
            startTime = Date.now();
            progressBar.style.transition = `width ${remainingTime}ms linear`;
            progressBar.style.width = '0%';

            timeoutId = setTimeout(() => {
                dismissToast(toast);
            }, remainingTime);
        }

        function pauseTimer() {
            if (!timeoutId) return;
            clearTimeout(timeoutId);
            timeoutId = null;
            const elapsed = Date.now() - startTime;
            remainingTime = Math.max(0, remainingTime - elapsed);
            const computedWidth = getComputedStyle(progressBar).width;
            progressBar.style.transition = 'none';
            progressBar.style.width = computedWidth;
        }

        toast.addEventListener('mouseenter', pauseTimer);
        toast.addEventListener('mouseleave', () => {
            if (remainingTime > 0) startTimer();
        });

        parent.appendChild(toast);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('toast-show');
                startTimer();
            });
        });
    }

    function dismissToast(toast) {
        if (!toast || toast.classList.contains('toast-hide')) return;
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Exposição Global
    window.showToast = showToast;
    window.toast = {
        success: (msg, title, duration) => showToast(msg, 'success', duration, title),
        error: (msg, title, duration) => showToast(msg, 'error', duration, title),
        warning: (msg, title, duration) => showToast(msg, 'warning', duration, title),
        info: (msg, title, duration) => showToast(msg, 'info', duration, title)
    };

    // Sobrescreve o alert() padrão do navegador com toasts elegantes
    if (!window.nativeAlert) {
        window.nativeAlert = window.alert;
        window.alert = function(msg) {
            if (msg === undefined || msg === null) return;
            const strMsg = String(msg);
            let type = 'info';
            const lower = strMsg.toLowerCase();

            if (lower.includes('sucesso') || lower.includes('éxito') || lower.includes('concluíd') || lower.includes('bem-sucedido') || lower.includes('salv')) {
                type = 'success';
            } else if (lower.includes('erro') || lower.includes('falha') || lower.includes('recusad') || lower.includes('inválid') || lower.includes('não foi possível') || lower.includes('excluí')) {
                type = 'error';
            } else if (lower.includes('atenção') || lower.includes('aviso') || lower.includes('obrigatório') || lower.includes('verifique') || lower.includes('por favor') || lower.includes('nenhum')) {
                type = 'warning';
            }

            showToast(strMsg, type, 4500);
        };
    }
})();
