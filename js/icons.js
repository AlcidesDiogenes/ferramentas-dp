// js/icons.js
/**
 * Ícones SVG (Lucide) reutilizados em várias telas do sistema — extraídos aqui para não
 * repetir o mesmo markup em dezenas de arquivos JS (qualquer ajuste visual passa a ser feito
 * em um único lugar). Cada função aceita um tamanho opcional (em unidades CSS, ex: '1.2em').
 */

export function iconeSucesso(size = '1.2em') {
    return `<svg class="lucide lucide-check-circle-2" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" /> </svg>`;
}

export function iconeErro(size = '1.2em') {
    return `<svg class="lucide lucide-x-circle" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m15 9-6 6" /> <path d="m9 9 6 6" /> </svg>`;
}

export function iconeAlerta(size = '1.2em') {
    return `<svg class="lucide lucide-alert-triangle" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" /> </svg>`;
}

export function iconeTrash(size = '1.2em') {
    return `<svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> </svg>`;
}
