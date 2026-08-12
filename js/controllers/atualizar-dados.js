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
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active-section');
        }
    });
});

// ==========================================
// ELEMENTOS DA INTERFACE
// ==========================================
// Hero Banner
const displayUserNome = document.getElementById("display-user-nome");
const displayUserEmail = document.getElementById("display-user-email");
const displayUserRoleBadge = document.getElementById("display-user-role-badge");
const userAvatar = document.getElementById("user-avatar");

// Form Perfil
const inputEmail = document.getElementById("input-email-readonly");
const inputNome = document.getElementById("input-nome");
const inputWhatsapp = document.getElementById("input-whatsapp"); 
const inputCargo = document.getElementById("input-cargo");
const inputDepartamento = document.getElementById("input-departamento");
const inputCpf = document.getElementById("input-cpf");
const msgFeedback = document.getElementById("msg-feedback");
const formPerfil = document.getElementById("form-perfil");
const btnVoltar = document.getElementById("btn-voltar");

// Stats & Empresa
const statEmpresaNome = document.getElementById("stat-empresa-nome");
const statNivelAcesso = document.getElementById("stat-nivel-acesso");
const empRazao = document.getElementById("emp-razao");
const empCnpj = document.getElementById("emp-cnpj");
const empEquipe = document.getElementById("emp-equipe");
const empSindicato = document.getElementById("emp-sindicato");

// Alterar Senha
const formAlterarSenha = document.getElementById("form-alterar-senha");
const inputNovaSenha = document.getElementById("input-nova-senha");
const inputConfirmaSenha = document.getElementById("input-confirma-senha");
const passwordStrengthFill = document.getElementById("password-strength-fill");
const msgSenhaFeedback = document.getElementById("msg-senha-feedback");
const infoUserAgent = document.getElementById("info-user-agent");

// Tabela de Auditoria
const tabelaAuditCorpo = document.getElementById("tabela-audit-corpo");

// Preferências / Cache
const btnLimparCache = document.getElementById("btn-limpar-cache");

let usuarioAtual = null;

// Helper: Gerar Iniciais para Avatar
function getInitials(name, email) {
    if (name && name.trim().length > 0) {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (email && email.includes('@')) {
        return email.substring(0, 2).toUpperCase();
    }
    return 'DP';
}

// Helper: Máscara WhatsApp
if (inputWhatsapp) {
    inputWhatsapp.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 6) {
            e.target.value = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
        } else if (v.length > 2) {
            e.target.value = `(${v.substring(0,2)}) ${v.substring(2)}`;
        } else if (v.length > 0) {
            e.target.value = `(${v}`;
        }
    });
}

// Helper: Máscara CPF
if (inputCpf) {
    inputCpf.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 9) {
            e.target.value = `${v.substring(0,3)}.${v.substring(3,6)}.${v.substring(6,9)}-${v.substring(9)}`;
        } else if (v.length > 6) {
            e.target.value = `${v.substring(0,3)}.${v.substring(3,6)}.${v.substring(6)}`;
        } else if (v.length > 3) {
            e.target.value = `${v.substring(0,3)}.${v.substring(3)}`;
        }
    });
}

// Medidor de Força de Senha
if (inputNovaSenha) {
    inputNovaSenha.addEventListener('input', (e) => {
        const val = e.target.value;
        let score = 0;
        if (val.length >= 6) score += 25;
        if (val.length >= 10) score += 25;
        if (/[A-Z]/.test(val)) score += 25;
        if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score += 25;

        if (passwordStrengthFill) {
            passwordStrengthFill.style.width = score + '%';
            if (score <= 25) {
                passwordStrengthFill.style.backgroundColor = '#ef4444';
            } else if (score <= 50) {
                passwordStrengthFill.style.backgroundColor = '#f59e0b';
            } else if (score <= 75) {
                passwordStrengthFill.style.backgroundColor = '#38bdf8';
            } else {
                passwordStrengthFill.style.backgroundColor = '#22c55e';
            }
        }
    });
}

// ==========================================
// CARREGAR DADOS DO PERFIL E EMPRESA
// ==========================================
async function carregarDadosPerfil() {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        let userEmail = 'usuario@ferramentasdp.com.br';
        let userId = null;

        if (user) {
            usuarioAtual = user;
            userId = user.id;
            userEmail = user.email || userEmail;
        }

        displayUserEmail.textContent = userEmail;
        inputEmail.value = userEmail;

        // Tentar carregar do Supabase 'profiles'
        let profileData = null;
        if (userId) {
            try {
                const { data, error } = await supabase
                    .schema('public')
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (!error && data) {
                    profileData = data;
                }
            } catch (e) {
                console.warn("Tabela profiles não disponível, utilizando fallback local:", e);
            }
        }

        // Fallback no localStorage se necessário
        const localSaved = JSON.parse(localStorage.getItem(`profile_${userId || 'guest'}`) || '{}');

        const nome = profileData?.nome_completo || localSaved.nome_completo || user?.user_metadata?.full_name || 'Profissional de DP';
        const phone = profileData?.telefone || localSaved.telefone || '(11) 98765-4321';
        const plano = profileData?.plano || localSaved.plano || localStorage.getItem(`user_plan_${userId || 'guest'}`) || 'Gratuito';
        const cargo = profileData?.cargo || localSaved.cargo || (plano === 'Gratuito' ? 'Usuário Gratuito' : 'Analista de DP Senior');
        const depto = profileData?.departamento || localSaved.departamento || 'Departamento Pessoal';
        const cpf = profileData?.cpf || localSaved.cpf || '';

        // Atualizar Campos
        displayUserNome.textContent = nome;
        userAvatar.textContent = getInitials(nome, userEmail);
        displayUserRoleBadge.textContent = `👤 ${cargo}`;

        const displayUserPlanBadge = document.getElementById("display-user-plan-badge");
        if (displayUserPlanBadge) {
            displayUserPlanBadge.textContent = plano === 'Pro' ? '✨ Plano Pro' : '🌱 Plano Gratuito';
        }

        const planNomeVal = document.getElementById("plan-nome-val");
        const planStatusVal = document.getElementById("plan-status-val");
        const planCotasVal = document.getElementById("plan-cotas-val");

        if (planNomeVal) planNomeVal.textContent = plano === 'Pro' ? '✨ Plano Pro' : '🌱 Plano Gratuito';
        if (planStatusVal) planStatusVal.textContent = plano === 'Pro' ? '🟢 Ativo (Sem Limitações)' : '🟢 Ativo (Plano Gratuito)';
        if (planCotasVal) planCotasVal.textContent = plano === 'Pro' ? 'Ilimitadas' : '50 Consultas de CCT / mês';

        inputNome.value = nome;
        inputWhatsapp.value = phone;
        inputCargo.value = cargo;
        if (inputDepartamento) inputDepartamento.value = depto;
        if (inputCpf) inputCpf.value = cpf;

        // Carregar Informações da Empresa Ativa
        carregarEmpresaContexto();

        // Detectar User Agent
        if (infoUserAgent) {
            infoUserAgent.textContent = `${navigator.userAgent.substring(0, 45)}...`;
        }

        // Renderizar Histórico de Auditoria
        carregarHistoricoAuditoria();

    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
    }
}

function carregarEmpresaContexto() {
    try {
        const empStorage = localStorage.getItem('empresa_selecionada');
        let empObj = { razao_social: 'Empresa Principal Exemplo LTDA', cnpj: '12.345.678/0001-90' };
        
        if (empStorage) {
            try { empObj = JSON.parse(empStorage); } catch (e) {}
        }

        const nomeEmp = empObj.razao_social || empObj.nome || 'Empresa Principal LTDA';
        const cnpjEmp = empObj.cnpj || '12.345.678/0001-90';

        if (statEmpresaNome) statEmpresaNome.textContent = nomeEmp;
        if (empRazao) empRazao.textContent = nomeEmp;
        if (empCnpj) empCnpj.textContent = cnpjEmp;
        if (empEquipe) empEquipe.textContent = localStorage.getItem('equipe_selecionada') || 'Equipe DP Geral';
        if (empSindicato) empSindicato.textContent = localStorage.getItem('sindicato_selecionado') || 'Sindicato do Comercio / Indústria';
    } catch (e) {
        console.warn("Erro ao carregar contexto de empresa:", e);
    }
}

// ==========================================
// SALVAR DADOS DO PERFIL
// ==========================================
if (formPerfil) {
    formPerfil.addEventListener("submit", async (e) => {
        e.preventDefault();

        msgFeedback.textContent = "Salvando alterações no perfil...";
        msgFeedback.style.color = "#fbbf24";

        try {
            const nomeVal = inputNome.value.trim();
            const phoneVal = inputWhatsapp.value.trim();
            const cargoVal = inputCargo.value.trim();
            const deptoVal = inputDepartamento ? inputDepartamento.value.trim() : '';
            const cpfVal = inputCpf ? inputCpf.value.trim() : '';

            const userId = usuarioAtual?.id || 'guest';

            const payload = {
                id: userId,
                nome_completo: nomeVal,
                telefone: phoneVal,
                cargo: cargoVal,
                departamento: deptoVal,
                cpf: cpfVal,
                updated_at: new Date()
            };

            // Salva localmente garantido
            localStorage.setItem(`profile_${userId}`, JSON.stringify(payload));

            // Tenta upsert no Supabase
            if (usuarioAtual?.id) {
                try {
                    await supabase
                        .schema('public')
                        .from('profiles')
                        .upsert(payload);
                } catch (e) {
                    console.warn("Upsert Supabase falhou, salvo localmente:", e);
                }
            }

            // Atualiza Header
            displayUserNome.textContent = nomeVal || 'Profissional de DP';
            userAvatar.textContent = getInitials(nomeVal, displayUserEmail.textContent);
            displayUserRoleBadge.textContent = `👤 ${cargoVal || 'Analista DP'}`;

            // Registrar no log de auditoria
            registrarLogAuditoria("Atualização de Perfil", "Módulo de Perfil", "Concluído com Sucesso");

            msgFeedback.textContent = "✅ Dados do perfil atualizados com sucesso!";
            msgFeedback.style.color = "#4ade80";

            setTimeout(() => { msgFeedback.textContent = ""; }, 3500);
        } catch (err) {
            console.error("Erro ao salvar perfil:", err);
            msgFeedback.textContent = "❌ Erro ao salvar: " + (err.message || String(err));
            msgFeedback.style.color = "#f87171";
        }
    });
}

// ==========================================
// ALTERAR SENHA COM SUPABASE AUTH
// ==========================================
if (formAlterarSenha) {
    formAlterarSenha.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nova = inputNovaSenha.value;
        const confirma = inputConfirmaSenha.value;

        if (!nova || nova.length < 6) {
            msgSenhaFeedback.textContent = "⚠️ A nova senha deve conter pelo menos 6 caracteres.";
            msgSenhaFeedback.style.color = "#f87171";
            return;
        }

        if (nova !== confirma) {
            msgSenhaFeedback.textContent = "⚠️ A confirmação de senha não confere com a nova senha.";
            msgSenhaFeedback.style.color = "#f87171";
            return;
        }

        msgSenhaFeedback.textContent = "Atualizando senha no Supabase Auth...";
        msgSenhaFeedback.style.color = "#fbbf24";

        try {
            const { error } = await supabase.auth.updateUser({ password: nova });
            if (error) throw error;

            msgSenhaFeedback.textContent = "✅ Senha alterada com sucesso!";
            msgSenhaFeedback.style.color = "#4ade80";

            inputNovaSenha.value = "";
            inputConfirmaSenha.value = "";
            if (passwordStrengthFill) passwordStrengthFill.style.width = "0%";

            registrarLogAuditoria("Alteração de Senha", "Segurança da Conta", "Sucesso");

            setTimeout(() => { msgSenhaFeedback.textContent = ""; }, 4000);
        } catch (err) {
            console.error("Erro ao alterar senha:", err);
            msgSenhaFeedback.textContent = "❌ Falha ao alterar senha: " + (err.message || String(err));
            msgSenhaFeedback.style.color = "#f87171";
        }
    });
}

// ==========================================
// AUDITORIA E LOGS DE ATIVIDADE
// ==========================================
function registrarLogAuditoria(acao, modulo, status) {
    let logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    const novoLog = {
        data: new Date().toLocaleString('pt-BR'),
        acao,
        modulo,
        status
    };
    logs.unshift(novoLog);
    if (logs.length > 20) logs = logs.slice(0, 20);
    localStorage.setItem('audit_logs', JSON.stringify(logs));
    carregarHistoricoAuditoria();
}

function carregarHistoricoAuditoria() {
    if (!tabelaAuditCorpo) return;

    let logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    
    // Se estiver vazio, popula com exemplos iniciais
    if (logs.length === 0) {
        logs = [
            { data: new Date().toLocaleString('pt-BR'), acao: 'Sessão Iniciada no Sistema', modulo: 'Autenticação', status: 'Sucesso' },
            { data: new Date(Date.now() - 3600000).toLocaleString('pt-BR'), acao: 'Acesso à Central do Usuário', modulo: 'Perfil', status: 'Concluído' }
        ];
        localStorage.setItem('audit_logs', JSON.stringify(logs));
    }

    tabelaAuditCorpo.innerHTML = logs.map(log => `
        <tr>
            <td style="color: #94a3b8; font-size: 0.82rem;">${log.data}</td>
            <td style="font-weight: 600;">${log.acao}</td>
            <td><span style="background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">${log.modulo}</span></td>
            <td><span style="color: #4ade80; font-weight: 600; font-size: 0.82rem;">🟢 ${log.status}</span></td>
        </tr>
    `).join('');
}

// ==========================================
// PREFERÊNCIAS E MANUTENÇÃO DE CACHE
// ==========================================
if (btnLimparCache) {
    btnLimparCache.addEventListener("click", () => {
        if (confirm("Deseja realmente limpar o cache local e recarregar a aplicação? Sua sessão permanecerá ativa.")) {
            // Limpa dados temporários sem remover o token de autenticação
            const keysToKeep = ['@FerramentasDP:token', '@FerramentasDP:supabase_url', '@FerramentasDP:supabase_key'];
            const preserved = {};
            keysToKeep.forEach(k => {
                if (localStorage.getItem(k)) preserved[k] = localStorage.getItem(k);
            });

            localStorage.clear();

            Object.keys(preserved).forEach(k => {
                localStorage.setItem(k, preserved[k]);
            });

            alert("Cache limpo com sucesso!");
            window.location.reload();
        }
    });
}

if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
        window.location.href = "../../index.html";
    });
}

const btnUpgradePlan = document.getElementById('btn-upgrade-plan');
if (btnUpgradePlan) {
    btnUpgradePlan.addEventListener("click", () => {
        alert("🚀 Upgrade para o Plano Pro:\n\nPara desbloquear cadastros ilimitados de empresas e equipes, cotas adicionais de consultas CCT/CBO e recursos avançados multi-tenant, entre em contato com o nosso setor comercial ou equipe de suporte.");
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
carregarDadosPerfil();
