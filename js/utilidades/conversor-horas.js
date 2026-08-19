/**
 * @module Utilidades - Conversor de Horas
 * @description Converte horas entre formato decimal (ex: 7.5) e HH:MM (ex: 07:30), nos dois sentidos, de forma reativa.
 */

"use strict";

function decimalParaHHMM(decimal) {
    const sinal = decimal < 0 ? '-' : '';
    const abs = Math.abs(decimal);
    let horas = Math.floor(abs);
    let minutos = Math.round((abs - horas) * 60);
    if (minutos === 60) {
        minutos = 0;
        horas += 1;
    }
    return `${sinal}${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function hhmmParaDecimal(texto) {
    const match = String(texto).trim().match(/^(-?)(\d{1,4}):([0-5]?\d)$/);
    if (!match) return null;
    const sinal = match[1] === '-' ? -1 : 1;
    const horas = parseInt(match[2], 10);
    const minutos = parseInt(match[3], 10);
    return sinal * (horas + minutos / 60);
}

document.addEventListener('DOMContentLoaded', () => {
    const decInput = document.getElementById('dec-input');
    const decOutput = document.getElementById('dec-output');
    const horaInput = document.getElementById('hora-input');
    const horaOutput = document.getElementById('hora-output');
    const horaErro = document.getElementById('hora-erro');

    decInput.addEventListener('input', () => {
        const valor = parseFloat(decInput.value.replace(',', '.'));
        decOutput.textContent = isNaN(valor) ? '00:00' : decimalParaHHMM(valor);
    });

    horaInput.addEventListener('input', () => {
        const texto = horaInput.value.trim();
        if (texto === '') {
            horaOutput.textContent = '0,00';
            horaErro.style.display = 'none';
            return;
        }
        const decimal = hhmmParaDecimal(texto);
        if (decimal === null) {
            horaOutput.textContent = '0,00';
            horaErro.style.display = 'block';
            return;
        }
        horaErro.style.display = 'none';
        horaOutput.textContent = decimal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
});
