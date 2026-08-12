// js/pdf-generators/rescisao-pdf.js

/**
 * Módulo de Geração de PDF Profissional para Simulador de Rescisão Contratual (via pdfMake)
 */

export function gerarPDFRescisao(dados) {
    const formatarMoeda = (valor) => {
        const val = Number(valor) || 0;
        return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const labelsRescisao = {
        'demissao_sem_justa_causa': '1. Demissão sem Justa Causa',
        'pedido_demissao': '2. Pedido de Demissão',
        'antecipacao_exp_funcionario': '3. Antecipação de Experiência pelo Funcionário',
        'antecipacao_exp_empregador': '4. Antecipação de Experiência pelo Empregador',
        'termino_experiencia': '5. Término de Contrato de Experiência',
        'demissao_com_justa_causa': '6. Demissão com Justa Causa',
        'acordo_partes': '7. Acordo entre as Partes (Art. 484-A CLT)'
    };

    const labelsAviso = {
        'indenizado': 'Indenizado pelo Empregador',
        'trabalhado': 'Trabalhado',
        'descontado': 'Descontado do Funcionário',
        'dispensado': 'Dispensado'
    };

    // Tabela de Verbas Rescisórias (Holerite do Funcionário)
    const tabelaVerbasBody = [
        [
            { text: 'Rubrica / Descrição da Verba', bold: true, fillColor: '#1e293b', color: '#ffffff' },
            { text: 'Tipo', bold: true, alignment: 'center', fillColor: '#1e293b', color: '#ffffff' },
            { text: 'Valor (R$)', bold: true, alignment: 'right', fillColor: '#1e293b', color: '#ffffff' }
        ]
    ];

    dados.itensVerbas.forEach(item => {
        const isDesconto = item.tipo === 'Desconto';
        tabelaVerbasBody.push([
            { text: item.descricao, color: isDesconto ? '#991b1b' : '#0f172a' },
            { text: item.tipo, alignment: 'center', color: isDesconto ? '#b91c1c' : '#047857' },
            { text: isDesconto ? `-${formatarMoeda(item.valor)}` : formatarMoeda(item.valor), alignment: 'right', bold: true, color: isDesconto ? '#b91c1c' : '#047857' }
        ]);
    });

    // Totais do Holerite Rescisório
    tabelaVerbasBody.push([
        { text: 'Total Proventos Brutos', bold: true, fillColor: '#f8fafc' },
        { text: 'Provento', alignment: 'center', fillColor: '#f8fafc', color: '#047857' },
        { text: formatarMoeda(dados.totalProventos), alignment: 'right', bold: true, fillColor: '#f8fafc', color: '#047857' }
    ]);
    tabelaVerbasBody.push([
        { text: 'Total Descontos', bold: true, fillColor: '#f8fafc' },
        { text: 'Desconto', alignment: 'center', fillColor: '#f8fafc', color: '#b91c1c' },
        { text: `-${formatarMoeda(dados.totalDescontos)}`, alignment: 'right', bold: true, fillColor: '#f8fafc', color: '#b91c1c' }
    ]);
    tabelaVerbasBody.push([
        { text: 'Líquido Rescisório a Receber', bold: true, fillColor: '#1e3a8a', color: '#ffffff', fontSize: 10 },
        { text: 'Líquido', alignment: 'center', fillColor: '#1e3a8a', color: '#ffffff', bold: true },
        { text: formatarMoeda(dados.liquidoReceber), alignment: 'right', bold: true, fillColor: '#1e3a8a', color: '#ffffff', fontSize: 11 }
    ]);

    // Tabela de Encargos do INSS Empresa
    const tabelaEncargosEmpresaBody = [
        [
            { text: 'Componente de Encargo Patronal', bold: true, fillColor: '#1e293b', color: '#ffffff' },
            { text: 'Alíquota', bold: true, alignment: 'center', fillColor: '#1e293b', color: '#ffffff' },
            { text: 'Base de Cálculo', bold: true, alignment: 'right', fillColor: '#1e293b', color: '#ffffff' },
            { text: 'Encargo Devido (R$)', bold: true, alignment: 'right', fillColor: '#1e293b', color: '#ffffff' }
        ],
        [
            { text: 'INSS Patronal (CPP)', fontSize: 8.5 },
            { text: `${(dados.percPatronal || 0).toFixed(2)}%`, alignment: 'center', fontSize: 8.5 },
            { text: formatarMoeda(dados.baseINSSPatronalEmpresa), alignment: 'right', fontSize: 8.5 },
            { text: formatarMoeda(dados.encINSSPatronal), alignment: 'right', bold: true, fontSize: 8.5 }
        ],
        [
            { text: 'INSS Terceiros / Outras Entidades', fontSize: 8.5 },
            { text: `${(dados.percTerceiros || 0).toFixed(2)}%`, alignment: 'center', fontSize: 8.5 },
            { text: formatarMoeda(dados.baseINSSPatronalEmpresa), alignment: 'right', fontSize: 8.5 },
            { text: formatarMoeda(dados.encINSSTerceiros), alignment: 'right', bold: true, fontSize: 8.5 }
        ],
        [
            { text: 'INSS GILRAT / RAT / FAP', fontSize: 8.5 },
            { text: `${(dados.percGilrat || 0).toFixed(2)}%`, alignment: 'center', fontSize: 8.5 },
            { text: formatarMoeda(dados.baseINSSPatronalEmpresa), alignment: 'right', fontSize: 8.5 },
            { text: formatarMoeda(dados.encINSSGilrat), alignment: 'right', bold: true, fontSize: 8.5 }
        ],
        [
            { text: 'SUBTOTAL INSS PATRONAL EMPRESA', bold: true, fillColor: '#f1f5f9', colSpan: 3 },
            {}, {},
            { text: formatarMoeda(dados.totalINSSPatronalEmpresa), alignment: 'right', bold: true, fillColor: '#f1f5f9', color: '#1e3a8a' }
        ],
        [
            { text: 'FGTS Mês da Rescisão / Aviso', fontSize: 8.5 },
            { text: '8,00%', alignment: 'center', fontSize: 8.5 },
            { text: formatarMoeda(dados.baseFGTSRescisao), alignment: 'right', fontSize: 8.5 },
            { text: formatarMoeda(dados.fgtsRescisao), alignment: 'right', bold: true, fontSize: 8.5 }
        ],
        [
            { text: 'Multa Rescisória do FGTS', fontSize: 8.5 },
            { text: `${dados.percentualMultaFGTS}.00%`, alignment: 'center', fontSize: 8.5 },
            { text: formatarMoeda(dados.baseFGTSMulta), alignment: 'right', fontSize: 8.5 },
            { text: formatarMoeda(dados.valorMultaFGTS), alignment: 'right', bold: true, fontSize: 8.5 }
        ]
    ];

    if (dados.custoBeneficiosEmpresa > 0) {
        tabelaEncargosEmpresaBody.push([
            { text: 'Custeio de Benefícios pela Empresa', fontSize: 8.5 },
            { text: '-', alignment: 'center', fontSize: 8.5 },
            { text: '-', alignment: 'right', fontSize: 8.5 },
            { text: formatarMoeda(dados.custoBeneficiosEmpresa), alignment: 'right', bold: true, fontSize: 8.5 }
        ]);
    }

    tabelaEncargosEmpresaBody.push([
        { text: 'CUSTO TOTAL DA RESCISÃO PARA O EMPREGADOR', bold: true, fillColor: '#0f172a', color: '#ffffff', colSpan: 3, fontSize: 9.5 },
        {}, {},
        { text: formatarMoeda(dados.custoTotalEmpresa), alignment: 'right', bold: true, fillColor: '#0f172a', color: '#10b981', fontSize: 10.5 }
    ]);

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [35, 30, 35, 35],
        content: [
            // Cabeçalho
            {
                columns: [
                    {
                        text: [
                            { text: 'SIMULAÇÃO DE RESCISÃO CONTRATUAL\n', fontSize: 15, bold: true, color: '#0f172a' },
                            { text: 'Ferramentas DP - Relatório de Análise Rescisória Profissional', fontSize: 8.5, color: '#64748b' }
                        ]
                    },
                    {
                        text: `Data do Cálculo: ${dados.dataCalculo}`,
                        alignment: 'right',
                        fontSize: 8.5,
                        color: '#64748b',
                        margin: [0, 4, 0, 0]
                    }
                ],
                margin: [0, 0, 0, 10]
            },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 525, y2: 0, lineWidth: 1.5, lineColor: '#2563eb' }] },

            // 1. Parâmetros e Contrato
            { text: '1. Parâmetros do Contrato e Modalidade', style: 'sectionTitle', margin: [0, 10, 0, 4] },
            {
                table: {
                    widths: ['*', '*'],
                    body: [
                        [
                            { text: `Regime Tributário: ${dados.regimeLabel}`, fontSize: 8.5 },
                            { text: `Salário Base: ${formatarMoeda(dados.salarioBase)}`, fontSize: 8.5, bold: true }
                        ],
                        [
                            { text: `Data de Admissão: ${dados.dataAdmissaoFormatada}`, fontSize: 8.5 },
                            { text: `Data de Demissão: ${dados.dataDemissaoFormatada}`, fontSize: 8.5 }
                        ],
                        [
                            { text: `Modalidade: ${labelsRescisao[dados.tipoRescisao] || dados.tipoRescisao}`, fontSize: 8.5, bold: true, color: '#1e3a8a' },
                            { text: `Aviso Prévio: ${labelsAviso[dados.tipoAviso] || dados.tipoAviso} (${dados.diasAviso} dias)`, fontSize: 8.5 }
                        ],
                        [
                            { text: `Dependentes (IRRF): ${dados.dependentes}`, fontSize: 8.5 },
                            { text: `Saldo FGTS Acumulado: ${formatarMoeda(dados.saldoFGTS)}`, fontSize: 8.5 }
                        ],
                        [
                            { text: `Dias Úteis (Mês): ${dados.diasUteis || 25}`, fontSize: 8.5 },
                            { text: `Dias Não Úteis / DSR: ${dados.diasNaoUteis || 5}`, fontSize: 8.5 }
                        ]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            },

            // 2. Apuração de Avos e Direitos
            { text: '2. Apuração de Tempo e Direitos Rescisórios', style: 'sectionTitle', margin: [0, 8, 0, 4] },
            {
                table: {
                    widths: ['*', '*', '*'],
                    body: [
                        [
                            { text: `Dias Trabalhados Mês: ${dados.diasTrabalhadosMes} dias`, fontSize: 8.5 },
                            { text: `Avos 13º Salário: ${dados.avos13}/12`, fontSize: 8.5, bold: true },
                            { text: `Avos Férias Prop.: ${dados.avosFerias}/12`, fontSize: 8.5, bold: true }
                        ],
                        [
                            { text: `Férias Vencidas: ${dados.qtdFeriasVencidas} período(s)`, fontSize: 8.5 },
                            { text: `Multa FGTS: ${dados.percentualMultaFGTS}%`, fontSize: 8.5 },
                            { text: `Saque FGTS Permitido: ${dados.saqueFGTSPermitido ? 'Sim' : 'Não'}`, fontSize: 8.5, color: dados.saqueFGTSPermitido ? '#047857' : '#b91c1c' }
                        ]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            },

            // 3. Detalhamento das Bases do Funcionário
            { text: '3. Detalhamento de Bases de Cálculo do Trabalhador', style: 'sectionTitle', margin: [0, 8, 0, 4] },
            {
                table: {
                    widths: ['*', '*', '*'],
                    body: [
                        [
                            { text: `Base INSS Mensal: ${formatarMoeda(dados.baseINSSMensal)}\n(INSS Devido: ${formatarMoeda(dados.inssMensal)})`, fontSize: 8 },
                            { text: `Base INSS 13º: ${formatarMoeda(dados.baseINSS13)}\n(INSS 13º Devido: ${formatarMoeda(dados.inss13)})`, fontSize: 8 },
                            { text: `Base IRRF Mensal: ${formatarMoeda(dados.baseIRRFMensal)}\n(IRRF Devido: ${formatarMoeda(dados.irrfMensal)})`, fontSize: 8 }
                        ],
                        [
                            { text: `Base IRRF 13º: ${formatarMoeda(dados.baseIRRF13)}\n(IRRF 13º Devido: ${formatarMoeda(dados.irrf13)})`, fontSize: 8 },
                            { text: `Base FGTS Rescisão: ${formatarMoeda(dados.baseFGTSRescisao)}\n(FGTS 8%: ${formatarMoeda(dados.fgtsRescisao)})`, fontSize: 8 },
                            { text: `Base Multa FGTS: ${formatarMoeda(dados.baseFGTSMulta)}\n(Multa ${dados.percentualMultaFGTS}%: ${formatarMoeda(dados.valorMultaFGTS)})`, fontSize: 8 }
                        ],
                        [
                            { text: `Total Verbas Isentas / Não Tributáveis: ${formatarMoeda(dados.totalVerbasIsentas)}`, fontSize: 8, bold: true, color: '#0284c7', colSpan: 3 },
                            {}, {}
                        ]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            },

            // 4. Detalhamento de Encargos Sociais e INSS Patronal
            { text: '4. Detalhamento de Encargos Sociais e INSS Patronal (Empresa)', style: 'sectionTitle', margin: [0, 8, 0, 4] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 50, 90, 95],
                    body: tabelaEncargosEmpresaBody
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            },

            // 5. Discriminação de Verbas Rescisórias (Holerite)
            { text: '5. Discriminação das Verbas Rescisórias (Holerite)', style: 'sectionTitle', margin: [0, 8, 0, 4] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 'auto', 100],
                    body: tabelaVerbasBody
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            },

            // 6. FGTS e Projeção de Saque
            { text: '6. Resumo do FGTS e Projeção de Saque', style: 'sectionTitle', margin: [0, 8, 0, 4] },
            {
                table: {
                    widths: ['*', 'auto'],
                    body: [
                        ['FGTS do Mês / Rescisão (8%)', { text: formatarMoeda(dados.fgtsRescisao), alignment: 'right' }],
                        ['Base Total do FGTS para Multa Rescisória', { text: formatarMoeda(dados.baseFGTSMulta), alignment: 'right' }],
                        [`Multa Rescisória do FGTS (${dados.percentualMultaFGTS}%)`, { text: formatarMoeda(dados.valorMultaFGTS), alignment: 'right', bold: true }],
                        [{ text: 'Valor Estimado Liberado para Saque pelo Funcionário', bold: true, color: '#047857' }, { text: formatarMoeda(dados.valorSaqueFGTS), alignment: 'right', bold: true, color: '#047857' }]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            }
        ],

        styles: {
            sectionTitle: { fontSize: 10, bold: true, color: '#0f172a' }
        },
        defaultStyle: { font: 'Roboto', fontSize: 8.5, color: '#334155' }
    };

    pdfMake.createPdf(docDefinition).download(`Rescisao_${dados.dataDemissaoFormatada.replace(/\//g, '-')}.pdf`);
}

