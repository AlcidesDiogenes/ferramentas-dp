/**
 * Módulo de Autenticação - Ferramentas DP
 * Responsável por gerenciar o estado da sessão, tokens e ciclo de vida do usuário.
 */

// Variável privada em memória para dificultar extração via XSS direto no storage
let currentToken = null;

// Chave utilizada para o sessionStorage (backup de persistência de aba)
const STORAGE_KEY = '@FerramentasDP:token';

/**
 * Função privada para decodificar JWT e verificar expiração
 * @param {string} token 
 * @returns {boolean} Retorna true se o token for válido e não estiver expirado
 */
const isTokenValid = (token) => {
    if (!token) return false;

    try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        
        // Verifica se a data de expiração (exp) é maior que o momento atual
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    } catch (error) {
        console.error('Erro ao decodificar o token.', error);
        return false;
    }
};

/**
 * Notifica a aplicação sobre mudanças no estado de autenticação
 * @param {boolean} isAuthenticated 
 */
const notifyAuthStateChange = (isAuthenticated) => {
    const event = new CustomEvent('authStateChanged', { 
        detail: { isAuthenticated } 
    });
    window.dispatchEvent(event);
};

export const AuthService = {
    /**
     * Tenta inicializar a sessão a partir do storage ao carregar a página
     */
    init() {
        const storedToken = sessionStorage.getItem(STORAGE_KEY);
        if (storedToken && isTokenValid(storedToken)) {
            currentToken = storedToken;
            notifyAuthStateChange(true);
        } else {
            this.logout(false); // Limpa resíduos se o token estiver inválido
        }
    },

    /**
     * Autentica o usuário na API
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async login(username, password) {
        try {
            // URL fictícia - deve ser ajustada para o endpoint real do backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                // Erro genérico de credenciais para evitar enumeração de usuários
                throw new Error('Credenciais inválidas ou sem permissão de acesso.');
            }

            const data = await response.json();
            
            if (!data.token) {
                throw new Error('Token não retornado pelo servidor.');
            }

            currentToken = data.token;
            sessionStorage.setItem(STORAGE_KEY, currentToken);
            
            notifyAuthStateChange(true);
            return { success: true };

        } catch (error) {
            this.logout(false);
            return { 
                success: false, 
                message: error.message || 'Erro ao processar a autenticação. Tente novamente mais tarde.' 
            };
        }
    },

    /**
     * Encerra a sessão do usuário
     * @param {boolean} notify UI - Define se deve notificar a aplicação
     */
    logout(notify = true) {
        currentToken = null;
        sessionStorage.removeItem(STORAGE_KEY);
        
        if (notify) {
            notifyAuthStateChange(false);
            // Redireciona para a tela de login
            window.location.href = '/pages/auth/login.html';
        }
    },

    /**
     * Retorna o token atual se for válido
     * @returns {string|null}
     */
    getToken() {
        if (!currentToken) {
            currentToken = sessionStorage.getItem(STORAGE_KEY);
        }

        if (currentToken && isTokenValid(currentToken)) {
            return currentToken;
        }

        this.logout(); // Força logout se tentarem pegar um token expirado
        return null;
    },

    /**
     * Verifica o estado de autenticação atual
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getToken();
    }
};

// Auto-inicializa o serviço ao ser importado
AuthService.init();