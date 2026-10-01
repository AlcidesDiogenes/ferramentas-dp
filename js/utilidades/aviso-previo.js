/**
 * @module Utilidades - Aviso Prévio Proporcional
 * @description Calcula os dias de aviso prévio devidos conforme o tempo de casa,
 * seguindo a Lei 12.506/2011 (30 dias + 3 dias por ano completo, limitado a 90 dias).
 */

"use strict";

import { calcularAnosCompletos, anoDataValido } from '../simuladores/calculos-folha.js';

function parseDataLocal(str) {
    return new Date(str + 'T00:00:00');
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-aviso-previo');
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

        const anosCompletos = calcularAnosCompletos(admissao, demissao);
        const diasAdicionais = Math.min(60, anosCompletos * 3);
        const totalDias = 30 + diasAdicionais;

        resultDiv.innerHTML = `
            <div class="sim-card">
                <div class="sim-grid">
                    <div class="sim-item">
                        <span class="sim-label">Anos completos de casa</span>
                        <span class="sim-value">${anosCompletos}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Dias adicionais (3 por ano, até 60)</span>
                        <span class="sim-value">${diasAdicionais}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Base legal (Lei 12.506/2011)</span>
                        <span class="sim-value" style="font-size: 0.95rem;">30 dias</span>
                    </div>
                </div>
                <div class="total-bar" style="margin-top: 16px;">
                    <span class="highlight-label">Total de dias de aviso prévio</span>
                    <span class="highlight-value">${totalDias} dias</span>
                </div>
            </div>
        `;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
});
