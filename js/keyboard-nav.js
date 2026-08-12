// js/keyboard-nav.js
/**
 * Suporte Global à Navegação por Teclado para .module-card e links de ação
 */
document.addEventListener('DOMContentLoaded', () => {
    const initKeyboardNav = () => {
        const cards = document.querySelectorAll('.module-card');
        
        cards.forEach(card => {
            // Torna o card focável via Tab caso ainda não tenha tabindex
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
            }
            
            // Gerencia eventos de teclado (Enter e Espaço)
            if (!card.dataset.hasKeyboardNav) {
                card.dataset.hasKeyboardNav = 'true';
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        // Evita disparar duas vezes se o foco do teclado já estiver diretamente no link/botão
                        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;

                        const actionBtn = card.querySelector('a.btn-action, a');
                        if (actionBtn) {
                            e.preventDefault();
                            actionBtn.click();
                        }
                    }
                });
            }
        });
    };

    initKeyboardNav();
    document.addEventListener('sidebarRendered', initKeyboardNav);
});
