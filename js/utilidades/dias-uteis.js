/**
 * @module Utilidades - Dias Úteis Entre Datas
 * @description Conta dias úteis (excluindo sábados, domingos e feriados nacionais) entre duas datas.
 */

"use strict";

function parseDataLocal(str) {
    return new Date(str + 'T00:00:00');
}

// Calcula a data da Páscoa (algoritmo de Gauss / Meeus-Jones-Butcher) para derivar os
// feriados móveis (Carnaval, Sexta-feira Santa e Corpus Christi).
function calcularPascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
}

function adicionarDias(data, dias) {
    const nova = new Date(data);
    nova.setDate(nova.getDate() + dias);
    return nova;
}

function chaveData(data) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

// Feriados nacionais fixos + móveis (baseados na Páscoa) de um ano
function feriadosDoAno(ano) {
    const pascoa = calcularPascoa(ano);
    const chaves = new Set([
        `${ano}-01-01`, // Confraternização Universal
        `${ano}-04-21`, // Tiradentes
        `${ano}-05-01`, // Dia do Trabalho
        `${ano}-09-07`, // Independência do Brasil
        `${ano}-10-12`, // Nossa Senhora Aparecida
        `${ano}-11-02`, // Finados
        `${ano}-11-15`, // Proclamação da República
        `${ano}-11-20`, // Dia Nacional de Zumbi e da Consciência Negra (Lei 14.759/2023)
        `${ano}-12-25`  // Natal
    ]);
    chaves.add(chaveData(adicionarDias(pascoa, -47))); // Carnaval (terça-feira)
    chaves.add(chaveData(adicionarDias(pascoa, -2)));  // Sexta-feira Santa
    chaves.add(chaveData(adicionarDias(pascoa, 60)));  // Corpus Christi
    return chaves;
}

function contarDiasUteis(inicio, fim, descontarFeriados, sabadoUtil) {
    const anos = new Set();
    for (let a = inicio.getFullYear(); a <= fim.getFullYear(); a++) anos.add(a);

    let todosFeriados = new Set();
    if (descontarFeriados) {
        anos.forEach(ano => {
            feriadosDoAno(ano).forEach(f => todosFeriados.add(f));
        });
    }

    let uteis = 0;
    let finsDeSemana = 0;
    let feriadosNoPeriodo = 0;
    const cursor = new Date(inicio);

    while (cursor <= fim) {
        const diaSemana = cursor.getDay(); // 0=domingo, 6=sábado
        const ehSabado = diaSemana === 6;
        const ehDomingo = diaSemana === 0;
        const ehFimDeSemanaNaoUtil = ehDomingo || (ehSabado && !sabadoUtil);
        const ehFeriado = descontarFeriados && todosFeriados.has(chaveData(cursor));

        if (ehFimDeSemanaNaoUtil) {
            finsDeSemana++;
        } else if (ehFeriado) {
            feriadosNoPeriodo++;
        } else {
            uteis++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    return { uteis, finsDeSemana, feriadosNoPeriodo };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-dias-uteis');
    const inputInicio = document.getElementById('data-inicio');
    const inputFim = document.getElementById('data-fim');
    const selectFeriados = document.getElementById('considerar-feriados');
    const selectSabado = document.getElementById('considerar-sabado');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const inicio = parseDataLocal(inputInicio.value);
        const fim = parseDataLocal(inputFim.value);
        const resultSection = document.getElementById('resultado-section');
        const resultDiv = document.getElementById('resultado-calculo');

        if (fim < inicio) {
            resultDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger); text-align: center;">A data de fim não pode ser anterior à data de início.</p></div>`;
            resultSection.style.display = 'block';
            return;
        }

        const descontarFeriados = selectFeriados.value === 'sim';
        const sabadoUtil = selectSabado.value === 'sim';
        const { uteis, finsDeSemana, feriadosNoPeriodo } = contarDiasUteis(inicio, fim, descontarFeriados, sabadoUtil);
        const totalDias = Math.round((fim - inicio) / 86400000) + 1;

        resultDiv.innerHTML = `
            <div class="sim-card">
                <div class="sim-grid">
                    <div class="sim-item">
                        <span class="sim-label">Total de dias no período</span>
                        <span class="sim-value">${totalDias}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">${sabadoUtil ? 'Domingos' : 'Fins de semana'}</span>
                        <span class="sim-value">${finsDeSemana}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Feriados nacionais no período</span>
                        <span class="sim-value">${descontarFeriados ? feriadosNoPeriodo : '-'}</span>
                    </div>
                </div>
                <div class="total-bar" style="margin-top: 16px;">
                    <span class="highlight-label">Dias úteis</span>
                    <span class="highlight-value">${uteis}</span>
                </div>
            </div>
        `;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
});
