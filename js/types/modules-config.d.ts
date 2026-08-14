/**
 * Definição de Tipos para o Gerenciador de Módulos (Zero Bugs Schema)
 */

export type ModuleStatus = 'Beta' | 'Updated' | 'New' | 'Maintenance' | 'Pro' | '' | null;

export type UserRole = 'public' | 'user' | 'pro' | 'premium' | 'admin';

export interface ModuleConfig {
    /** Identificador único do módulo (obrigatório e exclusivo) */
    id: string;
    
    /** Título do módulo exibido nos cards, headers e busca */
    title: string;
    
    /** Caminho relativo do arquivo HTML */
    path: string;
    
    /** Status/Selo do módulo ('Beta', 'Updated', 'New', 'Maintenance', 'Pro' ou personalizado) */
    status?: ModuleStatus | string;
    
    /** Rótulo legível para exibição da tag no selo (ex: 'Novo', 'Atualizado', 'Beta') */
    statusLabel?: string;
    
    /** Data de início em que a tag fica visível (Formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss) */
    validFrom?: string;
    
    /** Data limite em que a tag expira e deixa de ser exibida (Formato ISO: YYYY-MM-DD) */
    validUntil?: string;
    
    /** Perfil/Nível de acesso mínimo exigido para utilizar a ferramenta */
    roleRequired?: UserRole | UserRole[];
    
    /** Define se o módulo está ativo e acessível */
    accessible?: boolean;
    
    /** Mensagem explicativa exibida quando o módulo está indisponível ou restrito */
    message?: string;
}

declare global {
    interface Window {
        MODULES_CONFIG: ModuleConfig[];
        getUserRole?: () => UserRole;
    }
}
