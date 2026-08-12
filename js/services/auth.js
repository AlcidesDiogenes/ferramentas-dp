/**
 * Módulo de Autenticação - Ferramentas DP
 * Responsável por gerenciar a integração com o Supabase, sessões e ciclo de vida do usuário.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const STORAGE_KEY_TOKEN = '@FerramentasDP:token';
const STORAGE_KEY_URL = '@FerramentasDP:supabase_url';
const STORAGE_KEY_KEY = '@FerramentasDP:supabase_key';

const DEFAULT_URL = 'https://xyzcompany.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.placeholder';

let activeUrl = DEFAULT_URL;
let activeKey = DEFAULT_KEY;
let activeClient = null;

export function getSupabaseConfig() {
    const savedUrl = localStorage.getItem(STORAGE_KEY_URL) || localStorage.getItem('SUPABASE_URL') || window.SUPABASE_URL;
    const savedKey = localStorage.getItem(STORAGE_KEY_KEY) || localStorage.getItem('SUPABASE_ANON_KEY') || window.SUPABASE_ANON_KEY;
    
    const url = savedUrl ? savedUrl.trim() : activeUrl;
    const key = savedKey ? savedKey.trim() : activeKey;
    const isDefault = url.includes('xyzcompany.supabase.co') || key.includes('placeholder');

    return { url, key, isDefault };
}

function initClient(url, key) {
    activeUrl = url;
    activeKey = key;
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            activeClient = window.supabase.createClient(url, key, {
                auth: { persistSession: true, autoRefreshToken: true }
            });
        } else {
            activeClient = createClient(url, key, {
                auth: { persistSession: true, autoRefreshToken: true }
            });
        }
    } catch (e) {
        console.warn('Erro ao instanciar o cliente Supabase:', e);
    }
    return activeClient;
}

// Inicialização imediata
const initialConfig = getSupabaseConfig();
initClient(initialConfig.url, initialConfig.key);

// Busca configurações do servidor (/api/config) se disponível
export async function loadServerConfig() {
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            const data = await res.json();
            if (data.supabaseUrl && data.supabaseAnonKey) {
                const currentLocal = localStorage.getItem(STORAGE_KEY_URL);
                if (!currentLocal) {
                    initClient(data.supabaseUrl, data.supabaseAnonKey);
                }
            }
        }
    } catch (e) {
        // Servidor estático sem backend express
    }
}
loadServerConfig();

// Objeto de Proxy para manter a exportação 'supabase' sempre reativa caso a URL/Key mude em tempo de execução
export const supabase = new Proxy({}, {
    get(target, prop) {
        if (!activeClient) {
            const cfg = getSupabaseConfig();
            initClient(cfg.url, cfg.key);
        }
        const val = activeClient[prop];
        return typeof val === 'function' ? val.bind(activeClient) : val;
    }
});

export function saveSupabaseConfig(url, key) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = key.trim();
    
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
    
    initClient(cleanUrl, cleanKey);
    return { url: cleanUrl, key: cleanKey };
}

export async function testSupabaseConnection(url, key) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = key.trim();
    
    if (!cleanUrl || cleanUrl.includes('xyzcompany.supabase.co')) {
        return { success: false, error: 'URL do Supabase inválida ou com valor padrão de exemplo.' };
    }
    if (!cleanKey || cleanKey.includes('placeholder')) {
        return { success: false, error: 'Chave Anon do Supabase inválida ou com valor padrão.' };
    }

    try {
        // Tenta um ping no REST endpoint do Supabase com timeout de 6s
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(`${cleanUrl}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': cleanKey,
                'Authorization': `Bearer ${cleanKey}`
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok || response.status === 200 || response.status === 401 || response.status === 404) {
            // Se respondeu mesmo com 401/404, o servidor Supabase está ativo e alcançável
            return { success: true, status: response.status };
        } else {
            return { success: false, error: `Servidor retornou status HTTP ${response.status}` };
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            return { success: false, error: 'Tempo limite excedido ao conectar com a URL do Supabase. Verifique se o endereço está correto.' };
        }
        return { success: false, error: `Falha de conexão de rede: ${err.message}` };
    }
}

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
    const config = getSupabaseConfig();
    if (config.isDefault) {
        throw new Error('CONFIG_REQUIRED: O Supabase está com a URL padrão de exemplo. Abra as "Configurações do Supabase" abaixo e insira a URL e Chave Anon do seu projeto.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;
    
    if (data?.session?.access_token) {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, data.session.access_token);
    } else {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, 'active_session');
    }
    notifyAuthStateChange(true);
    return data;
}

export async function realizarCadastro(email, password) {
    const config = getSupabaseConfig();
    if (config.isDefault) {
        throw new Error('CONFIG_REQUIRED: O Supabase está com a URL padrão de exemplo. Abra as "Configurações do Supabase" abaixo e insira a URL e Chave Anon do seu projeto.');
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    if (error) throw error;

    const user = data?.user;
    if (user) {
        // Todo usuário novo que cadastra sua conta é criado como 'Gratuito' com as limitações gerais
        const initialProfile = {
            id: user.id,
            email: email,
            nome_completo: email.split('@')[0],
            plano: 'Gratuito',
            cargo: 'Usuário Gratuito',
            departamento: 'Geral',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            await supabase
                .schema('public')
                .from('profiles')
                .upsert(initialProfile);
        } catch (errProfile) {
            console.warn('Perfil inicial salvo localmente de fallback:', errProfile);
        }

        localStorage.setItem(`profile_${user.id}`, JSON.stringify(initialProfile));
        localStorage.setItem(`user_plan_${user.id}`, 'Gratuito');
    }
    
    if (data?.session?.access_token) {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, data.session.access_token);
    } else {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, 'active_session');
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
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    
    if (notify) {
        notifyAuthStateChange(false);
        let prefixo = '';
        const path = window.location.pathname;
        if (path.includes('/pages/simuladores/') || path.includes('/pages/dominioSistema/') || path.includes('/pages/auth/') || path.includes('/pages/gestao/') || path.includes('/pages/central-de-dados/')) {
            prefixo = '../../';
        } else if (path.includes('/pages/')) {
            prefixo = '../';
        }
        window.location.href = prefixo + 'pages/auth/login.html';
    }
}

export async function recuperarSenha(email) {
    const config = getSupabaseConfig();
    if (config.isDefault) {
        throw new Error('CONFIG_REQUIRED: O Supabase não está configurado.');
    }
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
                    sessionStorage.setItem(STORAGE_KEY_TOKEN, session.access_token);
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
        return sessionStorage.getItem(STORAGE_KEY_TOKEN) || null;
    },

    isAuthenticated() {
        const token = sessionStorage.getItem(STORAGE_KEY_TOKEN);
        if (token) return true;
        const hasSbToken = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (hasSbToken) return true;
        return false;
    }
};

AuthService.init();
