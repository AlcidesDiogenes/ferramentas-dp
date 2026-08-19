/**
 * @module Utilidades - Calculadora de Tempo de Casa
 * @description Calcula anos, meses e dias exatos entre a admissão e uma data de referência.
 */

"use strict";

function parseDataLocal(str) {
    return new Date(str + 'T00:00:00');
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR').format(valor);
}

function diferencaExata(inicio, fim) {
    let anos = fim.getFullYear() - inicio.getFullYear();
    let meses = fim.getMonth() - inicio.getMonth();
    let dias = fim.getDate() - inicio.getDate();

    if (dias < 0) {
        meses--;
        const ultimoDiaMesAnterior = new Date(fim.getFullYear(), fim.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
    }
    if (meses < 0) {
        anos--;
        meses += 12;
    }
    return { anos, meses, dias };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-tempo-casa');
    const inputAdmissao = document.getElementById('data-admissao');
    const inputReferencia = document.getElementById('data-referencia');

    // Preenche a data de referência com hoje por padrão
    const hoje = new Date();
    inputReferencia.value = hoje.toISOString().slice(0, 10);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const admissao = parseDataLocal(inputAdmissao.value);
        const referencia = parseDataLocal(inputReferencia.value);

        const resultSection = document.getElementById('resultado-section');
        const resultDiv = document.getElementById('resultado-calculo');

        if (referencia < admissao) {
            resultDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger); text-align: center;">A data de referência não pode ser anterior à data de admissão.</p></div>`;
            resultSection.style.display = 'block';
            return;
        }

        const { anos, meses, dias } = diferencaExata(admissao, referencia);
        const totalDiasCorridos = Math.round((referencia - admissao) / 86400000);

        resultDiv.innerHTML = `
            <div class="sim-card">
                <div class="sim-grid">
                    <div class="sim-item">
                        <span class="sim-label">Anos completos</span>
                        <span class="sim-value">${anos}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Meses completos (excedentes)</span>
                        <span class="sim-value">${meses}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Dias (excedentes)</span>
                        <span class="sim-value">${dias}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Total de dias corridos</span>
                        <span class="sim-value">${formatarMoeda(totalDiasCorridos)}</span>
                    </div>
                </div>
                <div class="total-bar" style="margin-top: 16px;">
                    <span class="highlight-label">Tempo de casa</span>
                    <span class="highlight-value">${anos} ano(s), ${meses} mês(es) e ${dias} dia(s)</span>
                </div>
            </div>
        `;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
});
