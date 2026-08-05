/**
 * Core Service - Auth Guard (Proteção de Rotas)
 * Verifica se o usuário possui uma sessão ativa no Supabase antes de exibir a página.
 */

import { supabase } from './auth.js';

async function verificarAcessoGlobal() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
            // Se não houver sessão válida, redireciona imediatamente para o login
            executarRedirecionamentoLogin();
            return;
        }

        // Opcional: Se houver um elemento para exibir o e-mail do usuário logado na UI
        const userEmailEl = document.getElementById("user-email-display");
        if (userEmailEl && session.user) {
            userEmailEl.textContent = session.user.email;
        }

    } catch (err) {
        console.error("Erro crítico na validação de segurança:", err);
        executarRedirecionamentoLogin();
    }
}

function executarRedirecionamentoLogin() {
    // Evita loop de redirecionamento se já estiver na página de login
    if (!window.location.pathname.includes("login.html")) {
        // Ajusta o caminho relativo dependendo de onde a página protegida está localizada
        window.location.href = "../../pages/auth/login.html";
    }
}

// Executa a verificação assim que o script é carregado na página protegida
verificarAcessoGlobal();

// Escuta em tempo real mudanças de estado (ex: expiração de token ou clique em sair)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        executarRedirecionamentoLogin();
    }
});