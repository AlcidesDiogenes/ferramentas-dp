// js/simuladores/tabelas.js

// Tabela de contribuição INSS

export const TETO_INSS = 8475.55;

export const TABELA_INSS = [
    { limite: 1621.00, aliquota: 0.075, deducao: 0.00 },
    { limite: 2902.84, aliquota: 0.090, deducao: 24.32 },
    { limite: 4354.27, aliquota: 0.120, deducao: 111.40 },
    { limite: 8475.55, aliquota: 0.140, deducao: 198.49 }
];

// Tabela de IRRF
export const TABELA_IRRF = [
    { base: 2428.80, aliquota: 0, deducao: 0 },
    { base: 2826.65, aliquota: 0.075, deducao: 182.16 },
    { base: 3751.05, aliquota: 0.150, deducao: 394.16 },
    { base: 4664.68, aliquota: 0.225, deducao: 675.49 },
    { base: 999999, aliquota: 0.275, deducao: 908.73 }
];

// Tabela de Redução Mensal (Regra Simplificada)
export const TABELA_REDUCAO_MENSAL = {
    limiteInferior: 5000.00,
    limiteSuperior: 7350.00,
    reducaoFixa: 312.89,
    formulaVariavel: (renda) => 978.62 - (0.133145 * renda)
};
// Valores Fixos
export const VALOR_DEDUCAO_DEPENDENTE = 189.59;

// Tabela de Salário Família
export const TABELA_SALARIO_FAMILIA = [
    { limite: 1819.26, valor: 62.04 }
];