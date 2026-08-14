// js/pdf-generators/comparador-rescisao-pdf.js

/**
 * Módulo de Geração de PDF Profissional para o Comparador Multicenários de Demissão (via pdfMake)
 */

export function gerarPDFComparativo(dados) {
    const formatarMoeda = (valor) => {
        const val = Number(valor) || 0;
        return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Tabela Comparativa Estruturada
    const headers = [
        { text: 'Métrica / Indicador', bold: true, fillColor: '#1e293b', color: '#ffffff', fontSize: 8.5 }
    ];

    dados.cenarios.forEach(c => {
        headers.push({ text: c.titulo, bold: true, alignment: 'center', fillColor: '#1e293b', color: '#ffffff', fontSize: 8.5 });
    });

    const body = [headers];

    // Linha 1: Saldo de Salário
    const rowSaldo = [{ text: 'Saldo de Salário', fontSize: 8, bold: true }];
    dados.cenarios.forEach(c => rowSaldo.push({ text: formatarMoeda(c.valorSaldoSalario), alignment: 'right', fontSize: 8 }));
    body.push(rowSaldo);

    // Linha 2: Aviso Prévio
    const rowAviso = [{ text: 'Aviso Prévio (Liq. Provento/Desc.)', fontSize: 8 }];
    dados.cenarios.forEach(c => {
        const val = c.valorAvisoPrevio - c.descontoAviso;
        const color = val < 0 ? '#b91c1c' : (val > 0 ? '#047857' : '#475569');
        rowAviso.push({ text: formatarMoeda(val), alignment: 'right', fontSize: 8, color });
    });
    body.push(rowAviso);

    // Linha 3: 13º Salário
    const row13 = [{ text: '13º Salário Rescisório', fontSize: 8 }];
    dados.cenarios.forEach(c => row13.push({ text: formatarMoeda(c.valor13Prop), alignment: 'right', fontSize: 8 }));
    body.push(row13);

    // Linha 4: Férias Totais (+ 1/3)
    const rowFerias = [{ text: 'Férias Prop. + Venc. (+ 1/3)', fontSize: 8 }];
    dados.cenarios.forEach(c => rowFerias.push({ text: formatarMoeda(c.totalFerias), alignment: 'right', fontSize: 8 }));
    body.push(rowFerias);

    // Linha 5: Total Proventos Brutos
    const rowProventos = [{ text: 'Proventos Brutos', bold: true, fillColor: '#f1f5f9', fontSize: 8.5 }];
    dados.cenarios.forEach(c => rowProventos.push({ text: formatarMoeda(c.totalProventos), alignment: 'right', bold: true, fillColor: '#f1f5f9', fontSize: 8.5, color: '#047857' }));
    body.push(rowProventos);

    // Linha 6: Descontos Oficiais (INSS + IRRF + Outros)
    const rowDescontos = [{ text: 'Descontos (INSS/IRRF/Outros)', fontSize: 8 }];
    dados.cenarios.forEach(c => rowDescontos.push({ text: `-${formatarMoeda(c.totalDescontos)}`, alignment: 'right', fontSize: 8, color: '#b91c1c' }));
    body.push(rowDescontos);

    // Linha 7: Líquido no Bolso do Trabalhador
    const rowLiquido = [{ text: 'LÍQUIDO A RECEBER (TRABALHADOR)', bold: true, fillColor: '#1e3a8a', color: '#ffffff', fontSize: 8.5 }];
    dados.cenarios.forEach(c => rowLiquido.push({ text: formatarMoeda(c.liquidoReceber), alignment: 'right', bold: true, fillColor: '#1e3a8a', color: '#ffffff', fontSize: 8.5 }));
    body.push(rowLiquido);

    // Linha 8: Multa Rescisória do FGTS
    const rowMultaFGTS = [{ text: 'Multa Rescisória do FGTS', fontSize: 8 }];
    dados.cenarios.forEach(c => rowMultaFGTS.push({ text: formatarMoeda(c.valorMultaFGTS), alignment: 'right', fontSize: 8, color: c.valorMultaFGTS > 0 ? '#0284c7' : '#64748b' }));
    body.push(rowMultaFGTS);

    // Linha 9: FGTS Mês da Rescisão
    const rowFGTSMes = [{ text: 'FGTS Mês / Aviso Indenizado (8%)', fontSize: 8 }];
    dados.cenarios.forEach(c => rowFGTSMes.push({ text: formatarMoeda(c.fgtsRescisao), alignment: 'right', fontSize: 8 }));
    body.push(rowFGTSMes);

    // Linha 10: Estimativa de Saque FGTS Liberado
    const rowSaqueFGTS = [{ text: 'Est. Saque FGTS Liberado', bold: true, fontSize: 8, color: '#047857' }];
    dados.cenarios.forEach(c => rowSaqueFGTS.push({ text: formatarMoeda(c.valorSaqueFGTS), alignment: 'right', bold: true, fontSize: 8, color: '#047857' }));
    body.push(rowSaqueFGTS);

    // Linha 11: Encargos Patronais (INSS Empresa)
    const rowEncargosINSS = [{ text: 'INSS Patronal + Terceiros + RAT', fontSize: 8 }];
    dados.cenarios.forEach(c => rowEncargosINSS.push({ text: formatarMoeda(c.totalINSSPatronalEmpresa), alignment: 'right', fontSize: 8 }));
    body.push(rowEncargosINSS);

    // Linha 12: CUSTO TOTAL DA EMPRESA
    const rowCustoEmpresa = [{ text: 'CUSTO TOTAL EMPRESA', bold: true, fillColor: '#0f172a', color: '#ffffff', fontSize: 8.5 }];
    dados.cenarios.forEach(c => rowCustoEmpresa.push({ text: formatarMoeda(c.custoTotalEmpresa), alignment: 'right', bold: true, fillColor: '#0f172a', color: '#10b981', fontSize: 8.5 }));
    body.push(rowCustoEmpresa);

    // Linha 13: Seguro-Desemprego
    const rowSeguro = [{ text: 'Direito a Seguro-Desemprego', fontSize: 7.5 }];
    dados.cenarios.forEach(c => rowSeguro.push({ text: c.permiteSeguroDesemprego ? 'SIM' : 'NÃO', alignment: 'center', bold: true, fontSize: 7.5, color: c.permiteSeguroDesemprego ? '#047857' : '#b91c1c' }));
    body.push(rowSeguro);

    // Dynamic column width: first column is wider, scenario columns divide remainder evenly
    const colCount = dados.cenarios.length;
    const scenarioWidth = Math.floor(380 / colCount);
    const widths = [135];
    for (let i = 0; i < colCount; i++) widths.push(scenarioWidth);

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: colCount > 4 ? 'landscape' : 'portrait',
        pageMargins: [25, 25, 25, 25],
        content: [
            // Cabeçalho
            {
                columns: [
                    {
                        text: [
                            { text: 'RELATÓRIO COMPARATIVO DE CENARIOS DE DEMISSÃO\n', fontSize: 14, bold: true, color: '#0f172a' },
                            { text: 'Ferramentas DP - Análise Estratégica de Impacto Financeiro e Trabalhista', fontSize: 8.5, color: '#64748b' }
                        ]
                    },
                    {
                        text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                        alignment: 'right',
                        fontSize: 8,
                        color: '#64748b',
                        margin: [0, 4, 0, 0]
                    }
                ],
                margin: [0, 0, 0, 8]
            },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: colCount > 4 ? 790 : 540, y2: 0, lineWidth: 1.5, lineColor: '#2563eb' }] },

            // 1. Parâmetros de Entrada da Simulação
            { text: '1. Parâmetros Base da Contratação', style: 'sectionTitle', margin: [0, 8, 0, 4] },
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        [
                            { text: `Salário Base: ${formatarMoeda(dados.salarioBase)}`, fontSize: 8, bold: true },
                            { text: `Regime: ${dados.regimeLabel}`, fontSize: 8 },
                            { text: `Admissão: ${dados.dataAdmissaoFormatada}`, fontSize: 8 },
                            { text: `Demissão: ${dados.dataDemissaoFormatada}`, fontSize: 8 }
                        ],
                        [
                            { text: `Saldo FGTS Acumulado: ${formatarMoeda(dados.saldoFGTS)}`, fontSize: 8 },
                            { text: `Dependentes IRRF: ${dados.dependentes}`, fontSize: 8 },
                            { text: `Dias Trabalhados Mês: ${dados.diasTrabalhadosMes}`, fontSize: 8 },
                            { text: `Proventos Extra: ${formatarMoeda(dados.totalProventosExtras)}`, fontSize: 8 }
                        ]
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            },

            // 2. Tabela de Comparação Multicenários
            { text: '2. Quadro Comparativo Multicenários Side-by-Side', style: 'sectionTitle', margin: [0, 6, 0, 4] },
            {
                table: {
                    headerRows: 1,
                    widths: widths,
                    body: body
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10]
            },

            // 3. Resumo de Diretrizes Legais dos Cenários
            { text: '3. Resumo de Regras Legais e Impactos Principais', style: 'sectionTitle', margin: [0, 6, 0, 4] },
            {
                ul: [
                    { text: 'Demissão sem Justa Causa: Maior custo rescisório para o empregador (40% multa FGTS + aviso). Libera 100% do saldo FGTS + verbas + Seguro-Desemprego para o trabalhador.', fontSize: 7.5 },
                    { text: 'Acordo Mútuo (Art. 484-A CLT): Reduz a multa do FGTS para 20% e o aviso indenizado para 50%. Permite ao funcionário sacar até 80% do saldo do FGTS, mas NÃO dá direito ao Seguro-Desemprego.', fontSize: 7.5 },
                    { text: 'Pedido de Demissão: Sem multa do FGTS (0%) e sem liberação da conta vinculada do FGTS nem Seguro-Desemprego. Caso não cumpra aviso, pode haver desconto de até 1 salário nominal.', fontSize: 7.5 },
                    { text: 'Demissão com Justa Causa: Extinção por falta grave (Art. 482 CLT). O trabalhador recebe unicamente saldo de salário e férias vencidas (se houver) com 1/3, perdendo direito a 13º e férias proporcionais.', fontSize: 7.5 }
                ]
            }
        ],

        styles: {
            sectionTitle: { fontSize: 9.5, bold: true, color: '#0f172a' }
        },
        defaultStyle: { font: 'Roboto', fontSize: 8, color: '#334155' }
    };

    pdfMake.createPdf(docDefinition).download(`Comparador_Rescisao_${dados.dataDemissaoFormatada.replace(/\//g, '-')}.pdf`);
}
