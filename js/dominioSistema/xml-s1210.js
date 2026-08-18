/**
 * @module AnaliseXmlS1210
 * @description Processador completo de XMLs do eSocial S-1210 com suporte a filtros dinâmicos.
 */
"use strict";

import { exportarExcelS1210 } from '../excel-generators/xml-s1210-excel.js';
import { iconeSucesso, iconeErro } from '../icons.js';

/**
 * Escapa caracteres HTML especiais. Necessário porque os valores exibidos vêm do conteúdo
 * de arquivos XML (nome do arquivo e campos do eSocial), que podem ser de origem externa
 * (ex: um XML recebido de um contador/sistema terceiro) e não são confiáveis.
 */
function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

class XmlS1210Processor {
    constructor() {
        this.dadosGlobais = [];
        this.elementos = {
            input: document.getElementById('file-input-xml'),
            listaStatus: document.getElementById('lista-arquivos-xml'),
            containerStatus: document.getElementById('import-status-xml'),
            containerTabela: document.getElementById('report-section'),
            painelAcoes: document.getElementById('actions-panel'),
            tabelaCorpo: document.getElementById('tabela-corpo'),
            inputFiltro: document.getElementById('input-filtro'),
            btnExportar: document.getElementById('btn-export-excel')
        };
        this.iniciar();
    }

    iniciar() {
        if (!this.elementos.input) return;

        // Inicializa o motor de filtros global
        if (typeof MotorFiltros !== 'undefined') {
            MotorFiltros.init('#input-filtro', "Ex: '00012345678' ou '2026-05'");
        }

        this.elementos.input.addEventListener('change', (e) => this.processarLote(e));

        // Listener de filtro em tempo real
        if (this.elementos.inputFiltro) {
            this.elementos.inputFiltro.addEventListener('input', (e) => {
                const dadosFiltrados = MotorFiltros.filtrarMultiplo(
                    this.dadosGlobais,
                    e.target.value,
                    ['nome_arquivo', 'nrInsc_Empregador', 'cpfBenef', 'perApur', 'perRef']
                );
                this.renderizarTabela(dadosFiltrados);
            });
        }

        // Listener do botão de Excel
        if (this.elementos.btnExportar) {
            this.elementos.btnExportar.addEventListener('click', () => {
                // Ao exportar, podemos considerar o filtro ativo. 
                // Se o campo de filtro tiver texto, exportamos os visíveis, senão os globais.
                const termoFiltro = this.elementos.inputFiltro ? this.elementos.inputFiltro.value : '';
                
                let dadosParaExportar = this.dadosGlobais;
                if (termoFiltro.trim() !== '') {
                    dadosParaExportar = MotorFiltros.filtrarMultiplo(
                        this.dadosGlobais, 
                        termoFiltro, 
                        ['nome_arquivo', 'nrInsc_Empregador', 'cpfBenef', 'perApur', 'perRef']
                    );
                }
                exportarExcelS1210(dadosParaExportar);
            });
        }
    }

    async processarLote(evento) {
        const arquivos = evento.target.files;
        if (arquivos.length === 0) return;

        this.dadosGlobais = [];
        this.elementos.containerStatus.style.display = 'block';
        this.elementos.containerTabela.style.display = 'block';
        if (this.elementos.painelAcoes) this.elementos.painelAcoes.style.display = 'flex';
        this.elementos.listaStatus.innerHTML = '';
        this.elementos.tabelaCorpo.innerHTML = '';
        if (this.elementos.inputFiltro) this.elementos.inputFiltro.value = '';

        for (const arquivo of arquivos) {
            const idLi = `status-${Math.random().toString(36).substr(2, 9)}`;
            this.adicionarStatusVisual(arquivo.name, 'Processando...', idLi, 'Carregando');

            try {
                const textoXml = await this.lerArquivoComoTexto(arquivo);
                const registrosExtraidos = this.extrairDadosS1210(textoXml, arquivo.name);
                
                this.dadosGlobais.push(...registrosExtraidos);
                this.renderizarTabela(this.dadosGlobais);
                this.atualizarStatusVisual(idLi, 'Sucesso', 'Sucesso');
            } catch (erro) {
                console.error(`Erro ao processar ${arquivo.name}:`, erro);
                this.atualizarStatusVisual(idLi, 'Erro na leitura', 'Erro');
            }
        }
        this.elementos.input.value = '';
    }

    lerArquivoAsTexto(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = (e) => resolve(e.target.result);
            leitor.onerror = (e) => reject(e);
            leitor.readAsText(arquivo, 'UTF-8');
        });
    }

    async lerArquivoComoTexto(arquivo) {
        return await this.lerArquivoAsTexto(arquivo);
    }

    encontrarNoPorTag(elementoPai, nomeTag) {
        if (!elementoPai) return null;
        const todosElementos = elementoPai.getElementsByTagName('*');
        for (let i = 0; i < todosElementos.length; i++) {
            const elem = todosElementos[i];
            const tagLocal = elem.tagName.includes(':') ? elem.tagName.split(':')[1] : elem.tagName;
            if (tagLocal === nomeTag) return elem;
        }
        return null;
    }

    encontrarTodosNosPorTag(elementoPai, nomeTag) {
        if (!elementoPai) return [];
        const encontrados = [];
        const todosElementos = elementoPai.getElementsByTagName('*');
        for (let i = 0; i < todosElementos.length; i++) {
            const elem = todosElementos[i];
            const tagLocal = elem.tagName.includes(':') ? elem.tagName.split(':')[1] : elem.tagName;
            if (tagLocal === nomeTag) encontrados.push(elem);
        }
        return encontrados;
    }

    extrairDadosS1210(textoXml, nomeArquivo) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textoXml, "text/xml");
        
        if (xmlDoc.querySelector("parsererror")) {
            throw new Error("XML mal formatado");
        }

        const registros = [];
        const ideEmpregador = this.encontrarNoPorTag(xmlDoc, "ideEmpregador");
        const nrInscEmpregador = ideEmpregador ? (this.encontrarNoPorTag(ideEmpregador, "nrInsc")?.textContent || null) : null;

        const ideTransmissor = this.encontrarNoPorTag(xmlDoc, "ideTransmissor");
        const nrInscTransmissor = ideTransmissor ? (this.encontrarNoPorTag(ideTransmissor, "nrInsc")?.textContent || null) : null;

        const eventos = this.encontrarTodosNosPorTag(xmlDoc, "evento");

        eventos.forEach(evento => {
            const eventoId = evento.getAttribute("Id") || "";
            const ideEvento = this.encontrarNoPorTag(evento, "ideEvento");
            const perApur = ideEvento ? (this.encontrarNoPorTag(ideEvento, "perApur")?.textContent || null) : null;

            const ideBenef = this.encontrarNoPorTag(evento, "ideBenef");
            const cpfBenef = ideBenef ? (this.encontrarNoPorTag(ideBenef, "cpfBenef")?.textContent || null) : null;

            const infoPgtos = ideBenef ? this.encontrarTodosNosPorTag(ideBenef, "infoPgto") : [];

            infoPgtos.forEach(pgto => {
                const dtPgtoNode = this.encontrarNoPorTag(pgto, "dtPgto");
                const perRefNode = this.encontrarNoPorTag(pgto, "perRef");
                const ideDmDevNode = this.encontrarNoPorTag(pgto, "ideDmDev");
                const vrLiqNode = this.encontrarNoPorTag(pgto, "vrLiq");

                registros.push({
                    nome_arquivo: nomeArquivo,
                    nrInsc_Empregador: nrInscEmpregador,
                    nrInsc_Transmissor: nrInscTransmissor,
                    evento_Id: eventoId,
                    perApur: perApur,
                    cpfBenef: cpfBenef,
                    dtPgto: dtPgtoNode ? dtPgtoNode.textContent : null,
                    perRef: perRefNode ? perRefNode.textContent : null,
                    ideDmDev: ideDmDevNode ? ideDmDevNode.textContent : null,
                    vrLiq: vrLiqNode ? parseFloat(vrLiqNode.textContent) : null
                });
            });
        });

        return registros;
    }

    adicionarStatusVisual(nomeArquivo, status, idLi, tipo) {
        const icone = tipo === 'Carregando' ? '⏳' : (tipo === 'Sucesso' ? iconeSucesso() : iconeErro());
        const cor = tipo === 'Erro' ? 'color: #e02424;' : 'color: var(--cor-texto-secundario);';
        const li = document.createElement('li');
        li.id = idLi;
        li.innerHTML = `<span style="margin-right: 8px;">${icone}</span> <strong>${escapeHtml(nomeArquivo)}</strong> - <span style="${cor}">${escapeHtml(status)}</span>`;
        this.elementos.listaStatus.appendChild(li);
    }

    atualizarStatusVisual(idLi, status, tipo) {
        const li = document.getElementById(idLi);
        if (li) {
            const icone = tipo === 'Sucesso' ? iconeSucesso() : iconeErro();
            const cor = tipo === 'Erro' ? 'color: #e02424;' : 'color: #107c41;';
            const nomeArquivo = li.querySelector('strong').innerText;
            li.innerHTML = `<span style="margin-right: 8px;">${icone}</span> <strong>${escapeHtml(nomeArquivo)}</strong> - <span style="font-weight: 600; ${cor}">${escapeHtml(status)}</span>`;
        }
    }

    renderizarTabela(dados) {
        this.elementos.tabelaCorpo.innerHTML = '';
        if (dados.length === 0) {
            this.elementos.tabelaCorpo.innerHTML = `<tr><td colspan="10" style="text-align:center;">Nenhum registro encontrado ou compatível com o filtro.</td></tr>`;
            return;
        }

        dados.forEach(dado => {
            const tr = document.createElement('tr');
            const valorFormatado = dado.vrLiq !== null ? dado.vrLiq.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
            
            tr.innerHTML = `
                <td style="font-size: 0.75rem;">${escapeHtml(dado.nome_arquivo) || '-'}</td>
                <td style="font-size: 0.8rem;">${escapeHtml(dado.nrInsc_Empregador) || '-'}</td>
                <td style="font-size: 0.8rem;">${escapeHtml(dado.nrInsc_Transmissor) || '-'}</td>
                <td style="font-size: 0.75rem;">${escapeHtml(dado.evento_Id) || '-'}</td>
                <td>${escapeHtml(dado.perApur) || '-'}</td>
                <td><strong>${escapeHtml(dado.cpfBenef) || '-'}</strong></td>
                <td>${escapeHtml(dado.dtPgto) || '-'}</td>
                <td>${escapeHtml(dado.perRef) || '-'}</td>
                <td style="font-size: 0.75rem;">${escapeHtml(dado.ideDmDev) || '-'}</td>
                <td style="font-weight: 600; color: #107c41;">${valorFormatado}</td>
            `;
            this.elementos.tabelaCorpo.appendChild(tr);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new XmlS1210Processor();
});