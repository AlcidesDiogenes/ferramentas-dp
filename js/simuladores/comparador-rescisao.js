// js/simuladores/comparador-rescisao.js

import { 
    TABELA_INSS, 
    TABELA_IRRF, 
    TETO_INSS, 
    VALOR_DEDUCAO_DEPENDENTE 
} from './tabelas.js';

import { gerarPDFComparativo } from '../pdf-generators/comparador-rescisao-pdf.js';

let ultimosDadosComparativos = null;

// ==========================================
// 1. HELPERS E FUNÇÕES DE CÁLCULO DE IMPOSTOS
// ==========================================

function formatarMoeda(valor) {
    const v = Number(valor) || 0;
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcularINSS(baseCalculo) {
    const base = Math.min(Math.max(0, baseCalculo), TETO_INSS);
    let anterior = 0;
    let soma = 0;

    for (const f of TABELA_INSS) {
        const baseFaixa = Math.min(base, f.limite) - anterior;
        if (baseFaixa > 0) {
            soma += baseFaixa * f.aliquota;
        }
        anterior = f.limite;
    }
    return Math.max(0, soma);
}

function calcularIRRF(baseCalculo) {
    if (baseCalculo <= 0) return 0;
    const faixa = TABELA_IRRF.find(f => baseCalculo <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
    const imposto = (baseCalculo * faixa.aliquota) - faixa.deducao;
    return Math.max(0, imposto);
}

function calcularAnosCompletos(dataInicio, dataFim) {
    let anos = dataFim.getFullYear() - dataInicio.getFullYear();
    const m = dataFim.getMonth() - dataInicio.getMonth();
    if (m < 0 || (m === 0 && dataFim.getDate() < dataInicio.getDate())) {
        anos--;
    }
    return Math.max(0, anos);
}

function obterAliquotaINSSPatronal(regime) {
    switch (regime) {
        case 'simples':
        case 'mei':
            return { percPatronal: 0, percTerceiros: 0, percGilrat: 0, total: 0 };
        case 'anexo4':
            return { percPatronal: 20.0, percTerceiros: 0, percGilrat: 2.0, total: 22.0 };
        case 'domestico':
            return { percPatronal: 8.0, percTerceiros: 0, percGilrat: 0.8, total: 8.8 };
        case 'lucro':
        default:
            return { percPatronal: 20.0, percTerceiros: 5.8, percGilrat: 2.0, total: 27.8 };
    }
}

// ==========================================
// 2. MOTOR DE CÁLCULO DE CENÁRIOS MULTICENÁRIOS
// ==========================================

function calcularCenario(codigoCenario, params) {
    const {
        salarioBase,
        regimeTributario,
        adm,
        dem,
        saldoFGTS,
        dependentes,
        qtdFeriasVencidas,
        proventosExtras
    } = params;

    // A. Apuração de Tempo
    const anosServico = calcularAnosCompletos(adm, dem);
    const diasAvisoIntegral = 30 + Math.min(60, anosServico * 3); // Lei 12.506/2011

    // Saldo de Salário
    let diasTrabalhadosMes = 0;
    if (adm.getFullYear() === dem.getFullYear() && adm.getMonth() === dem.getMonth()) {
        diasTrabalhadosMes = Math.max(1, dem.getDate() - adm.getDate() + 1);
    } else {
        diasTrabalhadosMes = dem.getDate();
    }
    const valorSaldoSalario = (salarioBase / 30) * diasTrabalhadosMes;

    // Avos Base
    let avos13Base = 0;
    if (diasTrabalhadosMes >= 15) {
        avos13Base = dem.getMonth() + 1;
    } else {
        avos13Base = dem.getMonth();
    }
    avos13Base = Math.min(12, Math.max(0, avos13Base));

    // Avos Férias Base
    let mesesCompletos = (dem.getFullYear() - adm.getFullYear()) * 12 + (dem.getMonth() - adm.getMonth());
    if (dem.getDate() < adm.getDate()) {
        mesesCompletos--;
    }
    let avosFeriasBase = (mesesCompletos % 12) + 1;
    avosFeriasBase = Math.min(12, Math.max(0, avosFeriasBase));

    // B. Mapeamento de Regras do Cenário
    let titulo = '';
    let tipoAviso = '';
    let diasAviso = 0;
    let valorAvisoPrevio = 0;
    let descontoAviso = 0;
    let avos13 = avos13Base;
    let avosFerias = avosFeriasBase;
    let multaFGTSPerc = 0;
    let permiteSaqueFGTS = false;
    let permiteSeguroDesemprego = false;
    let percentualSaque = 0;

    switch (codigoCenario) {
        case 'sem_justa_causa_indenizado':
            titulo = '1. Demissão s/ Justa Causa (Aviso Indenizado)';
            tipoAviso = 'Indenizado';
            diasAviso = diasAvisoIntegral;
            valorAvisoPrevio = (salarioBase / 30) * diasAvisoIntegral;
            descontoAviso = 0;
            avos13 = Math.min(12, avos13Base + Math.floor(diasAvisoIntegral / 30));
            avosFerias = Math.min(12, avosFeriasBase + Math.floor(diasAvisoIntegral / 30));
            multaFGTSPerc = 40;
            permiteSaqueFGTS = true;
            permiteSeguroDesemprego = true;
            percentualSaque = 100;
            break;

        case 'sem_justa_causa_trabalhado':
            titulo = '2. Demissão s/ Justa Causa (Aviso Trabalhado)';
            tipoAviso = 'Trabalhado';
            diasAviso = diasAvisoIntegral;
            valorAvisoPrevio = 0; // trabalhado já pago no mês
            descontoAviso = 0;
            avos13 = Math.min(12, avos13Base + Math.floor(diasAvisoIntegral / 30));
            avosFerias = Math.min(12, avosFeriasBase + Math.floor(diasAvisoIntegral / 30));
            multaFGTSPerc = 40;
            permiteSaqueFGTS = true;
            permiteSeguroDesemprego = true;
            percentualSaque = 100;
            break;

        case 'pedido_cumprido':
            titulo = '3. Pedido de Demissão (Aviso Cumprido)';
            tipoAviso = 'Trabalhado';
            diasAviso = 30;
            valorAvisoPrevio = 0;
            descontoAviso = 0;
            avos13 = avos13Base;
            avosFerias = avosFeriasBase;
            multaFGTSPerc = 0;
            permiteSaqueFGTS = false;
            permiteSeguroDesemprego = false;
            percentualSaque = 0;
            break;

        case 'pedido_descontado':
            titulo = '4. Pedido de Demissão (Aviso Descontado)';
            tipoAviso = 'Descontado';
            diasAviso = 30;
            valorAvisoPrevio = 0;
            descontoAviso = salarioBase;
            avos13 = avos13Base;
            avosFerias = avosFeriasBase;
            multaFGTSPerc = 0;
            permiteSaqueFGTS = false;
            permiteSeguroDesemprego = false;
            percentualSaque = 0;
            break;

        case 'acordo_partes':
            titulo = '5. Acordo Mútuo (Art. 484-A CLT)';
            tipoAviso = 'Indenizado 50%';
            diasAviso = Math.round(diasAvisoIntegral / 2);
            valorAvisoPrevio = ((salarioBase / 30) * diasAvisoIntegral) / 2;
            descontoAviso = 0;
            avos13 = Math.min(12, avos13Base + Math.floor((diasAvisoIntegral / 2) / 30));
            avosFerias = Math.min(12, avosFeriasBase + Math.floor((diasAvisoIntegral / 2) / 30));
            multaFGTSPerc = 20;
            permiteSaqueFGTS = true;
            permiteSeguroDesemprego = false;
            percentualSaque = 80;
            break;

        case 'com_justa_causa':
            titulo = '6. Demissão c/ Justa Causa (Art. 482 CLT)';
            tipoAviso = 'Dispensado';
            diasAviso = 0;
            valorAvisoPrevio = 0;
            descontoAviso = 0;
            avos13 = 0; // perde 13º proporcional
            avosFerias = 0; // perde férias proporcionais
            multaFGTSPerc = 0;
            permiteSaqueFGTS = false;
            permiteSeguroDesemprego = false;
            percentualSaque = 0;
            break;
    }

    // C. Verbas Rescisórias
    const valor13Prop = (salarioBase / 12) * avos13;
    const valorFeriasProp = (salarioBase / 12) * avosFerias;
    const valorTercoFeriasProp = valorFeriasProp / 3;

    const valorFeriasVencidas = salarioBase * qtdFeriasVencidas;
    const valorTercoFeriasVencidas = valorFeriasVencidas / 3;

    const totalFerias = valorFeriasProp + valorTercoFeriasProp + valorFeriasVencidas + valorTercoFeriasVencidas;

    const totalProventos = valorSaldoSalario + valorAvisoPrevio + valor13Prop + totalFerias + proventosExtras;

    // D. Impostos e Descontos (Mensal vs. 13º)
    const baseINSSMensal = valorSaldoSalario + (codigoCenario === 'sem_justa_causa_indenizado' || codigoCenario === 'acordo_partes' ? valorAvisoPrevio : 0) + proventosExtras;
    const inssMensal = calcularINSS(baseINSSMensal);

    const baseINSS13 = valor13Prop;
    const inss13 = calcularINSS(baseINSS13);

    const deducaoDep = dependentes * VALOR_DEDUCAO_DEPENDENTE;

    const baseIRRFMensal = Math.max(0, baseINSSMensal - inssMensal - deducaoDep);
    const irrfMensal = calcularIRRF(baseIRRFMensal);

    const baseIRRF13 = Math.max(0, baseINSS13 - inss13 - deducaoDep);
    const irrf13 = calcularIRRF(baseIRRF13);

    const totalDescontosOficiais = inssMensal + inss13 + irrfMensal + irrf13;
    const totalDescontos = totalDescontosOficiais + descontoAviso;

    const liquidoReceber = Math.max(0, totalProventos - totalDescontos);

    // E. FGTS e Multa Rescisória
    const baseFGTSRescisao = valorSaldoSalario + valorAvisoPrevio + valor13Prop + proventosExtras;
    const fgtsRescisao = baseFGTSRescisao * 0.08;

    const baseFGTSMulta = saldoFGTS + fgtsRescisao;
    const valorMultaFGTS = baseFGTSMulta * (multaFGTSPerc / 100);

    const valorSaqueFGTS = permiteSaqueFGTS ? (baseFGTSMulta + valorMultaFGTS) * (percentualSaque / 100) : 0;

    // F. Encargos do Empregador (INSS Patronal)
    const aliq = obterAliquotaINSSPatronal(regimeTributario);
    const encINSSPatronal = baseINSSMensal * (aliq.percPatronal / 100);
    const encINSSTerceiros = baseINSSMensal * (aliq.percTerceiros / 100);
    const encINSSGilrat = baseINSSMensal * (aliq.percGilrat / 100);
    const totalINSSPatronalEmpresa = encINSSPatronal + encINSSTerceiros + encINSSGilrat;

    const custoTotalEmpresa = totalProventos + totalINSSPatronalEmpresa + fgtsRescisao + valorMultaFGTS;

    return {
        codigoCenario,
        titulo,
        tipoAviso,
        diasAviso,
        valorSaldoSalario,
        valorAvisoPrevio,
        descontoAviso,
        avos13,
        valor13Prop,
        avosFerias,
        valorFeriasProp,
        valorTercoFeriasProp,
        valorFeriasVencidas,
        valorTercoFeriasVencidas,
        totalFerias,
        proventosExtras,
        totalProventos,
        inssMensal,
        inss13,
        irrfMensal,
        irrf13,
        totalDescontos,
        liquidoReceber,
        baseFGTSRescisao,
        fgtsRescisao,
        saldoFGTS,
        multaFGTSPerc,
        valorMultaFGTS,
        permiteSaqueFGTS,
        percentualSaque,
        valorSaqueFGTS,
        permiteSeguroDesemprego,
        totalINSSPatronalEmpresa,
        custoTotalEmpresa
    };
}

// ==========================================
// 3. RENDERIZAÇÃO DA INTERFACE E TABELAS
// ==========================================

function executarComparacao() {
    const salarioBase = parseFloat(document.getElementById('comp-salario-base').value) || 0;
    const regimeTributario = document.getElementById('comp-regime-tributario').value;
    const dataAdmissaoStr = document.getElementById('comp-data-admissao').value;
    const dataDemissaoStr = document.getElementById('comp-data-demissao').value;
    const saldoFGTS = parseFloat(document.getElementById('comp-saldo-fgts').value) || 0;
    const dependentes = parseInt(document.getElementById('comp-dependentes').value, 10) || 0;
    const qtdFeriasVencidas = parseInt(document.getElementById('comp-ferias-vencidas').value, 10) || 0;
    const proventosExtras = parseFloat(document.getElementById('comp-proventos-extras').value) || 0;

    if (!dataAdmissaoStr || !dataDemissaoStr) {
        alert('Por favor, selecione a Data de Admissão e a Data de Demissão.');
        return;
    }

    const adm = new Date(dataAdmissaoStr + 'T00:00:00');
    const dem = new Date(dataDemissaoStr + 'T00:00:00');

    if (dem < adm) {
        alert('A Data de Demissão não pode ser anterior à Data de Admissão.');
        return;
    }

    // Identificar cenários selecionados
    const cenariosCheckboxes = [
        { code: 'sem_justa_causa_indenizado', id: 'chk-sem-justa-indenizado' },
        { code: 'sem_justa_causa_trabalhado', id: 'chk-sem-justa-trabalhado' },
        { code: 'pedido_cumprido', id: 'chk-pedido-cumprido' },
        { code: 'pedido_descontado', id: 'chk-pedido-descontado' },
        { code: 'acordo_partes', id: 'chk-acordo-partes' },
        { code: 'com_justa_causa', id: 'chk-com-justa-causa' }
    ];

    const cenariosParaCalcular = cenariosCheckboxes
        .filter(item => document.getElementById(item.id)?.checked)
        .map(item => item.code);

    if (cenariosParaCalcular.length === 0) {
        alert('Selecione ao menos 1 cenário de demissão para comparar.');
        return;
    }

    const params = {
        salarioBase,
        regimeTributario,
        adm,
        dem,
        saldoFGTS,
        dependentes,
        qtdFeriasVencidas,
        proventosExtras
    };

    const resultadosCenarios = cenariosParaCalcular.map(code => calcularCenario(code, params));

    const regimeLabels = {
        'simples': 'Simples Nacional (com isenção CPP)',
        'lucro': 'Lucro Presumido / Real',
        'anexo4': 'Simples Nacional - Anexo IV',
        'mei': 'MEI / Simples Isento',
        'domestico': 'Doméstico'
    };

    let diasTrabalhadosMes = 0;
    if (adm.getFullYear() === dem.getFullYear() && adm.getMonth() === dem.getMonth()) {
        diasTrabalhadosMes = Math.max(1, dem.getDate() - adm.getDate() + 1);
    } else {
        diasTrabalhadosMes = dem.getDate();
    }

    ultimosDadosComparativos = {
        salarioBase,
        regimeTributario,
        regimeLabel: regimeLabels[regimeTributario] || regimeTributario,
        dataAdmissaoFormatada: adm.toLocaleDateString('pt-BR'),
        dataDemissaoFormatada: dem.toLocaleDateString('pt-BR'),
        saldoFGTS,
        dependentes,
        diasTrabalhadosMes,
        totalProventosExtras: proventosExtras,
        cenarios: resultadosCenarios
    };

    // Atualizar UI
    renderizarCardsDestaque(resultadosCenarios);
    renderizarTabelaMatriz(resultadosCenarios);
    renderizarGraficoBarras(resultadosCenarios);

    // Habilitar botões
    document.getElementById('btn-exportar-pdf-comp').disabled = false;
    document.getElementById('btn-copiar-resumo-texto').disabled = false;

    // Rolar suavemente até os resultados (útil em celulares)
    setTimeout(() => {
        const elDestaque = document.getElementById('secao-cards-destaque');
        if (elDestaque) {
            elDestaque.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

function renderizarCardsDestaque(cenarios) {
    const elContainer = document.getElementById('secao-cards-destaque');
    if (!elContainer) return;

    elContainer.style.display = 'block';

    // Maior Líquido
    const maiorLiquido = [...cenarios].sort((a, b) => b.liquidoReceber - a.liquidoReceber)[0];
    document.getElementById('card-maior-liquido-valor').textContent = formatarMoeda(maiorLiquido.liquidoReceber);
    document.getElementById('card-maior-liquido-nome').textContent = maiorLiquido.titulo;

    // Menor Custo Empresa
    const menorCusto = [...cenarios].sort((a, b) => a.custoTotalEmpresa - b.custoTotalEmpresa)[0];
    document.getElementById('card-menor-custo-valor').textContent = formatarMoeda(menorCusto.custoTotalEmpresa);
    document.getElementById('card-menor-custo-nome').textContent = menorCusto.titulo;

    // Acordo Mútuo
    const acordo = cenarios.find(c => c.codigoCenario === 'acordo_partes');
    if (acordo) {
        document.getElementById('card-acordo-partes-valor').textContent = formatarMoeda(acordo.liquidoReceber);
    } else {
        document.getElementById('card-acordo-partes-valor').textContent = 'N/A';
    }

    // Maior Saque FGTS
    const maiorSaque = [...cenarios].sort((a, b) => b.valorSaqueFGTS - a.valorSaqueFGTS)[0];
    document.getElementById('card-maior-saque-fgts').textContent = formatarMoeda(maiorSaque.valorSaqueFGTS);
    document.getElementById('card-maior-saque-nome').textContent = maiorSaque.titulo;
}

function renderizarTabelaMatriz(cenarios) {
    const elSecao = document.getElementById('secao-tabela-comparativa');
    const elHeader = document.getElementById('header-matriz-comparativa');
    const elBody = document.getElementById('body-matriz-comparativa');

    if (!elSecao || !elHeader || !elBody) return;

    elSecao.style.display = 'block';

    // Header
    let headerHTML = `<th style="width: 200px; text-align: left; background: #1e293b; color: white;">Métrica / Indicador</th>`;
    cenarios.forEach(c => {
        headerHTML += `<th style="text-align: right; background: #1e293b; color: white; padding: 10px;">${c.titulo}</th>`;
    });
    elHeader.innerHTML = headerHTML;

    // Rows
    const criarLinha = (label, propriedade, options = {}) => {
        const { bold = false, isCurrency = true, color = '', isHeaderRow = false, bg = '' } = options;
        let rowStyle = bg ? `background: ${bg};` : '';
        let html = `<tr style="${rowStyle}">`;
        
        let labelStyle = bold ? 'font-weight: 700;' : '';
        if (isHeaderRow) labelStyle += 'font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.5px;';

        html += `<td style="text-align: left; padding: 8px 12px; ${labelStyle}">${label}</td>`;

        cenarios.forEach(c => {
            let val = c[propriedade];
            let display = isCurrency ? formatarMoeda(val) : val;

            let cellStyle = bold ? 'font-weight: 700;' : '';
            if (color) cellStyle += `color: ${color};`;

            html += `<td style="text-align: right; padding: 8px 12px; ${cellStyle}">${display}</td>`;
        });

        html += `</tr>`;
        return html;
    };

    let bodyHTML = '';

    // Proventos
    bodyHTML += criarLinha('Saldo de Salário', 'valorSaldoSalario');
    bodyHTML += `<tr style="background: #f8fafc;"><td style="text-align: left; padding: 8px 12px;">Aviso Prévio (Provento/Desc.)</td>`;
    cenarios.forEach(c => {
        const val = c.valorAvisoPrevio - c.descontoAviso;
        const color = val < 0 ? '#b91c1c' : (val > 0 ? '#047857' : '#475569');
        bodyHTML += `<td style="text-align: right; padding: 8px 12px; font-weight: 600; color: ${color};">${formatarMoeda(val)} (${c.tipoAviso})</td>`;
    });
    bodyHTML += `</tr>`;

    bodyHTML += criarLinha('13º Salário Rescisório', 'valor13Prop');
    bodyHTML += criarLinha('Férias Totais (+ 1/3)', 'totalFerias');
    bodyHTML += criarLinha('Total Proventos Brutos', 'totalProventos', { bold: true, bg: '#f1f5f9', color: '#047857' });

    // Descontos & Líquido
    bodyHTML += criarLinha('Total Descontos (INSS/IRRF/Outros)', 'totalDescontos', { color: '#b91c1c' });
    bodyHTML += criarLinha('LÍQUIDO A RECEBER (TRABALHADOR)', 'liquidoReceber', { bold: true, bg: '#1e3a8a', color: '#ffffff', isHeaderRow: true });

    // FGTS & Encargos Empresa
    bodyHTML += criarLinha('Multa Rescisória do FGTS', 'valorMultaFGTS', { bold: true, color: '#0284c7' });
    bodyHTML += criarLinha('FGTS Mês / Aviso Indenizado', 'fgtsRescisao');
    bodyHTML += criarLinha('Est. Saque FGTS Liberado', 'valorSaqueFGTS', { bold: true, color: '#047857', bg: '#f0fdf4' });
    bodyHTML += criarLinha('Encargos INSS Patronal Empresa', 'totalINSSPatronalEmpresa');
    bodyHTML += criarLinha('CUSTO TOTAL DA EMPRESA', 'custoTotalEmpresa', { bold: true, bg: '#0f172a', color: '#10b981', isHeaderRow: true });

    // Direitos Legais
    bodyHTML += `<tr style="background: #f8fafc;"><td style="text-align: left; padding: 8px 12px; font-weight: 600;">Direito a Seguro-Desemprego</td>`;
    cenarios.forEach(c => {
        const txt = c.permiteSeguroDesemprego ? '<svg class="lucide lucide-check-circle-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" /> </svg> SIM' : '<svg class="lucide lucide-x-circle" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m15 9-6 6" /> <path d="m9 9 6 6" /> </svg> NÃO';
        const clr = c.permiteSeguroDesemprego ? '#047857' : '#b91c1c';
        bodyHTML += `<td style="text-align: right; padding: 8px 12px; font-weight: 700; color: ${clr};">${txt}</td>`;
    });
    bodyHTML += `</tr>`;

    elBody.innerHTML = bodyHTML;
}

function renderizarGraficoBarras(cenarios) {
    const elSecao = document.getElementById('secao-grafico-comparativo');
    const elContainer = document.getElementById('container-barras-grafico');

    if (!elSecao || !elContainer) return;

    elSecao.style.display = 'block';

    const maxCusto = Math.max(...cenarios.map(c => c.custoTotalEmpresa)) || 1;

    let html = '';

    cenarios.forEach(c => {
        const pctCusto = Math.round((c.custoTotalEmpresa / maxCusto) * 100);
        const pctLiquido = Math.round((c.liquidoReceber / maxCusto) * 100);

        html += `
            <div style="background: var(--cor-card-bg); padding: 14px; border-radius: 10px; border: 1px solid var(--cor-borda);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="font-size: 0.95rem; color: var(--cor-texto-principal);">${c.titulo}</strong>
                    <span style="font-size: 0.85rem; font-weight: 700; color: #1e3a8a;">Líquido: ${formatarMoeda(c.liquidoReceber)} | Custo Empresa: ${formatarMoeda(c.custoTotalEmpresa)}</span>
                </div>
                
                <!-- Barra Custo Empresa -->
                <div style="margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-bottom: 2px;">
                        <span>Custo Total Empregador</span>
                        <span>${pctCusto}%</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                        <div style="width: ${pctCusto}%; height: 100%; background: #0f172a; transition: width 0.5s ease;"></div>
                    </div>
                </div>

                <!-- Barra Líquido Trabalhador -->
                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-bottom: 2px;">
                        <span>Líquido a Receber pelo Trabalhador</span>
                        <span>${pctLiquido}%</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                        <div style="width: ${pctLiquido}%; height: 100%; background: #2563eb; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            </div>
        `;
    });

    elContainer.innerHTML = html;
}

// ==========================================
// 4. EXPORTAÇÃO E INTEGRAÇÃO DE URLs DE ENTRADA
// ==========================================

function copiarResumoTexto() {
    if (!ultimosDadosComparativos) return;

    let txt = `📊 *RESUMO COMPARATIVO DE CENÁRIOS DE DEMISSÃO*\n`;
    txt += `📅 Admissão: ${ultimosDadosComparativos.dataAdmissaoFormatada} | Demissão: ${ultimosDadosComparativos.dataDemissaoFormatada}\n`;
    txt += `💼 Salário Base: ${formatarMoeda(ultimosDadosComparativos.salarioBase)} | Saldo FGTS: ${formatarMoeda(ultimosDadosComparativos.saldoFGTS)}\n\n`;

    ultimosDadosComparativos.cenarios.forEach((c, idx) => {
        txt += `${idx + 1}. *${c.titulo}*\n`;
        txt += `   • Líquido Trabalhador: ${formatarMoeda(c.liquidoReceber)}\n`;
        txt += `   • Multa FGTS (${c.multaFGTSPerc}%): ${formatarMoeda(c.valorMultaFGTS)}\n`;
        txt += `   • Est. Saque FGTS: ${formatarMoeda(c.valorSaqueFGTS)}\n`;
        txt += `   • Custo Total Empregador: ${formatarMoeda(c.custoTotalEmpresa)}\n`;
        txt += `   • Seguro-Desemprego: ${c.permiteSeguroDesemprego ? 'SIM' : 'NÃO'}\n\n`;
    });

    navigator.clipboard.writeText(txt).then(() => {
        const toast = document.getElementById('toast-notificacao');
        if (toast) {
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 3000);
        }
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
        alert('Não foi possível copiar o texto automaticamente.');
    });
}

function carregarParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('salarioBase')) {
        // Preencher datas padrão de hoje se vazio
        const hoje = new Date();
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(hoje.getFullYear() - 1);

        document.getElementById('comp-data-admissao').value = umAnoAtras.toISOString().split('T')[0];
        document.getElementById('comp-data-demissao').value = hoje.toISOString().split('T')[0];
        return;
    }

    if (params.has('salarioBase')) document.getElementById('comp-salario-base').value = params.get('salarioBase');
    if (params.has('regime')) document.getElementById('comp-regime-tributario').value = params.get('regime');
    if (params.has('admissao')) document.getElementById('comp-data-admissao').value = params.get('admissao');
    if (params.has('demissao')) document.getElementById('comp-data-demissao').value = params.get('demissao');
    if (params.has('saldoFGTS')) document.getElementById('comp-saldo-fgts').value = params.get('saldoFGTS');
    if (params.has('dependentes')) document.getElementById('comp-dependentes').value = params.get('dependentes');

    // Executar automatizado ao carregar vindo da URL
    setTimeout(() => {
        executarComparacao();
    }, 200);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarParametrosURL();

    const btnCalcular = document.getElementById('btn-calcular-comparador');
    if (btnCalcular) btnCalcular.addEventListener('click', executarComparacao);

    const btnPDF = document.getElementById('btn-exportar-pdf-comp');
    if (btnPDF) btnPDF.addEventListener('click', () => {
        if (ultimosDadosComparativos) gerarPDFComparativo(ultimosDadosComparativos);
    });

    const btnCopiar = document.getElementById('btn-copiar-resumo-texto');
    if (btnCopiar) btnCopiar.addEventListener('click', copiarResumoTexto);
});
