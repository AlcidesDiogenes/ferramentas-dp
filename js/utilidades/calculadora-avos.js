/**
 * @module Utilidades - Calculadora de Avos
 * @description Calcula os avos proporcionais de 13º salário e férias entre admissão e
 * demissão, usando a regra dos 15 dias (fração igual ou superior a 15 dias conta como avo
 * completo). O cálculo em si vive em js/simuladores/calculos-folha.js, compartilhado com
 * os demais simuladores, para que todos deem o mesmo resultado para a mesma admissão/demissão.
 */

"use strict";

import { calcularAvos13, calcularAvosFerias, anoDataValido } from '../simuladores/calculos-folha.js';

function parseDataLocal(str) {
    return new Date(str + 'T00:00:00');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-avos');
    const inputAdmissao = document.getElementById('data-admissao');
    const inputDemissao = document.getElementById('data-demissao');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const admissao = parseDataLocal(inputAdmissao.value);
        const demissao = parseDataLocal(inputDemissao.value);
        const resultSection = document.getElementById('resultado-section');
        const resultDiv = document.getElementById('resultado-calculo');

        if (demissao < admissao) {
            resultDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger); text-align: center;">A data de demissão não pode ser anterior à data de admissão.</p></div>`;
            resultSection.style.display = 'block';
            return;
        }

        if (!anoDataValido(admissao) || !anoDataValido(demissao)) {
            resultDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger); text-align: center;">Ano de admissão ou demissão parece incorreto (confira se digitou o ano completo, ex: 2026 e não 26).</p></div>`;
            resultSection.style.display = 'block';
            return;
        }

        const avos13 = calcularAvos13(admissao, demissao);
        const avosFerias = calcularAvosFerias(admissao, demissao);

        resultDiv.innerHTML = `
            <div class="sim-card">
                <div class="sim-grid">
                    <div class="sim-item">
                        <span class="sim-label">Avos de 13º Salário</span>
                        <span class="sim-value">${avos13}/12</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Avos de Férias Proporcionais</span>
                        <span class="sim-value">${avosFerias}/12</span>
                    </div>
                </div>
                <p style="text-align: center; color: var(--cor-texto-secundario); font-size: 0.85rem; margin-top: 12px;">
                    Fração de mês igual ou superior a 15 dias conta como um avo completo.
                </p>
            </div>
        `;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
});
