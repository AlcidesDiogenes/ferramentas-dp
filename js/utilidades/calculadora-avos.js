/**
 * @module Utilidades - Calculadora de Avos
 * @description Calcula os avos proporcionais de 13º salário e férias entre admissão e
 * demissão, usando a regra dos 15 dias (fração igual ou superior a 15 dias conta como avo
 * completo). Mesma lógica usada no simulador de rescisão (js/simuladores/rescisao.js), para
 * manter os dois resultados consistentes.
 */

"use strict";

function parseDataLocal(str) {
    return new Date(str + 'T00:00:00');
}

function calcularAvos13(admissao, demissao) {
    let avos13 = 0;
    const anoDem = demissao.getFullYear();
    const inicioAno = new Date(anoDem, 0, 1);
    const dataInicio13 = admissao > inicioAno ? admissao : inicioAno;

    const mInicio = dataInicio13.getMonth();
    const mFim = demissao.getMonth();

    if (dataInicio13.getFullYear() === demissao.getFullYear()) {
        let diasPrimeiroMes = 30 - dataInicio13.getDate() + 1;
        if (dataInicio13.getDate() === 1) diasPrimeiroMes = 30;
        if (diasPrimeiroMes >= 15) avos13++;

        for (let m = mInicio + 1; m < mFim; m++) {
            avos13++;
        }

        if (mFim > mInicio && demissao.getDate() >= 15) {
            avos13++;
        }
    } else {
        avos13 = demissao.getMonth() + (demissao.getDate() >= 15 ? 1 : 0);
    }

    return Math.min(12, Math.max(0, avos13));
}

function calcularAvosFerias(admissao, demissao) {
    let ultimoAniversario = new Date(demissao.getFullYear(), admissao.getMonth(), admissao.getDate());
    if (ultimoAniversario > demissao) {
        ultimoAniversario = new Date(demissao.getFullYear() - 1, admissao.getMonth(), admissao.getDate());
    }

    let diffMeses = (demissao.getFullYear() - ultimoAniversario.getFullYear()) * 12 + (demissao.getMonth() - ultimoAniversario.getMonth());

    const diaInic = ultimoAniversario.getDate();
    const diaFim = demissao.getDate();

    if (diaFim < diaInic) {
        diffMeses--;
        const ultimoDiaMesAnterior = new Date(demissao.getFullYear(), demissao.getMonth(), 0).getDate();
        const diasRestantesFracao = (ultimoDiaMesAnterior - diaInic + 1) + diaFim;
        if (diasRestantesFracao >= 15) {
            diffMeses++;
        }
    } else if (diaFim - diaInic >= 15) {
        diffMeses++;
    }

    return Math.min(12, Math.max(0, diffMeses));
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
