/**
 * Ferramentas DP - Gerador de PDF para Cota de Aprendiz
 * Dependência: pdfmake.min.js, vfs_fonts.js e window.dadosRelatorioAprendiz
 */

document.addEventListener("DOMContentLoaded", () => {
    const btnPdf = document.getElementById("btn-exportar-pdf");
    if (!btnPdf) return;

    btnPdf.addEventListener("click", () => {
        const dados = window.dadosRelatorioAprendiz;

        // Valida se o processamento já ocorreu
        if (!dados || Object.keys(dados).length === 0) {
            alert("Nenhum dado processado. Por favor, importe e processe uma planilha primeiro.");
            return;
        }

        // Função auxiliar para construir as linhas das tabelas do PDF
        const buildTableBody = (dataArray, colunas) => {
            const body = [];
            
            // Cabeçalho
            body.push(colunas.map(c => ({ 
                text: c.text, 
                style: 'tableHeader', 
                alignment: c.alignment || 'left' 
            })));
            
            // Tratamento se não houver dados na categoria
            if (!dataArray || dataArray.length === 0) {
                body.push([
                    { text: "Nenhum registro classificado nesta categoria.", colSpan: colunas.length, alignment: 'center', margin: [0, 10, 0, 10], color: '#64748b' },
                    ...Array(colunas.length - 1).fill("")
                ]);
                return body;
            }

            // Linhas de dados
            dataArray.forEach(row => {
                const dataRow = [];
                colunas.forEach(c => {
                    let valor = row[c.key] ? row[c.key].toString() : "";
                    dataRow.push({ 
                        text: valor, 
                        alignment: c.alignment || 'left', 
                        style: c.style || 'tableData' 
                    });
                });
                body.push(dataRow);
            });
            
            return body;
        };

        // Estrutura do Documento PDFMake
        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 40],
            
            // Cabeçalho Padrão
            header: function(currentPage, pageCount) {
                return {
                    text: 'Apuração de Cota de Aprendiz',
                    alignment: 'right',
                    margin: [0, 20, 40, 0],
                    fontSize: 9,
                    color: '#64748b'
                };
            },
            
            // Rodapé com Numeração
            footer: function(currentPage, pageCount) {
                return {
                    text: `Página ${currentPage} de ${pageCount}`,
                    alignment: 'center',
                    fontSize: 9,
                    margin: [0, 10, 0, 0],
                    color: '#64748b'
                };
            },
            
            content: [
                { text: 'RELATÓRIO DE DIMENSIONAMENTO', style: 'header' },
                { text: 'COTA DE JOVEM APRENDIZ (Art. 429 CLT)', style: 'subHeader' },
                
                // Quadro: Informações da Empresa
                {
                    style: 'companyInfo',
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                {
                                    text: [
                                        { text: 'Empresa: ', bold: true, color: '#334155' }, `${dados.empresa.razaoSocial}\n`,
                                        { text: 'CNPJ: ', bold: true, color: '#334155' }, `${dados.empresa.cnpj}`
                                    ],
                                    fillColor: '#f8fafc',
                                    border: [true, true, true, true],
                                    borderColor: ['#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1'],
                                    margin: [10, 10, 10, 10]
                                }
                            ]
                        ]
                    }
                },

                // Resumo de Métricas
                { text: '1. RESUMO DA APURAÇÃO', style: 'sectionTitle' },
                {
                    columns: [
                        { text: `Total Analisados\n\n${dados.resumoTotais.totalAnalisadosCount}`, style: 'metricCard' },
                        { text: `Base de Cálculo\n\n${dados.resumoTotais.baseCalculoEfetivaCount}`, style: 'metricCard', color: '#0284c7' },
                        { text: `Excluídos\n\n${dados.resumoTotais.totalExcluidosCount}`, style: 'metricCard', color: '#f59e0b' },
                        { text: `Não Encontrados\n\n${dados.resumoTotais.totalNaoEncontradosCount}`, style: 'metricCard', color: '#ef4444' }
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },

                // Dimensionamento Legal
                { text: '2. DIMENSIONAMENTO DA COTA OBRIGATÓRIA', style: 'sectionTitle' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*'],
                        body: [
                            [
                                { text: 'Mínimo Obrigatório (5%)', style: 'tableHeader', alignment: 'center', fillColor: '#10b981' },
                                { text: 'Média Recomendada (10%)', style: 'tableHeader', alignment: 'center', fillColor: '#0ea5e9' },
                                { text: 'Limite Máximo (15%)', style: 'tableHeader', alignment: 'center', fillColor: '#f59e0b' }
                            ],
                            [
                                { text: dados.dimensionamentoCotas.cotaMinima.toString(), alignment: 'center', fontSize: 24, bold: true, color: '#10b981', margin: [0, 15, 0, 15] },
                                { text: dados.dimensionamentoCotas.cotaMedia.toString(), alignment: 'center', fontSize: 24, bold: true, color: '#0ea5e9', margin: [0, 15, 0, 15] },
                                { text: dados.dimensionamentoCotas.cotaMaxima.toString(), alignment: 'center', fontSize: 24, bold: true, color: '#f59e0b', margin: [0, 15, 0, 15] }
                            ]
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 30]
                },

                // Tabela 1: Base de Cálculo
                { text: '3. BASE DE CÁLCULO LÍQUIDA (ELEGÍVEIS)', style: 'sectionTitle', pageBreak: 'before' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto'],
                        body: buildTableBody(dados.detalhes.base, [
                            { text: 'CBO', key: 'cbo', alignment: 'center' },
                            { text: 'Título da Função', key: 'titulo' },
                            { text: 'Escolaridade Exigida', key: 'escolaridade' },
                            { text: 'Qtd', key: 'quantidade', alignment: 'center' }
                        ])
                    },
                    layout: 'stripedStyle',
                    margin: [0, 0, 0, 20]
                },

                // Tabela 2: Funções Excluídas
                { text: '4. FUNÇÕES EXCLUÍDAS DA COTA', style: 'sectionTitle' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto'],
                        body: buildTableBody(dados.detalhes.excluidos, [
                            { text: 'CBO', key: 'cbo', alignment: 'center' },
                            { text: 'Título da Função', key: 'titulo' },
                            { text: 'Motivo da Exclusão', key: 'motivoExclusao', style: 'textWarning' },
                            { text: 'Qtd', key: 'quantidade', alignment: 'center' }
                        ])
                    },
                    layout: 'stripedStyle',
                    margin: [0, 0, 0, 20]
                }
            ],
            
            // Definição dos Estilos
            styles: {
                header: { fontSize: 16, bold: true, alignment: 'center', color: '#0f172a' },
                subHeader: { fontSize: 12, alignment: 'center', color: '#64748b', margin: [0, 5, 0, 20] },
                companyInfo: { margin: [0, 0, 0, 20] },
                sectionTitle: { fontSize: 12, bold: true, color: '#334155', margin: [0, 10, 0, 10] },
                metricCard: { fillColor: '#f1f5f9', margin: [5, 10, 5, 10], alignment: 'center', bold: true, fontSize: 13 },
                tableHeader: { bold: true, fontSize: 10, color: '#ffffff', fillColor: '#334155', margin: [0, 5, 0, 5] },
                tableData: { fontSize: 9, color: '#334155', margin: [0, 3, 0, 3] },
                textWarning: { fontSize: 9, color: '#f59e0b', margin: [0, 3, 0, 3] },
                textDanger: { fontSize: 9, color: '#ef4444', bold: true, margin: [0, 3, 0, 3] }
            }
        };

        // Layout de tabelas listradas customizado
        pdfMake.tableLayouts = {
            stripedStyle: {
                hLineWidth: function (i, node) { return 0.5; },
                vLineWidth: function (i, node) { return 0; },
                hLineColor: function (i, node) { return '#e2e8f0'; },
                paddingTop: function (i, node) { return 4; },
                paddingBottom: function (i, node) { return 4; },
                fillColor: function (rowIndex, node, columnIndex) {
                    if (rowIndex === 0) return null; // Cabeçalho sem cor de fundo pelo layout
                    return (rowIndex % 2 === 0) ? '#f8fafc' : null; // Linhas pares em cinza clarinho
                }
            }
        };

        // Adiciona a tabela de CBOs Não Encontrados caso existam
        if (dados.detalhes.naoEncontrados && dados.detalhes.naoEncontrados.length > 0) {
            docDefinition.content.push(
                { text: '5. CBOs NÃO ENCONTRADOS / REVISÃO NECESSÁRIA', style: 'sectionTitle', color: '#ef4444' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto'],
                        body: buildTableBody(dados.detalhes.naoEncontrados, [
                            { text: 'CBO Fornecido', key: 'cbo', alignment: 'center', style: 'textDanger' },
                            { text: 'Título', key: 'titulo', style: 'textDanger' },
                            { text: 'Status', key: 'escolaridade', style: 'textDanger' },
                            { text: 'Qtd', key: 'quantidade', alignment: 'center', style: 'textDanger' }
                        ])
                    },
                    layout: 'stripedStyle',
                    margin: [0, 0, 0, 20]
                }
            );
        }

        // Gera e faz download do PDF
        const cnpjNome = dados.empresa.cnpj.replace(/\D/g, '') ;
        pdfMake.createPdf(docDefinition).download(`Relatorio_Aprendiz ${cnpjNome}.pdf`);
    });
});