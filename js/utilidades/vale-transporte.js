/**
 * @module Utilidades - Calculadora de Vale-Transporte
 * @description Compara o desconto legal de até 6% do salário base (Lei 7.418/1985) com o
 * custo real do transporte, mostrando quanto a empresa efetivamente arca.
 */

"use strict";

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-vale-transporte');
    const salarioInput = document.getElementById('salario-base');
    const custoDiarioInput = document.getElementById('custo-diario');
    const diasInput = document.getElementById('dias-trabalhados');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const salario = parseFloat(salarioInput.value) || 0;
        const custoDiario = parseFloat(custoDiarioInput.value) || 0;
        const dias = parseFloat(diasInput.value) || 0;

        const resultSection = document.getElementById('resultado-section');
        const resultDiv = document.getElementById('resultado-calculo');

        if (salario <= 0) {
            resultDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger); text-align: center;">Informe um salário base válido (maior que zero).</p></div>`;
            resultSection.style.display = 'block';
            return;
        }

        const custoTotalMensal = custoDiario * dias;
        const descontoMaximoLegal = salario * 0.06;
        const descontoReal = Math.min(descontoMaximoLegal, custoTotalMensal);
        const custoEmpresa = Math.max(0, custoTotalMensal - descontoReal);

        resultDiv.innerHTML = `
            <div class="sim-card">
                <div class="sim-grid">
                    <div class="sim-item">
                        <span class="sim-label">Custo Total do Transporte no Mês</span>
                        <span class="sim-value">${formatarMoeda(custoTotalMensal)}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Limite Legal de Desconto (6% do salário)</span>
                        <span class="sim-value">${formatarMoeda(descontoMaximoLegal)}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Desconto Efetivo do Colaborador</span>
                        <span class="sim-value">${formatarMoeda(descontoReal)}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Custo Assumido pela Empresa</span>
                        <span class="sim-value">${formatarMoeda(custoEmpresa)}</span>
                    </div>
                </div>
                <div class="total-bar" style="margin-top: 16px;">
                    <span class="highlight-label">${custoTotalMensal <= descontoMaximoLegal ? 'Desconto integral do custo (não atinge o limite de 6%)' : 'Desconto limitado a 6% do salário'}</span>
                    <span class="highlight-value">${formatarMoeda(descontoReal)}</span>
                </div>
            </div>
        `;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
});
