// js/services/equipeService.js
import { supabase } from './auth.js';

export const equipeService = {
    
    // Salvar nova equipe no Supabase
    async salvarEquipe(dadosEquipe) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            throw new Error("Usuário não autenticado no sistema.");
        }

        // Verificar limite do Plano Gratuito
        const userId = user.id;
        const localProfile = JSON.parse(localStorage.getItem(`profile_${userId}`) || '{}');
        const userPlan = localProfile.plano || localStorage.getItem(`user_plan_${userId}`) || 'Gratuito';

        if (userPlan === 'Gratuito') {
            const equipesExistentes = await this.listarEquipes();
            if (equipesExistentes && equipesExistentes.length >= 1) {
                throw new Error("⚠️ Limitação do Plano Gratuito: O seu plano atual possui o limite de 1 Equipe ativa. Faça upgrade para o Plano Pro para criar equipes adicionais.");
            }
        }

        const payload = {
            nome: dadosEquipe.nome,
            user_id: user.id
        };

        const { data, error } = await supabase
            .from('equipes')
            .insert([payload])
            .select();

        if (error) {
            console.error("Erro no Supabase ao salvar Equipe:", error);
            throw error;
        }

        // Dispara evento para atualizar o seletor na header
        if (data && data.length > 0) {
            window.dispatchEvent(new CustomEvent('equipe-criada', { detail: { novaEquipe: data[0] } }));
        }

        return data;
    },

    // Listar equipes cadastradas
    async listarEquipes() {
        const { data, error } = await supabase
            .from('equipes')
            .select('*');

        if (error) {
            console.error("Erro ao listar equipes:", error);
            throw error;
        }

        return data || [];
    }

};