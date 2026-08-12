/**
 * CONTROLLER: GESTÃO DE BASES
 * Gerencia os eventos de UI para o cadastro e listagem na Central de Bases.
 */
import { supabase } from '../../services/auth.js';
import { baseService } from '../../services/baseService.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnMenuNovaBase = document.getElementById('menu-abrir-base');
    const btnMenuCentralBases = document.getElementById('menu-central-bases');
    const containerModal = document.getElementById('container-modal-base');
    const workspaceArea = document.getElementById('workspace-area');

    if (btnMenuNovaBase) {
        btnMenuNovaBase.addEventListener('click', async (e) => {
            e.preventDefault();
            await carregarEAbrirModalBase();
        });
    }

    async function carregarEAbrirModalBase() {
        if (!containerModal) return;

        if (containerModal.innerHTML.trim() === '') {
            try {
                const response = await fetch('../../components/central-de-dados/modal-base.html');
                if (!response.ok) throw new Error('Falha ao carregar o componente do modal de base.');
                
                containerModal.innerHTML = await response.text();
                ativarEventosDoModalBase();
            } catch (error) {
                console.error("Erro na injeção do modal de base:", error);
                alert("Erro ao abrir formulário de bases.");
                return;
            }
        }

        const modal = document.getElementById('modal-cadastro-base');
        if (modal) modal.style.display = 'flex';
    }

    function ativarEventosDoModalBase() {
        const modal = document.getElementById('modal-cadastro-base');
        const btnFechar = document.getElementById('btn-fechar-modal-base');
        const btnCancelar = document.getElementById('btn-cancelar-base');
        const btnSalvar = document.getElementById('btn-salvar-base');
        const inputNome = document.getElementById('base_nome');

        const fecharModal = () => {
            if (modal) modal.style.display = 'none';
            const form = document.getElementById('form-base');
            if (form) form.reset();
        };

        btnFechar?.addEventListener('click', fecharModal);
        btnCancelar?.addEventListener('click', fecharModal);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });

        btnSalvar?.addEventListener('click', async (e) => {
            e.preventDefault();
            const equipeIdAtiva = localStorage.getItem('gestao_dp_equipe_ativa');

            if (!equipeIdAtiva) {
                alert("Aviso: Nenhuma equipe selecionada no topo da tela. Selecione uma equipe antes de cadastrar uma base.");
                return;
            }

            const nome_base = inputNome ? inputNome.value.trim() : '';
            if (!nome_base) {
                alert("Por favor, preencha o nome da base.");
                inputNome?.focus();
                return;
            }

            try {
                btnSalvar.disabled = true;
                btnSalvar.textContent = "Salvando...";

                const payload = {
                    equipe_id: equipeIdAtiva,
                    nome_base
                };

                const dataCriada = await baseService.salvarBase(payload);
                alert("Base cadastrada com sucesso!");
                fecharModal();

                // Dispara evento global para atualizar switchers
                if (dataCriada && dataCriada.length > 0) {
                    window.dispatchEvent(new CustomEvent('base-criada', { detail: { novaBase: dataCriada[0] } }));
                }

                // Se a central estiver aberta, atualiza a tabela
                if (document.getElementById('tbody-central-bases')) {
                    carregarTabelaBases();
                }
            } catch (err) {
                console.error("Erro ao salvar base:", err);
                alert(`Erro ao salvar base: ${err.message || 'Erro desconhecido'}`);
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.textContent = "Salvar Base";
            }
        });
    }

    if (btnMenuCentralBases) {
        btnMenuCentralBases.addEventListener('click', async (e) => {
            e.preventDefault();
            await abrirCentralBases();
        });
    }

    async function abrirCentralBases() {
        try {
            const response = await fetch('../../components/central-de-dados/central-bases.html');
            if (!response.ok) throw new Error('Falha ao carregar a Central de Bases.');
            
            workspaceArea.innerHTML = await response.text();
            carregarTabelaBases();
        } catch (error) {
            console.error("Erro ao abrir a Central de Bases:", error);
            alert("Erro ao carregar a Central de Bases.");
        }
    }

    async function carregarTabelaBases() {
        const tbody = document.getElementById('tbody-central-bases');
        if (!tbody) return;

        const equipeIdAtiva = localStorage.getItem('gestao_dp_equipe_ativa');
        if (!equipeIdAtiva) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma equipe selecionada.</td></tr>`;
            return;
        }

        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #64748b;">Carregando bases...</td></tr>`;

        try {
            const bases = await baseService.listarBasesPorEquipe(equipeIdAtiva);

            if (bases.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma base cadastrada para esta equipe.</td></tr>`;
                return;
            }

            tbody.innerHTML = bases.map(base => `
                <tr>
                    <td><strong>${base.nome_base}</strong></td>
                    <td>${base.created_at ? new Date(base.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                        <button class="btn btn-secondary btn-excluir-base" data-id="${base.id}" style="padding: 4px 8px; font-size: 12px; background-color: #fee2e2; color: #dc2626; border: none; cursor: pointer;">Excluir</button>
                    </td>
                </tr>
            `).join('');

            // Ouvintes para exclusão
            tbody.querySelectorAll('.btn-excluir-base').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm("Deseja realmente excluir esta base? Empresas vinculadas podem ser afetadas.")) {
                        try {
                            await baseService.excluirBase(id);
                            alert("Base excluída com sucesso!");
                            carregarTabelaBases();
                        } catch (err) {
                            alert("Erro ao excluir base. Verifique se existem empresas vinculadas a ela.");
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Erro ao carregar tabela de bases:", error);
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #ef4444;">Erro ao carregar dados do servidor.</td></tr>`;
        }
    }
});