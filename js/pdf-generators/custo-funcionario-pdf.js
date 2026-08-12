// js/pdf-generators/custo-funcionario-pdf.js

export function gerarPDFCustoFuncionario(dados) {
    const formatarMoeda = (valor) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const formatarDecParaHoraStr = (dec) => {
        if (!dec || dec <= 0) return '00:00';
        const hh = Math.floor(dec);
        const mm = Math.round((dec - hh) * 60);
        return `${hh}:${String(mm).padStart(2, '0')}`;
    };

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: { fontSize: 10, color: '#334155' },
        
        header: {
            text: `Emitido em: ${dataAtual}`,
            margin: [40, 20, 40, 0],
            alignment: 'right',
            fontSize: 8,
            color: '#94a3b8'
        },

        content: [
            // CABEÇALHO DO RELATÓRIO
            { text: 'RELATÓRIO DE CUSTO DE FUNCIONÁRIO', style: 'header' },
            { 
                columns: [
                    { text: [ { text: 'Regime Tributário: ', bold: true }, dados.regime.toUpperCase() ] },
                    { text: [ { text: 'Multiplicador de Custo: ', bold: true }, `${dados.percCustoSobreSalario}% do Salário` ], alignment: 'center' },
                    { text: [ { text: 'Projeção: ', bold: true }, dados.labelPeriodo ], alignment: 'right' }
                ],
                margin: [0, 0, 0, 15]
            },

            // BLOCO 1 E 2: INDICADORES E BASES DE CÁLCULO
            {
                columns: [
                    [
                        { text: '1. Indicadores e Apontamentos do Mês', style: 'sectionTitle' },
                        {
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    ['Valor Dia', formatarMoeda(dados.vlrDia)],
                                    ['Valor Hora Base', formatarMoeda(dados.vlrHora)],
                                    [`Horas Extras 50% (${formatarDecParaHoraStr(dados.qtdHE)})`, formatarMoeda(dados.totalHE)],
                                    ...(dados.totalHE100 > 0 ? [[`Horas Extras 100% (${formatarDecParaHoraStr(dados.qtdHE100)})`, formatarMoeda(dados.totalHE100)]] : []),
                                    [`Adicional Noturno (${formatarDecParaHoraStr(dados.qtdHorasNoturnas)})`, formatarMoeda(dados.totalAdicionalNoturno)],
                                    [`H.E. Noturnas (${formatarDecParaHoraStr(dados.qtdHENoturnas)})`, formatarMoeda(dados.totalHENoturna)],
                                    ...(dados.totalDescontoFaltas > 0 ? [[`Faltas/Atrasos (${formatarDecParaHoraStr(dados.qtdFaltas)})`, `-${formatarMoeda(dados.totalDescontoFaltas)}`]] : []),
                                    ['Reflexo DSR (Verbas)', formatarMoeda(dados.dsrVariaveis)],
                                    ['Insalubridade / Periculosidade', formatarMoeda((dados.insalubridade || 0) + (dados.periculosidade || 0))]
                                ]
                            },
                            layout: 'lightHorizontalLines',
                            margin: [0, 0, 10, 15]
                        }
                    ],
                    [
                        { text: '2. Bases de Cálculo Fiscais', style: 'sectionTitle' },
                        {
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    ['Base de Cálculo INSS', formatarMoeda(dados.baseINSS)],
                                    ['Base de Cálculo FGTS', formatarMoeda(dados.baseFGTS)],
                                    ['Base de Cálculo IRRF', formatarMoeda(dados.baseIRRF)],
                                    ['Vale Transporte Bruto', formatarMoeda(dados.totalVTBrito)],
                                    ['(-) Desconto VT Holerite (6%)', `-${formatarMoeda(dados.descontoVTHolerite)}`],
                                    ['Custo Cota VT Empresa', formatarMoeda(dados.custoLiquidoVTEmpresa)]
                                ]
                            },
                            layout: 'lightHorizontalLines',
                            margin: [10, 0, 0, 15]
                        }
                    ]
                ]
            },

            // BLOCO 3: HOLERITE RESUMIDO
            { text: '3. Holerite Resumido (Base Mensal)', style: 'sectionTitle' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto'],
                    body: [
                        [{ text: 'Descrição', bold: true, fillColor: '#f1f5f9' }, { text: 'Valor (R$)', bold: true, alignment: 'right', fillColor: '#f1f5f9' }],
                        ['Salário Bruto de Apuração (Proventos)', { text: formatarMoeda(dados.salarioBase), alignment: 'right' }],
                        ['(-) Desconto INSS Colaborador', { text: `-${formatarMoeda(dados.inssCalculado)}`, alignment: 'right', color: '#b91c1c' }],
                        ['(-) Desconto IRRF Colaborador', { text: `-${formatarMoeda(dados.irrfCalculado)}`, alignment: 'right', color: '#b91c1c' }],
                        ...(dados.descontoVTHolerite > 0 ? [['(-) Desconto Vale Transporte (Até 6%)', { text: `-${formatarMoeda(dados.descontoVTHolerite)}`, alignment: 'right', color: '#b91c1c' }]] : []),
                        ...(dados.outrosDesc > 0 ? [['(-) Outros Descontos', { text: `-${formatarMoeda(dados.outrosDesc)}`, alignment: 'right', color: '#b91c1c' }]] : []),
                        [{ text: 'Líquido a Receber em Conta', bold: true }, { text: formatarMoeda(dados.liquido), bold: true, alignment: 'right' }],
                        ['Total de Benefícios Proporcionados', { text: formatarMoeda(dados.totalBeneficios), alignment: 'right' }],
                        [{ text: 'Valor Percebido pelo Colaborador', bold: true, color: '#1e3a8a' }, { text: formatarMoeda(dados.totalFuncionarioVisao), bold: true, alignment: 'right', color: '#1e3a8a' }]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 15]
            },

            // BLOCO 4 E 5: ENCARGOS E PROVISÕES
            {
                columns: [
                    [
                        { text: '4. Encargos Empresa (Mês)', style: 'sectionTitle' },
                        {
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [`FGTS Mês${dados.regime === 'domestico' ? ' (+3,2%)' : ''}`, { text: formatarMoeda(dados.encFGTS + dados.encFGTS40Domestico), alignment: 'right' }],
                                    ['INSS Patronal', { text: formatarMoeda(dados.encINSSPatronal), alignment: 'right' }],
                                    ['INSS Terceiros', { text: formatarMoeda(dados.encINSSTerceiros), alignment: 'right' }],
                                    ['INSS GILRAT', { text: formatarMoeda(dados.encINSSGilrat), alignment: 'right' }],
                                    [{ text: 'Total Encargos', bold: true }, { text: formatarMoeda(dados.totalEncargos), bold: true, alignment: 'right' }]
                                ]
                            },
                            layout: 'lightHorizontalLines',
                            margin: [0, 0, 10, 15]
                        }
                    ],
                    [
                        { text: '5. Provisões (1/12)', style: 'sectionTitle' },
                        {
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    ['Provisão Férias', { text: formatarMoeda(dados.provFerias), alignment: 'right' }],
                                    ['Provisão 1/3 Férias', { text: formatarMoeda(dados.provTerco), alignment: 'right' }],
                                    ['Provisão 13º Salário', { text: formatarMoeda(dados.provDecimo), alignment: 'right' }],
                                    ['Provisão FGTS', { text: formatarMoeda(dados.provFGTS), alignment: 'right' }],
                                    ...(dados.regime !== 'domestico' ? [['Provisão FGTS 40%', { text: formatarMoeda(dados.provFGTS40), alignment: 'right' }]] : []),
                                    ['Provisão INSS Empresa', { text: formatarMoeda(dados.provINSSEmpresa), alignment: 'right' }],
                                    [{ text: 'Total Provisões', bold: true }, { text: formatarMoeda(dados.totalProvisoes), bold: true, alignment: 'right' }]
                                ]
                            },
                            layout: 'lightHorizontalLines',
                            margin: [10, 0, 0, 15]
                        }
                    ]
                ]
            },

            // BLOCO 6: RESUMO EXECUTIVO (TOTAL PROJETADO)
            { text: `6. Resumo Executivo - Projeção ${dados.labelPeriodo}`, style: 'sectionTitle', margin: [0, 10, 0, 5] },
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'Colaborador (Mês)', alignment: 'center', fillColor: '#f8fafc', margin: [0, 5] },
                            { text: 'Encargos Patronais', alignment: 'center', fillColor: '#f8fafc', margin: [0, 5] },
                            { text: 'Provisões Reservadas', alignment: 'center', fillColor: '#f8fafc', margin: [0, 5] },
                            { text: 'Custo Total Projetado', alignment: 'center', bold: true, fillColor: '#0f172a', color: 'white', margin: [0, 5] }
                        ],
                        [
                            { text: formatarMoeda(dados.projFuncionario), alignment: 'center', bold: true, fontSize: 11, margin: [0, 10] },
                            { text: formatarMoeda(dados.projEncargos), alignment: 'center', bold: true, fontSize: 11, margin: [0, 10] },
                            { text: formatarMoeda(dados.projProvisao), alignment: 'center', bold: true, fontSize: 11, margin: [0, 10] },
                            { text: formatarMoeda(dados.projTotalAbsoluto), alignment: 'center', bold: true, fontSize: 13, color: '#10b981', margin: [0, 10] }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0,
                    vLineWidth: () => 0,
                    hLineColor: () => '#cbd5e1'
                }
            }
        ],

        styles: {
            header: { fontSize: 15, bold: true, alignment: 'center', color: '#0f172a', margin: [0, 0, 0, 12] },
            sectionTitle: { fontSize: 11, bold: true, color: '#1e40af', margin: [0, 0, 0, 8], borderBottom: true }
        }
    };

    window.pdfMake.createPdf(docDefinition).download(`Relatorio_Custo_Funcionario_${dados.labelPeriodo}.pdf`);
}
