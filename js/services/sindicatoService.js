// js/services/sindicatoService.js
import { supabase } from './auth.js';

export const sindicatoService = {
    
    // Função para Inserir um novo Sindicato
    async salvarSindicato(dadosSindicato) {
        
        // 1. Recupera a equipe ativa selecionada no topo da tela (localStorage)
        let equipeId = localStorage.getItem('gestao_dp_equipe_ativa');

        // 2. Se não houver equipe no navegador, busca a primeira equipe criada pelo usuário
        if (!equipeId) {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error("Usuário não autenticado no sistema.");
            }

            const { data: equipes, error: eqError } = await supabase
                .from('equipes')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

            if (eqError || !equipes || equipes.length === 0) {
                throw new Error("Nenhuma equipe encontrada. Crie uma equipe na Central de Equipes.");
            }

            equipeId = equipes[0].id;
            localStorage.setItem('gestao_dp_equipe_ativa', equipeId);
        }

        // 3. Monta o payload incluindo o 'equipe_id' exigido pela tabela
        const payloadCompleto = {
            ...dadosSindicato,
            equipe_id: equipeId
        };

        // 4. Envia para a tabela user_sindicatos no Supabase
        const { data, error } = await supabase
            .from('user_sindicatos')
            .insert([payloadCompleto])
            .select();

        if (error) {
            console.error("Erro no Supabase ao salvar Sindicato:", error);
            throw error;
        }

        return data;
    }

};