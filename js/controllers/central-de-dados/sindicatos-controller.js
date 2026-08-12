/**
 * CONTROLLER: GESTÃO DE SINDICATOS E CCTs
 * Baseado estritamente na Documentação Técnica do Módulo.
 */

import { sindicatoService } from '../../services/sindicatoService.js';
import { supabase } from '../../services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    
    const btnMenuNovoSindicato = document.getElementById('menu-abrir-sindicato');
    const btnMenuCentralSindicatos = document.getElementById('menu-central-sindicatos');
    const containerModal = document.getElementById('container-modal-sindicato');
    const workspaceArea = document.getElementById('workspace-area');

    // 1. Abrir Modal de Novo Sindicato
    if (btnMenuNovoSindicato) {
        btnMenuNovoSindicato.addEventListener('click', async (e) => {
            e.preventDefault();
            await carregarEAbriModalSindicato();
        });
    }

    async function carregarEAbriModalSindicato() {
        if (containerModal.innerHTML.trim() === '') {
            try {
                const response = await fetch('../../components/central-de-dados/modal-sindicato.html');
                if (!response.ok) throw new Error('Falha ao carregar o componente do modal.');
                
                containerModal.innerHTML = await response.text();
                ativarEventosDoModalSindicato();
            } catch (error) {
                console.error("Erro na injeção do modal de sindicato:", error);
                alert("Erro ao abrir formulário de sindicatos.");
                return;
            }
        }

        const modal = document.getElementById('modal-cadastro-sindicato');
        if (modal) modal.style.display = 'flex';
    }

    function ativarEventosDoModalSindicato() {
        const modal = document.getElementById('modal-cadastro-sindicato');
        const btnFechar = document.getElementById('btn-fechar-modal-sindicato');
        const btnCancelar = document.getElementById('btn-cancelar-sindicato');
        const btnSalvar = document.getElementById('btn-salvar-sindicato');
        
        const inputCnpjSindicato = document.getElementById('sindicato_cnpj');
        const checkAditivo = document.getElementById('sindicato_tem_aditivo');
        const blocoAditivo = document.getElementById('bloco_dados_aditivo');
        const btnAdicionarAditivoItem = document.getElementById('btn-adicionar-aditivo-item');
        const containerListaAditivos = document.getElementById('container-lista-aditivos');

        // ---- MÁSCARA DE CNPJ ALFANUMÉRICO (REGRA VIGENTE) ----
        inputCnpjSindicato?.addEventListener('input', function(e) {
            let cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            cleaned = cleaned.substring(0, 14); // Limite rigoroso do CNPJ
            let masked = cleaned;

            if (cleaned.length > 12) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})([0-9]{2})/, "$1.$2.$3/$4-$5");
            } else if (cleaned.length > 8) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{1,4})/, "$1.$2.$3/$4");
            } else if (cleaned.length > 5) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{1,3})/, "$1.$2.$3");
            } else if (cleaned.length > 2) {
                masked = cleaned.replace(/^([A-Z0-9]{2})([A-Z0-9]{1,3})/, "$1.$2");
            }
            e.target.value = masked;
        });

        // ---- MECANISMOS DE RESET (OBRIGATÓRIO) ----
        const fecharModal = () => {
            modal.style.display = 'none';
            document.getElementById('form-sindicato').reset();
            blocoAditivo.style.display = 'none';
            if (containerListaAditivos) containerListaAditivos.innerHTML = '';
        };

        btnFechar?.addEventListener('click', fecharModal);
        btnCancelar?.addEventListener('click', fecharModal);
        
        // Clique fora da caixa fecha o modal e limpa tudo
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });

        // ---- ADITIVOS CONDICIONAIS E MÚLTIPLOS ----
        checkAditivo?.addEventListener('change', (e) => {
            if (e.target.checked) {
                blocoAditivo.style.display = 'block';
                if (containerListaAditivos.children.length === 0) {
                    adicionarLinhaAditivo(); // Adiciona o primeiro por padrão ao marcar
                }
            } else {
                blocoAditivo.style.display = 'none';
                containerListaAditivos.innerHTML = '';
            }
        });

        btnAdicionarAditivoItem?.addEventListener('click', () => {
            adicionarLinhaAditivo();
        });

        function adicionarLinhaAditivo() {
            const linha = document.createElement('div');
            linha.className = 'form-row aditivo-item';
            linha.style.cssText = "display: flex; gap: 10px; align-items: center; margin-bottom: 8px;";
            linha.innerHTML = `
                <div class="input-group" style="flex: 2;">
                    <input type="text" class="form-input aditivo-codigo" placeholder="Código do aditivo" required>
                </div>
                <div class="input-group" style="flex: 2;">
                    <input type="date" class="form-input aditivo-fim" required>
                </div>
                <button type="button" class="btn btn-secondary btn-remover-aditivo" style="background-color: #fee2e2; color: #dc2626; border: none; padding: 10px;"><i class="ph ph-trash"></i></button>
            `;
            
            linha.querySelector('.btn-remover-aditivo').addEventListener('click', () => {
                linha.remove();
            });

            containerListaAditivos.appendChild(linha);
        }

        // ---- PERSISTÊNCIA SINDICAL (SALVAR) ----
        btnSalvar?.addEventListener('click', async (e) => {
            e.preventDefault();

            const codigo_sindicato = document.getElementById('sindicato_codigo').value.trim();
            const codigo_cct = document.getElementById('sindicato_cct').value.trim();
            const cnpj = document.getElementById('sindicato_cnpj').value.trim();
            const nome_sindicato = document.getElementById('sindicato_nome').value.trim();
            const data_base = document.getElementById('sindicato_data_base').value;
            const fim_vigencia_cct = document.getElementById('sindicato_fim_vigencia').value;
            const tem_aditivo = checkAditivo.checked;

            if (!codigo_sindicato || !codigo_cct || !cnpj || !nome_sindicato || !data_base || !fim_vigencia_cct) {
                alert("Por favor, preencha todos os campos obrigatórios (*).");
                return;
            }

            // Coleta múltiplos aditivos se houver
            let aditivosArray = [];
            if (tem_aditivo) {
                const itensAditivos = containerListaAditivos.querySelectorAll('.aditivo-item');
                itensAditivos.forEach(item => {
                    const cod = item.querySelector('.aditivo-codigo').value.trim();
                    const fim = item.querySelector('.aditivo-fim').value;
                    if (cod && fim) {
                        aditivosArray.push({ codigo: cod, fim_vigencia: fim });
                    }
                });
            }

            const payload = {
                codigo_sindicato,
                codigo_cct,
                cnpj,
                nome_sindicato,
                data_base,
                fim_vigencia_cct: fim_vigencia_cct,
                tem_aditivo,
                aditivos: aditivosArray.length > 0 ? aditivosArray : null
            };

            try {
                btnSalvar.disabled = true;
                btnSalvar.textContent = "Salvando...";

                await sindicatoService.salvarSindicato(payload);
                
                alert("Sindicato salvo com sucesso!");
                fecharModal();

                // Recarrega a tabela se estiver na central
                if (document.getElementById('tbody-central-sindicatos')) {
                    carregarTabelaSindicatos();
                }

            } catch (error) {
                console.error(error);
                alert("Erro ao salvar Sindicato. Verifique os dados.");
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.textContent = "Salvar Sindicato";
            }
        });
    }


    // ==============================================================================
    // 2. LÓGICA DA CENTRAL: VISÃO DA TABELA E EXCLUSÃO COM CONFIRMAÇÃO
    // ==============================================================================
    if (btnMenuCentralSindicatos) {
        btnMenuCentralSindicatos.addEventListener('click', async (e) => {
            e.preventDefault();
            await abrirCentralSindicatos();
        });
    }

    async function abrirCentralSindicatos() {
        try {
            const response = await fetch('../../components/central-de-dados/central-sindicatos.html');
            if (!response.ok) throw new Error('Falha ao carregar a Central de Sindicatos.');
            
            workspaceArea.innerHTML = await response.text();
            carregarTabelaSindicatos();
        } catch (error) {
            console.error("Erro ao abrir a Central:", error);
            alert("Erro ao carregar a Central de Sindicatos.");
        }
    }

    async function carregarTabelaSindicatos() {
        const tbody = document.getElementById('tbody-central-sindicatos');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Carregando sindicatos...</td></tr>`;

        try {
            // Requisita dados ordenados de forma decrescente por data de criação
            const { data: sindicatos, error } = await supabase
                .from('user_sindicatos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Tratamento de Estados Vazios (Empty State)[cite: 1]
            if (!sindicatos || sindicatos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Nenhum sindicato cadastrado. Utilize o menu "Novo Cadastro" para iniciar.</td></tr>`;
                return;
            }

            // Renderização Tabular com Aditivos atrelados[cite: 1]
            tbody.innerHTML = sindicatos.map(item => {
                let aditivosHtml = '';
                if (item.aditivos && Array.isArray(item.aditivos) && item.aditivos.length > 0) {
                    aditivosHtml = `<br><small style="color: #2563eb;">Aditivos: ${item.aditivos.map(a => `${a.codigo} (Venc: ${a.fim_vigencia})`).join(', ')}</small>`;
                }

                // Traduz o mês numérico para nome legível
                const meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                const nomeMes = meses[parseInt(item.data_base)] || item.data_base;

                return `
                    <tr>
                        <td><strong>${item.nome_sindicato}</strong><br><small style="color: #64748b;">CCT: ${item.codigo_cct}</small>${aditivosHtml}</td>
                        <td>${item.cnpj || '-'}</td>
                        <td>${nomeMes}</td>
                        <td>${item.fim_vigencia_cct ? new Date(item.fim_vigencia_cct + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                        <td>
                            <button class="btn btn-secondary btn-excluir-sindicato" data-id="${item.id}" style="padding: 4px 8px; font-size: 12px; background-color: #fee2e2; color: #dc2626; border: none;">Excluir</button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Adiciona ouvintes para exclusão com pergunta de confirmação obrigatória[cite: 1]
            tbody.querySelectorAll('.btn-excluir-sindicato').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const confirmou = confirm("Tem certeza que deseja excluir este sindicato da base de dados?");
                    if (confirmou) {
                        await deletarSindicato(id);
                    }
                });
            });

        } catch (error) {
            console.error("Erro ao carregar tabela:", error);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">Erro ao carregar registros.</td></tr>`;
        }
    }

    async function deletarSindicato(id) {
        try {
            const { error } = await supabase
                .from('user_sindicatos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert("Sindicato excluído com sucesso!");
            carregarTabelaSindicatos(); // Atualiza a listagem
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Não foi possível excluir o registro.");
        }
    }

});