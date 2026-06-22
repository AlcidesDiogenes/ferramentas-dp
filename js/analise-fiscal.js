/**
 * @module AnaliseFiscal
 * @description Processador de Relatórios de Situação Fiscal da RFB
 * Nível: Produção / Enterprise (Com Exportação e Filtro)
 */

"use strict";

class AnaliseFiscalProcessor {
    constructor() {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Memória Global para o Filtro e Exportação
        this.dadosGlobais = [];

        // Mapeamento de Elementos da DOM
        this.elementos = {
            input: document.getElementById('file-input-fiscal'),
            listaStatus: document.getElementById('lista-arquivos-fiscal'),
            tabelaCorpo: document.getElementById('tabela-corpo'),
            containerStatus: document.getElementById('import-status-fiscal'),
            containerTabela: document.getElementById('report-section'),
            painelAcoes: document.getElementById('actions-panel-fiscal'),
            btnExcel: document.getElementById('btn-export-excel-fiscal'),
            btnPdf: document.getElementById('btn-export-pdf-fiscal'),
            inputFiltro: document.getElementById('input-filtro-fiscal')
        };

        this.iniciar();
    }

    iniciar() {
        if (!this.elementos.input) return;
        
        // Inicia Motor de Filtros Visualmente
        if (typeof MotorFiltros !== 'undefined') {
            MotorFiltros.init('#input-filtro-fiscal', "Ex: 'Devedor' ou 'Empresa X'");
        }
        
        // Event Listeners
        this.elementos.input.addEventListener('change', (e) => this.processarLote(e));
        
        if (this.elementos.btnExcel) {
            this.elementos.btnExcel.addEventListener('click', () => this.exportarExcel());
        }
        if (this.elementos.btnPdf) {
            this.elementos.btnPdf.addEventListener('click', () => this.exportarPDF());
        }
        
        if (this.elementos.inputFiltro) {
            this.elementos.inputFiltro.addEventListener('input', (e) => this.filtrarTabela(e.target.value));
        }
    }

    async processarLote(evento) {
        const arquivos = evento.target.files;
        if (arquivos.length === 0) return;

        // Reset Total da Interface e Dados
        this.dadosGlobais = [];
        this.elementos.containerStatus.style.display = 'block';
        this.elementos.containerTabela.style.display = 'block';
        this.elementos.painelAcoes.style.display = 'flex';
        this.elementos.listaStatus.innerHTML = '';
        this.elementos.tabelaCorpo.innerHTML = '';
        if (this.elementos.inputFiltro) this.elementos.inputFiltro.value = '';

        for (const arquivo of arquivos) {
            const idLi = `status-${Math.random().toString(36).substr(2, 9)}`;
            this.adicionarStatusVisual(arquivo.name, 'Processando...', idLi, 'Carregando');

            try {
                const dadosExtraidos = await this.extrairDadosPDF(arquivo);
                this.dadosGlobais.push(dadosExtraidos);
                this.renderizarTabela(this.dadosGlobais);
                this.atualizarStatusVisual(idLi, 'Concluído', 'Sucesso');
            } catch (erro) {
                console.error(`Erro ao processar ${arquivo.name}:`, erro);
                this.atualizarStatusVisual(idLi, 'Erro na leitura', 'Erro');
            }
        }
        
        this.elementos.input.value = '';
    }

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

                    const pagina1 = await pdf.getPage(1);
                    const conteudoPagina1 = await pagina1.getTextContent();
                    const textoItens = conteudoPagina1.items.map(i => i.str.trim()).filter(i => i.length > 0);
                    const textoCompletoPagina1 = textoItens.join(' ');

                    const regexCabecalho = /(?:CPF|CNPJ):\s*([\d\.\-\/]+)\s+(.*?)(?:Dados Cadastrais|Por meio do Portal)/i;
                    const matchCabecalho = textoCompletoPagina1.match(regexCabecalho);

                    if (matchCabecalho) {
                        identificador = matchCabecalho[1]; 
                        let nomeBruto = matchCabecalho[2].trim();
                        nomeEmpresa = nomeBruto.replace(/^(da Matriz|da Filial)\s*/i, '').replace(/^[\-\s]+/, '').trim();
                        
                        if (identificador.replace(/[^\d]/g, '').length === 8) {
                            const regexCNPJCompleto = /CNPJ:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i;
                            const matchCompleto = textoCompletoPagina1.match(regexCNPJCompleto);
                            if (matchCompleto) identificador = matchCompleto[1];
                        }
                    }

                    const regexData = /(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/;
                    const matchData = textoCompletoPagina1.match(regexData);
                    if (matchData) dataConsulta = matchData[1];

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
                        dataConsulta: dataConsulta,
                        situacao: situacaoFinal
                    });

                } catch (erro) {
                    reject(erro);
                }
            };
            leitor.readAsArrayBuffer(arquivo);
        });
    }

    /* ==================== CAMADA VISUAL E RENDERIZAÇÃO ==================== */

    adicionarStatusVisual(nomeArquivo, status, idLi, tipo) {
        const icone = tipo === 'Carregando' ? '⏳' : (tipo === 'Sucesso' ? '✅' : '❌');
        const cor = tipo === 'Erro' ? 'color: #e02424;' : 'color: var(--cor-texto-secundario);';
        const li = document.createElement('li');
        li.id = idLi;
        li.innerHTML = `<span style="margin-right: 8px;">${icone}</span> <strong>${nomeArquivo}</strong> - <span style="${cor}">${status}</span>`;
        this.elementos.listaStatus.appendChild(li);
    }

    atualizarStatusVisual(idLi, status, tipo) {
        const li = document.getElementById(idLi);
        if (li) {
            const icone = tipo === 'Sucesso' ? '✅' : '❌';
            const cor = tipo === 'Erro' ? 'color: #e02424;' : 'color: #107c41;';
            const nomeArquivo = li.querySelector('strong').innerText;
            li.innerHTML = `<span style="margin-right: 8px;">${icone}</span> <strong>${nomeArquivo}</strong> - <span style="font-weight: 600; ${cor}">${status}</span>`;
        }
    }

    renderizarTabela(dadosParaRenderizar) {
        this.elementos.tabelaCorpo.innerHTML = '';
        
        if (dadosParaRenderizar.length === 0) {
            this.elementos.tabelaCorpo.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum registro encontrado.</td></tr>`;
            return;
        }

        dadosParaRenderizar.forEach(dados => {
            const classeBadge = dados.situacao === 'Regular' ? '' : 'badge-critico';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${dados.nome}</td>
                <td>${dados.documento}</td>
                <td style="color: var(--cor-texto-secundario); font-size: 0.9rem;">${dados.dataConsulta}</td>
                <td><span class="badge ${classeBadge}">${dados.situacao}</span></td>
            `;
            this.elementos.tabelaCorpo.appendChild(tr);
        });
    }

    filtrarTabela(termo) {
        if (typeof MotorFiltros === 'undefined') return;
        const dadosFiltrados = MotorFiltros.filtrarMultiplo(
            this.dadosGlobais, 
            termo, 
            ['nome', 'documento', 'situacao']
        );
        this.renderizarTabela(dadosFiltrados);
    }

    /* ==================== EXPORTAÇÕES ==================== */

    exportarExcel() {
        // Pega apenas as linhas que estão visíveis na tela (respeita o filtro)
        const linhasVisiveis = Array.from(this.elementos.tabelaCorpo.querySelectorAll('tr')).filter(tr => tr.children.length > 1);
        if (linhasVisiveis.length === 0) return alert("Nenhum dado para exportar.");

        const docsVisiveis = linhasVisiveis.map(tr => tr.children[1].innerText);
        const dadosParaPlanilha = this.dadosGlobais
            .filter(d => docsVisiveis.includes(d.documento))
            .map(d => ({
                'Nome / Empresa': d.nome,
                'CPF/CNPJ': d.documento,
                'Data da Consulta': d.dataConsulta,
                'Situação': d.situacao
            }));

        const ws = XLSX.utils.json_to_sheet(dadosParaPlanilha);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Análise Fiscal");

        // Ajusta a largura das colunas do Excel
        ws['!cols'] = [{wch: 45}, {wch: 20}, {wch: 22}, {wch: 15}];
        XLSX.writeFile(wb, "Relatorio_Analise_Fiscal.xlsx");
    }

    exportarPDF() {
        const elementoRelatorio = document.getElementById('print-area');
        const opcoes = {
            margin:       [10, 10, 10, 10],
            filename:     'Relatorio_Analise_Fiscal.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opcoes).from(elementoRelatorio).save();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AnaliseFiscalProcessor();
});