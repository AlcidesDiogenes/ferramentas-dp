/**
 * @module Utilidades - Número por Extenso
 * @description Converte um número para o texto por extenso em português, como valor
 * monetário em reais (parte inteira e centavos) ou como número simples (parte inteira e,
 * se houver, casas decimais lidas dígito a dígito após "vírgula").
 */

"use strict";

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DIGITOS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DEZ_A_DEZENOVE = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

const ESCALAS = [
    { valor: 1000000000000, singular: 'trilhão', plural: 'trilhões' },
    { valor: 1000000000, singular: 'bilhão', plural: 'bilhões' },
    { valor: 1000000, singular: 'milhão', plural: 'milhões' },
    { valor: 1000, singular: 'mil', plural: 'mil' }
];

// Converte um número de 0 a 999 por extenso
function converterGrupo(num) {
    if (num === 0) return '';
    if (num === 100) return 'cem';

    const partes = [];
    const centena = Math.floor(num / 100);
    const resto = num % 100;

    if (centena > 0) partes.push(CENTENAS[centena]);

    if (resto > 0) {
        if (resto < 10) {
            partes.push(UNIDADES[resto]);
        } else if (resto < 20) {
            partes.push(DEZ_A_DEZENOVE[resto - 10]);
        } else {
            const dezena = Math.floor(resto / 10);
            const unidade = resto % 10;
            partes.push(unidade > 0 ? `${DEZENAS[dezena]} e ${UNIDADES[unidade]}` : DEZENAS[dezena]);
        }
    }

    return partes.join(' e ');
}

// Converte um número inteiro (sem casas decimais) por extenso, agrupando em milhares
function numeroPorExtenso(valorInteiro) {
    if (valorInteiro === 0) return 'zero';

    const grupos = [];
    let resto = valorInteiro;

    for (const escala of ESCALAS) {
        const qtd = Math.floor(resto / escala.valor);
        resto = resto % escala.valor;
        if (qtd === 0) continue;

        if (escala.valor === 1000 && qtd === 1) {
            grupos.push('mil');
        } else {
            grupos.push(`${converterGrupo(qtd)} ${qtd === 1 ? escala.singular : escala.plural}`);
        }
    }

    if (resto > 0) {
        grupos.push(converterGrupo(resto));
    }

    if (grupos.length === 1) return grupos[0];

    // Convenção padrão: vírgula entre os grupos, e "e" ligando o último grupo ao anterior
    let resultado = grupos[0];
    for (let i = 1; i < grupos.length; i++) {
        const separador = i === grupos.length - 1 ? ' e ' : ', ';
        resultado += separador + grupos[i];
    }
    return resultado;
}

function valorEmReaisPorExtenso(valor) {
    const valorArredondado = Math.round(Math.abs(valor) * 100) / 100;
    const reais = Math.floor(valorArredondado);
    const centavos = Math.round((valorArredondado - reais) * 100);

    if (reais === 0 && centavos === 0) return 'zero reais';

    const partes = [];
    if (reais > 0) {
        partes.push(`${numeroPorExtenso(reais)} ${reais === 1 ? 'real' : 'reais'}`);
    }
    if (centavos > 0) {
        partes.push(`${numeroPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);
    }

    return partes.join(' e ');
}

// Converte um número simples (não monetário) por extenso — parte decimal (se houver) é lida
// dígito a dígito após "vírgula", que é a convenção usual para números fora de contexto
// monetário (ex: 3,14 → "três vírgula um quatro").
function numeroSimplesPorExtenso(valor) {
    const negativo = valor < 0;
    const absoluto = Math.abs(valor);
    const parteInteira = Math.floor(absoluto);
    const decimalStr = absoluto.toFixed(2).split('.')[1];

    let resultado = numeroPorExtenso(parteInteira);
    if (decimalStr !== '00') {
        const digitosExtenso = decimalStr.split('').map(d => DIGITOS[parseInt(d, 10)]).join(' ');
        resultado += ` vírgula ${digitosExtenso}`;
    }

    return negativo ? `menos ${resultado}` : resultado;
}

function capitalizarPrimeiraLetra(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('valor-numerico');
    const output = document.getElementById('valor-extenso');
    const selectTipo = document.getElementById('tipo-extenso');
    const label = document.getElementById('label-valor-numerico');

    function recalcular() {
        const valor = parseFloat(input.value) || 0;
        const texto = selectTipo.value === 'numero'
            ? numeroSimplesPorExtenso(valor)
            : valorEmReaisPorExtenso(valor);
        output.textContent = capitalizarPrimeiraLetra(texto);
    }

    function atualizarLabel() {
        label.textContent = selectTipo.value === 'numero' ? 'Número' : 'Valor em Reais';
    }

    input.addEventListener('input', recalcular);
    selectTipo.addEventListener('change', () => {
        atualizarLabel();
        recalcular();
    });

    atualizarLabel();
    recalcular();
});
