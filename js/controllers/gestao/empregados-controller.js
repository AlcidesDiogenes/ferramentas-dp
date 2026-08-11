/**
 * CONTROLLER: GESTÃO DE EMPREGADOS
 * Responsável por gerenciar a abertura do modal, validações, máscaras 
 * e persistência dos dados de colaboradores vinculados à empresa ativa.
 */

import { supabase } from '../../services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Exemplo de gancho para botão de abertura de novo empregado (se aplicável na interface)
    const btnNovoEmpregado = document.getElementById('menu-novo-empregado');
    if (btnNovoEmpregado) {
        btnNovoEmpregado.addEventListener('click', async (e) => {
            e.preventDefault();
            await abrirModalEmpregado();
        });
    }
});

/**
 * Abre e injeta o modal de empregado no DOM, limpando estados anteriores.
 */
export async function abrirModalEmpregado() {
    const containerModal = document.getElementById('container-modal-empregado');
    if (!containerModal) {
        console.warn("Container 'container-modal-empregado' não encontrado no DOM.");
        return;
    }

    // Injeta o HTML do modal se ainda não estiver presente
    if (containerModal.innerHTML.trim() === '') {
        try {
            const response = await fetch('../../components/gestao/modal-empregado.html');
            if (!response.ok) throw new Error('Falha ao carregar o componente do modal de empregado.');
            containerModal.innerHTML = await response.text();
            ativarEventosModalEmpregado();
        } catch (error) {
            console.error("Erro na injeção do modal:", error);
            alert("Erro ao abrir formulário de cadastro de colaborador.");
            return;
        }
    }

    const modal = document.getElementById('modal-cadastro-empregado');
    const form = document.getElementById('form-empregado');
    if (form) form.reset();

    if (modal) modal.style.display = 'flex';
}

/**
 * Ativa os ouvintes de eventos, regras de validação e salvamento do modal.
 */
function ativarEventosModalEmpregado() {
    const modal = document.getElementById('modal-cadastro-empregado');
    const btnFechar = document.getElementById('btn-fechar-modal-empregado');
    const btnCancelar = document.getElementById('btn-cancelar-empregado');
    const btnSalvar = document.getElementById('btn-salvar-empregado');
    const inputCpf = document.getElementById('emp_cpf');

    // Máscara simples para CPF
    inputCpf?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{1,3})/, "$1.$2");
        }
        e.target.value = value;
    });

    const fecharModal = () => {
        if (modal) modal.style.display = 'none';
        const form = document.getElementById('form-empregado');
        if (form) form.reset();
    };

    btnFechar?.addEventListener('click', fecharModal);
    btnCancelar?.addEventListener('click', fecharModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    // Ação de salvamento
    btnSalvar?.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            const empresaIdAtiva = localStorage.getItem('gestao_dp_empresa_ativa');
            if (!empresaIdAtiva) {
                alert("Aviso: Nenhuma empresa ativa selecionada no cabeçalho. Por favor, selecione uma empresa antes de cadastrar o colaborador.");
                return;
            }

            // Captura de valores obrigatórios
            const codigo_empregado = document.getElementById('emp_codigo')?.value.trim();
            const nome = document.getElementById('emp_nome')?.value.trim();
            const cpf = document.getElementById('emp_cpf')?.value.trim();
            const admissao = document.getElementById('emp_admissao')?.value;
            const salarioStr = document.getElementById('emp_salario')?.value;
            const data_nascimento = document.getElementById('emp_nascimento')?.value;
            const sexo = document.getElementById('emp_sexo')?.value;

            // Validação estrita dos campos obrigatórios exigidos
            if (!codigo_empregado || !nome || !cpf || !admissao || !salarioStr || !data_nascimento || !sexo) {
                alert("Por favor, preencha todos os campos obrigatórios (*):\n- Cód Empregado\n- Nome Completo\n- CPF\n- Admissão\n- Salário\n- Data de Nascimento\n- Sexo");
                return;
            }

            const salario = parseFloat(salarioStr);
            if (isNaN(salario) || salario < 0) {
                alert("O valor do salário informado é inválido.");
                return;
            }

            // Mapeamento completo dos dados para o payload do Supabase
            const payload = {
                empresa_id: empresaIdAtiva,
                codigo_empregado,
                nome,
                cpf,
                admissao,
                salario,
                data_nascimento,
                sexo,
                codigo_esocial: document.getElementById('emp_esocial')?.value.trim() || null,
                categoria: document.getElementById('emp_categoria')?.value.trim() || null,
                cod_cargo: document.getElementById('emp_cod_cargo')?.value.trim() || null,
                descricao_cargo: document.getElementById('emp_desc_cargo')?.value.trim() || null,
                cbo: document.getElementById('emp_cbo')?.value.trim() || null,
                cod_ccusto: document.getElementById('emp_ccusto')?.value.trim() || null,
                descricao_dpto: document.getElementById('emp_dpto')?.value.trim() || null,
                rg: document.getElementById('emp_rg')?.value.trim() || null,
                orgao_rg: document.getElementById('emp_orgao_rg')?.value.trim() || null,
                pis: document.getElementById('emp_pis')?.value.trim() || null,
                ctps: document.getElementById('emp_ctps')?.value.trim() || null,
                nome_mae: document.getElementById('emp_mae')?.value.trim() || null,
                nome_pai: document.getElementById('emp_pai')?.value.trim() || null,
                cep: document.getElementById('emp_cep')?.value.trim() || null,
                endereco: document.getElementById('emp_endereco')?.value.trim() || null,
                bairro: document.getElementById('emp_bairro')?.value.trim() || null,
                celular: document.getElementById('emp_celular')?.value.trim() || null,
                email: document.getElementById('emp_email')?.value.trim() || null
            };

            // Feedback visual de carregamento
            btnSalvar.disabled = true;
            btnSalvar.textContent = "Salvando Colaborador...";

            const { error } = await supabase
                .from('empregados')
                .insert([payload]);

            if (error) throw error;

            alert("Colaborador cadastrado com sucesso!");
            fecharModal();

            // Opcional: Dispara evento global se houver listagem reativa de empregados
            window.dispatchEvent(new CustomEvent('empregado-cadastrado'));

        } catch (err) {
            console.error("Erro detalhado ao salvar empregado:", err);
            alert(`Erro ao cadastrar colaborador:\n\nMensagem: ${err.message || JSON.stringify(err)}`);
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = "Salvar Colaborador";
        }
    });
}