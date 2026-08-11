/**
 * CONTROLLER: EQUIPE SWITCHER
 * Gerencia o preenchimento, criação automática e atualização em tempo real da equipe ativa.
 */

import { supabase } from '../services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const selectEquipe = document.getElementById('seletor-equipe-ativa');
    if (!selectEquipe) return;

    // Função central para carregar e atualizar as equipes no seletor
    async function carregarEquipesNoSwitcher() {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) return;

            let equipesList = [];

            // 1. Busca equipes criadas pelo usuário
            const { data: equipesOwner, error: err1 } = await supabase
                .from('equipes')
                .select('id, nome')
                .eq('user_id', user.id);

            if (!err1 && equipesOwner) {
                equipesList = [...equipesOwner];
            }

            // 2. Se não tiver nenhuma equipe cadastrada em lugar nenhum, cria a padrão
            if (equipesList.length === 0) {
                let nomeUsuario = user.user_metadata?.nome_completo || user.user_metadata?.nome;
                
                if (!nomeUsuario) {
                    try {
                        const { data: perfil } = await supabase
                            .from('profiles')
                            .select('nome_completo, nome')
                            .eq('id', user.id)
                            .maybeSingle();
                        if (perfil) nomeUsuario = perfil.nome_completo || perfil.nome;
                    } catch (e) {}
                }

                if (!nomeUsuario && user.email) {
                    nomeUsuario = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }

                const nomeEquipePadrao = `Minha equipe (${nomeUsuario || 'Usuário'})`;

                const { data: novaEq, error: errCreate } = await supabase
                    .from('equipes')
                    .insert([{ nome: nomeEquipePadrao, user_id: user.id }])
                    .select();

                if (!errCreate && novaEq && novaEq.length > 0) {
                    equipesList.push(novaEq[0]);
                    localStorage.setItem('gestao_dp_equipe_ativa', novaEq[0].id);
                }
            }

            // 3. Preenche o elemento select com as equipes atualizadas
            const valorAtual = selectEquipe.value; // Guarda a seleção atual momentaneamente
            selectEquipe.innerHTML = `<option value="" disabled selected>Selecionar Equipe...</option>`;
            
            equipesList.forEach(eq => {
                const option = document.createElement('option');
                option.value = eq.id;
                option.textContent = eq.nome;
                selectEquipe.appendChild(option);
            });

            // 4. Restaura a seleção ou define a ativa salva no localStorage
            let savedEquipeId = localStorage.getItem('gestao_dp_equipe_ativa') || valorAtual;
            
            if (!savedEquipeId && equipesList.length > 0) {
                savedEquipeId = equipesList[0].id;
                localStorage.setItem('gestao_dp_equipe_ativa', savedEquipeId);
            }

            if (savedEquipeId) {
                selectEquipe.value = savedEquipeId;
            }

        } catch (error) {
            console.error("Erro ao carregar o seletor de equipes:", error);
        }
    }

    // Carrega na inicialização da página
    await carregarEquipesNoSwitcher();

    // Ouve o evento global disparado quando uma nova equipe é criada na Central
    window.addEventListener('equipe-criada', async (e) => {
        await carregarEquipesNoSwitcher();
        // Se quiser selecionar automaticamente a equipe recém-criada:
        if (e.detail && e.detail.novaEquipe) {
            selectEquipe.value = e.detail.novaEquipe.id;
            localStorage.setItem('gestao_dp_equipe_ativa', e.detail.novaEquipe.id);
        }
    });

    // Salva a nova equipe ativa sempre que o usuário trocar manualmente pelo select
    selectEquipe.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        localStorage.setItem('gestao_dp_equipe_ativa', selectedId);
        window.dispatchEvent(new CustomEvent('equipe-alterada', { detail: { equipeId: selectedId } }));
    });
});