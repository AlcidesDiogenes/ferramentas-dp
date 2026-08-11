import { supabase, realizarLogout } from './auth.js';

async function atualizarEstadoSidebar() {
    const divLogado = document.getElementById('user-logged-in');
    const divDeslogado = document.getElementById('user-logged-out');
    const emailSpan = document.getElementById('sidebar-user-email');

    // Se o sidebar ainda não foi injetado na página, aguarda 50ms e tenta novamente
    if (!divLogado || !divDeslogado) {
        setTimeout(atualizarEstadoSidebar, 50);
        return;
    }

    try {
        // Busca a sessão ativa diretamente do armazenamento local
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
            // Se não estiver logado, exibe o botão de Fazer Login
            divLogado.style.display = 'none';
            divDeslogado.style.display = 'block';
            return;
        }

        // Se estiver logado, oculta o botão de login e exibe o e-mail/ações
        divDeslogado.style.display = 'none';
        divLogado.style.display = 'flex';
        
        if (emailSpan) {
            emailSpan.textContent = session.user.email; // Mostra o usuário conectado
        }

    } catch (err) {
        console.error("Erro ao carregar usuário no sidebar:", err);
        divLogado.style.display = 'none';
        divDeslogado.style.display = 'block';
    }
}

// Inicia a verificação assim que o script carregar
atualizarEstadoSidebar();

// Ouve mudanças de login/logout em tempo real
supabase.auth.onAuthStateChange(() => {
    atualizarEstadoSidebar();
});

// Delegação de eventos globais para os botões do sidebar (funciona mesmo se injetados dinamicamente)
document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'btn-sidebar-logout' || e.target.closest('#btn-sidebar-logout')) {
        try {
            await realizarLogout();
        } catch (error) {
            console.error("Erro ao sair:", error.message);
        }
    }

    if (e.target && e.target.id === 'btn-atualizar-dados' || e.target.closest('#btn-atualizar-dados')) {
        let prefixo = '';
        const path = window.location.pathname;
        if (path.includes('/pages/simuladores/') || path.includes('/pages/dominioSistema/') || path.includes('/pages/auth/') || path.includes('/pages/gestao/')) {
            prefixo = '../../';
        } else if (path.includes('/pages/')) {
            prefixo = '../';
        }
        window.location.href = prefixo + 'pages/auth/atualizar-dados.html';
    }
});