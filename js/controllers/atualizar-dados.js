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
// GERENCIAMENTO DO MODAL E SINDICATOS / CCTs
// ==========================================
const btnAbrirModal = document.getElementById('btn-abrir-modal');
const modalSindicato = document.getElementById('modal-sindicato');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const formSindicato = document.getElementById('form-sindicato');
const checkTemAditivo = document.getElementById('check-tem-aditivo');
const blocoAditivosContainer = document.getElementById('bloco-aditivos-container');
const listaAditivosInputs = document.getElementById('lista-aditivos-inputs');
const btnAddAditivo = document.getElementById('btn-add-aditivo');
const inputCnpjSindicato = document.getElementById('input-cnpj-sindicato');

const tabelaSindicatos = document.getElementById('tabela-sindicatos');
const tbodySindicatos = document.getElementById('tbody-sindicatos');
const msgSemSindicatos = document.getElementById('msg-sem-sindicatos');

// --- TRATAMENTO DE CNPJ ALFANUMÉRICO (MÁXIMO 14 CARACTERES BASE) ---
if (inputCnpjSindicato) {
    inputCnpjSindicato.addEventListener('input', (e) => {
        // Remove tudo que não for letra ou número e converte para maiúsculo
        let val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        
        // Limita rigorosamente a 14 caracteres alfanuméricos base
        if (val.length > 14) val = val.slice(0, 14);
        
        // Aplica a máscara XX.XXX.XXX/XXXX-XX
        let masked = val;
        if (val.length > 2) masked = val.substring(0, 2) + '.' + val.substring(2);
        if (val.length > 5) masked = masked.substring(0, 6) + '.' + masked.substring(6);
        if (val.length > 8) masked = masked.substring(0, 10) + '/' + masked.substring(10);
        if (val.length > 12) masked = masked.substring(0, 15) + '-' + masked.substring(15);
        
        e.target.value = masked;
    });
}

// --- LÓGICA DE MÚLTIPLOS ADITIVOS ---
function adicionarCampoAditivo() {
    const div = document.createElement('div');
    div.className = 'aditivo-item';
    div.style.border = '1px dashed #475569';
    div.style.padding = '12px';
    div.style.borderRadius = '6px';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '10px';
    div.style.background = '#0f172a';
    div.style.marginTop = '10px';

    div.innerHTML = `
        <div class="form-group">
            <label>Código do Aditivo:</label>
            <input type="text" class="input-codigo-aditivo" placeholder="Ex: Aditivo 01/2026" required>
        </div>
        <div class="form-group">
            <label>Fim da Vigência do Aditivo:</label>
            <input type="date" class="input-vigencia-aditivo" required>
        </div>
        <button type="button" class="btn-remover-aditivo" style="align-self: flex-start; background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 0.85rem; font-weight: 600;">Remover Aditivo</button>
    `;

    div.querySelector('.btn-remover-aditivo').addEventListener('click', () => {
        div.remove();
        // Se remover todos e a caixa estiver marcada, deixa vazio aguardando o usuário clicar em "Adicionar"
    });

    listaAditivosInputs.appendChild(div);
}

if (checkTemAditivo && blocoAditivosContainer) {
    checkTemAditivo.addEventListener('change', (e) => {
        // O container inteiro (incluindo o botão de adicionar) só aparece se marcado
        blocoAditivosContainer.style.display = e.target.checked ? 'flex' : 'none';
        
        // Se marcou a caixa e não tem nenhum campo, cria o primeiro automaticamente
        if (e.target.checked && listaAditivosInputs.children.length === 0) {
            adicionarCampoAditivo();
        } else if (!e.target.checked) {
            // Se desmarcou, limpa os inputs para não enviar dados fantasmas
            listaAditivosInputs.innerHTML = ''; 
        }
    });

    btnAddAditivo.addEventListener('click', adicionarCampoAditivo);
}

// --- CONTROLE DO MODAL ---
if (btnAbrirModal && modalSindicato) {
    btnAbrirModal.addEventListener('click', () => {
        modalSindicato.style.display = 'flex';
    });

    const fecharModalFunc = () => {
        modalSindicato.style.display = 'none';
        formSindicato.reset();
        blocoAditivosContainer.style.display = 'none';
        listaAditivosInputs.innerHTML = ''; // Limpa os aditivos gerados dinamicamente
    };

    btnFecharModal.addEventListener('click', fecharModalFunc);
    btnCancelarModal.addEventListener('click', fecharModalFunc);

    modalSindicato.addEventListener('click', (e) => {
        if (e.target === modalSindicato) {
            fecharModalFunc();
        }
    });
}

// --- RENDERIZAR E SALVAR SINDICATOS ---
async function carregarSindicatos() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .schema('public')
            .from('user_sindicatos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tabelaSindicatos.style.display = 'none';
            msgSemSindicatos.style.display = 'block';
            return;
        }

        tabelaSindicatos.style.display = 'table';
        msgSemSindicatos.style.display = 'none';
        tbodySindicatos.innerHTML = '';

        data.forEach(sind => {
            const tr = document.createElement('tr');
            
            // Monta o HTML com todos os aditivos cadastrados
            let aditivosHTML = 'Não possui';
            if (sind.tem_aditivo && sind.aditivos && sind.aditivos.length > 0) {
                aditivosHTML = sind.aditivos.map(ad => 
                    `<span class="tag-aditivo" style="margin-bottom: 4px; display: inline-block;">Cod: ${ad.codigo} <br><small style="color:#94a3b8;">Fim: ${ad.vigencia}</small></span>`
                ).join('<br>');
            }

            tr.innerHTML = `
                <td><strong>${sind.nome_sindicato}</strong></td>
                <td>${sind.cnpj || 'Não informado'}</td>
                <td>${sind.data_base || 'Não informada'}</td>
                <td>${sind.fim_vigencia_cct || 'Não informada'}</td>
                <td>${aditivosHTML}</td>
                <td style="vertical-align: middle;">
                    <button type="button" onclick="deletarSindicato('${sind.id}')" style="background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 0.85rem; font-weight: 600; padding: 5px;">Excluir CCT</button>
                </td>
            `;
            tbodySindicatos.appendChild(tr);
        });

    } catch (err) {
        console.error("Erro ao carregar sindicatos:", err);
    }
}

if (formSindicato) {
    formSindicato.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Extrai todos os aditivos da lista dinâmica
            let arrayAditivos = [];
            if (checkTemAditivo.checked) {
                const itensAditivo = listaAditivosInputs.querySelectorAll('.aditivo-item');
                itensAditivo.forEach(item => {
                    const cod = item.querySelector('.input-codigo-aditivo').value.trim();
                    const vig = item.querySelector('.input-vigencia-aditivo').value;
                    if (cod || vig) {
                        arrayAditivos.push({ codigo: cod, vigencia: vig });
                    }
                });
            }

            const novoSindicato = {
                user_id: user.id,
                nome_sindicato: document.getElementById('input-nome-sindicato').value.trim(),
                cnpj: document.getElementById('input-cnpj-sindicato').value.trim(),
                data_base: document.getElementById('input-data-base').value.trim(),
                fim_vigencia_cct: document.getElementById('input-fim-cct').value,
                tem_aditivo: checkTemAditivo.checked,
                aditivos: arrayAditivos // Salva o array em JSON
            };

            const { error } = await supabase
                .schema('public')
                .from('user_sindicatos')
                .insert([novoSindicato]);

            if (error) throw error;

            formSindicato.reset();
            blocoAditivosContainer.style.display = 'none';
            listaAditivosInputs.innerHTML = '';
            modalSindicato.style.display = 'none';

            carregarSindicatos();
        } catch (err) {
            console.error("Erro ao salvar sindicato:", err);
            alert("Erro ao salvar sindicato: " + err.message);
        }
    });
}

// --- EXCLUSÃO DE CCT COM PERGUNTA DE CONFIRMAÇÃO ---
window.deletarSindicato = async function(id) {
    // Pergunta de confirmação obrigatória antes da exclusão
    const confirmacao = confirm("Deseja realmente excluir esta Convenção Coletiva (CCT) e seus aditivos?");
    if (!confirmacao) return; // Cancela a operação se o usuário clicar em "Não/Cancelar"

    try {
        const { error } = await supabase
            .schema('public')
            .from('user_sindicatos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        carregarSindicatos(); // Atualiza a tabela dinamicamente após exclusão
    } catch (err) {
        console.error("Erro ao excluir sindicato:", err);
        alert("Erro ao excluir CCT. Tente novamente.");
    }
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
carregarDadosPerfil();
carregarSindicatos();