// js/simuladores/calculos-folha.js
//
// Núcleo de cálculos de folha de pagamento (CLT) compartilhado por todos os
// simuladores e utilidades. Funções puras: recebem number/Date, devolvem
// number/boolean/object — nunca tocam o DOM. Isso permite testar o cálculo em
// Node puro (ver tests/calculos-folha.test.js) sem precisar de navegador, e
// evita que a mesma regra de negócio seja reimplementada (e divirja) em cada
// arquivo que precisa dela.
//
// Antes de reimplementar qualquer cálculo de avos, INSS, IRRF ou aviso prévio
// em um novo simulador, importe daqui.

import {
    TABELA_INSS,
    TABELA_IRRF,
    TETO_INSS,
    VALOR_DEDUCAO_DEPENDENTE,
    DESCONTO_SIMPLIFICADO,
    TABELA_REDUCAO_MENSAL
} from './tabelas.js';

// ==========================================
// TEMPO DE SERVIÇO / AVISO PRÉVIO
// ==========================================

/**
 * Anos completos entre duas datas (considera o dia/mês de aniversário).
 */
export function calcularAnosCompletos(dataInicio, dataFim) {
    let anos = dataFim.getFullYear() - dataInicio.getFullYear();
    const m = dataFim.getMonth() - dataInicio.getMonth();
    if (m < 0 || (m === 0 && dataFim.getDate() < dataInicio.getDate())) {
        anos--;
    }
    return Math.max(0, anos);
}

/**
 * Dias de aviso prévio proporcional (Lei 12.506/2011): 30 dias + 3 dias por
 * ano completo de serviço, limitado a 90 dias.
 */
export function calcularAvisoPrevioProporcional(dataInicio, dataFim) {
    const anos = calcularAnosCompletos(dataInicio, dataFim);
    return Math.min(90, 30 + (anos * 3));
}

// ==========================================
// AVOS DE 13º SALÁRIO E FÉRIAS PROPORCIONAIS
// ==========================================

/**
 * Avos de 13º salário proporcional ao período aquisitivo do ano de
 * `dataReferencia` (regra: cada mês completo, ou fração igual/superior a 15
 * dias, conta como 1 avo). Usa sempre os dias reais do calendário (nunca um
 * mês fixo de 30 dias), para não errar quando a admissão cai em fevereiro
 * (28/29 dias) ou em meses de 31 dias.
 */
export function calcularAvos13(admissao, dataReferencia) {
    let avos13 = 0;
    const anoRef = dataReferencia.getFullYear();
    const inicioAno = new Date(anoRef, 0, 1);
    const dataInicio13 = admissao > inicioAno ? admissao : inicioAno;

    const mInicio = dataInicio13.getMonth();
    const mFim = dataReferencia.getMonth();

    if (mInicio === mFim) {
        // Início e fim do período dentro do mesmo mês: conta os dias
        // realmente trabalhados, não os dias até o fim do mês.
        const diasTrabalhadosNoMes = dataReferencia.getDate() - dataInicio13.getDate() + 1;
        if (diasTrabalhadosNoMes >= 15) avos13 = 1;
    } else {
        // Primeiro mês: dias restantes até o fim do mês, usando o nº real de
        // dias do mês (28/29 em fevereiro, 30 ou 31 nos demais).
        const diasNoMesInicio = new Date(dataInicio13.getFullYear(), mInicio + 1, 0).getDate();
        const diasPrimeiroMes = diasNoMesInicio - dataInicio13.getDate() + 1;
        if (diasPrimeiroMes >= 15) avos13++;

        // Meses completos entre o início e o fim.
        for (let m = mInicio + 1; m < mFim; m++) {
            avos13++;
        }

        // Último mês (mês da data de referência).
        if (dataReferencia.getDate() >= 15) {
            avos13++;
        }
    }

    return Math.min(12, Math.max(0, avos13));
}

/**
 * Avos de férias proporcionais, contados a partir do último aniversário de
 * admissão anterior a `dataReferencia` (regra dos 15 dias, igual ao 13º).
 */
export function calcularAvosFerias(admissao, dataReferencia) {
    let ultimoAniversario = new Date(dataReferencia.getFullYear(), admissao.getMonth(), admissao.getDate());
    if (ultimoAniversario > dataReferencia) {
        ultimoAniversario = new Date(dataReferencia.getFullYear() - 1, admissao.getMonth(), admissao.getDate());
    }

    let diffMeses = (dataReferencia.getFullYear() - ultimoAniversario.getFullYear()) * 12 + (dataReferencia.getMonth() - ultimoAniversario.getMonth());

    const diaInic = ultimoAniversario.getDate();
    const diaFim = dataReferencia.getDate();

    if (diaFim < diaInic) {
        diffMeses--;
        const ultimoDiaMesAnterior = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 0).getDate();
        const diasRestantesFracao = (ultimoDiaMesAnterior - diaInic + 1) + diaFim;
        if (diasRestantesFracao >= 15) {
            diffMeses++;
        }
    } else if (diaFim - diaInic >= 15) {
        diffMeses++;
    }

    return Math.min(12, Math.max(0, diffMeses));
}

// ==========================================
// INSS
// ==========================================

/**
 * INSS progressivo por faixas (TABELA_INSS), com teto de contribuição
 * (TETO_INSS) já aplicado.
 */
export function calcularINSS(baseCalculo) {
    const base = Math.min(Math.max(0, baseCalculo), TETO_INSS);
    let anterior = 0;
    let soma = 0;

    for (const f of TABELA_INSS) {
        const baseFaixa = Math.min(base, f.limite) - anterior;
        if (baseFaixa > 0) soma += baseFaixa * f.aliquota;
        anterior = f.limite;
    }

    return Math.max(0, soma);
}

// ==========================================
// IRRF
// ==========================================

/**
 * Encontra a faixa da TABELA_IRRF aplicável a uma base de cálculo.
 */
export function encontrarFaixaIRRF(base) {
    return TABELA_IRRF.find(f => base <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
}

/**
 * Imposto de uma única faixa da tabela progressiva de IRRF, sem nenhuma
 * dedução adicional (nem simplificado, nem redução mensal).
 */
export function calcularImpostoIRRFFaixa(base) {
    if (base <= 0) return 0;
    const faixa = encontrarFaixaIRRF(base);
    return Math.max(0, (base * faixa.aliquota) - faixa.deducao);
}

/**
 * Valor da "redução mensal" (Lei 14.663/2023): zera o IRRF até o limite
 * inferior da tabela e reduz proporcionalmente até o limite superior.
 */
export function calcularReducaoMensal(baseProventos) {
    if (baseProventos <= TABELA_REDUCAO_MENSAL.limiteInferior) {
        return TABELA_REDUCAO_MENSAL.reducaoFixa;
    }
    if (baseProventos <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
        return TABELA_REDUCAO_MENSAL.formulaVariavel(baseProventos);
    }
    return 0;
}

/**
 * Cálculo completo de IRRF: compara a dedução legal (INSS + dependentes)
 * com o desconto simplificado (o que for mais benéfico ao contribuinte),
 * depois aplica a redução mensal sobre o menor valor apurado. Devolve todo o
 * passo a passo (bases, faixas, modelo vencedor) para simuladores didáticos
 * que precisam exibir a memória de cálculo, além do valor final pronto para
 * quem só precisa do número.
 */
export function calcularIRRFCompleto(baseProventos, descontoINSS, dependentes) {
    const deducaoDependentes = dependentes * VALOR_DEDUCAO_DEPENDENTE;

    const baseLegal = Math.max(0, baseProventos - descontoINSS - deducaoDependentes);
    const baseSimplificada = Math.max(0, baseProventos - DESCONTO_SIMPLIFICADO);

    const faixaLegal = encontrarFaixaIRRF(baseLegal);
    const faixaSimplificada = encontrarFaixaIRRF(baseSimplificada);

    const impostoLegal = calcularImpostoIRRFFaixa(baseLegal);
    const impostoSimplificado = calcularImpostoIRRFFaixa(baseSimplificada);

    const simplificadoMaisVantajoso = impostoSimplificado < impostoLegal;
    const impostoDevidoSemReducao = Math.min(impostoLegal, impostoSimplificado);

    const valorReducao = calcularReducaoMensal(baseProventos);
    const reducaoEfetiva = Math.min(impostoDevidoSemReducao, Math.max(0, valorReducao));
    const impostoFinal = Math.max(0, impostoDevidoSemReducao - reducaoEfetiva);

    return {
        baseLegal,
        faixaLegal,
        impostoLegal,
        baseSimplificada,
        faixaSimplificada,
        impostoSimplificado,
        simplificadoMaisVantajoso,
        modeloVencedor: simplificadoMaisVantajoso ? 'Simplificado' : 'Deduções Legais',
        impostoDevidoSemReducao,
        valorReducao,
        reducaoEfetiva,
        impostoFinal
    };
}

/**
 * Atalho para quem só precisa do valor final de IRRF (sem a memória de
 * cálculo completa).
 */
export function calcularIRRF(baseProventos, descontoINSS, dependentes) {
    return calcularIRRFCompleto(baseProventos, descontoINSS, dependentes).impostoFinal;
}

// ==========================================
// VALIDAÇÃO DE ENTRADA
// ==========================================

/**
 * Checa se o ano de uma data é plausível para um registro de admissão ou
 * demissão. Existe porque um <input type="date"> nativo aceita um ano
 * digitado incompleto (ex: "26" em vez de "2026") sem nenhum aviso do
 * navegador, o que silenciosamente quebra qualquer cálculo que dependa do
 * ano da data (ex: avos de 13º/férias contam o período a partir do ano
 * errado). Use isto para validar datas antes de calcular.
 */
export function anoDataValido(data, { min = 1950, max = new Date().getFullYear() + 5 } = {}) {
    const ano = data.getFullYear();
    return ano >= min && ano <= max;
}
