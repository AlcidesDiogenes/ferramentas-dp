import { supabase } from '../services/auth.js';

// ==========================================
// CONTROLE DE ALTERNÂNCIA DE ABAS
// ==========================================
const tabButtons = document.querySelectorAll('.tab-btn');
const formSections = document.querySelectorAll('.form-section');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        formSections.forEach(sec => sec.classList.remove('active-section'));

        button.classList.add('active');
        const targetId = button.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-section');
    });
});

// ==========================================
// DADOS CADASTRAIS (CARREGAR E SALVAR)
// ==========================================
const inputEmail = document.getElementById("input-email-readonly");
const inputNome = document.getElementById("input-nome");
const inputWhatsapp = document.getElementById("input-whatsapp"); 
const inputCargo = document.getElementById("input-cargo");
const msgFeedback = document.getElementById("msg-feedback");
const formPerfil = document.getElementById("form-perfil");
const btnVoltar = document.getElementById("btn-voltar");

let usuarioAtualId = null;

async function carregarDadosPerfil() {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Usuário não autenticado.");

        usuarioAtualId = user.id;
        inputEmail.value = user.email;

        const { data, error } = await supabase
            .schema('public')
            .from('profiles')
            .select('*')
            .eq('id', usuarioAtualId)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            inputNome.value = data.nome_completo || '';
            inputWhatsapp.value = data.telefone || ''; 
            inputCargo.value = data.cargo || '';
        }
    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
    }
}

if (formPerfil) {
    formPerfil.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!usuarioAtualId) return;

        msgFeedback.textContent = "Salvando...";
        msgFeedback.style.color = "#fbbf24";

        try {
            const dadosAtualizados = {
                id: usuarioAtualId,
                nome_completo: inputNome.value.trim(),
                telefone: inputWhatsapp.value.trim(),
                cargo: inputCargo.value.trim(),
                updated_at: new Date()
            };

            const { error } = await supabase
                .schema('public')
                .from('profiles')
                .upsert(dadosAtualizados);

            if (error) throw error;

            msgFeedback.textContent = "Dados atualizados e salvos com sucesso!";
            msgFeedback.style.color = "#4ade80";

            setTimeout(() => { msgFeedback.textContent = ""; }, 3000);
        } catch (err) {
            console.error("Erro detalhado ao salvar:", err);
            msgFeedback.textContent = "Erro ao salvar: " + (err.message || JSON.stringify(err));
            msgFeedback.style.color = "#f87171";
        }
    });
}

if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
        window.location.href = "../../index.html";
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
carregarDadosPerfil();