/**
 * CONTROLLER: GESTÃO DE EMPRESAS
 * Responsável por gerenciar os eventos de UI relacionados às empresas 
 * (Abertura de modal para cadastro/edição, máscaras, carregamento de sindicatos, salvamento e atualização).
 */

import { supabase } from '../../services/auth.js';
import { initCentralEmpresas } from './central-empresas-controller.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnMenuNovaEmpresa = document.getElementById('menu-abrir-empresa');
    const btnMenuCentralEmpresas = document.getElementById('menu-central-empresas');
    
    const containerModal = document.getElementById('container-modal-empresa');
    const workspaceArea = document.getElementById('workspace-area');

    if (btnMenuNovaEmpresa) {
        btnMenuNovaEmpresa.addEventListener('click', async (e) => {
            e.preventDefault();
            await abrirModalEmpresa(); // Modo Cadastro
        });
    }

    if (btnMenuCentralEmpresas) {
        btnMenuCentralEmpresas.addEventListener('click', async (e) => {
            e.preventDefault();
            await abrirCentralEmpresas();
        });
    }
});

/**
 * Abre e injeta o modal de empresa, configurando-o para cadastro ou edição.
 * @param {string|null} empresaId - ID da empresa para edição (opcional)
 */
export async function abrirModalEmpresa(empresaId = null) {
    const containerModal = document.getElementById('container-modal-empresa');
    if (!containerModal) return;

    // Injeta o HTML do modal se ainda não estiver presente no DOM
    if (containerModal.innerHTML.trim() === '') {
        try {
            const response = await fetch('../../components/central-de-dados/modal-empresa.html');
            if (!response.ok) throw new Error('Falha ao carregar o componente do modal.');
            containerModal.innerHTML = await response.text();
            ativarEventosDoModal();
        } catch (error) {
            console.error("Erro na injeção do modal:", error);
            alert("Erro ao abrir formulário de cadastro.");
            return;
        }
    }

    await carregarSindicatosNoSelectEmpresa();

    const modal = document.getElementById('modal-cadastro-empresa');
    const tituloModal = modal?.querySelector('.modal-header h3');
    const btnSalvar = document.getElementById('btn-salvar-empresa');
    const formEmpresa = document.getElementById('form-empresa');

    if (formEmpresa) formEmpresa.reset();

    // Configuração de Estados (Edição vs Novo Cadastro)
    if (empresaId) {
        if (tituloModal) tituloModal.textContent = "Editar Empresa";
        if (btnSalvar) btnSalvar.textContent = "Salvar Alterações";
        if (modal) modal.setAttribute('data-edit-id', empresaId);
        
        await carregarDadosEmpresaParaEdicao(empresaId);
    } else {
        if (tituloModal) tituloModal.textContent = "Cadastrar Nova Empresa";
        if (btnSalvar) btnSalvar.textContent = "Salvar Empresa";
        if (modal) modal.removeAttribute('data-edit-id');
        
        const blocoPercentual = document.getElementById('bloco_percentual_adiantamento');
        if (blocoPercentual) blocoPercentual.style.display = 'none';
    }

    if (modal) modal.style.display = 'flex';
}

/**
 * Função exportada dedicada a ser chamada externamente (ex: Central de Empresas).
 * @param {string} id - ID da empresa
 */
export async function abrirModalEdicaoEmpresa(id) {
    await abrirModalEmpresa(id);
}

/**
 * Busca os dados da empresa no Supabase e preenche o formulário para edição.
 * @param {string} id - ID da empresa
 */
async function carregarDadosEmpresaParaEdicao(id) {
    try {
        const { data, error } = await supabase
            .from('empresa')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Empresa não encontrada.");

        // Preenchimento rigoroso dos campos do formulário
        document.getElementById('empresa_codigo').value = data.codigo_empresa || '';
        document.getElementById('empresa_cnpj').value = data.cnpj_cpf || '';
        document.getElementById('empresa_apelido').value = data.apelido || '';
        document.getElementById('empresa_razao').value = data.razao_social || '';
        document.getElementById('empresa_sindicato_id').value = data.sindicato_id || '';
        
        const checkMovimento = document.getElementById('empresa_movimento');
        if (checkMovimento) checkMovimento.checked = data.tem_movimento ?? true;

        const checkAdiantamento = document.getElementById('empresa_tem_adiantamento');
        const blocoPercentual = document.getElementById('bloco_percentual_adiantamento');
        const inputPercentual = document.getElementById('empresa_percentual_adiantamento');

        if (checkAdiantamento) {
            checkAdiantamento.checked = data.tem_adiantamento || false;
            if (data.tem_adiantamento) {
                if (blocoPercentual) blocoPercentual.style.display = 'flex';
                if (inputPercentual) {
                    inputPercentual.value = data.percentual_adiantamento || '';
                    inputPercentual.setAttribute('required', 'true');
                }
            } else {
                if (blocoPercentual) blocoPercentual.style.display = 'none';
                if (inputPercentual) inputPercentual.removeAttribute('required');
            }
        }

    } catch (err) {
        console.error("Erro ao carregar dados da empresa para edição:", err);
        alert("Não foi possível carregar os dados da empresa para edição.");
    }
}

/**
 * Ativa os ouvintes de eventos e regras de negócio do modal de empresas.
 */
function ativarEventosDoModal() {
    const modal = document.getElementById('modal-cadastro-empresa');
    const btnFechar = document.getElementById('btn-fechar-modal-empresa');
    const btnCancelar = document.getElementById('btn-cancelar-empresa');
    const btnSalvar = document.getElementById('btn-salvar-empresa');
    
    const inputCnpjCpf = document.getElementById('empresa_cnpj');
    const checkAdiantamento = document.getElementById('empresa_tem_adiantamento');
    const blocoPercentual = document.getElementById('bloco_percentual_adiantamento');
    const inputPercentual = document.getElementById('empresa_percentual_adiantamento');
    const checkMovimento = document.getElementById('empresa_movimento');

    // Máscara dinâmica para CNPJ/CPF
    inputCnpjCpf?.addEventListener('input', function(e) {
        let cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const temLetra = /[A-Z]/.test(cleaned);
        let masked = cleaned;

        if (temLetra || cleaned.length > 11) {
            cleaned = cleaned.substring(0, 14);
            masked = cleaned;

            if (cleaned.length > 12) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})([0-9]{2})/, "$1.$2.$3/$4-$5");
            } else if (cleaned.length > 8) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{1,4})/, "$1.$2.$3/$4");
            } else if (cleaned.length > 5) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{1,3})/, "$1.$2.$3");
            } else if (cleaned.length > 2) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{1,3})/, "$1.$2");
            }
        } else {
            cleaned = cleaned.substring(0, 11);
            masked = cleaned;

            if (cleaned.length > 9) {
                masked = masked.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            } else if (cleaned.length > 6) {
                masked = masked.replace(/^(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
            } else if (cleaned.length > 3) {
                masked = masked.replace(/^(\d{3})(\d{1,3})/, "$1.$2");
            }
        }

        e.target.value = masked;
    });

    const fecharModal = () => {
        if (modal) {
            modal.style.display = 'none';
            modal.removeAttribute('data-edit-id');
        }
        document.getElementById('form-empresa')?.reset();
        if (blocoPercentual) blocoPercentual.style.display = 'none';
    };

    btnFechar?.addEventListener('click', fecharModal);
    btnCancelar?.addEventListener('click', fecharModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) fecharModal();
    });

    checkAdiantamento?.addEventListener('change', (e) => {
        if (e.target.checked) {
            blocoPercentual.style.display = 'flex';
            inputPercentual?.setAttribute('required', 'true');
        } else {
            blocoPercentual.style.display = 'none';
            inputPercentual?.removeAttribute('required');
            if (inputPercentual) inputPercentual.value = '';
        }
    });

    btnSalvar?.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            const equipeIdAtiva = localStorage.getItem('gestao_dp_equipe_ativa');
            const baseIdAtiva = localStorage.getItem('gestao_dp_base_ativa');
            const editId = modal?.getAttribute('data-edit-id');

            if (!equipeIdAtiva) {
                alert("Aviso: Nenhuma equipe selecionada no topo da tela.");
                return;
            }

            if (!baseIdAtiva) {
                alert("Aviso: Nenhuma base operacional selecionada no topo da tela.");
                return;
            }

            const codigoInput = document.getElementById('empresa_codigo');
            const cnpjInput = document.getElementById('empresa_cnpj');
            const apelidoInput = document.getElementById('empresa_apelido');
            const razaoInput = document.getElementById('empresa_razao');
            const sindicatoSelect = document.getElementById('empresa_sindicato_id');

            const codigo_empresa = codigoInput ? codigoInput.value.trim() : '';
            const cnpj_cpf = cnpjInput ? cnpjInput.value.trim() : '';
            const apelido = apelidoInput ? apelidoInput.value.trim() : '';
            const razao_social = razaoInput ? razaoInput.value.trim() : '';
            const sindicato_id = sindicatoSelect ? sindicatoSelect.value : null;
            const tem_movimento = checkMovimento ? checkMovimento.checked : true;
            const tem_adiantamento = checkAdiantamento ? checkAdiantamento.checked : false;
            const percentual_adiantamento = tem_adiantamento && inputPercentual ? parseFloat(inputPercentual.value) || 0 : null;

            if (!codigo_empresa || !cnpj_cpf || !apelido || !razao_social || !sindicato_id) {
                alert("Por favor, preencha todos os campos obrigatórios (*).");
                return;
            }

            // Para novos cadastros (não edições), verificar limitação geral de 1 empresa no Plano Gratuito
            if (!editId) {
                try {
                    const { data: authData } = await supabase.auth.getUser();
                    const userId = authData?.user?.id || 'guest';
                    const localProfile = JSON.parse(localStorage.getItem(`profile_${userId}`) || '{}');
                    const userPlan = localProfile.plano || localStorage.getItem(`user_plan_${userId}`) || 'Gratuito';

                    if (userPlan === 'Gratuito') {
                        const { data: empresasExistentes } = await supabase
                            .from('empresa')
                            .select('id')
                            .eq('equipe_id', equipeIdAtiva)
                            .eq('base_id', baseIdAtiva);

                        if (empresasExistentes && empresasExistentes.length >= 1) {
                            alert("⚠️ Limitação Geral do Plano Gratuito:\n\nSeu plano atual é GRATUITO, o qual possui o limite de 1 Empresa por Equipe/Base. Para cadastrar mais empresas, faça upgrade para o Plano Pro.");
                            return;
                        }
                    }
                } catch (planErr) {
                    console.warn("Erro ao verificar limites do plano do usuário:", planErr);
                }
            }

            const payload = {
                equipe_id: equipeIdAtiva,
                base_id: baseIdAtiva,
                tem_movimento,
                codigo_empresa,
                cnpj_cpf,
                apelido,
                razao_social,
                sindicato_id,
                tem_adiantamento,
                percentual_adiantamento,
                ativo: true
            };

            btnSalvar.disabled = true;
            btnSalvar.textContent = editId ? "Salvando Alterações..." : "Salvando...";

            let error;
            if (editId) {
                // Operação de UPDATE no Supabase
                const res = await supabase
                    .from('empresa')
                    .update(payload)
                    .eq('id', editId);
                error = res.error;
            } else {
                // Operação de INSERT no Supabase
                const res = await supabase
                    .from('empresa')
                    .insert([payload]);
                error = res.error;
            }

            if (error) throw error;

            alert(editId ? "Empresa atualizada com sucesso!" : "Empresa cadastrada com sucesso!");
            fecharModal();

            // Atualiza reativamente a tabela da Central se estiver aberta
            if (document.getElementById('tbody-central-empresas')) {
                await initCentralEmpresas();
            }

        } catch (err) {
            console.error("Erro ao salvar/atualizar empresa:", err);
            alert(`Erro ao salvar empresa:\n\nMensagem: ${err.message || JSON.stringify(err)}`);
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.textContent = modal?.getAttribute('data-edit-id') ? "Salvar Alterações" : "Salvar Empresa";
        }
    });
}

/**
 * Carrega os sindicatos disponíveis no elemento select do modal.
 */
async function carregarSindicatosNoSelectEmpresa() {
    const selectSindicato = document.getElementById('empresa_sindicato_id');
    if (!selectSindicato) return;

    selectSindicato.innerHTML = `<option value="" disabled selected>Carregando sindicatos...</option>`;

    try {
        const equipeIdAtiva = localStorage.getItem('gestao_dp_equipe_ativa');
        let query = supabase.from('user_sindicatos').select('id, nome_sindicato, codigo_cct');
        
        if (equipeIdAtiva) {
            query = query.eq('equipe_id', equipeIdAtiva);
        }

        const { data: sindicatos, error } = await query;
        if (error) throw error;

        if (!sindicatos || sindicatos.length === 0) {
            selectSindicato.innerHTML = `<option value="" disabled selected>Nenhum sindicato cadastrado</option>`;
            return;
        }

        selectSindicato.innerHTML = `<option value="" disabled selected>Selecione o Sindicato...</option>`;
        sindicatos.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.nome_sindicato} (CCT: ${s.codigo_cct})`;
            selectSindicato.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar sindicatos para a empresa:", error);
        selectSindicato.innerHTML = `<option value="" disabled selected>Erro ao carregar sindicatos</option>`;
    }
}

async function abrirCentralEmpresas() {
    const workspaceArea = document.getElementById('workspace-area');
    if (!workspaceArea) return;

    try {
        const response = await fetch('../../components/central-de-dados/central-empresas.html');
        if (!response.ok) throw new Error('Falha ao carregar a Central de Empresas.');
        
        workspaceArea.innerHTML = await response.text();
        await initCentralEmpresas();
    } catch (error) {
        console.error("Erro ao abrir a Central:", error);
        alert("Erro ao carregar a Central de Empresas.");
    }
}