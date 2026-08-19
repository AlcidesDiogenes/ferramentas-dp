/**
 * @module Utilidades - Ajuste de Texto
 * @description Converte maiúsculas/minúsculas, capitaliza palavras/frases, alterna
 * capitalização, inverte, remove acentos e espaços extras, com contador de caracteres/palavras
 * e cópia rápida para a área de transferência.
 */

"use strict";

function alternarCapitalizacao(texto) {
    let maiuscula = true;
    return Array.from(texto).map(ch => {
        if (/\p{L}/u.test(ch)) {
            const resultado = maiuscula ? ch.toUpperCase() : ch.toLowerCase();
            maiuscula = !maiuscula;
            return resultado;
        }
        return ch;
    }).join('');
}

function inverterTexto(texto) {
    return Array.from(texto).reverse().join('');
}

function removerAcentos(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function removerEspacosExtras(texto) {
    return texto
        .split('\n')
        .map(linha => linha.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// Capitaliza a primeira letra de cada palavra, respeitando a lista de palavras ignoradas
// (artigos/preposições) e o comprimento mínimo — a primeira palavra do texto é sempre
// capitalizada, mesmo que esteja na lista de ignoradas.
function primeiraLetraPalavra(texto, minLetras, palavrasIgnoradas) {
    const ignorarSet = new Set(palavrasIgnoradas.map(p => p.trim().toLowerCase()).filter(Boolean));
    let primeira = true;

    return texto.replace(/\S+/g, (palavra) => {
        const somenteLetras = palavra.toLowerCase().replace(/[^\p{L}]/gu, '');
        const ehPrimeira = primeira;
        primeira = false;

        const deveIgnorar = !ehPrimeira && (somenteLetras.length < minLetras || ignorarSet.has(somenteLetras));
        const base = palavra.toLowerCase();

        if (deveIgnorar) return base;

        return base.replace(/^(\P{L}*)(\p{L})/u, (m, prefixo, letra) => prefixo + letra.toUpperCase());
    });
}

// Capitaliza apenas a primeira letra de cada frase (após ./!/? ou início do texto), o resto em minúsculo
function primeiraPalavraFrase(texto) {
    const base = texto.toLowerCase();
    return base.replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (m) => m.toUpperCase());
}

function atualizarContador(textarea, contadorEl) {
    const texto = textarea.value;
    const caracteres = texto.length;
    const palavras = texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;
    contadorEl.textContent = `${caracteres} caractere${caracteres === 1 ? '' : 's'}, ${palavras} palavra${palavras === 1 ? '' : 's'}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('texto-input');
    const contadorEl = document.getElementById('contador-texto');
    const minLetrasInput = document.getElementById('opt-min-letras');
    const ignorarPalavrasInput = document.getElementById('opt-ignorar-palavras');

    function aplicar(transformar) {
        textarea.value = transformar(textarea.value);
        atualizarContador(textarea, contadorEl);
        textarea.focus();
    }

    textarea.addEventListener('input', () => atualizarContador(textarea, contadorEl));

    document.getElementById('btn-maiusculo').addEventListener('click', () => {
        aplicar(texto => texto.toLocaleUpperCase('pt-BR'));
    });

    document.getElementById('btn-minusculo').addEventListener('click', () => {
        aplicar(texto => texto.toLocaleLowerCase('pt-BR'));
    });

    document.getElementById('btn-alternado').addEventListener('click', () => {
        aplicar(alternarCapitalizacao);
    });

    document.getElementById('btn-inverter').addEventListener('click', () => {
        aplicar(inverterTexto);
    });

    document.getElementById('btn-primeira-letra-palavra').addEventListener('click', () => {
        const minLetras = parseInt(minLetrasInput.value, 10) || 1;
        const palavrasIgnoradas = ignorarPalavrasInput.value.split(',');
        aplicar(texto => primeiraLetraPalavra(texto, minLetras, palavrasIgnoradas));
    });

    document.getElementById('btn-primeira-palavra-frase').addEventListener('click', () => {
        aplicar(primeiraPalavraFrase);
    });

    document.getElementById('btn-remover-acentos').addEventListener('click', () => {
        aplicar(removerAcentos);
    });

    document.getElementById('btn-remover-espacos').addEventListener('click', () => {
        aplicar(removerEspacosExtras);
    });

    document.getElementById('btn-selecionar-tudo').addEventListener('click', () => {
        textarea.focus();
        textarea.select();
    });

    document.getElementById('btn-copiar').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(textarea.value);
            if (window.showToast) window.showToast('Texto copiado para a área de transferência.', 'success');
        } catch (err) {
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            if (window.showToast) window.showToast('Texto copiado para a área de transferência.', 'success');
        }
    });

    document.getElementById('btn-limpar').addEventListener('click', () => {
        textarea.value = '';
        atualizarContador(textarea, contadorEl);
        textarea.focus();
    });
});
