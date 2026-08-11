/**
 * Controlador de Autenticação do Cabeçalho - Ferramentas DP
 * Responsável por atualizar a UI do Header (exibir perfil vs. botão login)
 * com base no evento de estado da sessão global.
 */

import { AuthService } from '../services/auth.js';

class HeaderAuthController {
    constructor() {
        // Seletores baseados em IDs semânticos que devem existir no seu HTML do cabeçalho
        this.loginContainer = document.getElementById('login-action-container');
        this.userProfileContainer = document.getElementById('user-profile-container');
        this.logoutBtn = document.getElementById('btn-logout');

        this.init();
    }

    /**
     * Inicializa o controlador, vincula os eventos e monta o estado inicial da UI
     */
    init() {
        // Prevenção de quebra de script caso a página não possua o cabeçalho padrão
        if (!this.loginContainer || !this.userProfileContainer) {
            console.warn('HeaderAuthController: Elementos estruturais do cabeçalho não encontrados no DOM.');
            return;
        }

        this.bindEvents();
        
        // Define o estado inicial da interface com a Fonte Única de Verdade (AuthService)
        this.updateUI(AuthService.isAuthenticated());
    }

    /**
     * Vincula ouvintes de eventos da janela e interações do usuário
     */
    bindEvents() {
        // Escuta a mudança de estado propagada pelo auth.js
        window.addEventListener('authStateChanged', (event) => {
            this.updateUI(event.detail.isAuthenticated);
        });

        // Ação de logout disparada pelo usuário no menu do cabeçalho
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    /**
     * Atualiza o DOM visando performance e acessibilidade (WCAG)
     * @param {boolean} isAuthenticated 
     */
    updateUI(isAuthenticated) {
        if (isAuthenticated) {
            // Usuário LOGADO: Oculta a área de Login
            this.loginContainer.setAttribute('hidden', 'true');
            this.loginContainer.setAttribute('aria-hidden', 'true');
            
            // Exibe a área do Perfil do Usuário
            this.userProfileContainer.removeAttribute('hidden');
            this.userProfileContainer.setAttribute('aria-hidden', 'false');
        } else {
            // Usuário DESLOGADO: Oculta a área do Perfil
            this.userProfileContainer.setAttribute('hidden', 'true');
            this.userProfileContainer.setAttribute('aria-hidden', 'true');
            
            // Exibe a área de Login
            this.loginContainer.removeAttribute('hidden');
            this.loginContainer.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * Processa a solicitação de logout do usuário com fallback de segurança
     */
    handleLogout() {
        try {
            // Delega a responsabilidade lógica para o AuthService
            AuthService.logout(true);
        } catch (error) {
            console.error('Erro na delegação do logout:', error);
            
            // Fallback: Se o serviço falhar, força a limpeza do navegador localmente
            sessionStorage.clear();
            window.location.replace('/pages/auth/login.html');
        }
    }
}

// Garante que o DOM esteja totalmente construído antes de procurar os elementos
document.addEventListener('DOMContentLoaded', () => {
    new HeaderAuthController();
});