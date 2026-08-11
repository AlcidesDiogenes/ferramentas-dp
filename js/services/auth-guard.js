/**
 * Guardião de Rotas - Ferramentas DP
 * Protege o acesso às rotinas de Departamento Pessoal (férias, rescisões, cálculos).
 * Deve ser carregado preferencialmente na tag <head> das páginas.
 */

import { AuthService } from './auth.js';

class AuthGuard {
    constructor() {
        this.publicRoutes = [
            '/pages/auth/login.html',
            '/index.html',
            '/'
        ];
        
        this.verifyAccess();
    }

    /**
     * Verifica o acesso baseado na rota atual e no estado do token
     */
    verifyAccess() {
        const currentPath = window.location.pathname;
        const isAuthenticated = AuthService.isAuthenticated();
        const isPublicRoute = this.publicRoutes.some(route => currentPath.endsWith(route));

        if (!isAuthenticated && !isPublicRoute) {
            // Usuário não autenticado tentando acessar ferramentas de DP (Rescisões, Férias, etc.)
            this.redirectToLogin();
        } else if (isAuthenticated && isPublicRoute) {
            // Usuário já autenticado tentando acessar o login, redireciona para a home/dashboard
            this.redirectDashboard();
        }
    }

    /**
     * Redireciona para o login sem salvar no histórico de navegação
     */
    redirectToLogin() {
        console.warn('Acesso negado: Redirecionando para autenticação.');
        // Usa replace para evitar que o botão "Voltar" do navegador burle a segurança via cache
        window.location.replace('/pages/auth/login.html');
    }

    /**
     * Redireciona para o painel principal
     */
    redirectDashboard() {
        window.location.replace('/pages/consultas.html'); // Ajuste para a rota raiz correta pós-login
    }
}

// Inicializa o guardião imediatamente
new AuthGuard();