// js/simuladores/custo-funcionario.js

import { 
    SALARIO_MINIMO, 
    TABELA_INSS, 
    TABELA_IRRF, 
    TETO_INSS, 
    VALOR_DEDUCAO_DEPENDENTE, 
    DESCONTO_SIMPLIFICADO,
    TABELA_REDUCAO_MENSAL
} from './tabelas.js';

import { gerarPDFCustoFuncionario } from '../pdf-generators/custo-funcionario-pdf.js';

let dadosAtuaisParaPDF = null; // Variável para armazenar o último cálculo

// ==========================================
// 1. FUNÇÕES INTERNAS DE CÁLCULO DE IMPOSTO
// ==========================================

function calcularINSSInterno(baseCalculo) {
    const baseINSS = Math.min(baseCalculo, TETO_INSS);
    let anterior = 0;
    let somaProgressiva = 0;
    
    TABELA_INSS.forEach(f => {
        let baseFaixa = Math.min(baseINSS, f.limite) - anterior;
        if (baseFaixa > 0) somaProgressiva += baseFaixa * f.aliquota;
        anterior = f.limite;
    });
    
    return Math.max(0, somaProgressiva);
}

function calcularImpostoIRRF(base) {
    if (base <= 0) return 0;
    const faixa = TABELA_IRRF.find(f => base <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
    return (base * faixa.aliquota) - faixa.deducao;
}

function calcularIRRFInterno(salarioBase, valorINSS, dependentes) {
    const baseLegal = Math.max(0, salarioBase - valorINSS - (dependentes * VALOR_DEDUCAO_DEPENDENTE));
    const baseSimplificada = Math.max(0, salarioBase - DESCONTO_SIMPLIFICADO);
    const impostoLegal = calcularImpostoIRRF(baseLegal);
    const impostoSimplificado = calcularImpostoIRRF(baseSimplificada);
    const impostoDevidoSemReducao = Math.min(impostoLegal, impostoSimplificado);

    let valorReducao = 0;
    if (salarioBase <= TABELA_REDUCAO_MENSAL.limiteInferior) {
        valorReducao = TABELA_REDUCAO_MENSAL.reducaoFixa; 
    } else if (salarioBase > TABELA_REDUCAO_MENSAL.limiteInferior && salarioBase <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
        valorReducao = TABELA_REDUCAO_MENSAL.formulaVariavel(salarioBase);
    }
    
    let reducaoEfetiva = Math.min(impostoDevidoSemReducao, Math.max(0, valorReducao));
    return Math.max(0, impostoDevidoSemReducao - reducaoEfetiva);
}

// Função para limpar e resetar o simulador
function limparCampos() {
    // 1. Limpa todos os inputs de texto e número
    const inputs = document.querySelectorAll('#secao-custo-funcionario input');
    inputs.forEach(input => input.value = '');

    // 2. Restaura os Selects para a primeira opção
    const selects = document.querySelectorAll('#secao-custo-funcionario select');
    selects.forEach(select => select.selectedIndex = 0);

    // 3. Restaura os Valores Padrões de DP
    document.getElementById('dias-uteis').value = '25';
    document.getElementById('dias-nao-uteis').value = '5';
    document.getElementById('divisor-mes').value = '30';
    document.getElementById('horas-mensais').value = '220';
    document.getElementById('perc-he').value = '50';
    document.getElementById('dependentes-irrf').value = '0';
    document.getElementById('base-salario-insalubridade').value = SALARIO_MINIMO.toFixed(2);

    // 4. Oculta o container de resultados
    document.getElementById('resultado-container').style.display = 'none';

    // Oculta o botão de PDF e zera o estado
    document.getElementById('btn-gerar-pdf').style.display = 'none';
    dadosAtuaisParaPDF = null

    // 5. Reativa a lógica de bloqueio de regime
    atualizarRegime();
}

// Listener para o botão de limpar
document.getElementById('btn-limpar').addEventListener('click', limparCampos);

// ==========================================
// 2. CONFIGURAÇÃO DE REGIME TRIBUTÁRIO
// ==========================================

function atualizarRegime() {
    const regime = document.getElementById('regime-tributario').value;
    const patronal = document.getElementById('inss-patronal');
    const terceiro = document.getElementById('inss-terceiros');
    const gilrat = document.getElementById('inss-gilrat');

    patronal.disabled = false; terceiro.disabled = false; gilrat.disabled = false;
    
    switch(regime) {
        case 'simples':
            [patronal, terceiro, gilrat].forEach(el => { el.value = 0; el.disabled = true; });
            break;
        case 'concomitante':
            patronal.value = 20; gilrat.value = 1; terceiro.value = 0; terceiro.disabled = true;
            break;
        case 'lucro':
            patronal.value = 20; terceiro.value = 5.4; gilrat.value = 1;
            break;
        case 'domestico':
            patronal.value = 8; gilrat.value = 1; terceiro.value = 0; terceiro.disabled = true;
            break;
    }
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================
// 3. LÓGICA PRINCIPAL DO CUSTO (ON DEMAND)
// ==========================================

function calcularTudo() {
    // Parâmetros e Inputs Base
    const regime = document.getElementById('regime-tributario').value;
    const percPatronal = parseFloat(document.getElementById('inss-patronal').value) || 0;
    const percTerceiros = parseFloat(document.getElementById('inss-terceiros').value) || 0;
    const percGilrat = parseFloat(document.getElementById('inss-gilrat').value) || 0;

    const salarioInput = parseFloat(document.getElementById('salario-base').value) || 0;
    const isHorista = document.getElementById('is-horista').value === 'sim';
    const divisor = parseFloat(document.getElementById('divisor-mes').value) || 30;
    const horasMes = parseFloat(document.getElementById('horas-mensais').value) || 220;
    const diasUteis = parseFloat(document.getElementById('dias-uteis').value) || 0;
    const diasNaoUteis = parseFloat(document.getElementById('dias-nao-uteis').value) || 0;
    const percHE = (parseFloat(document.getElementById('perc-he').value) || 0) / 100;
    const depIRRF = parseInt(document.getElementById('dependentes-irrf').value) || 0;

    const salarioReferencia = isHorista ? (salarioInput * horasMes) : salarioInput;

    // 1. Derivações de Valores (Dia, Hora, Hora Extra)
    const vlrDia = salarioReferencia / divisor;
    const vlrHora = salarioReferencia / horasMes;
    const vlrHoraExtra = vlrHora * (1 + percHE);
    
    // 2. Insalubridade e Periculosidade
    const baseInsal = parseFloat(document.getElementById('base-salario-insalubridade').value) || 0;
    const insalubridade = baseInsal * (parseFloat(document.getElementById('insalubridade').value) || 0);
    const periculosidade = (document.getElementById('periculosidade').value === 'sim') ? (salarioReferencia * 0.3) : 0;

    // 3. Horas Extras e DSR
    const tempoHE = document.getElementById('horas-extras-qtd').value || '00:00';
    const [hh, mm] = tempoHE.split(':').map(Number);
    const totalHE = (hh + (mm/60)) * vlrHoraExtra;
    
    let dsrHE = 0;
    if (isHorista) {
        dsrHE = (salarioInput * horasMes / diasUteis) * diasNaoUteis;
    } else if (diasUteis > 0) {
        dsrHE = (totalHE / diasUteis) * diasNaoUteis; 
    }

    // 4. Benefícios Auxiliares
    const totalVR = (parseFloat(document.getElementById('vr-dia').value) || 0) * diasUteis;
    const totalVA = parseFloat(document.getElementById('va-mes').value) || 0;
    const totalVT = (parseFloat(document.getElementById('vt-unidade').value) || 0) * 2 * diasUteis;
    const outrosBenef = parseFloat(document.getElementById('outros-beneficios').value) || 0;
    const totalBeneficios = totalVR + totalVA + totalVT + outrosBenef;

    // 5. Salário Base e Descontos
    const outrosProv = parseFloat(document.getElementById('outros-proventos').value) || 0;
    const outrosDesc = parseFloat(document.getElementById('outros-descontos').value) || 0;
    
    const salarioBase = salarioReferencia + totalHE + dsrHE + insalubridade + periculosidade + outrosProv;
    
    const inssCalculado = calcularINSSInterno(salarioBase);
    const baseCalculoIRRF = Math.max(0, salarioBase - inssCalculado - (depIRRF * VALOR_DEDUCAO_DEPENDENTE));
    const irrfCalculado = calcularIRRFInterno(salarioBase, inssCalculado, depIRRF);
    
    const liquido = salarioBase - inssCalculado - irrfCalculado - outrosDesc;
    const totalFuncionarioVisao = liquido + totalBeneficios;

    // 6. Bases de Cálculo
    const baseINSS = salarioBase;
    const baseFGTS = salarioBase;
    const baseIRRF = baseCalculoIRRF;

    // 7. Provisões
    const provFerias = salarioBase / 12;
    const provTerco = provFerias / 3;
    const provDecimo = salarioBase / 12;
    const baseProvisoes = provFerias + provTerco + provDecimo;
    
    const provFGTS = baseProvisoes * 0.08;
    const provFGTS40 = regime === 'domestico' ? 0 : provFGTS * 0.40;
    const provINSSEmpresa = baseProvisoes * ((percPatronal + percTerceiros + percGilrat) / 100);
    const totalProvisoes = baseProvisoes + provFGTS + provFGTS40 + provINSSEmpresa;

    // 8. Encargos do Mês
    const encFGTS = baseFGTS * 0.08;
    const encFGTS40Domestico = regime === 'domestico' ? baseFGTS * 0.032 : 0;
    const encINSSPatronal = baseINSS * (percPatronal / 100);
    const encINSSTerceiros = baseINSS * (percTerceiros / 100);
    const encINSSGilrat = baseINSS * (percGilrat / 100);
    
    const totalEncargos = encFGTS + encFGTS40Domestico + encINSSPatronal + encINSSTerceiros + encINSSGilrat;

    // 9. Custos Totais e Projeção
    const custoProventos = salarioBase;
    const custoBeneficios = totalBeneficios;
    const custoEncargos = totalEncargos;

    const periodo = document.getElementById('periodo-simulacao').value;
    const mult = periodo === 'mensal' ? 1 : (periodo === 'semestral' ? 6 : 12);
    const labelPeriodo = periodo.charAt(0).toUpperCase() + periodo.slice(1);

    const projFuncionario = totalFuncionarioVisao * mult;
    const projEncargos = custoEncargos * mult;
    const projProvisao = totalProvisoes * mult;
    const projTotalAbsoluto = (custoProventos + custoBeneficios + custoEncargos + totalProvisoes) * mult;

    // ==========================================
    // MONTAGEM DO DASHBOARD DE RESULTADOS
    // ==========================================
    const htmlResultado = `
        <!-- Seção 1: Geração de Informações (Variáveis de Cálculo) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div class="calc-box" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="margin-bottom: 10px; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 1rem;">Indicadores Base</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem;">
                    <div><strong>Valor Dia:</strong> ${formatarMoeda(vlrDia)}</div>
                    <div><strong>Valor Hora:</strong> ${formatarMoeda(vlrHora)}</div>
                    <div><strong>Valor H.E.:</strong> ${formatarMoeda(vlrHoraExtra)}</div>
                    ${insalubridade > 0 ? `<div><strong>Insalubridade:</strong> ${formatarMoeda(insalubridade)}</div>` : ''}
                    ${periculosidade > 0 ? `<div><strong>Periculosidade:</strong> ${formatarMoeda(periculosidade)}</div>` : ''}
                </div>
            </div>

            <div class="calc-box" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="margin-bottom: 10px; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; font-size: 1rem;">Variáveis do Mês</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem;">
                    <div><strong>Total H.E.:</strong> ${formatarMoeda(totalHE)}</div>
                    <div><strong>DSR H.E.:</strong> ${formatarMoeda(dsrHE)}</div>
                    <div><strong>Total VR:</strong> ${formatarMoeda(totalVR)}</div>
                    <div><strong>Total VT:</strong> ${formatarMoeda(totalVT)}</div>
                </div>
            </div>
        </div>

        <!-- Seção 2 e 3: Informações Base do Funcionário e Bases de Cálculo -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div class="calc-box" style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h4 style="margin-bottom: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Holerite Resumido</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Salário Base (Bruto):</span> <strong>${formatarMoeda(salarioBase)}</strong></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #b91c1c;"><span>(-) INSS:</span> <strong>${formatarMoeda(inssCalculado)}</strong></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #b91c1c;"><span>(-) IRRF:</span> <strong>${formatarMoeda(irrfCalculado)}</strong></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #b91c1c;"><span>(-) Outros Descontos:</span> <strong>${formatarMoeda(outrosDesc)}</strong></div>
                <hr style="margin: 10px 0; border: 0; border-top: 1px dashed #cbd5e1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #047857; font-weight: 600;"><span>Líquido a Receber:</span> <span>${formatarMoeda(liquido)}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Benefícios:</span> <strong>${formatarMoeda(totalBeneficios)}</strong></div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 1.1rem; color: #1e3a8a;"><span>Total Funcionário:</span> <strong>${formatarMoeda(totalFuncionarioVisao)}</strong></div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div class="calc-box" style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
                    <h4 style="margin-bottom: 10px; color: #475569; font-size: 0.95rem;">Bases de Cálculo</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Base INSS:</span> <strong>${formatarMoeda(baseINSS)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Base FGTS:</span> <strong>${formatarMoeda(baseFGTS)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Base IRRF:</span> <strong>${formatarMoeda(baseIRRF)}</strong></div>
                </div>

                <div class="calc-box" style="background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1;">
                    <h4 style="margin-bottom: 10px; color: #475569; font-size: 0.95rem;">Encargos Empresa (Mês)</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>FGTS Mês${regime === 'domestico' ? ' (+3,2%)' : ''}:</span> <strong>${formatarMoeda(encFGTS + encFGTS40Domestico)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>INSS Patronal:</span> <strong>${formatarMoeda(encINSSPatronal)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>INSS Terceiros:</span> <strong>${formatarMoeda(encINSSTerceiros)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>INSS GILRAT:</span> <strong>${formatarMoeda(encINSSGilrat)}</strong></div>
                    <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #cbd5e1;">
                    <div style="display: flex; justify-content: space-between; font-weight: 600;"><span>Total Encargos:</span> <span>${formatarMoeda(totalEncargos)}</span></div>
                </div>
            </div>
        </div>

        <!-- Seção 4: Provisões -->
        <div class="calc-box" style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
            <h4 style="margin-bottom: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Provisões Mensais (1/12)</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.95rem;">
                <div style="display: flex; justify-content: space-between;"><span>Férias:</span> <strong>${formatarMoeda(provFerias)}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>1/3 Férias:</span> <strong>${formatarMoeda(provTerco)}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>13º Salário:</span> <strong>${formatarMoeda(provDecimo)}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>FGTS:</span> <strong>${formatarMoeda(provFGTS)}</strong></div>
                ${regime !== 'domestico' ? `<div style="display: flex; justify-content: space-between;"><span>FGTS 40%:</span> <strong>${formatarMoeda(provFGTS40)}</strong></div>` : ''}
                <div style="display: flex; justify-content: space-between;"><span>INSS Empresa:</span> <strong>${formatarMoeda(provINSSEmpresa)}</strong></div>
            </div>
            <div style="text-align: right; margin-top: 15px; font-weight: 600; color: #334155;">Total Provisão Mensal: ${formatarMoeda(totalProvisoes)}</div>
        </div>

        <!-- Seção 5: Painel de Projeção Final -->
        <div class="calc-box" style="background: #1e293b; color: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="margin-bottom: 20px; text-align: center; font-size: 1.4rem; color: #f8fafc; border-bottom: 1px solid #475569; padding-bottom: 15px;">
                Custo Total Projetado - Visão ${labelPeriodo}
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 5px;">Custo Funcionário (Líquido + Benefícios)</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #38bdf8;">${formatarMoeda(projFuncionario)}</div>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 5px;">Custo Encargos</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #fb923c;">${formatarMoeda(projEncargos)}</div>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 5px;">Custo Provisões</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #a78bfa;">${formatarMoeda(projProvisao)}</div>
                </div>
            </div>
            
            <div style="background: #0f172a; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #334155;">
                <div style="font-size: 1rem; color: #94a3b8; margin-bottom: 8px;">Custo Total para a Empresa (${labelPeriodo})</div>
                <div style="font-size: 2.2rem; font-weight: bold; color: #10b981;">
                    ${formatarMoeda(projTotalAbsoluto)}
                </div>
                <div style="font-size: 0.8rem; color: #64748b; margin-top: 5px;">(Salário Base + Benefícios + Encargos + Provisões) * Multiplicador</div>
            </div>
        </div>
    `;

    const container = document.getElementById('resultado-container');
    container.innerHTML = htmlResultado;
    container.style.display = 'block';

    dadosAtuaisParaPDF = {
        regime, labelPeriodo, mult,
        // Indicadores Base e Variáveis
        vlrDia, vlrHora, vlrHoraExtra, insalubridade, periculosidade, totalHE, dsrHE, totalVR, totalVA, totalVT,
        // Holerite
        salarioBase, inssCalculado, irrfCalculado, outrosDesc, liquido, totalBeneficios, totalFuncionarioVisao,
        // Bases
        baseINSS, baseFGTS, baseIRRF,
        // Encargos
        encFGTS, encFGTS40Domestico, encINSSPatronal, encINSSTerceiros, encINSSGilrat, totalEncargos,
        // Provisões
        provFerias, provTerco, provDecimo, provFGTS, provFGTS40, provINSSEmpresa, totalProvisoes,
        // Projeções Totais
        projFuncionario, projEncargos, projProvisao, projTotalAbsoluto
    };

    // Revela o botão de Gerar PDF
    document.getElementById('btn-gerar-pdf').style.display = 'block';
}

// ==========================================
// 4. INICIALIZAÇÃO E LISTENERS
// ==========================================

document.getElementById('regime-tributario').addEventListener('change', atualizarRegime);
document.getElementById('btn-calcular').addEventListener('click', calcularTudo);

document.getElementById('base-salario-insalubridade').value = SALARIO_MINIMO.toFixed(2);
atualizarRegime();

document.getElementById('btn-gerar-pdf').addEventListener('click', () => {
    if (dadosAtuaisParaPDF) {
        gerarPDFCustoFuncionario(dadosAtuaisParaPDF);
    }
});