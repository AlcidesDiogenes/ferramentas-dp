/**
 * @module AnaliseFiscal
 * @description Processador de Relatórios de Situação Fiscal da RFB
 * Nível: Produção / Enterprise
 */

"use strict";

class AnaliseFiscalProcessor {
    constructor() {
        // Configuração do Worker do PDF.js (Obrigatório para performance)
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Mapeamento de Elementos da DOM
        this.elementos = {
            input: document.getElementById('file-input-fiscal'),
            listaStatus: document.getElementById('lista-arquivos-fiscal'),
            tabelaCorpo: document.getElementById('tabela-corpo'),
            containerStatus: document.getElementById('import-status-fiscal'),
            containerTabela: document.getElementById('report-section')
        };

        this.iniciar();
    }

    /**
     * Inicializa os event listeners
     */
    iniciar() {
        if (!this.elementos.input) {
            console.error("AnaliseFiscal: Input de arquivo não encontrado.");
            return;
        }
        
        this.elementos.input.addEventListener('change', (e) => this.processarLote(e));
    }

    /**
     * Gerencia o lote de arquivos selecionados
     */
    async processarLote(evento) {
        const arquivos = evento.target.files;
        if (arquivos.length === 0) return;

        // Reset Total da Interface para nova leitura
        this.elementos.containerStatus.style.display = 'block';
        this.elementos.containerTabela.style.display = 'block';
        this.elementos.listaStatus.innerHTML = '';
        this.elementos.tabelaCorpo.innerHTML = '';

        // Processamento sequencial assíncrono
        for (const arquivo of arquivos) {
            const idLi = `status-${Math.random().toString(36).substr(2, 9)}`;
            this.adicionarStatusVisual(arquivo.name, 'Processando...', idLi, 'Carregando');

            try {
                const dadosExtraidos = await this.extrairDadosPDF(arquivo);
                this.renderizarLinhaTabela(dadosExtraidos);
                this.atualizarStatusVisual(idLi, 'Concluído', 'Sucesso');
            } catch (erro) {
                console.error(`Erro ao processar ${arquivo.name}:`, erro);
                this.atualizarStatusVisual(idLi, 'Erro na leitura', 'Erro');
            }
        }
        
        // Limpa o input para permitir selecionar os mesmos arquivos novamente
        this.elementos.input.value = '';
    }

    /**
     * Motor de extração de dados do PDF
     */
    async extrairDadosPDF(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            
            leitor.onload = async () => {
                try {
                    const dadosBinarios = new Uint8Array(leitor.result);
                    const pdf = await pdfjsLib.getDocument(dadosBinarios).promise;
                    
                    let nomeEmpresa = "Não identificado";
                    let identificador = "Não encontrado";
                    let situacaoFinal = "Regular";
                    let dataConsulta = "Data não identificada";

                    // 1. Extração da Página 1 (Foco Exclusivo nos Dados Cadastrais e Data)
                    const pagina1 = await pdf.getPage(1);
                    const conteudoPagina1 = await pagina1.getTextContent();
                    
                    // Junta os textos filtrando espaços inúteis para criar uma string contínua
                    const textoItens = conteudoPagina1.items.map(i => i.str.trim()).filter(i => i.length > 0);
                    const textoCompletoPagina1 = textoItens.join(' ');

                    // ==========================================
                    // EXTRAÇÃO 1: CNPJ/CPF e NOME
                    // ==========================================
                    const regexCabecalho = /(?:CPF|CNPJ):\s*([\d\.\-\/]+)\s+(.*?)(?:Dados Cadastrais|Por meio do Portal)/i;
                    const matchCabecalho = textoCompletoPagina1.match(regexCabecalho);

                    if (matchCabecalho) {
                        identificador = matchCabecalho[1]; 
                        let nomeBruto = matchCabecalho[2].trim();

                        // LIMPEZA DO NOME:
                        nomeEmpresa = nomeBruto
                            .replace(/^(da Matriz|da Filial)\s*/i, '') // Remove sujeira de filiais
                            .replace(/^[\-\s]+/, '') // CORREÇÃO: Remove o traço "-" e espaços logo no início do nome
                            .trim();
                        
                        // Busca secundária caso tenha pegado apenas o CNPJ Raiz (8 dígitos)
                        if (identificador.replace(/[^\d]/g, '').length === 8) {
                            const regexCNPJCompleto = /CNPJ:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i;
                            const matchCompleto = textoCompletoPagina1.match(regexCNPJCompleto);
                            if (matchCompleto) {
                                identificador = matchCompleto[1];
                            }
                        }
                    }

                    // ==========================================
                    // EXTRAÇÃO 2: DATA E HORA DA CONSULTA
                    // ==========================================
                    // Caça o padrão exato de Data e Hora: DD/MM/AAAA HH:MM:SS
                    const regexData = /(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/;
                    const matchData = textoCompletoPagina1.match(regexData);
                    
                    if (matchData) {
                        dataConsulta = matchData[1];
                    }

                    // ==========================================
                    // EXTRAÇÃO 3: VARREDURA DE PASSIVOS FISCAIS
                    // ==========================================
                    let temPendencia = false;
                    
                    for (let numPag = 1; numPag <= pdf.numPages; numPag++) {
                        const pagina = await pdf.getPage(numPag);
                        const conteudo = await pagina.getTextContent();
                        const textoPagina = conteudo.items.map(i => i.str).join(' ');

                        const qtdDevedor = (textoPagina.match(/\bDEVEDOR\b/gi) || []).length;
                        const qtdSdoDevedor = (textoPagina.match(/Sdo\.\s*Devedor/gi) || []).length;
                        
                        if (qtdDevedor > qtdSdoDevedor) {
                            temPendencia = true;
                            break;
                        }
                        
                        if (/(ATIVA AJUIZADA|ATIVA EM COBRANCA|ATIVA NAO AJUIZAVEL)/i.test(textoPagina)) {
                            temPendencia = true;
                            break;
                        }
                    }

                    if (temPendencia) situacaoFinal = "Com Pendência";

                    resolve({
                        nome: nomeEmpresa || "Empresa sem denominação",
                        documento: identificador,
                        dataConsulta: dataConsulta, // NOVA INFORMAÇÃO ENVIADA PARA A TABELA
                        situacao: situacaoFinal
                    });

                } catch (erro) {
                    reject(erro);
                }
            };
            
            leitor.readAsArrayBuffer(arquivo);
        });
    }

    /* ======================================================================
       Camada de Atualização de Interface (UI)
       ====================================================================== */

    adicionarStatusVisual(nomeArquivo, status, idLi, tipo) {
        const icone = tipo === 'Carregando' ? '⏳' : (tipo === 'Sucesso' ? '✅' : '❌');
        const cor = tipo === 'Erro' ? 'color: #e02424;' : 'color: var(--cor-texto-secundario);';
        
        const li = document.createElement('li');
        li.id = idLi;
        li.innerHTML = `<span style="margin-right: 8px;">${icone}</span> 
                        <strong>${nomeArquivo}</strong> - 
                        <span style="${cor}">${status}</span>`;
        this.elementos.listaStatus.appendChild(li);
    }

    atualizarStatusVisual(idLi, status, tipo) {
        const li = document.getElementById(idLi);
        if (li) {
            const icone = tipo === 'Sucesso' ? '✅' : '❌';
            const cor = tipo === 'Erro' ? 'color: #e02424;' : 'color: #107c41;';
            const nomeArquivo = li.querySelector('strong').innerText;
            li.innerHTML = `<span style="margin-right: 8px;">${icone}</span> 
                            <strong>${nomeArquivo}</strong> - 
                            <span style="font-weight: 600; ${cor}">${status}</span>`;
        }
    }

    renderizarLinhaTabela(dados) {
        const classeBadge = dados.situacao === 'Regular' ? '' : 'badge-critico';
        
        const tr = document.createElement('tr');
        // Nova estrutura do HTML refletida aqui, com a coluna de data adicionada
        tr.innerHTML = `
            <td style="font-weight: 500;">${dados.nome}</td>
            <td>${dados.documento}</td>
            <td style="color: var(--cor-texto-secundario); font-size: 0.9rem;">${dados.dataConsulta}</td>
            <td><span class="badge ${classeBadge}">${dados.situacao}</span></td>
        `;
        
        this.elementos.tabelaCorpo.appendChild(tr);
    }
}

// Inicializa o módulo quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    new AnaliseFiscalProcessor();
});