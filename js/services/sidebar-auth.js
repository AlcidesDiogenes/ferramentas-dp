import { supabase, realizarLogout } from './auth.js';

async function atualizarEstadoSidebar() {
    const divLogado = document.getElementById('user-logged-in');
    const divDeslogado = document.getElementById('user-logged-out');
    const emailSpan = document.getElementById('sidebar-user-email');

    try {
        // getSession lê direto do localStorage, sendo imediato e infalível no front-end
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
            // Se não houver sessão, mostra o botão de Fazer Login
            if (divLogado) divLogado.style.display = 'none';
            if (divDeslogado) divDeslogado.style.display = 'block';
            return;
        }

        // Se houver sessão ativa, exibe os dados e oculta o botão de login
        if (divDeslogado) divDeslogado.style.display = 'none';
        if (divLogado) divLogado.style.display = 'flex';
        
        if (emailSpan) {
            emailSpan.textContent = session.user.email; // Exibe o e-mail do usuário conectado
        }

    } catch (err) {
        console.error("Erro ao carregar usuário no sidebar:", err);
        if (divLogado) divLogado.style.display = 'none';
        if (divDeslogado) divDeslogado.style.display = 'block';
    }
}

// Executa a verificação assim que o script é carregado na página
atualizarEstadoSidebar();

// Atualiza o sidebar automaticamente se houver qualquer mudança de login/logout
supabase.auth.onAuthStateChange(() => {
    atualizarEstadoSidebar();
});

// Evento para o botão de Logout
document.getElementById('btn-sidebar-logout')?.addEventListener('click', async () => {
    try {
        await realizarLogout();
    } catch (error) {
        console.error("Erro ao sair:", error.message);
    }
});

// Evento para o botão de Atualizar Dados Cadastrais
document.getElementById('btn-atualizar-dados')?.addEventListener('click', () => {
    alert("Redirecionando para a central de atualização cadastral...");
    // window.location.href = "pages/auth/atualizar-dados.html";
});