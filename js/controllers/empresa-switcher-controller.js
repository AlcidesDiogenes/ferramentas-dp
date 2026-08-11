/**
 * CONTROLLER: EMPRESA SWITCHER
 * Gerencia o preenchimento, sincronização e persistência da Empresa Ativa no cabeçalho.
 */
import { supabase } from '../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const selectEmpresa = document.getElementById('seletor-empresa-ativa');
    if (!selectEmpresa) return;

    async function carregarEmpresasNoSwitcher() {
        try {
            const equipeIdAtiva = localStorage.getItem('gestao_dp_equipe_ativa');
            const baseIdAtiva = localStorage.getItem('gestao_dp_base_ativa');

            if (!equipeIdAtiva || !baseIdAtiva) {
                selectEmpresa.innerHTML = `<option value="" disabled selected>Selecione Equipe e Base...</option>`;
                return;
            }

            const { data: empresas, error } = await supabase
                .from('empresa')
                .select('id, apelido, codigo_empresa')
                .eq('equipe_id', equipeIdAtiva)
                .eq('base_id', baseIdAtiva)
                .order('codigo_empresa', { ascending: true });

            if (error) throw error;

            const valorAtual = selectEmpresa.value;
            selectEmpresa.innerHTML = `<option value="" disabled selected>Trocar de Empresa...</option>`;

            if (!empresas || empresas.length === 0) {
                selectEmpresa.innerHTML = `<option value="" disabled selected>Nenhuma empresa na base</option>`;
                localStorage.removeItem('gestao_dp_empresa_ativa');
                return;
            }

            empresas.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `[${emp.codigo_empresa}] ${emp.apelido}`;
                selectEmpresa.appendChild(option);
            });

            let savedEmpresaId = localStorage.getItem('gestao_dp_empresa_ativa') || valorAtual;

            const empresaExiste = empresas.some(emp => emp.id === savedEmpresaId);
            if (!empresaExiste && empresas.length > 0) {
                savedEmpresaId = empresas[0].id;
                localStorage.setItem('gestao_dp_empresa_ativa', savedEmpresaId);
            }

            if (empresaExiste || savedEmpresaId) {
                selectEmpresa.value = savedEmpresaId;
            }
        } catch (err) {
            console.error("Erro ao carregar o seletor de empresas:", err);
            selectEmpresa.innerHTML = `<option value="" disabled selected>Erro ao carregar empresas</option>`;
        }
    }

    await carregarEmpresasNoSwitcher();

    // Ouve alterações de equipe ou base para recarregar as empresas correspondentes
    window.addEventListener('equipe-alterada', async () => {
        localStorage.removeItem('gestao_dp_empresa_ativa');
        await carregarEmpresasNoSwitcher();
    });

    window.addEventListener('base-alterada', async () => {
        localStorage.removeItem('gestao_dp_empresa_ativa');
        await carregarEmpresasNoSwitcher();
    });

    // Salva a nova empresa ativa ao trocar manualmente no select
    selectEmpresa.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        localStorage.setItem('gestao_dp_empresa_ativa', selectedId);
        window.dispatchEvent(new CustomEvent('empresa-alterada', { detail: { empresaId: selectedId } }));
    });
});