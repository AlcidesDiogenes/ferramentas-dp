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
// 1. HELPERS DE HORAS SEM LIMITE (HH:MM / DECIMAL)
// ==========================================

/**
 * Converte string de horas em decimal de forma flexível e ilimitada.
 * Aceita: "45:30", "120:00", "45.5", "45,5", "45"
 */
function converterHorasParaDecimal(valorTempo) {
    if (!valorTempo) return 0;
    const str = String(valorTempo).trim().replace(',', '.');
    if (!str) return 0;

    if (str.includes(':')) {
        const partes = str.split(':');
        const hh = parseFloat(partes[0]) || 0;
        const mm = parseFloat(partes[1]) || 0;
        return hh + (mm / 60);
    }
    
    return parseFloat(str) || 0;
}

/**
 * Formata em HH:mm (sem limite de 24h) ao perder o foco (blur).
 */
function formatarCampoHora(input) {
    let val = input.value.trim().replace(',', '.');
    if (!val) return;

    if (val.includes(':')) {
        let [hhStr, mmStr] = val.split(':');
        let hh = parseInt(hhStr, 10) || 0;
        let mm = parseInt(mmStr, 10) || 0;
        if (mm >= 60) {
            hh += Math.floor(mm / 60);
            mm = mm % 60;
        }
        input.value = `${hh}:${String(mm).padStart(2, '0')}`;
    } else {
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) {
            const hh = Math.floor(num);
            const mm = Math.round((num - hh) * 60);
            input.value = `${hh}:${String(mm).padStart(2, '0')}`;
        }
    }
}

/**
 * Formata valor decimal de horas de volta para string legível "HH:mm"
 */
function formatarDecimalParaHoras(decimalVal) {
    if (!decimalVal || decimalVal <= 0) return '00:00';
    const hh = Math.floor(decimalVal);
    const mm = Math.round((decimalVal - hh) * 60);
    return `${hh}:${String(mm).padStart(2, '0')}`;
}

// ==========================================
// 2. FUNÇÕES INTERNAS DE CÁLCULO DE IMPOSTO
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
    if (document.getElementById('perc-he-100')) document.getElementById('perc-he-100').value = '100';
    document.getElementById('perc-adicional-noturno').value = '20';
    document.getElementById('dependentes-irrf').value = '0';
    document.getElementById('base-salario-insalubridade').value = SALARIO_MINIMO.toFixed(2);

    // 4. Oculta o container de resultados
    document.getElementById('resultado-container').style.display = 'none';

    // Oculta o botão de PDF e zera o estado
    document.getElementById('btn-gerar-pdf').style.display = 'none';
    dadosAtuaisParaPDF = null;

    // 5. Reativa a lógica de bloqueio de regime
    atualizarRegime();

    if (window.toast) window.toast.info("Formulário resetado com sucesso.");
}

// Listener para o botão de limpar
document.getElementById('btn-limpar').addEventListener('click', limparCampos);

// ==========================================
// 3. CONFIGURAÇÃO DE REGIME TRIBUTÁRIO
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
// 4. LÓGICA PRINCIPAL DO CUSTO (ON DEMAND)
// ==========================================

function calcularTudo() {
    // Parâmetros e Inputs Base
    const regime = document.getElementById('regime-tributario').value;
    const percPatronal = parseFloat(document.getElementById('inss-patronal').value) || 0;
    const percTerceiros = parseFloat(document.getElementById('inss-terceiros').value) || 0;
    const percGilrat = parseFloat(document.getElementById('inss-gilrat').value) || 0;

    const salarioInput = parseFloat(document.getElementById('salario-base').value) || 0;
    
    if (salarioInput <= 0) {
        if (window.toast) window.toast.warning("Por favor, informe o Salário Base do colaborador.");
        document.getElementById('salario-base').focus();
        return;
    }

    const isHorista = document.getElementById('is-horista').value === 'sim';
    const divisor = parseFloat(document.getElementById('divisor-mes').value) || 30;
    const horasMes = parseFloat(document.getElementById('horas-mensais').value) || 220;
    const diasUteis = parseFloat(document.getElementById('dias-uteis').value) || 0;
    const diasNaoUteis = parseFloat(document.getElementById('dias-nao-uteis').value) || 0;
    const percHE = (parseFloat(document.getElementById('perc-he').value) || 0) / 100;
    const percHE100 = (parseFloat(document.getElementById('perc-he-100')?.value) || 100) / 100;
    const percAdicionalNoturno = (parseFloat(document.getElementById('perc-adicional-noturno').value) || 20) / 100;
    const depIRRF = parseInt(document.getElementById('dependentes-irrf').value) || 0;

    const salarioReferencia = isHorista ? (salarioInput * horasMes) : salarioInput;

    // 1. Derivações de Valores (Dia, Hora, Horas Extras, Adicional Noturno)
    const vlrDia = salarioReferencia / divisor;
    const vlrHora = salarioReferencia / horasMes;
    const vlrHoraExtra = vlrHora * (1 + percHE);
    const vlrHoraExtra100 = vlrHora * (1 + percHE100);
    const vlrAdicionalNoturno = vlrHora * percAdicionalNoturno;
    const vlrHoraExtraNoturna = (vlrHora + vlrAdicionalNoturno) * (1 + percHE);
    
    // 2. Insalubridade e Periculosidade
    const baseInsal = parseFloat(document.getElementById('base-salario-insalubridade').value) || 0;
    const insalubridade = baseInsal * (parseFloat(document.getElementById('insalubridade').value) || 0);
    const periculosidade = (document.getElementById('periculosidade').value === 'sim') ? (salarioReferencia * 0.3) : 0;

    // 3. Horas Acumuladas no Mês (Ilimitadas) e Faltas
    const qtdHE = converterHorasParaDecimal(document.getElementById('horas-extras-qtd').value);
    const qtdHE100 = converterHorasParaDecimal(document.getElementById('horas-extras-100-qtd')?.value);
    const qtdHorasNoturnas = converterHorasParaDecimal(document.getElementById('horas-noturnas-qtd').value);
    const qtdHENoturnas = converterHorasParaDecimal(document.getElementById('horas-extras-noturnas-qtd').value);
    const qtdFaltas = converterHorasParaDecimal(document.getElementById('horas-faltas-qtd')?.value);
    
    const totalHE = qtdHE * vlrHoraExtra;
    const totalHE100 = qtdHE100 * vlrHoraExtra100;
    const totalAdicionalNoturno = qtdHorasNoturnas * vlrAdicionalNoturno;
    const totalHENoturna = qtdHENoturnas * vlrHoraExtraNoturna;
    const totalDescontoFaltas = qtdFaltas * vlrHora;
    
    // O Reflexo de DSR soma todas as variáveis positivas trabalhadas
    const baseDSRVerbas = totalHE + totalHE100 + totalAdicionalNoturno + totalHENoturna;

    let dsrVariaveis = 0;
    let dsrPerdidoFaltas = 0;

    if (isHorista) {
        dsrVariaveis = ((salarioReferencia + baseDSRVerbas) / (diasUteis || 1)) * diasNaoUteis;
    } else if (diasUteis > 0) {
        dsrVariaveis = (baseDSRVerbas / diasUteis) * diasNaoUteis; 
        if (qtdFaltas > 0) {
            dsrPerdidoFaltas = (totalDescontoFaltas / diasUteis) * diasNaoUteis;
        }
    }

    // 4. Benefícios Auxiliares & Regra do Vale-Transporte (6% Salário Base)
    const totalVR = (parseFloat(document.getElementById('vr-dia').value) || 0) * diasUteis;
    const totalVA = parseFloat(document.getElementById('va-mes').value) || 0;
    const totalVTBrito = (parseFloat(document.getElementById('vt-unidade').value) || 0) * 2 * diasUteis;
    
    const aplicarDescontoVT = document.getElementById('aplicar-desconto-vt')?.value !== 'nao';
    let descontoVTHolerite = 0;
    
    if (aplicarDescontoVT && totalVTBrito > 0) {
        // O desconto de VT é limitado a 6% do salário base ou o valor real do VT (o menor entre os dois)
        const teto6Percentual = salarioReferencia * 0.06;
        descontoVTHolerite = Math.min(totalVTBrito, teto6Percentual);
    }

    const custoLiquidoVTEmpresa = Math.max(0, totalVTBrito - descontoVTHolerite);
    const outrosBenef = parseFloat(document.getElementById('outros-beneficios').value) || 0;
    
    // Total de benefícios assumidos Efetivamente pela Empresa
    const totalBeneficiosEmpresa = totalVR + totalVA + custoLiquidoVTEmpresa + outrosBenef;
    const totalBeneficiosProporcionados = totalVR + totalVA + totalVTBrito + outrosBenef;

    // 5. Proventos Totais e Holerite
    const outrosProv = parseFloat(document.getElementById('outros-proventos').value) || 0;
    const outrosDesc = parseFloat(document.getElementById('outros-descontos').value) || 0;
    
    // Salário Bruto de Apuração (Base tributável INSS/FGTS/IRRF)
    const salarioBase = Math.max(0, salarioReferencia + baseDSRVerbas + dsrVariaveis + insalubridade + periculosidade + outrosProv - totalDescontoFaltas - dsrPerdidoFaltas);
    
    const inssCalculado = calcularINSSInterno(salarioBase);
    const baseCalculoIRRF = Math.max(0, salarioBase - inssCalculado - (depIRRF * VALOR_DEDUCAO_DEPENDENTE));
    const irrfCalculado = calcularIRRFInterno(salarioBase, inssCalculado, depIRRF);
    
    const totalDescontosHolerite = inssCalculado + irrfCalculado + outrosDesc + descontoVTHolerite;
    const liquido = Math.max(0, salarioBase - totalDescontosHolerite);
    const totalFuncionarioVisao = liquido + totalBeneficiosProporcionados;

    // 6. Bases de Cálculo
    const baseINSS = salarioBase;
    const baseFGTS = salarioBase;
    const baseIRRF = baseCalculoIRRF;

    // 7. Provisões Trabalhistas
    const calcularProvisao = document.getElementById('calcular-provisao')?.value !== 'nao';

    const rawProvFerias = salarioBase / 12;
    const rawProvTerco = rawProvFerias / 3;
    const rawProvDecimo = salarioBase / 12;
    const rawBaseProvisoes = rawProvFerias + rawProvTerco + rawProvDecimo;
    
    const rawProvFGTS = rawBaseProvisoes * 0.08;
    const rawProvFGTS40 = regime === 'domestico' ? 0 : rawProvFGTS * 0.40;
    const rawProvINSSEmpresa = rawBaseProvisoes * ((percPatronal + percTerceiros + percGilrat) / 100);
    const rawTotalProvisoes = rawBaseProvisoes + rawProvFGTS + rawProvFGTS40 + rawProvINSSEmpresa;

    const provFerias = calcularProvisao ? rawProvFerias : 0;
    const provTerco = calcularProvisao ? rawProvTerco : 0;
    const provDecimo = calcularProvisao ? rawProvDecimo : 0;
    const provFGTS = calcularProvisao ? rawProvFGTS : 0;
    const provFGTS40 = calcularProvisao ? rawProvFGTS40 : 0;
    const provINSSEmpresa = calcularProvisao ? rawProvINSSEmpresa : 0;
    const totalProvisoes = calcularProvisao ? rawTotalProvisoes : 0;

    // 8. Encargos do Mês
    const encFGTS = baseFGTS * 0.08;
    const encFGTS40Domestico = regime === 'domestico' ? baseFGTS * 0.032 : 0;
    const encINSSPatronal = baseINSS * (percPatronal / 100);
    const encINSSTerceiros = baseINSS * (percTerceiros / 100);
    const encINSSGilrat = baseINSS * (percGilrat / 100);
    
    const totalEncargos = encFGTS + encFGTS40Domestico + encINSSPatronal + encINSSTerceiros + encINSSGilrat;

    // 9. Custos Totais e Projeção
    const custoProventos = salarioBase;
    const custoBeneficios = totalBeneficiosEmpresa;
    const custoEncargos = totalEncargos;

    const periodo = document.getElementById('periodo-simulacao').value;
    const mult = periodo === 'mensal' ? 1 : (periodo === 'semestral' ? 6 : 12);
    const labelPeriodo = periodo.charAt(0).toUpperCase() + periodo.slice(1);

    const custoMensalEfetivoEmpresa = custoProventos + custoBeneficios + custoEncargos + totalProvisoes;
    
    const projFuncionario = totalFuncionarioVisao * mult;
    const projEncargos = custoEncargos * mult;
    const projProvisao = totalProvisoes * mult;
    const projTotalAbsoluto = custoMensalEfetivoEmpresa * mult;

    // Razão Percentual do Custo Total sobre o Salário Base Contratual
    const percCustoSobreSalario = salarioReferencia > 0 ? ((custoMensalEfetivoEmpresa / salarioReferencia) * 100).toFixed(1) : 0;

    // Percentuais para a Barra de Distribuição de Custo
    const percProvBar = custoMensalEfetivoEmpresa > 0 ? ((custoProventos / custoMensalEfetivoEmpresa) * 100).toFixed(1) : 0;
    const percEncBar = custoMensalEfetivoEmpresa > 0 ? ((custoEncargos / custoMensalEfetivoEmpresa) * 100).toFixed(1) : 0;
    const percBenBar = custoMensalEfetivoEmpresa > 0 ? ((custoBeneficios / custoMensalEfetivoEmpresa) * 100).toFixed(1) : 0;
    const percVisBar = (custoMensalEfetivoEmpresa > 0 && totalProvisoes > 0) ? ((totalProvisoes / custoMensalEfetivoEmpresa) * 100).toFixed(1) : 0;

    // ==========================================
    // MONTAGEM DO DASHBOARD DE RESULTADOS
    // ==========================================
    const apontamentosHtmlItens = [];
    if (qtdHE > 0) {
        apontamentosHtmlItens.push(`<div><strong>H.E. 50% (${formatarDecimalParaHoras(qtdHE)}):</strong> ${formatarMoeda(totalHE)}</div>`);
    }
    if (qtdHE100 > 0) {
        apontamentosHtmlItens.push(`<div><strong>H.E. 100% (${formatarDecimalParaHoras(qtdHE100)}):</strong> ${formatarMoeda(totalHE100)}</div>`);
    }
    if (qtdHorasNoturnas > 0) {
        apontamentosHtmlItens.push(`<div><strong>Noturnas (${formatarDecimalParaHoras(qtdHorasNoturnas)}):</strong> ${formatarMoeda(totalAdicionalNoturno)}</div>`);
    }
    if (qtdHENoturnas > 0) {
        apontamentosHtmlItens.push(`<div><strong>H.E. Not. (${formatarDecimalParaHoras(qtdHENoturnas)}):</strong> ${formatarMoeda(totalHENoturna)}</div>`);
    }
    if (dsrVariaveis > 0) {
        apontamentosHtmlItens.push(`<div><strong>DSR Verbas:</strong> ${formatarMoeda(dsrVariaveis)}</div>`);
    }
    if (qtdFaltas > 0) {
        apontamentosHtmlItens.push(`<div class="text-danger-semantic"><strong>Faltas (${formatarDecimalParaHoras(qtdFaltas)}):</strong> -${formatarMoeda(totalDescontoFaltas)}</div>`);
    }
    if (outrosProv > 0) {
        apontamentosHtmlItens.push(`<div><strong>Outros Proventos:</strong> ${formatarMoeda(outrosProv)}</div>`);
    }
    if (outrosDesc > 0) {
        apontamentosHtmlItens.push(`<div class="text-danger-semantic"><strong>Outros Descontos:</strong> -${formatarMoeda(outrosDesc)}</div>`);
    }

    const temApontamentos = apontamentosHtmlItens.length > 0;

    const htmlResultado = `
        <!-- KPI Card de Impacto / Razão Custo-Salário -->
        <div class="custo-kpi-card">
            <div>
                <span style="font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600;">Multiplicador do Custo Efetivo</span>
                <div style="font-size: 1.5rem; font-weight: 800; color: #38bdf8; margin-top: 2px;">
                    Custo Real: ${percCustoSobreSalario}% do Salário Base
                </div>
            </div>
            <div style="text-align: right; font-size: 0.9rem; color: #cbd5e1;">
                Salário Contratual: <strong>${formatarMoeda(salarioReferencia)}</strong><br>
                Custo Mensal Total: <strong style="color: #34d399;">${formatarMoeda(custoMensalEfetivoEmpresa)}</strong>
            </div>
        </div>

        <!-- Seção 1: Indicadores e Variáveis Apuradas -->
        <div style="display: grid; grid-template-columns: ${temApontamentos ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr'}; gap: 15px; margin-bottom: 20px;">
            <div class="custo-calc-box-subtle">
                <h4 class="custo-box-header-sm">Valores Unitários da Jornada</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; font-size: 0.9rem;">
                    <div><strong>Valor Dia:</strong> ${formatarMoeda(vlrDia)}</div>
                    <div><strong>Valor Hora:</strong> ${formatarMoeda(vlrHora)}</div>
                    <div><strong>H.E. 50%:</strong> ${formatarMoeda(vlrHoraExtra)}/h</div>
                    <div><strong>H.E. 100%:</strong> ${formatarMoeda(vlrHoraExtra100)}/h</div>
                    <div><strong>Ad. Noturno:</strong> ${formatarMoeda(vlrAdicionalNoturno)}/h</div>
                    <div><strong>H.E. Noturna:</strong> ${formatarMoeda(vlrHoraExtraNoturna)}/h</div>
                    ${insalubridade > 0 ? `<div><strong>Insalubridade:</strong> ${formatarMoeda(insalubridade)}</div>` : ''}
                    ${periculosidade > 0 ? `<div><strong>Periculosidade:</strong> ${formatarMoeda(periculosidade)}</div>` : ''}
                </div>
            </div>

            ${temApontamentos ? `
            <div class="custo-calc-box-subtle">
                <h4 class="custo-box-header-sm">
                    Apontamentos Apurados
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem;">
                    ${apontamentosHtmlItens.join('')}
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Seção 2 e 3: Holerite e Bases de Cálculo -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div class="custo-calc-box">
                <h4 class="custo-box-header">Holerite Resumido</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Proventos Totais (Bruto):</span> <strong>${formatarMoeda(salarioBase)}</strong></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;" class="text-danger-semantic"><span>(-) INSS Colaborador:</span> <strong>${formatarMoeda(inssCalculado)}</strong></div>
                ${irrfCalculado > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;" class="text-danger-semantic"><span>(-) IRRF Colaborador:</span> <strong>${formatarMoeda(irrfCalculado)}</strong></div>` : ''}
                ${descontoVTHolerite > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;" class="text-danger-semantic"><span>(-) Desconto VT (6% Cap):</span> <strong>${formatarMoeda(descontoVTHolerite)}</strong></div>` : ''}
                ${outrosDesc > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;" class="text-danger-semantic"><span>(-) Outros Descontos:</span> <strong>${formatarMoeda(outrosDesc)}</strong></div>` : ''}
                <hr class="custo-row-divider">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600;" class="text-success-semantic"><span>Líquido em Conta:</span> <span>${formatarMoeda(liquido)}</span></div>
                ${totalBeneficiosProporcionados > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Benefícios Proporcionados:</span> <strong>${formatarMoeda(totalBeneficiosProporcionados)}</strong></div>` : ''}
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 1.1rem;" class="text-info-semantic"><span>Valor Percebido Colaborador:</span> <strong>${formatarMoeda(totalFuncionarioVisao)}</strong></div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div class="custo-calc-box">
                    <h4 class="custo-box-header-sm">Bases de Cálculo Fiscais</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Base INSS:</span> <strong>${formatarMoeda(baseINSS)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Base FGTS:</span> <strong>${formatarMoeda(baseFGTS)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Base IRRF:</span> <strong>${formatarMoeda(baseIRRF)}</strong></div>
                    ${totalVTBrito > 0 ? `
                        <hr class="custo-row-divider">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Vale Transporte Bruto:</span> <strong>${formatarMoeda(totalVTBrito)}</strong></div>
                        ${descontoVTHolerite > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;" class="text-danger-semantic"><span>(-) Desc. VT Holerite (6%):</span> <strong>${formatarMoeda(descontoVTHolerite)}</strong></div>` : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: 600;"><span>Custo Cota VT Empresa:</span> <strong>${formatarMoeda(custoLiquidoVTEmpresa)}</strong></div>
                    ` : ''}
                </div>

                <div class="custo-calc-box">
                    <h4 class="custo-box-header-sm">Encargos Empresa (Mês)</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>FGTS Mês${regime === 'domestico' ? ' (+3,2%)' : ''}:</span> <strong>${formatarMoeda(encFGTS + encFGTS40Domestico)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>INSS Patronal:</span> <strong>${formatarMoeda(encINSSPatronal)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>INSS Terceiros:</span> <strong>${formatarMoeda(encINSSTerceiros)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>INSS GILRAT:</span> <strong>${formatarMoeda(encINSSGilrat)}</strong></div>
                    <hr class="custo-row-divider">
                    <div style="display: flex; justify-content: space-between; font-weight: 600;"><span>Total Encargos:</span> <span>${formatarMoeda(totalEncargos)}</span></div>
                </div>
            </div>
        </div>

        <!-- Seção 4: Provisões -->
        ${calcularProvisao ? `
        <div class="custo-calc-box" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--cor-borda, #e2e8f0); padding-bottom: 8px; margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 1.02rem; font-weight: 700; color: var(--cor-texto-principal, #0f172a);">Provisões Trabalhistas Mensais (1/12)</h4>
                <span class="badge-tag-azul">🟢 Ativo (Férias + 13º)</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.95rem;">
                <div style="display: flex; justify-content: space-between;"><span>Férias:</span> <strong>${formatarMoeda(provFerias)}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>1/3 Férias:</span> <strong>${formatarMoeda(provTerco)}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>13º Salário:</span> <strong>${formatarMoeda(provDecimo)}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>FGTS s/ Provisões:</span> <strong>${formatarMoeda(provFGTS)}</strong></div>
                ${regime !== 'domestico' ? `<div style="display: flex; justify-content: space-between;"><span>FGTS 40% Multa:</span> <strong>${formatarMoeda(provFGTS40)}</strong></div>` : ''}
                <div style="display: flex; justify-content: space-between;"><span>INSS Patronal Provisões:</span> <strong>${formatarMoeda(provINSSEmpresa)}</strong></div>
            </div>
            <div style="text-align: right; margin-top: 15px; font-weight: 600; color: var(--cor-texto-principal);">Total Provisão Mensal: ${formatarMoeda(totalProvisoes)}</div>
        </div>
        ` : ''}

        <!-- Seção de Composição Visual do Custo -->
        <div class="custo-calc-box-subtle" style="margin-bottom: 20px;">
            <h4 class="custo-box-header-sm">Distribuição Percentual do Custo Mensal</h4>
            <div style="height: 14px; width: 100%; background: var(--cor-borda); border-radius: 7px; overflow: hidden; display: flex; margin-bottom: 10px;">
                <div style="width: ${percProvBar}%; background: #3b82f6;" title="Proventos Brutos: ${percProvBar}%"></div>
                <div style="width: ${percEncBar}%; background: #f97316;" title="Encargos Fiscais: ${percEncBar}%"></div>
                <div style="width: ${percBenBar}%; background: #10b981;" title="Benefícios Efetivos: ${percBenBar}%"></div>
                ${calcularProvisao ? `<div style="width: ${percVisBar}%; background: #a855f7;" title="Provisões Trabalhistas: ${percVisBar}%"></div>` : ''}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.8rem; color: var(--cor-texto-secundario);">
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #3b82f6; border-radius: 2px;"></span> Proventos (${percProvBar}%)</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #f97316; border-radius: 2px;"></span> Encargos Patronais (${percEncBar}%)</span>
                <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #10b981; border-radius: 2px;"></span> Benefícios Efetivos (${percBenBar}%)</span>
                ${calcularProvisao ? `<span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; background: #a855f7; border-radius: 2px;"></span> Provisões (${percVisBar}%)</span>` : ''}
            </div>
        </div>

        <!-- Seção 5: Painel de Projeção Final -->
        <div class="custo-projection-card">
            <h3 style="margin-bottom: 20px; text-align: center; font-size: 1.4rem; padding-bottom: 15px;">
                Custo Total Projetado - Visão ${labelPeriodo}
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
                <div class="custo-projection-inner-box">
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 5px;">Percebido Colaborador (Visão Mês)</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #38bdf8;">${formatarMoeda(projFuncionario)}</div>
                </div>
                <div class="custo-projection-inner-box">
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 5px;">Custo Encargos Patronais</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #fb923c;">${formatarMoeda(projEncargos)}</div>
                </div>
                ${calcularProvisao ? `
                <div class="custo-projection-inner-box">
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 5px;">Custo Provisões Reservadas</div>
                    <div style="font-size: 1.3rem; font-weight: bold; color: #a78bfa;">${formatarMoeda(projProvisao)}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="custo-projection-final-box">
                <div style="font-size: 1rem; color: #94a3b8; margin-bottom: 8px;">Custo Total para a Empresa (${labelPeriodo})</div>
                <div style="font-size: 2.2rem; font-weight: bold; color: #10b981;">
                    ${formatarMoeda(projTotalAbsoluto)}
                </div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 5px;">(Salário Bruto + Benefícios Efetivos + Encargos${calcularProvisao ? ' + Provisões' : ''}) * Multiplicador</div>
            </div>
        </div>
    `;

    const container = document.getElementById('resultado-container');
    container.innerHTML = htmlResultado;
    container.style.display = 'block';

    dadosAtuaisParaPDF = {
        regime, labelPeriodo, mult, calcularProvisao,
        vlrDia, vlrHora, vlrHoraExtra, vlrHoraExtra100, vlrAdicionalNoturno, vlrHoraExtraNoturna,
        insalubridade, periculosidade, totalHE, totalHE100, totalAdicionalNoturno, totalHENoturna, totalDescontoFaltas, dsrVariaveis, outrosProv, outrosDesc, totalVR, totalVA, totalVTBrito, descontoVTHolerite, custoLiquidoVTEmpresa,
        salarioBase, inssCalculado, irrfCalculado, liquido, totalBeneficios: totalBeneficiosEmpresa, totalBeneficiosProporcionados, totalFuncionarioVisao,
        baseINSS, baseFGTS, baseIRRF,
        encFGTS, encFGTS40Domestico, encINSSPatronal, encINSSTerceiros, encINSSGilrat, totalEncargos,
        provFerias, provTerco, provDecimo, provFGTS, provFGTS40, provINSSEmpresa, totalProvisoes,
        projFuncionario, projEncargos, projProvisao, projTotalAbsoluto, percCustoSobreSalario,
        qtdHE, qtdHE100, qtdHorasNoturnas, qtdHENoturnas, qtdFaltas, salarioReferencia
    };

    // Revela o botão de Gerar PDF
    document.getElementById('btn-gerar-pdf').style.display = 'block';

    if (window.toast) window.toast.success("Custo do funcionário calculado com sucesso!");
}

// ==========================================
// 5. INICIALIZAÇÃO E LISTENERS
// ==========================================

document.getElementById('regime-tributario').addEventListener('change', atualizarRegime);
document.getElementById('btn-calcular').addEventListener('click', calcularTudo);

document.getElementById('base-salario-insalubridade').value = SALARIO_MINIMO.toFixed(2);
atualizarRegime();

// Adiciona máscaras para inputs de horas ilimitadas
document.querySelectorAll('.mascara-horas').forEach(input => {
    input.addEventListener('blur', () => formatarCampoHora(input));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            formatarCampoHora(input);
            calcularTudo();
        }
    });
});

document.getElementById('btn-gerar-pdf').addEventListener('click', () => {
    if (dadosAtuaisParaPDF) {
        gerarPDFCustoFuncionario(dadosAtuaisParaPDF);
    } else {
        if (window.toast) window.toast.warning("Realize um cálculo primeiro antes de gerar o PDF.");
    }
});
