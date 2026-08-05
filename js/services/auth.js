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
    window.location.href = "/pages/auth/login.html";
}