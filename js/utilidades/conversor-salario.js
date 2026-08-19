/**
 * @module Utilidades - Conversor de Salário
 * @description Converte o salário mensal para valor diário e valor hora, com divisor
 * de dias e carga horária mensal configuráveis.
 */

"use strict";

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

document.addEventListener('DOMContentLoaded', () => {
    const salarioInput = document.getElementById('salario-mensal');
    const divisorInput = document.getElementById('divisor-dias');
    const horasSelect = document.getElementById('horas-mensais');
    const valorDiarioEl = document.getElementById('valor-diario');
    const valorHoraEl = document.getElementById('valor-hora');

    function recalcular() {
        const salario = parseFloat(salarioInput.value) || 0;
        const divisorDias = parseFloat(divisorInput.value) || 30;
        const horasMensais = parseFloat(horasSelect.value) || 220;

        const valorDiario = divisorDias > 0 ? salario / divisorDias : 0;
        const valorHora = horasMensais > 0 ? salario / horasMensais : 0;

        valorDiarioEl.textContent = formatarMoeda(valorDiario);
        valorHoraEl.textContent = formatarMoeda(valorHora);
    }

    [salarioInput, divisorInput, horasSelect].forEach(el => {
        el.addEventListener('input', recalcular);
        el.addEventListener('change', recalcular);
    });
});
