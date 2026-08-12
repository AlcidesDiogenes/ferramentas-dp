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

    const tabelaIndicadoresBody = [
        ['Valor Dia', formatarMoeda(dados.vlrDia)],
        ['Valor Hora Base', formatarMoeda(dados.vlrHora)],
        ['Valor Hora Extra 50%', `${formatarMoeda(dados.vlrHoraExtra)}/h`],
        ['Valor Hora Extra 100%', `${formatarMoeda(dados.vlrHoraExtra100)}/h`],
        ['Valor Adicional Noturno', `${formatarMoeda(dados.vlrAdicionalNoturno)}/h`],
        ['Valor Hora Extra Noturna', `${formatarMoeda(dados.vlrHoraExtraNoturna)}/h`]
    ];

    if ((dados.insalubridade || 0) > 0 || (dados.periculosidade || 0) > 0) {
        tabelaIndicadoresBody.push(['Insalubridade / Periculosidade', formatarMoeda((dados.insalubridade || 0) + (dados.periculosidade || 0))]);
    }

    if (dados.qtdHE > 0) {
        tabelaIndicadoresBody.push([`Total H.E. 50% (${formatarDecParaHoraStr(dados.qtdHE)})`, formatarMoeda(dados.totalHE)]);
    }
    if (dados.qtdHE100 > 0) {
        tabelaIndicadoresBody.push([`Total H.E. 100% (${formatarDecParaHoraStr(dados.qtdHE100)})`, formatarMoeda(dados.totalHE100)]);
    }
    if (dados.qtdHorasNoturnas > 0) {
        tabelaIndicadoresBody.push([`Total Ad. Noturno (${formatarDecParaHoraStr(dados.qtdHorasNoturnas)})`, formatarMoeda(dados.totalAdicionalNoturno)]);
    }
    if (dados.qtdHENoturnas > 0) {
        tabelaIndicadoresBody.push([`Total H.E. Noturnas (${formatarDecParaHoraStr(dados.qtdHENoturnas)})`, formatarMoeda(dados.totalHENoturna)]);
    }
    if (dados.dsrVariaveis > 0) {
        tabelaIndicadoresBody.push(['Reflexo DSR (Verbas)', formatarMoeda(dados.dsrVariaveis)]);
    }
    if (dados.qtdFaltas > 0) {
        tabelaIndicadoresBody.push([`Faltas/Atrasos (${formatarDecParaHoraStr(dados.qtdFaltas)})`, `-${formatarMoeda(dados.totalDescontoFaltas)}`]);
    }
    if (dados.outrosProv > 0) {
        tabelaIndicadoresBody.push(['Outros Proventos', formatarMoeda(dados.outrosProv)]);
    }
    if (dados.outrosDesc > 0) {
        tabelaIndicadoresBody.push(['Outros Descontos', `-${formatarMoeda(dados.outrosDesc)}`]);
    }

    const tabelaBasesBody = [
        ['Base de Cálculo INSS', formatarMoeda(dados.baseINSS)],
        ['Base de Cálculo FGTS', formatarMoeda(dados.baseFGTS)],
        ['Base de Cálculo IRRF', formatarMoeda(dados.baseIRRF)]
    ];

    if (dados.totalVTBrito > 0) {
        tabelaBasesBody.push(['Vale Transporte Bruto', formatarMoeda(dados.totalVTBrito)]);
        if (dados.descontoVTHolerite > 0) {
            tabelaBasesBody.push(['(-) Desconto VT Holerite (6%)', `-${formatarMoeda(dados.descontoVTHolerite)}`]);
        }
        tabelaBasesBody.push(['Custo Cota VT Empresa', formatarMoeda(dados.custoLiquidoVTEmpresa)]);
    }

    const tabelaHoleriteBody = [
        [{ text: 'Descrição', bold: true, fillColor: '#f1f5f9' }, { text: 'Valor (R$)', bold: true, alignment: 'right', fillColor: '#f1f5f9' }],
        ['Salário Bruto de Apuração (Proventos)', { text: formatarMoeda(dados.salarioBase), alignment: 'right' }],
        ['(-) Desconto INSS Colaborador', { text: `-${formatarMoeda(dados.inssCalculado)}`, alignment: 'right', color: '#b91c1c' }]
    ];

    if (dados.irrfCalculado > 0) {
        tabelaHoleriteBody.push(['(-) Desconto IRRF Colaborador', { text: `-${formatarMoeda(dados.irrfCalculado)}`, alignment: 'right', color: '#b91c1c' }]);
    }
    if (dados.descontoVTHolerite > 0) {
        tabelaHoleriteBody.push(['(-) Desconto Vale Transporte (Até 6%)', { text: `-${formatarMoeda(dados.descontoVTHolerite)}`, alignment: 'right', color: '#b91c1c' }]);
    }
    if (dados.outrosDesc > 0) {
        tabelaHoleriteBody.push(['(-) Outros Descontos', { text: `-${formatarMoeda(dados.outrosDesc)}`, alignment: 'right', color: '#b91c1c' }]);
    }

    tabelaHoleriteBody.push([{ text: 'Líquido a Receber em Conta', bold: true }, { text: formatarMoeda(dados.liquido), bold: true, alignment: 'right' }]);

    if (dados.totalBeneficios > 0) {
        tabelaHoleriteBody.push(['Total de Benefícios Proporcionados', { text: formatarMoeda(dados.totalBeneficios), alignment: 'right' }]);
    }

    tabelaHoleriteBody.push([{ text: 'Valor Percebido pelo Colaborador', bold: true, color: '#1e3a8a' }, { text: formatarMoeda(dados.totalFuncionarioVisao), bold: true, alignment: 'right', color: '#1e3a8a' }]);

    // BLOCO DE ENCARGOS E PROVISÕES DInÂMICO
    const blocoEncargosEProvisoes = dados.calcularProvisao ? {
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
    } : [
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
            margin: [0, 0, 0, 15]
        }
    ];

    // RESUMO EXECUTIVO PROJEÇÃO
    const numSecaoResumo = dados.calcularProvisao ? 6 : 5;
    const blocoResumoExecutivo = [
        { text: `${numSecaoResumo}. Resumo Executivo - Projeção ${dados.labelPeriodo}`, style: 'sectionTitle', margin: [0, 10, 0, 5] },
        {
            table: {
                widths: dados.calcularProvisao ? ['*', '*', '*', '*'] : ['*', '*', '*'],
                body: dados.calcularProvisao ? [
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
                ] : [
                    [
                        { text: 'Colaborador (Mês)', alignment: 'center', fillColor: '#f8fafc', margin: [0, 5] },
                        { text: 'Encargos Patronais', alignment: 'center', fillColor: '#f8fafc', margin: [0, 5] },
                        { text: 'Custo Total Projetado', alignment: 'center', bold: true, fillColor: '#0f172a', color: 'white', margin: [0, 5] }
                    ],
                    [
                        { text: formatarMoeda(dados.projFuncionario), alignment: 'center', bold: true, fontSize: 11, margin: [0, 10] },
                        { text: formatarMoeda(dados.projEncargos), alignment: 'center', bold: true, fontSize: 11, margin: [0, 10] },
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
    ];

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
                                body: tabelaIndicadoresBody
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
                                body: tabelaBasesBody
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
                    body: tabelaHoleriteBody
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 15]
            },

            // BLOCO 4 E 5: ENCARGOS E PROVISÕES
            blocoEncargosEProvisoes,

            // BLOCO RESUMO EXECUTIVO (TOTAL PROJETADO)
            ...blocoResumoExecutivo
        ],

        styles: {
            header: { fontSize: 15, bold: true, alignment: 'center', color: '#0f172a', margin: [0, 0, 0, 12] },
            sectionTitle: { fontSize: 11, bold: true, color: '#1e40af', margin: [0, 0, 0, 8], borderBottom: true }
        }
    };

    window.pdfMake.createPdf(docDefinition).download(`Relatorio_Custo_Funcionario_${dados.labelPeriodo}.pdf`);
}
