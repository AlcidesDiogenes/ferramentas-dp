/**
 * CONTROLLER: CENTRAL DE EMPRESAS
 * Responsável por gerenciar a listagem, filtragem por base ativa, acionamento de edição e exclusão de empresas.
 */

import { supabase } from '../../services/auth.js';
import { abrirModalEdicaoEmpresa } from './empresas-controller.js';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tbody-central-empresas')) {
        initCentralEmpresas();
    }
});

// Ouve a alteração de base no switcher global para atualizar a listagem reativamente
window.addEventListener('base-alterada', () => {
    if (document.getElementById('tbody-central-empresas')) {
        initCentralEmpresas();
    }
});

/**
 * Inicializa e carrega os dados da Central de Empresas para a equipe e base ativas.
 */
export async function initCentralEmpresas() {
    const tbody = document.getElementById('tbody-central-empresas');
    if (!tbody) {
        console.warn("Elemento 'tbody-central-empresas' não encontrado no DOM.");
        return;
    }

    const equipeIdAtiva = localStorage.getItem('gestao_dp_equipe_ativa');
    const baseIdAtiva = localStorage.getItem('gestao_dp_base_ativa');

    if (!equipeIdAtiva) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">Nenhuma equipe selecionada no menu superior.</td></tr>';
        return;
    }

    if (!baseIdAtiva) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">Nenhuma base operacional selecionada no topo da tela. Selecione uma base para visualizar as empresas.</td></tr>';
        return;
    }

    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">Carregando empresas da base...</td></tr>';

        // Consulta ao Supabase filtrando estritamente por equipe e base ativa
        const { data: empresas, error } = await supabase
            .from('empresa')
            .select(`
                *,
                equipe_bases ( nome_base )
            `)
            .eq('equipe_id', equipeIdAtiva)
            .eq('base_id', baseIdAtiva)
            .order('codigo_empresa', { ascending: true });

        if (error) throw error;

        tbody.innerHTML = '';

        if (!empresas || empresas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #64748b;">Nenhuma empresa cadastrada para esta base operacional. Utilize o menu "Novo Cadastro" para iniciar.</td></tr>';
            return;
        }

        empresas.forEach(emp => {
            const tr = document.createElement('tr');
            const nomeBase = emp.equipe_bases?.nome_base || 'Base Padrão';
            
            tr.innerHTML = `
                <td>${emp.codigo_empresa}</td>
                <td>${emp.apelido}</td>
                <td>${emp.cnpj_cpf}</td>
                <td>${emp.regime_tributario || '-'}</td>
                <td>${nomeBase}</td>
                <td style="display: flex; gap: 6px;">
                    <button class="btn-editar btn btn-secondary" data-id="${emp.id}" style="padding: 4px 8px; cursor: pointer; font-size: 12px;">Editar</button>
                    <button class="btn-excluir btn btn-secondary" data-id="${emp.id}" style="padding: 4px 8px; cursor: pointer; font-size: 12px; background-color: #fee2e2; color: #dc2626; border: none;">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Adiciona ouvintes de clique nos botões de edição
        tbody.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const empresaId = e.target.getAttribute('data-id');
                await handleEditarEmpresa(empresaId);
            });
        });

        // Adiciona ouvintes de clique nos botões de exclusão
        tbody.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const empresaId = e.target.getAttribute('data-id');
                await handleExcluirEmpresa(empresaId);
            });
        });

    } catch (err) {
        console.error("Erro ao carregar empresas na Central:", err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red; padding: 20px;">Erro ao carregar dados. Verifique o console.</td></tr>';
    }
}

/**
 * Aciona a abertura do modal de edição carregando os dados da empresa.
 * @param {string} id - ID do registro da empresa
 */
async function handleEditarEmpresa(id) {
    try {
        await abrirModalEdicaoEmpresa(id);
    } catch (err) {
        console.error("Erro ao abrir modal de edição:", err);
        alert("Não foi possível carregar o formulário de edição.");
    }
}

/**
 * Trata a exclusão segura de uma empresa com confirmação e tratamento de exceções.
 * @param {string} id - ID do registro da empresa
 */
async function handleExcluirEmpresa(id) {
    const confirmacao = confirm("Tem certeza que deseja excluir esta empresa? Esta ação não poderá ser desfeita.");
    if (!confirmacao) return;

    try {
        const { error } = await supabase
            .from('empresa')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert("Empresa excluída com sucesso!");
        await initCentralEmpresas();

    } catch (err) {
        console.error("Erro detalhado ao excluir empresa:", err);
        alert(`Erro ao excluir empresa:\n\nMensagem: ${err.message || JSON.stringify(err)}`);
    }
}