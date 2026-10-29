/**
 * @module Utilidades - Calculadora de Tempo
 * @description Projeta datas somando ou subtraindo prazos (dias, meses e anos) e calcula a diferença exata entre datas.
 */

"use strict";

import {
    anoDataValido,
    calcularAnosCompletos,
    calcularAvisoPrevioProporcional,
    calcularDiferencaExata,
    projetarData
} from '../simuladores/calculos-folha.js';

function parseDataLocal(str) {
    if (!str) return null;
    return new Date(str + 'T00:00:00');
}

function formatarDataBR(data) {
    if (!data) return '';
    const d = String(data.getDate()).padStart(2, '0');
    const m = String(data.getMonth() + 1).padStart(2, '0');
    const y = data.getFullYear();
    return `${d}/${m}/${y}`;
}

const DIAS_SEMANA = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
];

const MESES_EXTENSO = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatarDataPorExtenso(data) {
    const diaSemana = DIAS_SEMANA[data.getDay()];
    return `${diaSemana}, ${data.getDate()} de ${MESES_EXTENSO[data.getMonth()]} de ${data.getFullYear()}`;
}

function calcularPascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
}

function chaveData(data) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function obterFeriadosNacionais(ano) {
    const pascoa = calcularPascoa(ano);
    const addDias = (base, n) => {
        const d = new Date(base);
        d.setDate(d.getDate() + n);
        return d;
    };

    const mapa = new Map();
    mapa.set(`${ano}-01-01`, 'Confraternização Universal');
    mapa.set(chaveData(addDias(pascoa, -47)), 'Terça-feira de Carnaval');
    mapa.set(chaveData(addDias(pascoa, -2)), 'Sexta-feira Santa');
    mapa.set(chaveData(pascoa), 'Domingo de Páscoa');
    mapa.set(`${ano}-04-21`, 'Tiradentes');
    mapa.set(`${ano}-05-01`, 'Dia do Trabalho');
    mapa.set(chaveData(addDias(pascoa, 60)), 'Corpus Christi');
    mapa.set(`${ano}-09-07`, 'Independência do Brasil');
    mapa.set(`${ano}-10-12`, 'Nossa Senhora Aparecida');
    mapa.set(`${ano}-11-02`, 'Finados');
    mapa.set(`${ano}-11-15`, 'Proclamação da República');
    mapa.set(`${ano}-11-20`, 'Dia da Consciência Negra');
    mapa.set(`${ano}-12-25`, 'Natal');
    return mapa;
}

function verificarStatusData(data) {
    const diaSemana = data.getDay();
    const feriados = obterFeriadosNacionais(data.getFullYear());
    const chave = chaveData(data);
    const nomeFeriado = feriados.get(chave);

    if (nomeFeriado) {
        return {
            tipo: 'feriado',
            rotulo: `Feriado Nacional: ${nomeFeriado}`,
            classeBadge: 'badge-calendar-aviso',
            icone: '⚠️',
            ehDiaUtil: false
        };
    }
    if (diaSemana === 0) {
        return {
            tipo: 'domingo',
            rotulo: 'Domingo (Dia não útil)',
            classeBadge: 'badge-calendar-aviso',
            icone: '⚠️',
            ehDiaUtil: false
        };
    }
    if (diaSemana === 6) {
        return {
            tipo: 'sabado',
            rotulo: 'Sábado (Fim de semana)',
            classeBadge: 'badge-calendar-aviso',
            icone: '⚠️',
            ehDiaUtil: false
        };
    }
    return {
        tipo: 'util',
        rotulo: 'Dia útil comercial (Segunda a Sexta)',
        classeBadge: 'badge-calendar-util',
        icone: '✓',
        ehDiaUtil: true
    };
}

function contarDiasUteisPeriodo(inicio, fim) {
    const dIni = inicio <= fim ? new Date(inicio) : new Date(fim);
    const dFim = inicio <= fim ? new Date(fim) : new Date(inicio);

    const anos = new Set();
    for (let a = dIni.getFullYear(); a <= dFim.getFullYear(); a++) anos.add(a);
    const todosFeriados = new Set();
    anos.forEach(ano => {
        for (const k of obterFeriadosNacionais(ano).keys()) {
            todosFeriados.add(k);
        }
    });

    let uteis = 0;
    const cursor = new Date(dIni);
    while (cursor <= dFim) {
        const ds = cursor.getDay();
        const ehFimDeSemana = ds === 0 || ds === 6;
        const ehFeriado = todosFeriados.has(chaveData(cursor));
        if (!ehFimDeSemana && !ehFeriado) {
            uteis++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return uteis;
}

function copiarTexto(texto, mensagemSucesso = 'Copiado para a área de transferência!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => {
            if (window.toast) window.toast.success(mensagemSucesso);
        }).catch(() => {
            fallbackCopiar(texto, mensagemSucesso);
        });
    } else {
        fallbackCopiar(texto, mensagemSucesso);
    }
}

function fallbackCopiar(texto, mensagemSucesso) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        if (window.toast) window.toast.success(mensagemSucesso);
    } catch {
        if (window.toast) window.toast.error('Não foi possível copiar automaticamente.');
    }
    document.body.removeChild(textarea);
}

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // Alternância de Abas (Tabs)
    // ----------------------------------------------------
    const tabBtnProjecao = document.getElementById('tab-btn-projecao');
    const tabBtnDiferenca = document.getElementById('tab-btn-diferenca');
    const painelProjecao = document.getElementById('painel-projecao');
    const painelDiferenca = document.getElementById('painel-diferenca');

    function alternarAba(abaAtiva) {
        if (abaAtiva === 'projecao') {
            tabBtnProjecao.classList.add('active');
            tabBtnProjecao.setAttribute('aria-selected', 'true');
            tabBtnDiferenca.classList.remove('active');
            tabBtnDiferenca.setAttribute('aria-selected', 'false');

            painelProjecao.style.display = 'block';
            painelDiferenca.style.display = 'none';
        } else {
            tabBtnDiferenca.classList.add('active');
            tabBtnDiferenca.setAttribute('aria-selected', 'true');
            tabBtnProjecao.classList.remove('active');
            tabBtnProjecao.setAttribute('aria-selected', 'false');

            painelDiferenca.style.display = 'block';
            painelProjecao.style.display = 'none';
        }
    }

    if (tabBtnProjecao && tabBtnDiferenca) {
        tabBtnProjecao.addEventListener('click', () => alternarAba('projecao'));
        tabBtnDiferenca.addEventListener('click', () => alternarAba('diferenca'));
    }

    // ----------------------------------------------------
    // Elementos da Aba 1 (Projetar Data)
    // ----------------------------------------------------
    const formProjecao = document.getElementById('form-projecao');
    const resultadoProjSection = document.getElementById('resultado-projecao-section');
    const resultadoProjDiv = document.getElementById('resultado-projecao');
    const btnLimparProj = document.getElementById('btn-limpar-proj');
    const checkRegraClt = document.getElementById('proj-regra-clt');

    // ----------------------------------------------------
    // Inicialização de Datas Padrão ("Hoje")
    // ----------------------------------------------------
    const hojeStr = new Date().toISOString().slice(0, 10);
    const inputProjInicio = document.getElementById('proj-data-inicio');
    const inputAdmissao = document.getElementById('data-admissao');
    const inputReferencia = document.getElementById('data-referencia');

    if (inputProjInicio) inputProjInicio.value = hojeStr;
    if (inputReferencia) inputReferencia.value = hojeStr;

    // Botões "Hoje" rápidos
    const btnHojeProj = document.getElementById('btn-hoje-proj');
    const btnHojeInicio = document.getElementById('btn-hoje-inicio');
    const btnHojeRef = document.getElementById('btn-hoje-ref');

    if (btnHojeProj) btnHojeProj.addEventListener('click', () => { inputProjInicio.value = hojeStr; });
    if (btnHojeInicio) btnHojeInicio.addEventListener('click', () => { inputAdmissao.value = hojeStr; });
    if (btnHojeRef) btnHojeRef.addEventListener('click', () => { inputReferencia.value = hojeStr; });

    // ----------------------------------------------------
    // Seletor de Operação (Somar / Subtrair)
    // ----------------------------------------------------
    const radiosOp = document.querySelectorAll('input[name="operacao"]');
    const labelOpSomar = document.getElementById('label-op-somar');
    const labelOpSubtrair = document.getElementById('label-op-subtrair');

    radiosOp.forEach(radio => {
        radio.addEventListener('change', () => {
            resultadoProjSection.style.display = 'none';
            if (radio.value === 'somar') {
                labelOpSomar.classList.add('active');
                labelOpSubtrair.classList.remove('active');
            } else {
                labelOpSubtrair.classList.add('active');
                labelOpSomar.classList.remove('active');
            }
        });
    });

    // ----------------------------------------------------
    // Chips de Atalho Rápido do DP (+15d, +30d, +45d, etc.)
    // ----------------------------------------------------
    const inputAnos = document.getElementById('proj-anos');
    const inputMeses = document.getElementById('proj-meses');
    const inputDias = document.getElementById('proj-dias');
    const chipBtns = document.querySelectorAll('.chip-btn');

    chipBtns.forEach(chip => {
        chip.addEventListener('click', () => {
            if (chip.dataset.chipDias !== undefined) {
                inputDias.value = chip.dataset.chipDias;
                inputMeses.value = '';
                inputAnos.value = '';
            } else if (chip.dataset.chipMeses !== undefined) {
                inputMeses.value = chip.dataset.chipMeses;
                inputDias.value = '';
                inputAnos.value = '';
            } else if (chip.dataset.chipAnos !== undefined) {
                inputAnos.value = chip.dataset.chipAnos;
                inputMeses.value = '';
                inputDias.value = '';
            }

            // O resultado só deve aparecer quando o usuário clicar em "Calcular Data"
            resultadoProjSection.style.display = 'none';
        });
    });

    // Oculta resultado anterior caso qualquer campo seja alterado
    [inputProjInicio, inputAnos, inputMeses, inputDias, checkRegraClt].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                resultadoProjSection.style.display = 'none';
            });
            input.addEventListener('change', () => {
                resultadoProjSection.style.display = 'none';
            });
        }
    });

    // ----------------------------------------------------
    // ABA 1: PROJETAR DATA (SOMAR / SUBTRAIR PRAZOS)
    // ----------------------------------------------------
    if (btnLimparProj) {
        btnLimparProj.addEventListener('click', () => {
            inputAnos.value = '';
            inputMeses.value = '';
            inputDias.value = '';
            resultadoProjSection.style.display = 'none';
            resultadoProjDiv.innerHTML = '';
            if (window.toast) window.toast.info('Formulário limpo com sucesso.');
        });
    }

    formProjecao.addEventListener('submit', (e) => {
        e.preventDefault();

        const dataInicio = parseDataLocal(inputProjInicio.value);
        if (!dataInicio) {
            if (window.toast) window.toast.warning('Informe a Data de Início.');
            return;
        }

        if (!anoDataValido(dataInicio)) {
            resultadoProjDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger, #b91c1c); text-align: center;">Ano da Data de Início parece incorreto (verifique se digitou o ano completo, ex: 2026 e não 26).</p></div>`;
            resultadoProjSection.style.display = 'block';
            return;
        }

        const anos = parseInt(inputAnos.value, 10) || 0;
        const meses = parseInt(inputMeses.value, 10) || 0;
        const dias = parseInt(inputDias.value, 10) || 0;

        if (anos === 0 && meses === 0 && dias === 0) {
            if (window.toast) window.toast.warning('Informe ao menos uma quantidade de dias, meses ou anos para calcular.');
            return;
        }

        const radioOp = document.querySelector('input[name="operacao"]:checked');
        const operacao = radioOp ? radioOp.value : 'somar';
        const incluirDiaInicio = checkRegraClt.checked && operacao === 'somar';

        const dataResultante = projetarData(dataInicio, {
            anos,
            meses,
            dias,
            operacao,
            incluirDiaInicio
        });

        if (!anoDataValido(dataResultante)) {
            resultadoProjDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger, #b91c1c); text-align: center;">A data projetada ultrapassou limites válidos.</p></div>`;
            resultadoProjSection.style.display = 'block';
            return;
        }

        const statusCalendario = verificarStatusData(dataResultante);
        const diasCorridos = Math.abs(Math.round((dataResultante - dataInicio) / 86400000));
        const diasUteisPeriodo = contarDiasUteisPeriodo(dataInicio, dataResultante);

        // Montagem do texto explicativo do prazo
        const partesPrazo = [];
        if (anos > 0) partesPrazo.push(`${anos} ${anos > 1 ? 'anos' : 'ano'}`);
        if (meses > 0) partesPrazo.push(`${meses} ${meses > 1 ? 'meses' : 'mês'}`);
        if (dias > 0) partesPrazo.push(`${dias} ${dias > 1 ? 'dias' : 'dia'}`);
        const prazoFormatado = partesPrazo.join(', ');

        const sinalOp = operacao === 'somar' ? '+' : '-';
        const tituloOperacao = operacao === 'somar' ? 'Data de Término / Vencimento' : 'Data Retroativa';

        let notaRegraClt = '';
        if (incluirDiaInicio) {
            notaRegraClt = `
                <div style="margin-top: 10px; font-size: 0.82rem; color: var(--cor-texto-secundario, #64748b);">
                    * Regra de vigência CLT aplicada: o primeiro dia (${formatarDataBR(dataInicio)}) contou como o Dia 1 de trabalho.
                </div>
            `;
        }

        resultadoProjDiv.innerHTML = `
            <div class="sim-card">
                <div class="calc-hero-card">
                    <span class="calc-hero-label">${tituloOperacao}</span>
                    <span class="calc-hero-value">${formatarDataBR(dataResultante)}</span>
                    <span class="calc-hero-subvalue">${formatarDataPorExtenso(dataResultante)}</span>
                    <div>
                        <span class="badge-calendar ${statusCalendario.classeBadge}">
                            ${statusCalendario.icone} ${statusCalendario.rotulo}
                        </span>
                    </div>
                </div>

                <div class="sim-section">
                    <h4>Resumo da Projeção de Prazo</h4>
                    <div class="sim-grid">
                        <div class="sim-item">
                            <span class="sim-label">Data de Início</span>
                            <span class="sim-value">${formatarDataBR(dataInicio)} <small style="font-size:0.8rem; font-weight:normal; color:var(--cor-texto-secundario);">(${DIAS_SEMANA[dataInicio.getDay()]})</small></span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Prazo Aplicado</span>
                            <span class="sim-value" style="color: var(--cor-destaque, #2563eb); font-weight: 700;">${sinalOp} ${prazoFormatado}</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Total de Dias Corridos</span>
                            <span class="sim-value">${diasCorridos} dia(s)</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Dias Úteis no Período</span>
                            <span class="sim-value">${diasUteisPeriodo} dia(s)</span>
                        </div>
                    </div>
                    ${notaRegraClt}
                </div>

                <div style="display: flex; justify-content: center; gap: 12px; margin-top: 20px;">
                    <button type="button" class="btn-action" id="btn-copiar-proj" style="padding: 0 20px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        Copiar Resultado
                    </button>
                </div>
            </div>
        `;

        resultadoProjSection.style.display = 'block';

        const btnCopiarProj = document.getElementById('btn-copiar-proj');
        if (btnCopiarProj) {
            btnCopiarProj.addEventListener('click', () => {
                const textoCopiar = `Data de Início: ${formatarDataBR(dataInicio)} (${DIAS_SEMANA[dataInicio.getDay()]})\nPrazo: ${sinalOp} ${prazoFormatado}\nData Resultante: ${formatarDataBR(dataResultante)} (${DIAS_SEMANA[dataResultante.getDay()]})\nStatus: ${statusCalendario.rotulo}`;
                copiarTexto(textoCopiar, 'Data projetada copiada com sucesso!');
            });
        }

        resultadoProjSection.scrollIntoView({ behavior: 'smooth' });
    });

    // ----------------------------------------------------
    // ABA 2: DIFERENÇA ENTRE DATAS (TEMPO DE CASA / DECORRIDO)
    // ----------------------------------------------------
    const formDiferenca = document.getElementById('form-tempo-casa');
    const resultSection = document.getElementById('resultado-section');
    const resultDiv = document.getElementById('resultado-calculo');
    const btnLimparDif = document.getElementById('btn-limpar-dif');
    const checkIncluirUltimoDia = document.getElementById('dif-incluir-ultimo-dia');

    // Oculta resultado anterior caso qualquer campo da aba diferença seja alterado
    [inputAdmissao, inputReferencia, checkIncluirUltimoDia].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                resultSection.style.display = 'none';
            });
            input.addEventListener('change', () => {
                resultSection.style.display = 'none';
            });
        }
    });

    if (btnLimparDif) {
        btnLimparDif.addEventListener('click', () => {
            inputAdmissao.value = '';
            inputReferencia.value = hojeStr;
            checkIncluirUltimoDia.checked = false;
            resultSection.style.display = 'none';
            resultDiv.innerHTML = '';
            if (window.toast) window.toast.info('Formulário limpo com sucesso.');
        });
    }

    formDiferenca.addEventListener('submit', (e) => {
        e.preventDefault();

        const dataInicio = parseDataLocal(inputAdmissao.value);
        const referencia = parseDataLocal(inputReferencia.value);

        if (!dataInicio || !referencia) {
            if (window.toast) window.toast.warning('Informe a Data de Início e a Data de Referência.');
            return;
        }

        if (referencia < dataInicio) {
            resultDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger, #b91c1c); text-align: center;">A data final/referência não pode ser anterior à data de início.</p></div>`;
            resultSection.style.display = 'block';
            return;
        }

        if (!anoDataValido(dataInicio) || !anoDataValido(referencia)) {
            resultDiv.innerHTML = `<div class="sim-card"><p style="color: var(--cor-text-danger, #b91c1c); text-align: center;">Ano de início ou referência parece incorreto (confira se digitou o ano completo, ex: 2026 e não 26).</p></div>`;
            resultSection.style.display = 'block';
            return;
        }

        const incluirUltimoDia = checkIncluirUltimoDia ? checkIncluirUltimoDia.checked : false;
        const { anos, meses, dias, totalDiasCorridos } = calcularDiferencaExata(dataInicio, referencia, incluirUltimoDia);
        const diasUteis = contarDiasUteisPeriodo(dataInicio, referencia);
        const semanasCompletas = Math.floor(totalDiasCorridos / 7);

        // Cálculo de aviso prévio proporcional CLT (Lei 12.506/2011)
        const anosCompletosServico = calcularAnosCompletos(dataInicio, referencia);
        const diasAvisoPrevio = calcularAvisoPrevioProporcional(dataInicio, referencia);

        const partesTempo = [];
        if (anos > 0) partesTempo.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
        if (meses > 0) partesTempo.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
        if (dias > 0 || partesTempo.length === 0) partesTempo.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);

        let tempoExtenso = '';
        if (partesTempo.length === 3) {
            tempoExtenso = `${partesTempo[0]}, ${partesTempo[1]} e ${partesTempo[2]}`;
        } else if (partesTempo.length === 2) {
            tempoExtenso = `${partesTempo[0]} e ${partesTempo[1]}`;
        } else {
            tempoExtenso = partesTempo[0];
        }

        resultDiv.innerHTML = `
            <div class="sim-card">
                <div class="calc-hero-card">
                    <span class="calc-hero-label">Tempo Total Decorrido</span>
                    <span class="calc-hero-value" style="font-size: 1.8rem;">${tempoExtenso}</span>
                    <span class="calc-hero-subvalue">${new Intl.NumberFormat('pt-BR').format(totalDiasCorridos)} dias corridos totais</span>
                </div>

                <div class="sim-section">
                    <h4>Detalhamento do Período</h4>
                    <div class="sim-grid">
                        <div class="sim-item">
                            <span class="sim-label">Anos completos</span>
                            <span class="sim-value">${anos}</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Meses completos (excedentes)</span>
                            <span class="sim-value">${meses}</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Dias (excedentes)</span>
                            <span class="sim-value">${dias}</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Total de Semanas</span>
                            <span class="sim-value">${semanasCompletas} semana(s)</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Dias Úteis no Período</span>
                            <span class="sim-value">${diasUteis} dia(s)</span>
                        </div>
                        <div class="sim-item">
                            <span class="sim-label">Dias Corridos</span>
                            <span class="sim-value">${new Intl.NumberFormat('pt-BR').format(totalDiasCorridos)}</span>
                        </div>
                    </div>
                </div>

                <div class="sim-section">
                    <h4>Aplicação em Departamento Pessoal</h4>
                    <div style="background-color: var(--cor-card-subtle-bg, #f8fafc); border: 1px solid var(--cor-borda, #cbd5e1); border-radius: 8px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <strong style="color: var(--cor-texto-principal, #1e293b); font-size: 0.95rem;">Aviso Prévio Proporcional (Lei 12.506/2011)</strong>
                                <p style="margin: 4px 0 0; font-size: 0.82rem; color: var(--cor-texto-secundario, #64748b);">
                                    Baseado em ${anosCompletosServico} ano(s) completo(s) de serviço prestado (30 dias base + 3 dias por ano completo, até o teto de 90 dias).
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 1.5rem; font-weight: 800; color: var(--cor-destaque, #2563eb);">${diasAvisoPrevio} dias</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: center; gap: 12px; margin-top: 20px;">
                    <button type="button" class="btn-action" id="btn-copiar-dif" style="padding: 0 20px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        Copiar Resumo
                    </button>
                </div>
            </div>
        `;

        resultSection.style.display = 'block';

        const btnCopiarDif = document.getElementById('btn-copiar-dif');
        if (btnCopiarDif) {
            btnCopiarDif.addEventListener('click', () => {
                const textoCopiar = `Data de Início: ${formatarDataBR(dataInicio)}\nData Final/Referência: ${formatarDataBR(referencia)}\nTempo Decorrido: ${tempoExtenso}\nDias Corridos: ${totalDiasCorridos}\nDias Úteis: ${diasUteis}\nAviso Prévio Devido (Lei 12.506/2011): ${diasAvisoPrevio} dias`;
                copiarTexto(textoCopiar, 'Resumo do tempo decorrido copiado com sucesso!');
            });
        }

        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
});
