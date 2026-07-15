/**
 * @module GestaoJornada - Cálculos
 * @description Processa a matemática da CLT de forma reativa: cruza o Realizado com a Escala Semanal, apura Extras, Atrasos e Horas Fictas.
 */

"use strict";

document.addEventListener('DOMContentLoaded', () => {
    const btnCalcular = document.getElementById('btn-calcular-totais');
    const corpoTabela = document.getElementById('corpo-tabela-ponto');

    // Regras de Departamento Pessoal - CLT
    const INICIO_NOTURNO = 22 * 60; // 22:00
    const FIM_NOTURNO = 29 * 60;    // 05:00 (+24h)
    const FATOR_NOTURNO = 60 / 52.5;

    // Utilitários de Tempo
    function timeParaMinutos(timeStr) {
        if (!timeStr || timeStr.includes('-')) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h * 60) + m;
    }

    function minutosParaTime(totalMinutos) {
        if (totalMinutos === 0) return "00:00";
        const h = Math.floor(totalMinutos / 60);
        const m = Math.round(totalMinutos % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Calcula Horas Trabalhadas e Noturnas de um intervalo (Entrada-Saída)
    function apurarBatida(entrada, saida) {
        if (!entrada || !saida) return { trab: 0, noturno: 0 };

        let mEntrada = timeParaMinutos(entrada);
        let mSaida = timeParaMinutos(saida);

        // Se saiu no dia seguinte, soma 24h em minutos
        if (mSaida <= mEntrada) mSaida += (24 * 60);

        let minutosTotais = mSaida - mEntrada;
        let minutosNoturnos = 0;

        // Intersecção 1: Noite do próprio dia
        const intInicio = Math.max(mEntrada, INICIO_NOTURNO);
        const intFim = Math.min(mSaida, FIM_NOTURNO);
        if (intInicio < intFim) minutosNoturnos += (intFim - intInicio);

        // Intersecção 2: Plantões longos que chegam a uma segunda noite
        const intInicio2 = Math.max(mEntrada, INICIO_NOTURNO + (24 * 60));
        const intFim2 = Math.min(mSaida, FIM_NOTURNO + (24 * 60));
        if (intInicio2 < intFim2) minutosNoturnos += (intFim2 - intInicio2);

        return { trab: minutosTotais, noturno: minutosNoturnos };
    }

    // Lê os dados da Escala Importada para o dia da semana específico
    function calcularEscala(diaSemanaIndex) {
        if (!window.escalaColaborador || !window.escalaColaborador[diaSemanaIndex]) return 0;
        const esc = window.escalaColaborador[diaSemanaIndex];
        const t1 = apurarBatida(esc.e1, esc.s1);
        const t2 = apurarBatida(esc.e2, esc.s2);
        return t1.trab + t2.trab;
    }

    // Motor Central de Apuração
    function realizarApuracao() {
        const linhas = document.querySelectorAll('.linha-ponto');
        if (linhas.length === 0) return;
        
        let somas = { trab: 0, extra: 0, noturno: 0, ficta: 0, atraso: 0 };

        linhas.forEach(linha => {
            const diaSemanaIndex = linha.getAttribute('data-dia-semana');
            
            const e1 = linha.querySelector('.e1').value;
            const s1 = linha.querySelector('.s1').value;
            const e2 = linha.querySelector('.e2').value;
            const s2 = linha.querySelector('.s2').value;

            // 1. Apuração do Tempo Realizado no dia
            const turno1 = apurarBatida(e1, s1);
            const turno2 = apurarBatida(e2, s2);

            const diaTrab = turno1.trab + turno2.trab;
            const diaNoturnoReal = turno1.noturno + turno2.noturno;
            const diaFicta = diaNoturnoReal * FATOR_NOTURNO; 

            // 2. Apuração da Escala Esperada para gerar Extas ou Atrasos
            const diaEscala = calcularEscala(diaSemanaIndex);
            
            let diaExtra = 0;
            let diaAtraso = 0;

            if (diaTrab > diaEscala) {
                diaExtra = diaTrab - diaEscala;
            } else if (diaTrab < diaEscala) {
                diaAtraso = diaEscala - diaTrab;
            }

            // 3. Atualiza os Totais do Mês em Memória
            somas.trab += diaTrab;
            somas.extra += diaExtra;
            somas.noturno += diaNoturnoReal;
            somas.ficta += diaFicta;
            somas.atraso += diaAtraso;

            // 4. Escreve os resultados na Linha (DOM)
            linha.querySelector('.res-trab').textContent = minutosParaTime(diaTrab);
            linha.querySelector('.res-extra').textContent = minutosParaTime(diaExtra);
            linha.querySelector('.res-noturno').textContent = minutosParaTime(diaNoturnoReal);
            linha.querySelector('.res-ficta').textContent = minutosParaTime(diaFicta);
            linha.querySelector('.res-atraso').textContent = minutosParaTime(diaAtraso);
        });

        // 5. Atualiza o Rodapé Consolidado
        document.getElementById('tot-trab').textContent = minutosParaTime(somas.trab);
        document.getElementById('tot-extra').textContent = minutosParaTime(somas.extra);
        document.getElementById('tot-not').textContent = minutosParaTime(somas.noturno);
        document.getElementById('tot-ficta').textContent = minutosParaTime(somas.ficta);
        document.getElementById('tot-atraso').textContent = minutosParaTime(somas.atraso);
    }

    // ==========================================
    // ORQUESTRAÇÃO DE EVENTOS DE INTERFACE
    // ==========================================

    // Escuta o módulo de importação avisar que a tabela foi desenhada
    document.addEventListener('pontoImportado', realizarApuracao);

    // Reatividade: recalcula tudo se você digitar uma nova hora manualmente na tabela
    if (corpoTabela) {
        corpoTabela.addEventListener('change', (e) => {
            if (e.target.classList.contains('form-control')) {
                realizarApuracao();
            }
        });
    }

    // Botão forçar recalculo caso necessário
    if (btnCalcular) {
        btnCalcular.addEventListener('click', realizarApuracao);
    }
});