// js/simuladores/rescisao.js

import { 
    TABELA_INSS, 
    TABELA_IRRF, 
    TETO_INSS, 
    VALOR_DEDUCAO_DEPENDENTE 
} from './tabelas.js';

import { gerarPDFRescisao } from '../pdf-generators/rescisao-pdf.js';

let dadosAtuaisParaPDF = null;

// ==========================================
// 1. HELPERS E MÁSCARAS
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

/**
 * Calcula anos completos entre duas datas
 */
function calcularAnosCompletos(dataInicio, dataFim) {
    let anos = dataFim.getFullYear() - dataInicio.getFullYear();
    const m = dataFim.getMonth() - dataInicio.getMonth();
    if (m < 0 || (m === 0 && dataFim.getDate() < dataInicio.getDate())) {
        anos--;
    }
    return Math.max(0, anos);
}

// ==========================================
// 2. GERENCIAMENTO DE LINHAS DINÂMICAS
// ==========================================

function adicionarLinhaProvento(descricao = '', valor = '', incideINSS = true, incideFGTS = true, incideIRRF = true, calculaDSR = false) {
    const container = document.getElementById('container-proventos');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'dinamico-row row-provento';
    row.innerHTML = `
        <input type="text" class="custo-form-control field-desc provento-desc" placeholder="Ex: Horas Extras 50%" value="${descricao}">
        <input type="number" step="0.01" class="custo-form-control field-valor provento-valor" placeholder="R$ 0,00" value="${valor}">
        <div class="dinamico-options">
            <label title="Incide na base de INSS"><input type="checkbox" class="provento-inss" ${incideINSS ? 'checked' : ''}> INSS</label>
            <label title="Incide na base de FGTS"><input type="checkbox" class="provento-fgts" ${incideFGTS ? 'checked' : ''}> FGTS</label>
            <label title="Incide na base de IRRF"><input type="checkbox" class="provento-irrf" ${incideIRRF ? 'checked' : ''}> IRRF</label>
            <label title="Calcula reflexo de DSR"><input type="checkbox" class="provento-dsr" ${calculaDSR ? 'checked' : ''}> Calc. DSR</label>
        </div>
        <button type="button" class="btn-remover-linha" title="Excluir este provento">
<svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> </svg> ️ Excluir</button>
    `;

    row.querySelector('.btn-remover-linha').addEventListener('click', () => row.remove());
    container.appendChild(row);
}

function adicionarLinhaDesconto(descricao = '', valor = '', abateBase = false) {
    const container = document.getElementById('container-descontos');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'dinamico-row row-desconto';
    row.innerHTML = `
        <input type="text" class="custo-form-control field-desc desconto-desc" placeholder="Ex: Adiantamento Salarial" value="${descricao}">
        <input type="number" step="0.01" class="custo-form-control field-valor desconto-valor" placeholder="R$ 0,00" value="${valor}">
        <div class="dinamico-options">
            <label title="Abate da base de cálculo de INSS e IRRF (ex: Faltas/Atrasos)"><input type="checkbox" class="desconto-abate" ${abateBase ? 'checked' : ''}> Abater Bases (Falta/Atraso)</label>
        </div>
        <button type="button" class="btn-remover-linha" title="Excluir este desconto">
<svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> </svg> ️ Excluir</button>
    `;

    row.querySelector('.btn-remover-linha').addEventListener('click', () => row.remove());
    container.appendChild(row);
}

function adicionarLinhaBeneficio(descricao = '', valor = '', natureza = 'empresa') {
    const container = document.getElementById('container-beneficios');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'dinamico-row row-beneficio';
    row.innerHTML = `
        <input type="text" class="custo-form-control field-desc beneficio-desc" placeholder="Ex: Vale Transporte (Saldo/Custeio)" value="${descricao}">
        <input type="number" step="0.01" class="custo-form-control field-valor beneficio-valor" placeholder="R$ 0,00" value="${valor}">
        <select class="custo-form-control field-select beneficio-natureza">
            <option value="empresa" ${natureza === 'empresa' ? 'selected' : ''}>Custo Empregador</option>
            <option value="desconto" ${natureza === 'desconto' ? 'selected' : ''}>Desconto Colaborador</option>
            <option value="rescisao" ${natureza === 'rescisao' ? 'selected' : ''}>Pago na Rescisão</option>
        </select>
        <button type="button" class="btn-remover-linha" title="Excluir este benefício">
<svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> </svg> ️ Excluir</button>
    `;

    row.querySelector('.btn-remover-linha').addEventListener('click', () => row.remove());
    container.appendChild(row);
}

// ==========================================
// 3. APURAÇÃO AUTOMÁTICA DE AVOS E AVISO
// ==========================================

function apurarAvosEDiasAutomaticos() {
    const elAdmissao = document.getElementById('data-admissao');
    const elDemissao = document.getElementById('data-demissao');
    const elTipoRescisao = document.getElementById('tipo-rescisao');
    const elTipoAviso = document.getElementById('tipo-aviso');

    const elAvos13 = document.getElementById('avos-13');
    const elAvosFerias = document.getElementById('avos-ferias');
    const elDiasAviso = document.getElementById('dias-aviso');
    const elDiasSaldo = document.getElementById('dias-saldo');
    const elInfo = document.getElementById('info-apuracao-datas');

    const manual13 = document.getElementById('manual-avos-13')?.checked;
    const manualFerias = document.getElementById('manual-avos-ferias')?.checked;
    const manualAviso = document.getElementById('manual-dias-aviso')?.checked;
    const manualSaldo = document.getElementById('manual-dias-saldo')?.checked;

    const tipoRescisao = elTipoRescisao.value;

    // Trata visibilidade do grupo de antecipação de experiência
    const grupoExp = document.getElementById('grupo-exp-dias');
    if (['antecipacao_exp_funcionario', 'antecipacao_exp_empregador'].includes(tipoRescisao)) {
        grupoExp.style.display = 'flex';
    } else {
        grupoExp.style.display = 'none';
    }

    // Trata opções de aviso prévio conforme modalidade
    const grupoAviso = document.getElementById('grupo-aviso-previo');
    const grupoDiasAviso = document.getElementById('grupo-dias-aviso');

    if (['demissao_sem_justa_causa', 'acordo_partes'].includes(tipoRescisao)) {
        grupoAviso.style.display = 'flex';
        grupoDiasAviso.style.display = 'flex';
        if (elTipoAviso.value === 'descontado') elTipoAviso.value = 'indenizado';
    } else if (tipoRescisao === 'pedido_demissao') {
        grupoAviso.style.display = 'flex';
        grupoDiasAviso.style.display = 'flex';
        if (elTipoAviso.value === 'indenizado') elTipoAviso.value = 'trabalhado';
    } else {
        grupoAviso.style.display = 'none';
        grupoDiasAviso.style.display = 'none';
    }

    if (!elAdmissao.value || !elDemissao.value) {
        if (elInfo) elInfo.innerHTML = '<svg class="lucide lucide-lightbulb" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /> <path d="M9 18h6" /> <path d="M10 22h4" /> </svg> Informe <strong>Data de Admissão</strong> e <strong>Data de Demissão</strong> para o cálculo automático.';
        return;
    }

    const adm = new Date(elAdmissao.value + 'T00:00:00');
    const dem = new Date(elDemissao.value + 'T00:00:00');

    if (isNaN(adm.getTime()) || isNaN(dem.getTime()) || dem < adm) {
        if (elInfo) elInfo.innerHTML = '<svg class="lucide lucide-alert-triangle" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" /> </svg> <span style="color: #b91c1c;">Data de demissão deve ser igual ou posterior à data de admissão.</span>';
        return;
    }

    // 0. Cálculo dos Dias de Saldo de Salário (Proporcional à Admissão no Mês)
    let diasSaldoCalc = 0;
    if (adm.getFullYear() === dem.getFullYear() && adm.getMonth() === dem.getMonth()) {
        // Admitido e demitido no mesmo mês e ano (ex: 10/08/2026 até 31/08/2026 => 31 - 10 + 1 = 22 dias)
        diasSaldoCalc = Math.max(1, dem.getDate() - adm.getDate() + 1);
    } else {
        // Admitido em mês/ano anterior
        diasSaldoCalc = dem.getDate();
    }

    if (elDiasSaldo && !manualSaldo) {
        elDiasSaldo.value = diasSaldoCalc;
    }

    // 1. Cálculo de Dias de Aviso Prévio (Lei 12.506/2011)
    let diasAvisoCalc = 30;
    if (['demissao_sem_justa_causa', 'acordo_partes'].includes(tipoRescisao)) {
        const anos = calcularAnosCompletos(adm, dem);
        diasAvisoCalc = Math.min(90, 30 + (anos * 3));
    } else if (tipoRescisao === 'pedido_demissao') {
        diasAvisoCalc = 30;
    } else {
        diasAvisoCalc = 0;
    }

    if (!manualAviso) {
        elDiasAviso.value = diasAvisoCalc;
    }

    // Projeção do aviso indenizado para avos
    const diasAvisoEfetivos = Number(elDiasAviso.value) || diasAvisoCalc;
    let projecaoDem = new Date(dem);
    if (elTipoAviso.value === 'indenizado' && diasAvisoEfetivos > 0 && ['demissao_sem_justa_causa', 'acordo_partes'].includes(tipoRescisao)) {
        let diasProj = diasAvisoEfetivos;
        if (tipoRescisao === 'acordo_partes') diasProj = Math.round(diasAvisoEfetivos / 2);
        projecaoDem.setDate(projecaoDem.getDate() + diasProj);
    }

    // 2. Apuração dos Avos de 13º Salário
    let avos13Calc = 0;
    if (tipoRescisao !== 'demissao_com_justa_causa') {
        const anoDem = projecaoDem.getFullYear();
        const inicioAno = new Date(anoDem, 0, 1);
        const dataInicio13 = adm > inicioAno ? adm : inicioAno;

        let mInicio = dataInicio13.getMonth();
        let mFim = projecaoDem.getMonth();
        if (dataInicio13.getFullYear() === projecaoDem.getFullYear()) {
            let diasPrimeiroMes = 30 - dataInicio13.getDate() + 1;
            if (dataInicio13.getDate() === 1) diasPrimeiroMes = 30;
            if (diasPrimeiroMes >= 15) avos13Calc++;

            for (let m = mInicio + 1; m < mFim; m++) {
                avos13Calc++;
            }

            if (mFim > mInicio) {
                if (projecaoDem.getDate() >= 15) {
                    avos13Calc++;
                }
            }
        } else {
            avos13Calc = projecaoDem.getMonth() + (projecaoDem.getDate() >= 15 ? 1 : 0);
        }
        avos13Calc = Math.min(12, Math.max(0, avos13Calc));
    }

    if (!manual13) {
        elAvos13.value = avos13Calc;
    }

    // 3. Apuração dos Avos de Férias Proporcionais
    let avosFeriasCalc = 0;
    if (tipoRescisao !== 'demissao_com_justa_causa') {
        let ultimoAniversario = new Date(projecaoDem.getFullYear(), adm.getMonth(), adm.getDate());
        if (ultimoAniversario > projecaoDem) {
            ultimoAniversario = new Date(projecaoDem.getFullYear() - 1, adm.getMonth(), adm.getDate());
        }

        let diffMeses = (projecaoDem.getFullYear() - ultimoAniversario.getFullYear()) * 12 + (projecaoDem.getMonth() - ultimoAniversario.getMonth());
        
        let diaInic = ultimoAniversario.getDate();
        let diaFim = projecaoDem.getDate();

        if (diaFim < diaInic) {
            diffMeses--;
            const ultimoDiaMesAnterior = new Date(projecaoDem.getFullYear(), projecaoDem.getMonth(), 0).getDate();
            const diasRestantesFracao = (ultimoDiaMesAnterior - diaInic + 1) + diaFim;
            if (diasRestantesFracao >= 15) {
                diffMeses++;
            }
        } else if (diaFim - diaInic >= 15) {
            diffMeses++;
        }

        avosFeriasCalc = Math.min(12, Math.max(0, diffMeses));
    }

    if (!manualFerias) {
        elAvosFerias.value = avosFeriasCalc;
    }

    if (elInfo) {
        const df = (d) => d.toLocaleDateString('pt-BR');
        const saldoExibido = elDiasSaldo ? elDiasSaldo.value : diasSaldoCalc;
        elInfo.innerHTML = `
<svg class="lucide lucide-check-circle-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" /> </svg> <strong>Período apurado:</strong> ${df(adm)} até ${df(dem)} ${projecaoDem > dem ? `(Projeção Aviso: ${df(projecaoDem)})` : ''}<br>` +
            `
<svg class="lucide lucide-arrow-right" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 12h14" /> <path d="m12 5 7 7-7 7" /> </svg> <strong>Saldo:</strong> ${saldoExibido}d | <strong>Aviso:</strong> ${diasAvisoEfetivos}d | <strong>Avos 13º:</strong> ${elAvos13.value}/12 | <strong>Avos Férias:</strong> ${elAvosFerias.value}/12`;
    }
}

// ==========================================
// 4. ATUALIZAÇÃO AUTOMÁTICA DOS PARÂMETROS FISCAIS
// ==========================================

function atualizarAliquotasPatronais() {
    const regime = document.getElementById('regime-tributario').value;
    const inssPatronal = document.getElementById('inss-patronal');
    const inssTerceiros = document.getElementById('inss-terceiros');
    const inssGilrat = document.getElementById('inss-gilrat');

    if (regime === 'simples' || regime === 'mei') {
        inssPatronal.value = 0;
        inssTerceiros.value = 0;
        inssGilrat.value = 0;
    } else if (regime === 'anexo4') {
        inssPatronal.value = 20.0;
        inssTerceiros.value = 0;
        inssGilrat.value = 2.0;
    } else if (regime === 'domestico') {
        inssPatronal.value = 8.0;
        inssTerceiros.value = 0;
        inssGilrat.value = 0.8;
    } else { // Lucro Presumido / Real
        inssPatronal.value = 20.0;
        inssTerceiros.value = 5.8;
        inssGilrat.value = 2.0;
    }
}

// ==========================================
// 5. PROCESSAMENTO PRINCIPAL DE CÁLCULO
// ==========================================

function processarCalculoRescisao() {
    const regime = document.getElementById('regime-tributario').value;
    const percPatronal = parseFloat(document.getElementById('inss-patronal').value) || 0;
    const percTerceiros = parseFloat(document.getElementById('inss-terceiros').value) || 0;
    const percGilrat = parseFloat(document.getElementById('inss-gilrat').value) || 0;

    const salarioBase = parseFloat(document.getElementById('salario-base').value) || 0;
    if (salarioBase <= 0) {
        alert('Informe um salário base válido (maior que zero) antes de calcular.');
        return;
    }
    const dataAdmissaoStr = document.getElementById('data-admissao').value;
    const dataDemissaoStr = document.getElementById('data-demissao').value;
    const dependentes = parseInt(document.getElementById('dependentes-irrf').value, 10) || 0;
    const saldoFGTS = parseFloat(document.getElementById('saldo-fgts').value) || 0;
    const qtdFeriasVencidas = parseInt(document.getElementById('qtd-ferias-vencidas').value, 10) || 0;

    const diasUteis = parseInt(document.getElementById('dias-uteis').value, 10) || 25;
    const diasNaoUteis = parseInt(document.getElementById('dias-nao-uteis').value, 10) || 5;

    const tipoRescisao = document.getElementById('tipo-rescisao').value;
    const tipoAviso = document.getElementById('tipo-aviso').value;
    const diasAviso = parseInt(document.getElementById('dias-aviso').value, 10) || 0;
    const avos13 = parseInt(document.getElementById('avos-13').value, 10) || 0;
    const avosFerias = parseInt(document.getElementById('avos-ferias').value, 10) || 0;
    const diasRestantesExp = parseInt(document.getElementById('dias-restantes-exp').value, 10) || 0;

    if (salarioBase <= 0) {
        alert('Por favor, informe um valor de Salário Base válido maior que zero.');
        document.getElementById('salario-base').focus();
        return;
    }

    if (!dataAdmissaoStr || !dataDemissaoStr) {
        alert('Por favor, preencha as datas de Admissão e Demissão.');
        return;
    }

    const admDate = new Date(dataAdmissaoStr + 'T00:00:00');
    const demDate = new Date(dataDemissaoStr + 'T00:00:00');

    const divisorMes = parseInt(document.getElementById('divisor-mes')?.value, 10) || 30;
    const elDiasSaldoInput = document.getElementById('dias-saldo');
    let diasTrabalhadosMes = parseInt(elDiasSaldoInput?.value, 10);

    if (isNaN(diasTrabalhadosMes)) {
        if (admDate.getFullYear() === demDate.getFullYear() && admDate.getMonth() === demDate.getMonth()) {
            diasTrabalhadosMes = Math.max(1, demDate.getDate() - admDate.getDate() + 1);
        } else {
            diasTrabalhadosMes = demDate.getDate();
        }
    }

    // 1. Saldo de Salário
    const valorSaldoSalario = (salarioBase / divisorMes) * diasTrabalhadosMes;

    // 2. Verbas de Aviso Prévio e Indenizações
    let valorAvisoPrevio = 0;
    let valorAvisoDescontado = 0;
    let valorIndenizacao479 = 0;
    let valorIndenizacao480 = 0;

    if (tipoRescisao === 'demissao_sem_justa_causa') {
        if (tipoAviso === 'indenizado') {
            valorAvisoPrevio = (salarioBase / 30) * diasAviso;
        }
    } else if (tipoRescisao === 'acordo_partes') {
        if (tipoAviso === 'indenizado') {
            valorAvisoPrevio = 0.5 * (salarioBase / 30) * diasAviso;
        }
    } else if (tipoRescisao === 'pedido_demissao') {
        if (tipoAviso === 'descontado') {
            valorAvisoDescontado = (salarioBase / 30) * 30;
        }
    } else if (tipoRescisao === 'antecipacao_exp_empregador') {
        valorIndenizacao479 = 0.5 * diasRestantesExp * (salarioBase / 30);
    } else if (tipoRescisao === 'antecipacao_exp_funcionario') {
        valorIndenizacao480 = 0.5 * diasRestantesExp * (salarioBase / 30);
    }

    // 3. 13º Salário Proporcional
    let valor13Proporcional = 0;
    if (tipoRescisao !== 'demissao_com_justa_causa') {
        valor13Proporcional = (salarioBase / 12) * avos13;
    }

    // 4. Férias Vencidas + 1/3
    let valorFeriasVencidas = 0;
    let valorTercoFeriasVencidas = 0;
    if (qtdFeriasVencidas > 0) {
        valorFeriasVencidas = salarioBase * qtdFeriasVencidas;
        valorTercoFeriasVencidas = (salarioBase / 3) * qtdFeriasVencidas;
    }

    // 5. Férias Proporcionais + 1/3
    let valorFeriasProporcionais = 0;
    let valorTercoFeriasProporcionais = 0;
    if (tipoRescisao !== 'demissao_com_justa_causa') {
        valorFeriasProporcionais = (salarioBase / 12) * avosFerias;
        valorTercoFeriasProporcionais = valorFeriasProporcionais / 3;
    }

    // LISTA DE RUBRICAS / ITEMIZAÇÃO
    const itensVerbas = [];

    // Proventos Padrão
    if (valorSaldoSalario > 0) {
        itensVerbas.push({ descricao: `Saldo de Salário (${diasTrabalhadosMes} dias)`, tipo: 'Provento', valor: valorSaldoSalario });
    }
    if (valorAvisoPrevio > 0) {
        itensVerbas.push({ descricao: `Aviso Prévio Indenizado (${diasAviso} dias${tipoRescisao === 'acordo_partes' ? ' - 50%' : ''})`, tipo: 'Provento', valor: valorAvisoPrevio });
    }
    if (valor13Proporcional > 0) {
        itensVerbas.push({ descricao: `13º Salário Proporcional (${avos13}/12)`, tipo: 'Provento', valor: valor13Proporcional });
    }
    if (valorFeriasVencidas > 0) {
        itensVerbas.push({ descricao: `Férias Vencidas (${qtdFeriasVencidas} período(s))`, tipo: 'Provento', valor: valorFeriasVencidas });
        itensVerbas.push({ descricao: '1/3 Constitucional s/ Férias Vencidas', tipo: 'Provento', valor: valorTercoFeriasVencidas });
    }
    if (valorFeriasProporcionais > 0) {
        itensVerbas.push({ descricao: `Férias Proporcionais (${avosFerias}/12)`, tipo: 'Provento', valor: valorFeriasProporcionais });
        itensVerbas.push({ descricao: '1/3 Constitucional s/ Férias Proporcionais', tipo: 'Provento', valor: valorTercoFeriasProporcionais });
    }
    if (valorIndenizacao479 > 0) {
        itensVerbas.push({ descricao: `Indenização Art. 479 CLT (${diasRestantesExp} dias rest.)`, tipo: 'Provento', valor: valorIndenizacao479 });
    }

    // LEITURA DOS PROVENTOS ADICIONAIS DINÂMICOS
    let somaProventosDinamicos = 0;
    let somaProventosINSS = 0;
    let somaProventosFGTS = 0;
    let somaProventosIRRF = 0;
    let somaDSRVar = 0;

    const listaProventosDinamicos = [];
    document.querySelectorAll('#container-proventos .row-provento').forEach(row => {
        const desc = row.querySelector('.provento-desc').value.trim() || 'Provento Adicional';
        const val = parseFloat(row.querySelector('.provento-valor').value) || 0;
        const incINSS = row.querySelector('.provento-inss').checked;
        const incFGTS = row.querySelector('.provento-fgts').checked;
        const incIRRF = row.querySelector('.provento-irrf').checked;
        const calcDSR = row.querySelector('.provento-dsr').checked;

        if (val > 0) {
            itensVerbas.push({ descricao: desc, tipo: 'Provento', valor: val });
            somaProventosDinamicos += val;
            if (incINSS) somaProventosINSS += val;
            if (incFGTS) somaProventosFGTS += val;
            if (incIRRF) somaProventosIRRF += val;

            if (calcDSR && diasUteis > 0) {
                const valDSR = (val / diasUteis) * diasNaoUteis;
                if (valDSR > 0) {
                    const descDSR = `DSR s/ ${desc}`;
                    itensVerbas.push({ descricao: descDSR, tipo: 'Provento', valor: valDSR });
                    somaDSRVar += valDSR;
                    if (incINSS) somaProventosINSS += valDSR;
                    if (incFGTS) somaProventosFGTS += valDSR;
                    if (incIRRF) somaProventosIRRF += valDSR;
                }
            }

            listaProventosDinamicos.push({ desc, val, incINSS, incFGTS, incIRRF, calcDSR });
        }
    });

    // LEITURA DOS DESCONTOS ADICIONAIS DINÂMICOS
    let somaDescontosDinamicos = 0;
    let somaAbateBases = 0;

    const listaDescontosDinamicos = [];
    document.querySelectorAll('#container-descontos .row-desconto').forEach(row => {
        const desc = row.querySelector('.desconto-desc').value.trim() || 'Desconto Adicional';
        const val = parseFloat(row.querySelector('.desconto-valor').value) || 0;
        const abate = row.querySelector('.desconto-abate').checked;

        if (val > 0) {
            itensVerbas.push({ descricao: `(-) ${desc}`, tipo: 'Desconto', valor: val });
            somaDescontosDinamicos += val;
            if (abate) somaAbateBases += val;
            listaDescontosDinamicos.push({ desc, val, abate });
        }
    });

    // LEITURA DOS BENEFÍCIOS DINÂMICOS
    let custoBeneficiosEmpresa = 0;
    const listaBeneficiosDinamicos = [];
    document.querySelectorAll('#container-beneficios .row-beneficio').forEach(row => {
        const desc = row.querySelector('.beneficio-desc').value.trim() || 'Benefício / Custeio';
        const val = parseFloat(row.querySelector('.beneficio-valor').value) || 0;
        const natureza = row.querySelector('.beneficio-natureza').value;

        if (val > 0) {
            if (natureza === 'desconto') {
                itensVerbas.push({ descricao: `(-) ${desc}`, tipo: 'Desconto', valor: val });
            } else if (natureza === 'rescisao') {
                itensVerbas.push({ descricao: desc, tipo: 'Provento', valor: val });
            } else { // empresa
                custoBeneficiosEmpresa += val;
            }
            listaBeneficiosDinamicos.push({ desc, val, natureza });
        }
    });

    // ==========================================
    // APURAÇÃO DETALHADA DAS BASES DO FUNCIONÁRIO
    // ==========================================
    
    // Base INSS Mensal = Saldo de Salário + Proventos com INSS - Descontos com Abate Base
    let baseINSSMensal = Math.max(0, valorSaldoSalario + somaProventosINSS - somaAbateBases);
    const inssMensal = calcularINSS(baseINSSMensal);
    if (inssMensal > 0) {
        itensVerbas.push({ descricao: '(-) INSS sobre Saldo de Salário e Variáveis', tipo: 'Desconto', valor: inssMensal });
    }

    // Base INSS 13º Salário
    let baseINSS13 = valor13Proporcional;
    const inss13 = calcularINSS(baseINSS13);
    if (inss13 > 0) {
        itensVerbas.push({ descricao: '(-) INSS sobre 13º Salário Proporcional', tipo: 'Desconto', valor: inss13 });
    }

    // Base IRRF Mensal
    const deducaoDep = dependentes * VALOR_DEDUCAO_DEPENDENTE;
    let baseIRRFMensal = Math.max(0, baseINSSMensal - inssMensal - deducaoDep);
    const irrfMensal = calcularIRRF(baseIRRFMensal);
    if (irrfMensal > 0) {
        itensVerbas.push({ descricao: '(-) IRRF sobre Saldo de Salário e Variáveis', tipo: 'Desconto', valor: irrfMensal });
    }

    // Base IRRF 13º Salário
    let baseIRRF13 = Math.max(0, baseINSS13 - inss13 - deducaoDep);
    const irrf13 = calcularIRRF(baseIRRF13);
    if (irrf13 > 0) {
        itensVerbas.push({ descricao: '(-) IRRF sobre 13º Salário Proporcional', tipo: 'Desconto', valor: irrf13 });
    }

    // Descontos Específicos
    if (valorAvisoDescontado > 0) {
        itensVerbas.push({ descricao: '(-) Desconto Aviso Prévio Não Cumprido', tipo: 'Desconto', valor: valorAvisoDescontado });
    }
    if (valorIndenizacao480 > 0) {
        itensVerbas.push({ descricao: `(-) Indenização Art. 480 CLT (${diasRestantesExp} dias rest.)`, tipo: 'Desconto', valor: valorIndenizacao480 });
    }

    // Totais do Holerite
    const totalProventos = itensVerbas.filter(i => i.tipo === 'Provento').reduce((acc, i) => acc + i.valor, 0);
    const totalDescontos = itensVerbas.filter(i => i.tipo === 'Desconto').reduce((acc, i) => acc + i.valor, 0);
    const liquidoReceber = Math.max(0, totalProventos - totalDescontos);

    // FGTS e Multa Rescisória
    let baseFGTSRescisao = valorSaldoSalario + valor13Proporcional + somaProventosFGTS;
    if (['demissao_sem_justa_causa', 'acordo_partes'].includes(tipoRescisao) && valorAvisoPrevio > 0) {
        baseFGTSRescisao += valorAvisoPrevio;
    }
    const fgtsRescisao = baseFGTSRescisao * 0.08;

    const baseFGTSMulta = saldoFGTS + fgtsRescisao;
    let percentualMultaFGTS = 0;
    let valorMultaFGTS = 0;

    if (tipoRescisao === 'demissao_sem_justa_causa') {
        percentualMultaFGTS = 40;
        valorMultaFGTS = baseFGTSMulta * 0.40;
    } else if (tipoRescisao === 'acordo_partes') {
        percentualMultaFGTS = 20;
        valorMultaFGTS = baseFGTSMulta * 0.20;
    }

    let saqueFGTSPermitido = false;
    let valorSaqueFGTS = 0;

    if (['demissao_sem_justa_causa', 'antecipacao_exp_empregador', 'termino_experiencia'].includes(tipoRescisao)) {
        saqueFGTSPermitido = true;
        valorSaqueFGTS = baseFGTSMulta + valorMultaFGTS;
    } else if (tipoRescisao === 'acordo_partes') {
        saqueFGTSPermitido = true;
        valorSaqueFGTS = (baseFGTSMulta * 0.80) + valorMultaFGTS;
    }

    // Total de Verbas Isentas / Indenizatórias
    const totalVerbasIsentas = valorFeriasVencidas + valorTercoFeriasVencidas +
        valorFeriasProporcionais + valorTercoFeriasProporcionais +
        valorMultaFGTS + valorIndenizacao479 + (valorAvisoPrevio > 0 ? valorAvisoPrevio : 0);

    // ==========================================
    // APURAÇÃO DETALHADA DOS ENCARGOS DA EMPRESA (INSS PATRONAL)
    // ==========================================
    const baseINSSPatronalEmpresa = baseINSSMensal + baseINSS13;

    let encINSSPatronal = 0;
    let encINSSTerceiros = 0;
    let encINSSGilrat = 0;

    if (regime !== 'simples' && regime !== 'mei') {
        encINSSPatronal = baseINSSPatronalEmpresa * (percPatronal / 100);
        encINSSTerceiros = baseINSSPatronalEmpresa * (percTerceiros / 100);
        encINSSGilrat = baseINSSPatronalEmpresa * (percGilrat / 100);
    }
    const totalINSSPatronalEmpresa = encINSSPatronal + encINSSTerceiros + encINSSGilrat;

    // Custo Total para Empregador
    const custoTotalEmpresa = totalProventos + totalINSSPatronalEmpresa + fgtsRescisao + valorMultaFGTS + custoBeneficiosEmpresa;

    // Regimes Labels
    const regimeLabels = {
        'simples': 'Simples Nacional (com isenção CPP)',
        'lucro': 'Lucro Presumido / Real',
        'anexo4': 'Simples Nacional - Anexo IV',
        'mei': 'MEI / Simples Isento',
        'domestico': 'Doméstico'
    };

    // Objeto consolidado para exibição e PDF
    dadosAtuaisParaPDF = {
        dataCalculo: new Date().toLocaleDateString('pt-BR'),
        regime,
        regimeLabel: regimeLabels[regime] || regime,
        percPatronal,
        percTerceiros,
        percGilrat,
        salarioBase,
        dataAdmissaoFormatada: admDate.toLocaleDateString('pt-BR'),
        dataDemissaoFormatada: demDate.toLocaleDateString('pt-BR'),
        tipoRescisao,
        tipoAviso,
        diasAviso,
        dependentes,
        saldoFGTS,
        qtdFeriasVencidas,
        diasTrabalhadosMes,
        diasUteis,
        diasNaoUteis,
        avos13,
        avosFerias,
        itensVerbas,
        totalProventos,
        totalDescontos,
        liquidoReceber,
        
        // Bases do Funcionário
        baseINSSMensal,
        baseINSS13,
        inssMensal,
        inss13,
        baseIRRFMensal,
        baseIRRF13,
        irrfMensal,
        irrf13,
        baseFGTSRescisao,
        fgtsRescisao,
        baseFGTSMulta,
        percentualMultaFGTS,
        valorMultaFGTS,
        saqueFGTSPermitido,
        valorSaqueFGTS,
        totalVerbasIsentas,

        // Encargos INSS Empresa
        baseINSSPatronalEmpresa,
        encINSSPatronal,
        encINSSTerceiros,
        encINSSGilrat,
        totalINSSPatronalEmpresa,
        custoBeneficiosEmpresa,
        custoTotalEmpresa,

        // Listas dinâmicas lançadas
        listaProventosDinamicos,
        listaDescontosDinamicos,
        listaBeneficiosDinamicos
    };

    // Renderiza HTML dos resultados
    renderizarResultadosHTML(dadosAtuaisParaPDF);
}

// ==========================================
// 6. RENDERIZAÇÃO DA INTERFACE DE RESULTADOS
// ==========================================

function renderizarResultadosHTML(dados) {
    const container = document.getElementById('resultado-container');
    const btnGerarPdf = document.getElementById('btn-gerar-pdf');

    if (!container) return;

    const labelsRescisao = {
        'demissao_sem_justa_causa': '1. Demissão sem Justa Causa',
        'pedido_demissao': '2. Pedido de Demissão',
        'antecipacao_exp_funcionario': '3. Antecipação de Experiência pelo Funcionário',
        'antecipacao_exp_empregador': '4. Antecipação de Experiência pelo Empregador',
        'termino_experiencia': '5. Término de Contrato de Experiência',
        'demissao_com_justa_causa': '6. Demissão com Justa Causa',
        'acordo_partes': '7. Acordo entre as Partes (Art. 484-A CLT)'
    };

    let notasRegime = '';
    if (dados.regime === 'simples' || dados.regime === 'mei') {
        notasRegime = '<svg class="lucide lucide-lightbulb" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /> <path d="M9 18h6" /> <path d="M10 22h4" /> </svg> <strong>Simples Nacional / MEI:</strong> Isento do recolhimento de CPP Patronal, Terceiros e GILRAT em guia separada (incluso na alíquota unificada DAS).';
    } else if (dados.regime === 'anexo4') {
        notasRegime = '<svg class="lucide lucide-alert-triangle" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" /> </svg> <strong>Anexo IV:</strong> Recolhe CPP (20%) e GILRAT em guia separada (GPS/DARF), porém isento de Terceiros.';
    } else if (dados.regime === 'domestico') {
        notasRegime = '<svg class="lucide lucide-lightbulb" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /> <path d="M9 18h6" /> <path d="M10 22h4" /> </svg> <strong>Doméstico:</strong> Alíquota patronal de 8,0% + 0,8% GILRAT via DAE eSocial.';
    } else {
        notasRegime = '<svg class="lucide lucide-building" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 10h.01" /> <path d="M12 14h.01" /> <path d="M12 6h.01" /> <path d="M16 10h.01" /> <path d="M16 14h.01" /> <path d="M16 6h.01" /> <path d="M8 10h.01" /> <path d="M8 14h.01" /> <path d="M8 6h.01" /> <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /> <rect x="4" y="2" width="16" height="20" rx="2" /> </svg> <strong>Lucro Presumido / Real:</strong> Incidência integral de CPP (20%), Outras Entidades/Terceiros (5,8%) e GILRAT.';
    }

    let html = `
        <div style="margin-top: 25px; border-top: 2px dashed var(--cor-borda, #cbd5e1); padding-top: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--cor-texto-principal);">
                        
<svg class="lucide lucide-bar-chart-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 21v-6" /> <path d="M12 21V3" /> <path d="M19 21V9" /> </svg> Resultado Profissional do Cálculo Rescisório
                    </h2>
                    <p style="font-size: 0.88rem; color: var(--cor-texto-secundario);">
                        Modalidade: <strong>${labelsRescisao[dados.tipoRescisao]}</strong>
                    </p>
                </div>
                <span class="badge-tag-azul" style="font-size: 0.85rem; padding: 6px 12px;">Cálculo Concluído</span>
            </div>

            <!-- KPI Cards de Resumo -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 25px;">
                <div style="background: var(--cor-card-subtle-bg, #f8fafc); border: 1px solid var(--cor-borda, #e2e8f0); border-radius: 12px; padding: 16px; text-align: center;">
                    <span style="font-size: 0.8rem; color: var(--cor-texto-secundario); font-weight: 600; text-transform: uppercase;">Total Proventos Brutos</span>
                    <div style="font-size: 1.3rem; font-weight: 800; color: var(--cor-text-success, #047857); margin-top: 4px;">${formatarMoeda(dados.totalProventos)}</div>
                </div>

                <div style="background: var(--cor-card-subtle-bg, #f8fafc); border: 1px solid var(--cor-borda, #e2e8f0); border-radius: 12px; padding: 16px; text-align: center;">
                    <span style="font-size: 0.8rem; color: var(--cor-texto-secundario); font-weight: 600; text-transform: uppercase;">Total Descontos</span>
                    <div style="font-size: 1.3rem; font-weight: 800; color: var(--cor-text-danger, #b91c1c); margin-top: 4px;">-${formatarMoeda(dados.totalDescontos)}</div>
                </div>

                <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); border-radius: 12px; padding: 16px; text-align: center; color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                    <span style="font-size: 0.8rem; opacity: 0.9; font-weight: 600; text-transform: uppercase;">Líquido no Saldo Rescisório</span>
                    <div style="font-size: 1.4rem; font-weight: 800; margin-top: 4px;">${formatarMoeda(dados.liquidoReceber)}</div>
                </div>

                <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 12px; padding: 16px; text-align: center; color: white; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);">
                    <span style="font-size: 0.8rem; opacity: 0.9; font-weight: 600; text-transform: uppercase;">Custo Total para Empregador</span>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #10b981; margin-top: 4px;">${formatarMoeda(dados.custoTotalEmpresa)}</div>
                </div>
            </div>

            <!-- BLOCO DETALHADO 1: TODAS AS BASES DO FUNCIONÁRIO -->
            <div style="background: var(--cor-card-bg); border: 1px solid var(--cor-borda); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 15px; color: var(--cor-texto-principal); display: flex; align-items: center; gap: 8px;">
                    <span>
<svg class="lucide lucide-ruler" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /> <path d="m14.5 12.5 2-2" /> <path d="m11.5 9.5 2-2" /> <path d="m8.5 6.5 2-2" /> <path d="m17.5 15.5 2-2" /> </svg> </span> Detalhamento Completo das Bases de Cálculo do Funcionário
                </h3>
                <div class="grid-bases-detalhadas">
                    <div class="card-base-item">
                        <span class="base-label">Base INSS Mensal (Saldo/Variáveis)</span>
                        <span class="base-val">${formatarMoeda(dados.baseINSSMensal)}</span>
                        <span class="base-desc">INSS Devido: ${formatarMoeda(dados.inssMensal)}</span>
                    </div>

                    <div class="card-base-item">
                        <span class="base-label">Base INSS 13º Salário</span>
                        <span class="base-val">${formatarMoeda(dados.baseINSS13)}</span>
                        <span class="base-desc">INSS 13º Devido: ${formatarMoeda(dados.inss13)}</span>
                    </div>

                    <div class="card-base-item">
                        <span class="base-label">Base IRRF Mensal</span>
                        <span class="base-val">${formatarMoeda(dados.baseIRRFMensal)}</span>
                        <span class="base-desc">IRRF Devido: ${formatarMoeda(dados.irrfMensal)}</span>
                    </div>

                    <div class="card-base-item">
                        <span class="base-label">Base IRRF 13º Salário</span>
                        <span class="base-val">${formatarMoeda(dados.baseIRRF13)}</span>
                        <span class="base-desc">IRRF 13º Devido: ${formatarMoeda(dados.irrf13)}</span>
                    </div>

                    <div class="card-base-item">
                        <span class="base-label">Base FGTS Rescisão (Folha/Aviso/13º)</span>
                        <span class="base-val">${formatarMoeda(dados.baseFGTSRescisao)}</span>
                        <span class="base-desc">FGTS 8%: ${formatarMoeda(dados.fgtsRescisao)}</span>
                    </div>

                    <div class="card-base-item">
                        <span class="base-label">Base para Multa FGTS (CEF + Mês)</span>
                        <span class="base-val">${formatarMoeda(dados.baseFGTSMulta)}</span>
                        <span class="base-desc">Multa ${dados.percentualMultaFGTS}%: ${formatarMoeda(dados.valorMultaFGTS)}</span>
                    </div>

                    <div class="card-base-item" style="grid-column: 1 / -1; background: var(--cor-card-subtle-bg);">
                        <span class="base-label">Total de Verbas Isentas / Indenizatórias (Não Tributáveis)</span>
                        <span class="base-val" style="color: #0284c7;">${formatarMoeda(dados.totalVerbasIsentas)}</span>
                        <span class="base-desc">Inclui Férias Vencidas e Proporcionais + 1/3, Multa Rescisória e Indenizações</span>
                    </div>
                </div>
            </div>

            <!-- BLOCO DETALHADO 2: DETALHAMENTO DOS ENCARGOS DO INSS REFERENTES À EMPRESA -->
            <div style="background: var(--cor-card-bg); border: 1px solid var(--cor-borda); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 12px; color: var(--cor-texto-principal); display: flex; align-items: center; gap: 8px;">
                    <span>
<svg class="lucide lucide-landmark" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 18v-7" /> <path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" /> <path d="M14 18v-7" /> <path d="M18 18v-7" /> <path d="M3 22h18" /> <path d="M6 18v-7" /> </svg> ️</span> Detalhamento dos Encargos Sociais e INSS Patronal da Empresa
                </h3>
                <p style="font-size: 0.85rem; color: var(--cor-texto-secundario); margin-bottom: 15px;">
                    ${notasRegime}
                </p>

                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: var(--cor-card-subtle-bg, #f1f5f9); text-align: left; border-bottom: 2px solid var(--cor-borda, #cbd5e1);">
                                <th style="padding: 10px 12px;">Componente de Encargo Patronal</th>
                                <th style="padding: 10px 12px; text-align: center;">Alíquota</th>
                                <th style="padding: 10px 12px; text-align: right;">Base de Cálculo (R$)</th>
                                <th style="padding: 10px 12px; text-align: right;">Encargo Devido (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--cor-borda, #e2e8f0);">
                                <td style="padding: 10px 12px; font-weight: 600;">INSS Patronal (CPP)</td>
                                <td style="padding: 10px 12px; text-align: center;">${dados.percPatronal.toFixed(2)}%</td>
                                <td style="padding: 10px 12px; text-align: right;">${formatarMoeda(dados.baseINSSPatronalEmpresa)}</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${formatarMoeda(dados.encINSSPatronal)}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--cor-borda, #e2e8f0);">
                                <td style="padding: 10px 12px; font-weight: 600;">INSS Terceiros / Outras Entidades</td>
                                <td style="padding: 10px 12px; text-align: center;">${dados.percTerceiros.toFixed(2)}%</td>
                                <td style="padding: 10px 12px; text-align: right;">${formatarMoeda(dados.baseINSSPatronalEmpresa)}</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${formatarMoeda(dados.encINSSTerceiros)}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--cor-borda, #e2e8f0);">
                                <td style="padding: 10px 12px; font-weight: 600;">INSS GILRAT / RAT / FAP</td>
                                <td style="padding: 10px 12px; text-align: center;">${dados.percGilrat.toFixed(2)}%</td>
                                <td style="padding: 10px 12px; text-align: right;">${formatarMoeda(dados.baseINSSPatronalEmpresa)}</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${formatarMoeda(dados.encINSSGilrat)}</td>
                            </tr>
                            <tr style="border-bottom: 2px solid var(--cor-borda, #cbd5e1); background: var(--cor-card-subtle-bg, #f8fafc);">
                                <td colspan="3" style="padding: 10px 12px; font-weight: bold;">SUBTOTAL INSS PATRONAL EMPRESA</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 800; color: #1e3a8a;">${formatarMoeda(dados.totalINSSPatronalEmpresa)}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--cor-borda, #e2e8f0);">
                                <td style="padding: 10px 12px; font-weight: 600;">FGTS Mês da Rescisão / Aviso</td>
                                <td style="padding: 10px 12px; text-align: center;">8,00%</td>
                                <td style="padding: 10px 12px; text-align: right;">${formatarMoeda(dados.baseFGTSRescisao)}</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${formatarMoeda(dados.fgtsRescisao)}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--cor-borda, #e2e8f0);">
                                <td style="padding: 10px 12px; font-weight: 600;">Multa Rescisória do FGTS</td>
                                <td style="padding: 10px 12px; text-align: center;">${dados.percentualMultaFGTS}.00%</td>
                                <td style="padding: 10px 12px; text-align: right;">${formatarMoeda(dados.baseFGTSMulta)}</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${formatarMoeda(dados.valorMultaFGTS)}</td>
                            </tr>
                            ${dados.custoBeneficiosEmpresa > 0 ? `
                            <tr style="border-bottom: 1px solid var(--cor-borda, #e2e8f0);">
                                <td style="padding: 10px 12px; font-weight: 600;">Custeio de Benefícios pela Empresa</td>
                                <td style="padding: 10px 12px; text-align: center;">-</td>
                                <td style="padding: 10px 12px; text-align: right;">-</td>
                                <td style="padding: 10px 12px; text-align: right; font-weight: 700;">${formatarMoeda(dados.custoBeneficiosEmpresa)}</td>
                            </tr>
                            ` : ''}
                        </tbody>
                        <tfoot>
                            <tr style="background: #0f172a; color: #ffffff; font-weight: bold;">
                                <td colspan="3" style="padding: 12px;">CUSTO TOTAL DA RESCISÃO PARA O EMPREGADOR</td>
                                <td style="padding: 12px; text-align: right; color: #10b981; font-size: 1.1rem;">${formatarMoeda(dados.custoTotalEmpresa)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Tabela Discriminada de Verbas (Holerite) -->
            <div style="background: var(--cor-card-bg); border: 1px solid var(--cor-borda); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 15px; color: var(--cor-texto-principal); display: flex; align-items: center; gap: 8px;">
                    <span>
<svg class="lucide lucide-receipt" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 17V7" /> <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" /> <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" /> </svg> </span> Discriminação das Verbas Rescisórias (Holerite do Funcionário)
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: var(--cor-card-subtle-bg, #f1f5f9); text-align: left; border-bottom: 2px solid var(--cor-borda, #cbd5e1);">
                                <th style="padding: 10px 12px; color: var(--cor-texto-principal);">Descrição da Verba</th>
                                <th style="padding: 10px 12px; text-align: center; color: var(--cor-texto-principal);">Natureza</th>
                                <th style="padding: 10px 12px; text-align: right; color: var(--cor-texto-principal);">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dados.itensVerbas.map(item => {
                                const isDesc = item.tipo === 'Desconto';
                                return `
                                    <tr style="border-bottom: 1px solid var(--cor-borda, #e2e8f0);">
                                        <td style="padding: 10px 12px; font-weight: 500; color: ${isDesc ? '#b91c1c' : 'var(--cor-texto-principal)'};">${item.descricao}</td>
                                        <td style="padding: 10px 12px; text-align: center;">
                                            <span style="font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px; background: ${isDesc ? '#fef2f2' : '#ecfdf5'}; color: ${isDesc ? '#991b1b' : '#047857'};">
                                                ${item.tipo}
                                            </span>
                                        </td>
                                        <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: ${isDesc ? '#b91c1c' : '#047857'};">
                                            ${isDesc ? '-' : ''}${formatarMoeda(item.valor)}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: var(--cor-card-subtle-bg, #f8fafc); font-weight: bold; border-top: 2px solid var(--cor-borda, #cbd5e1);">
                                <td colspan="2" style="padding: 12px; color: #1e3a8a;">LÍQUIDO A RECEBER EM CONTA PELO TRABALHADOR</td>
                                <td style="padding: 12px; text-align: right; color: #1e3a8a; font-size: 1.05rem;">${formatarMoeda(dados.liquidoReceber)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Painel de Movimentação do FGTS -->
            <div style="background: var(--cor-card-bg); border: 1px solid var(--cor-borda); border-radius: 12px; padding: 20px;">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--cor-texto-principal); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <span>
<svg class="lucide lucide-building-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 12h4" /> <path d="M10 8h4" /> <path d="M14 21v-3a2 2 0 0 0-4 0v3" /> <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" /> <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /> </svg> </span> Resumo do FGTS e Projeção de Saque
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; font-size: 0.88rem;">
                    <div style="background: var(--cor-card-subtle-bg); padding: 12px 16px; border-radius: 8px;">
                        <span>FGTS do Mês da Rescisão (8%):</span><br>
                        <strong style="font-size: 1.1rem;">${formatarMoeda(dados.fgtsRescisao)}</strong>
                    </div>
                    <div style="background: var(--cor-card-subtle-bg); padding: 12px 16px; border-radius: 8px;">
                        <span>Base de Cálculo da Multa Rescisória:</span><br>
                        <strong style="font-size: 1.1rem;">${formatarMoeda(dados.baseFGTSMulta)}</strong>
                    </div>
                    <div style="background: var(--cor-card-subtle-bg); padding: 12px 16px; border-radius: 8px;">
                        <span>Multa Rescisória do FGTS (${dados.percentualMultaFGTS}%):</span><br>
                        <strong style="font-size: 1.1rem; color: var(--cor-text-info, #1e3a8a);">${formatarMoeda(dados.valorMultaFGTS)}</strong>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 12px 16px; border-radius: 8px; color: var(--cor-text-success, #047857);">
                        <span>Estimativa Liberada para Saque CEF:</span><br>
                        <strong style="font-size: 1.15rem; color: var(--cor-text-success, #047857);">${formatarMoeda(dados.valorSaqueFGTS)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.style.display = 'block';

    if (btnGerarPdf) {
        btnGerarPdf.style.display = 'inline-flex';
    }

    // Scroll suave até o resultado
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// 7. EVENT LISTENERS E INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Escuta mudança do regime tributário
    const elRegime = document.getElementById('regime-tributario');
    if (elRegime) {
        elRegime.addEventListener('change', () => {
            atualizarAliquotasPatronais();
            apurarAvosEDiasAutomaticos();
        });
    }

    // Escuta mudanças de datas e modalidade de rescisão
    ['data-admissao', 'data-demissao', 'tipo-rescisao', 'tipo-aviso'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', apurarAvosEDiasAutomaticos);
        }
    });

    // Botões para adicionar linhas dinâmicas
    const btnAddProvento = document.getElementById('btn-add-provento');
    if (btnAddProvento) {
        btnAddProvento.addEventListener('click', () => adicionarLinhaProvento());
    }

    const btnAddDesconto = document.getElementById('btn-add-desconto');
    if (btnAddDesconto) {
        btnAddDesconto.addEventListener('click', () => adicionarLinhaDesconto());
    }

    const btnAddBeneficio = document.getElementById('btn-add-beneficio');
    if (btnAddBeneficio) {
        btnAddBeneficio.addEventListener('click', () => adicionarLinhaBeneficio());
    }

    // Escuta checkboxes manuais para habilitar/desabilitar inputs
    const mapCheckboxes = [
        { chk: 'manual-dias-saldo', input: 'dias-saldo' },
        { chk: 'manual-dias-aviso', input: 'dias-aviso' },
        { chk: 'manual-avos-13', input: 'avos-13' },
        { chk: 'manual-avos-ferias', input: 'avos-ferias' }
    ];

    mapCheckboxes.forEach(m => {
        const chkEl = document.getElementById(m.chk);
        const inpEl = document.getElementById(m.input);
        if (chkEl && inpEl) {
            chkEl.addEventListener('change', () => {
                inpEl.disabled = !chkEl.checked;
                if (!chkEl.checked) {
                    apurarAvosEDiasAutomaticos();
                }
            });
        }
    });

    // Botões principais
    const btnCalcular = document.getElementById('btn-calcular');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', processarCalculoRescisao);
    }

    const btnLimpar = document.getElementById('btn-limpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            document.querySelectorAll('#secao-rescisao input:not([type="checkbox"])').forEach(i => {
                if (i.type === 'number') i.value = i.defaultValue || '';
                else i.value = '';
            });
            document.querySelectorAll('#secao-rescisao select').forEach(s => {
                s.selectedIndex = 0;
            });
            document.querySelectorAll('#secao-rescisao input[type="checkbox"]').forEach(c => {
                c.checked = false;
            });

            // Limpa containers de itens dinâmicos
            ['container-proventos', 'container-descontos', 'container-beneficios'].forEach(id => {
                const c = document.getElementById(id);
                if (c) c.innerHTML = '';
            });

            document.getElementById('dias-saldo').disabled = true;
            document.getElementById('dias-aviso').disabled = true;
            document.getElementById('avos-13').disabled = true;
            document.getElementById('avos-ferias').disabled = true;

            const resContainer = document.getElementById('resultado-container');
            if (resContainer) resContainer.style.display = 'none';

            const btnPdf = document.getElementById('btn-gerar-pdf');
            if (btnPdf) btnPdf.style.display = 'none';

            atualizarAliquotasPatronais();
            apurarAvosEDiasAutomaticos();
        });
    }

    const btnGerarPdf = document.getElementById('btn-gerar-pdf');
    if (btnGerarPdf) {
        btnGerarPdf.addEventListener('click', () => {
            if (dadosAtuaisParaPDF) {
                gerarPDFRescisao(dadosAtuaisParaPDF);
            } else {
                alert('Por favor, processe o cálculo antes de gerar o relatório PDF.');
            }
        });
    }

    const irParaComparador = (e) => {
        if (e) e.preventDefault();
        const salarioBase = document.getElementById('salario-base')?.value || '';
        const regime = document.getElementById('regime-tributario')?.value || 'lucro';
        const admissao = document.getElementById('data-admissao')?.value || '';
        const demissao = document.getElementById('data-demissao')?.value || '';
        const saldoFGTS = document.getElementById('saldo-fgts')?.value || '0';
        const dependentes = document.getElementById('dependentes')?.value || '0';

        const url = `comparador-rescisao.html?salarioBase=${encodeURIComponent(salarioBase)}&regime=${encodeURIComponent(regime)}&admissao=${encodeURIComponent(admissao)}&demissao=${encodeURIComponent(demissao)}&saldoFGTS=${encodeURIComponent(saldoFGTS)}&dependentes=${encodeURIComponent(dependentes)}`;
        window.location.href = url;
    };

    const btnComparar = document.getElementById('btn-comparar-cenarios');
    if (btnComparar) btnComparar.addEventListener('click', irParaComparador);

    const btnLinkComparadorHeader = document.getElementById('btn-link-comparador-header');
    if (btnLinkComparadorHeader) btnLinkComparadorHeader.addEventListener('click', irParaComparador);

    // Inicialização padrão
    atualizarAliquotasPatronais();
    apurarAvosEDiasAutomaticos();
});
