/**
 * Core Service - Autenticação Supabase
 * Inclui o método de atualização de senha pós-recuperação.
 */

const SUPABASE_URL = 'https://hydqqvczmvaadowqpmdu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pIkH3Ki7G0-hWwXRKmtchQ_S6l7ugql';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function realizarLogin(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    return data;
}

export async function realizarCadastro(email, senha) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) throw error;
    return data;
}

export async function recuperarSenha(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/pages/auth/login.html',
    });
    if (error) throw error;
    return data;
}

export async function atualizarSenha(novaSenha) {
    const { data, error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) throw error;
    return data;
}

export async function verificarSessaoAtiva() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export async function realizarLogout() {
    await supabase.auth.signOut();
    
    // Calcula automaticamente o caminho para a página principal (index.html) na raiz
    let prefixo = '';
    const path = window.location.pathname;
    if (path.includes('/pages/simuladores/') || path.includes('/pages/dominioSistema/') || path.includes('/pages/auth/')) {
        prefixo = '../../';
    } else if (path.includes('/pages/')) {
        prefixo = '../';
    }
    
    window.location.href = prefixo + 'index.html';
}

document.getElementById('btn-header-login')?.addEventListener('click', () => {
    // Redireciona para a sua página de login (ajuste a rota se necessário)
    window.location.href = '../auth/login.html'; 
});