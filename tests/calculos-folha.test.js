// tests/calculos-folha.test.js
//
// Testes do núcleo de cálculos de folha (js/simuladores/calculos-folha.js).
// Roda com: npm test  (usa o runner nativo do Node, node:test — sem
// dependência externa). Os casos abaixo reproduzem bugs reais encontrados e
// corrigidos manualmente ao longo do desenvolvimento deste projeto — eles
// existem para que esses bugs nunca voltem silenciosamente.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
    calcularAnosCompletos,
    calcularAvisoPrevioProporcional,
    calcularAvos13,
    calcularAvosFerias,
    calcularINSS,
    calcularIRRF,
    calcularIRRFCompleto,
    anoDataValido
} from '../js/simuladores/calculos-folha.js';

const d = (ano, mes, dia) => new Date(ano, mes - 1, dia);

test('calcularAvos13', async (t) => {
    await t.test('admissão em fevereiro (mês de 29 dias em ano bissexto) não superestima os avos', () => {
        // Bug original: assumir mês fixo de 30 dias dava 7 em vez de 6.
        assert.equal(calcularAvos13(d(2024, 2, 16), d(2024, 9, 5)), 6);
    });

    await t.test('admissão e demissão no mesmo mês, menos de 15 dias trabalhados, conta 0 avos', () => {
        // Bug original: a fórmula antiga contava até o fim do mês mesmo
        // quando a pessoa foi desligada bem antes, dando 1 em vez de 0.
        assert.equal(calcularAvos13(d(2024, 1, 10), d(2024, 1, 20)), 0);
    });

    await t.test('caso real do usuário: término de experiência de 45 dias (03/08 a 16/09)', () => {
        assert.equal(calcularAvos13(d(2026, 8, 3), d(2026, 9, 16)), 2);
    });

    await t.test('admissão no fim do ano anterior: conta a partir de 1º de janeiro do ano de referência', () => {
        assert.equal(calcularAvos13(d(2023, 12, 31), d(2024, 1, 20)), 1);
    });

    await t.test('nunca passa de 12 nem fica negativo', () => {
        assert.ok(calcularAvos13(d(2000, 1, 1), d(2024, 12, 31)) <= 12);
        assert.ok(calcularAvos13(d(2024, 12, 31), d(2024, 12, 31)) >= 0);
    });
});

test('calcularAvosFerias', async (t) => {
    await t.test('caso real do usuário: 03/08 a 16/09 do mesmo ano', () => {
        assert.equal(calcularAvosFerias(d(2026, 8, 3), d(2026, 9, 16)), 1);
    });

    await t.test('exatamente 1 ano de casa, mesmo dia do aniversário, dá 0 avos do novo período', () => {
        assert.equal(calcularAvosFerias(d(2024, 3, 10), d(2025, 3, 10)), 0);
    });

    await t.test('11 meses e 20 dias arredonda para 12 avos (fração >= 15 dias)', () => {
        assert.equal(calcularAvosFerias(d(2024, 8, 1), d(2025, 7, 21)), 12);
    });
});

test('calcularAnosCompletos e calcularAvisoPrevioProporcional (Lei 12.506/2011)', async (t) => {
    await t.test('menos de 1 ano de casa: aviso mínimo de 30 dias', () => {
        assert.equal(calcularAnosCompletos(d(2024, 1, 1), d(2024, 11, 1)), 0);
        assert.equal(calcularAvisoPrevioProporcional(d(2024, 1, 1), d(2024, 11, 1)), 30);
    });

    await t.test('2 anos completos: 30 + 2*3 = 36 dias', () => {
        assert.equal(calcularAnosCompletos(d(2022, 5, 10), d(2024, 5, 10)), 2);
        assert.equal(calcularAvisoPrevioProporcional(d(2022, 5, 10), d(2024, 5, 10)), 36);
    });

    await t.test('25 anos de casa: teto de 90 dias', () => {
        assert.equal(calcularAvisoPrevioProporcional(d(1999, 1, 1), d(2024, 1, 1)), 90);
    });
});

test('calcularINSS (TABELA_INSS progressiva)', async (t) => {
    await t.test('exatamente no limite da 1ª faixa', () => {
        assert.equal(calcularINSS(1621).toFixed(2), '121.57');
    });

    await t.test('salário de 3.000 soma as 3 primeiras faixas', () => {
        assert.equal(calcularINSS(3000).toFixed(2), '248.60');
    });

    await t.test('acima do teto de contribuição, o desconto não passa do teto', () => {
        const noTeto = calcularINSS(8475.55);
        assert.equal(calcularINSS(10000).toFixed(2), noTeto.toFixed(2));
    });
});

test('calcularIRRF / calcularIRRFCompleto', async (t) => {
    await t.test('salário 3.000: desconto simplificado zera o imposto (isento)', () => {
        assert.equal(calcularIRRF(3000, calcularINSS(3000), 0).toFixed(2), '0.00');
    });

    await t.test('salário 8.000 (acima do teto da redução mensal): dedução legal vence, sem redução', () => {
        assert.equal(calcularIRRF(8000, calcularINSS(8000), 0).toFixed(2), '1037.85');
    });

    await t.test('salário 5.500 (dentro da faixa de redução mensal variável): aplica a redução sobre o modelo vencedor', () => {
        const r = calcularIRRFCompleto(5500, calcularINSS(5500), 0);
        assert.equal(r.modeloVencedor, 'Simplificado');
        assert.ok(r.reducaoEfetiva > 0, 'deveria aplicar redução mensal nessa faixa de salário');
        assert.ok(r.impostoFinal < r.impostoDevidoSemReducao, 'o imposto final deve ser menor que o devido sem redução');
    });
});

test('anoDataValido', async (t) => {
    await t.test('ano digitado incompleto (26 em vez de 2026) é inválido', () => {
        assert.equal(anoDataValido(d(26, 8, 3)), false);
    });

    await t.test('ano normal é válido', () => {
        assert.equal(anoDataValido(d(2026, 8, 3)), true);
    });

    await t.test('respeita os limites configurados', () => {
        assert.equal(anoDataValido(d(1950, 1, 1)), true);
        assert.equal(anoDataValido(d(1949, 12, 31)), false);
    });
});
