/**
 * CONTROLLER: APP SYNC LISTENER
 * Gerencia a reatividade global da aplicação, recarregando a página 
 * automaticamente sempre que houver alteração de contexto (equipe, base, empresa) 
 * ou exclusão de registros em tabelas do sistema.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ouve alterações de contexto disparadas pelos seletores globais do cabeçalho
    window.addEventListener('equipe-alterada', () => {
        window.location.reload();
    });

    window.addEventListener('base-alterada', () => {
        window.location.reload();
    });

    window.addEventListener('empresa-alterada', () => {
        window.location.reload();
    });

    // 2. Ouve evento global customizado para exclusões bem-sucedidas em qualquer tabela
    window.addEventListener('registro-excluido', () => {
        window.location.reload();
    });
});