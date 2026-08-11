/**
 * CORE SERVICE: BASE SERVICE
 * Responsável por gerenciar as operações de banco de dados para a tabela `equipe_bases`.
 */
import { supabase } from './auth.js';

export const baseService = {
    /**
     * Lista as bases vinculadas a uma determinada equipe.
     * @param {string} equipeId - ID da equipe ativa
     */
    async listarBasesPorEquipe(equipeId) {
        if (!equipeId) return [];
        
        const { data, error } = await supabase
            .from('equipe_bases')
            .select('*')
            .eq('equipe_id', equipeId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Erro ao listar bases da equipe:", error);
            throw error;
        }
        return data || [];
    },

    /**
     * Salva uma nova base operacional no Supabase.
     * @param {Object} dadosBase - Objeto contendo nome_base e equipe_id
     */
    async salvarBase(dadosBase) {
        const { data, error } = await supabase
            .from('equipe_bases')
            .insert([dadosBase])
            .select();

        if (error) {
            console.error("Erro ao salvar base no Supabase:", error);
            throw error;
        }

        return data;
    },

    /**
     * Exclui uma base pelo ID.
     * @param {string} baseId - ID da base
     */
    async excluirBase(baseId) {
        const { error } = await supabase
            .from('equipe_bases')
            .delete()
            .eq('id', baseId);

        if (error) {
            console.error("Erro ao excluir base:", error);
            throw error;
        }
        return true;
    }
};