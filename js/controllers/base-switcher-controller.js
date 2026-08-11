/**
 * CONTROLLER: BASE SWITCHER
 * Gerencia o preenchimento, criação automática da base padrão e sincronização da Base Ativa.
 */
import { supabase } from '../services/auth.js';
import { baseService } from '../services/baseService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const selectBase = document.getElementById('seletor-base-ativa');
    if (!selectBase) return;

    async function carregarBasesNoSwitcher() {
        try {
            const equipeIdAtiva = localStorage.getItem('gestao_dp_equipe_ativa');
            if (!equipeIdAtiva) {
                selectBase.innerHTML = `<option value="" disabled selected>Selecione uma equipe...</option>`;
                return;
            }

            let basesList = [];
            try {
                basesList = await baseService.listarBasesPorEquipe(equipeIdAtiva);
            } catch (err) {
                console.error("Erro ao buscar bases:", err);
            }

            // Se a equipe não possuir nenhuma base cadastrada, cria a base padrão obrigatoriamente
            if (basesList.length === 0) {
                try {
                    const novaBasePayload = {
                        equipe_id: equipeIdAtiva,
                        nome_base: 'Base Padrão'
                    };
                    const dadosCriados = await baseService.salvarBase(novaBasePayload);
                    if (dadosCriados && dadosCriados.length > 0) {
                        basesList.push(dadosCriados[0]);
                        localStorage.setItem('gestao_dp_base_ativa', dadosCriados[0].id);
                    }
                } catch (err) {
                    console.error("Erro ao criar base padrão automática:", err);
                }
            }

            const valorAtual = selectBase.value;
            selectBase.innerHTML = `<option value="" disabled selected>Selecionar Base...</option>`;

            basesList.forEach(base => {
                const option = document.createElement('option');
                option.value = base.id;
                option.textContent = base.nome_base;
                selectBase.appendChild(option);
            });

            let savedBaseId = localStorage.getItem('gestao_dp_base_ativa') || valorAtual;

            if (!savedBaseId && basesList.length > 0) {
                savedBaseId = basesList[0].id;
                localStorage.setItem('gestao_dp_base_ativa', savedBaseId);
            }

            if (savedBaseId) {
                selectBase.value = savedBaseId;
            }
        } catch (error) {
            console.error("Erro crítico ao carregar o seletor de bases:", error);
        }
    }

    await carregarBasesNoSwitcher();

    // Ouve quando o usuário troca de equipe para atualizar as bases disponíveis
    window.addEventListener('equipe-alterada', async () => {
        localStorage.removeItem('gestao_dp_base_ativa');
        await carregarBasesNoSwitcher();
    });

    // Ouve quando uma nova base é criada para atualizar o seletor instantaneamente
    window.addEventListener('base-criada', async (e) => {
        await carregarBasesNoSwitcher();
        if (e.detail && e.detail.novaBase) {
            selectBase.value = e.detail.novaBase.id;
            localStorage.setItem('gestao_dp_base_ativa', e.detail.novaBase.id);
        }
    });

    // Salva a nova base ativa sempre que o usuário trocar manualmente pelo select
    selectBase.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        localStorage.setItem('gestao_dp_base_ativa', selectedId);
        window.dispatchEvent(new CustomEvent('base-alterada', { detail: { baseId: selectedId } }));
    });
});