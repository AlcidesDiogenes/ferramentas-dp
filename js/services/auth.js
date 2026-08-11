/**
 * Módulo de Autenticação - Ferramentas DP
 * Responsável por gerenciar a integração com o Supabase, sessões e ciclo de vida do usuário.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = window.SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.placeholder';

export const supabase = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEY = '@FerramentasDP:token';

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

export async function realizarLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    if (data?.session?.access_token) {
        sessionStorage.setItem(STORAGE_KEY, data.session.access_token);
    } else {
        sessionStorage.setItem(STORAGE_KEY, 'active_session');
    }
    notifyAuthStateChange(true);
    return data;
}

export async function realizarCadastro(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    if (error) throw error;
    if (data?.session?.access_token) {
        sessionStorage.setItem(STORAGE_KEY, data.session.access_token);
    } else {
        sessionStorage.setItem(STORAGE_KEY, 'active_session');
    }
    notifyAuthStateChange(true);
    return data;
}

export async function realizarLogout(notify = true) {
    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn('Erro ao encerrar sessão no Supabase:', e);
    }
    sessionStorage.removeItem(STORAGE_KEY);
    
    if (notify) {
        notifyAuthStateChange(false);
        let prefixo = '';
        const path = window.location.pathname;
        if (path.includes('/pages/simuladores/') || path.includes('/pages/dominioSistema/') || path.includes('/pages/auth/') || path.includes('/pages/gestao/')) {
            prefixo = '../../';
        } else if (path.includes('/pages/')) {
            prefixo = '../';
        }
        window.location.href = prefixo + 'pages/auth/login.html';
    }
}

export async function recuperarSenha(email) {
    const redirectTo = window.location.origin + '/pages/auth/login.html';
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
    });
    if (error) throw error;
    return data;
}

export async function atualizarSenha(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });
    if (error) throw error;
    return data;
}

export const AuthService = {
    init() {
        try {
            supabase.auth.onAuthStateChange((event, session) => {
                const isAuthenticated = !!session;
                if (session?.access_token) {
                    sessionStorage.setItem(STORAGE_KEY, session.access_token);
                }
                notifyAuthStateChange(isAuthenticated);
            });
        } catch (err) {
            console.warn('Aviso na inicialização do AuthService:', err);
        }
    },

    async login(username, password) {
        return realizarLogin(username, password);
    },

    async logout(notify = true) {
        return realizarLogout(notify);
    },

    getToken() {
        return sessionStorage.getItem(STORAGE_KEY) || null;
    },

    isAuthenticated() {
        const token = sessionStorage.getItem(STORAGE_KEY);
        if (token) return true;
        const hasSbToken = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (hasSbToken) return true;
        return false;
    }
};

AuthService.init();
