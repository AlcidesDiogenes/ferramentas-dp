/**
 * CONTROLLER: HEADER AUTH
 * Consulta a tabela de perfis priorizando a coluna 'nome_completo'.
 */

import { supabase } from '../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const btnLoginHeader = document.getElementById('btn-header-login');
    if (!btnLoginHeader) return;

    try {
        // 1. Verifica a sessão ativa no Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            btnLoginHeader.innerHTML = `<i class="ph ph-sign-in"></i> <span>Entrar</span>`;
            btnLoginHeader.onclick = () => {
                window.location.href = '../auth/login.html';
            };
            return;
        }

        let nomeExibicao = null;

        // 2. Consulta o perfil priorizando a coluna 'nome_completo'
        try {
            let { data: perfil, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error || !perfil) {
                const { data: perfilAlt } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();
                perfil = perfilAlt;
            }

            if (perfil) {
                // Prioriza explicitamente a coluna 'nome_completo'
                nomeExibicao = perfil.nome_completo || perfil.nome || perfil.full_name || perfil.name;
            }
        } catch (err) {
            console.warn("Aviso: Não foi possível consultar a tabela de perfis.", err);
        }

        // 3. Fallback caso não encontre na tabela
        if (!nomeExibicao) {
            nomeExibicao = user.user_metadata?.nome_completo || user.user_metadata?.nome;
        }

        if (!nomeExibicao && user.email) {
            const parteEmail = user.email.split('@')[0];
            nomeExibicao = parteEmail
                .replace(/[._]/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
        }

        // 4. Renderiza o botão com o ícone e o nome correto
        btnLoginHeader.innerHTML = `<i class="ph ph-user-circle"></i><span>${nomeExibicao || 'Usuário'}</span>`;
        btnLoginHeader.title = `Logado como ${user.email}. Clique para sair.`;

        // 5. Ação de encerramento de sessão
        btnLoginHeader.onclick = async () => {
            if (confirm(`Deseja encerrar a sessão de ${nomeExibicao}?`)) {
                await supabase.auth.signOut();
                window.location.reload();
            }
        };

    } catch (error) {
        console.error("Erro ao processar autenticação na header:", error);
    }
});