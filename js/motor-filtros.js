/**
 * MOTOR GLOBAL DE FILTROS AVANÇADOS (Multi-termos)
 */

const MotorFiltros = {
    // 1. Função de busca
    filtrarMultiplo: function (dados, textoDigitado, colunasParaBusca) {
        if (!textoDigitado || textoDigitado.trim() === '') return dados;
        const termos = textoDigitado.toLowerCase().trim().split(/\s+/);
        return dados.filter(linha => {
            const superString = colunasParaBusca.map(coluna => (linha[coluna] || '').toString().toLowerCase()).join(' ');
            return termos.every(termo => superString.includes(termo));
        });
    },

    // 2. Função que injeta o placeholder automaticamente em todos os inputs
    init: function (selector = '#input-filtro', placeholderTexto = "Digite para buscar...") {
        const input = document.querySelector(selector);
        if (input) {
            // Se o módulo não enviar nada, usa o padrão. Se enviar, usa o do módulo.
            input.placeholder = placeholderTexto;
        }
    }
};

// Inicializa automaticamente ao carregar a página
document.addEventListener('DOMContentLoaded', () => MotorFiltros.init());