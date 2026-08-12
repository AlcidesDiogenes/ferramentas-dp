/**
 * CONTROLLER: GESTÃO DE EQUIPES
 */

import { equipeService } from '../../services/equipeService.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const btnMenuNovaEquipe = document.getElementById('menu-abrir-equipe');
    const btnMenuCentralEquipes = document.getElementById('menu-central-equipes');
    const containerModal = document.getElementById('container-modal-equipe');
    const workspaceArea = document.getElementById('workspace-area');

    // 1. Abrir Modal de Nova Equipe
    if (btnMenuNovaEquipe) {
        btnMenuNovaEquipe.addEventListener('click', async (e) => {
            e.preventDefault();
            await carregarEAbriModalEquipe();
        });
    }

    async function carregarEAbriModalEquipe() {
        if (containerModal.innerHTML.trim() === '') {
            try {
                const response = await fetch('../../components/central-de-dados/modal-equipe.html');
                if (!response.ok) throw new Error('Falha ao carregar o componente do modal de equipe.');
                
                containerModal.innerHTML = await response.text();
                ativarEventosDoModalEquipe();
            } catch (error) {
                console.error("Erro na injeção do modal de equipe:", error);
                alert("Erro ao abrir formulário de equipes.");
                return;
            }
        }

        const modal = document.getElementById('modal-cadastro-equipe');
        if (modal) modal.style.display = 'flex';
    }

    function ativarEventosDoModalEquipe() {
        const modal = document.getElementById('modal-cadastro-equipe');
        const btnFechar = document.getElementById('btn-fechar-modal-equipe');
        const btnCancelar = document.getElementById('btn-cancelar-equipe');
        const btnSalvar = document.getElementById('btn-salvar-equipe');

        const fecharModal = () => {
            modal.style.display = 'none';
            document.getElementById('form-equipe').reset();
        };

        btnFechar?.addEventListener('click', fecharModal);
        btnCancelar?.addEventListener('click', fecharModal);

        // Ação de Salvar Equipe
        btnSalvar?.addEventListener('click', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('equipe_nome').value.trim();
            const descricao = document.getElementById('equipe_descricao').value.trim();

            if (!nome) {
                alert("Por favor, preencha o nome da equipe.");
                return;
            }

            const payload = { nome, descricao };

            try {
                btnSalvar.disabled = true;
                btnSalvar.textContent = "Salvando...";

                await equipeService.salvarEquipe(payload);
                
                alert("Equipe salva com sucesso!");
                fecharModal();

                // Se a central estiver aberta, atualiza a tabela automaticamente
                if (document.getElementById('tbody-central-equipes')) {
                    carregarTabelaEquipes();
                }

            } catch (error) {
                console.error(error);
                alert("Ocorreu um erro ao salvar a Equipe. Verifique a tabela 'equipes' no Supabase.");
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.textContent = "Salvar Equipe";
            }
        });
    }

    // 2. Abrir Central de Equipes (Tabela)
    if (btnMenuCentralEquipes) {
        btnMenuCentralEquipes.addEventListener('click', async (e) => {
            e.preventDefault();
            await abrirCentralEquipes();
        });
    }

    async function abrirCentralEquipes() {
        try {
            const response = await fetch('../../components/central-de-dados/central-equipes.html');
            if (!response.ok) throw new Error('Falha ao carregar a Central de Equipes.');
            
            workspaceArea.innerHTML = await response.text();
            carregarTabelaEquipes();
        } catch (error) {
            console.error("Erro ao abrir a Central:", error);
            alert("Erro ao carregar a Central de Equipes.");
        }
    }

    async function carregarTabelaEquipes() {
        const tbody = document.getElementById('tbody-central-equipes');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748b;">Carregando equipes...</td></tr>`;

        try {
            const equipes = await equipeService.listarEquipes();
            
            if (equipes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748b;">Nenhuma equipe cadastrada.</td></tr>`;
                return;
            }

            tbody.innerHTML = equipes.map(eq => `
                <tr>
                    <td><strong>${eq.nome}</strong></td>
                    <td>${eq.descricao || '-'}</td>
                    <td>${eq.created_at ? new Date(eq.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="alert('Opções de gerenciamento em breve')">Gerenciar</button>
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ef4444;">Erro ao carregar os dados do banco.</td></tr>`;
        }
    }

});