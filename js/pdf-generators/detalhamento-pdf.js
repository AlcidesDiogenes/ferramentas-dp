// js/pdf-generators/detalhamento-pdf.js

import {
    TABELA_INSS,
    TABELA_IRRF,
    TABELA_REDUCAO_MENSAL,
    VALOR_DEDUCAO_DEPENDENTE,
    DESCONTO_SIMPLIFICADO
} from '../simuladores/tabelas.js';

export function gerarPDFDetalhamento(dados, resultados, detalhes) {
    const formatar = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Função interna para recriar o passo a passo do INSS igual ao HTML
    const gerarBlocoINSS = () => {
        let inssContent = [];

        if (dados.tipoContribuinte === 'prolabore' || dados.tipoContribuinte === 'individual') {
            const isProlabore = dados.tipoContribuinte === 'prolabore';
            const aliquotaFixa = isProlabore ? 0.11 : 0.20;
            const nomeTipo = isProlabore ? 'Sócio (Pró-labore)' : 'Contribuinte Individual';
            const aliquotaTexto = isProlabore ? '11%' : '20%';

            inssContent.push({ text: `Cálculo para ${nomeTipo}:`, style: 'subTitle' });
            inssContent.push({ text: `Alíquota fixa de ${aliquotaTexto} aplicada sobre a base de cálculo.`, margin: [0, 5, 0, 5], fontSize: 11, color: '#475569' });
            inssContent.push({ text: `Cálculo: ${formatar(detalhes.inss.baseINSS)} x ${aliquotaTexto} = ${formatar(detalhes.inss.baseINSS * aliquotaFixa)}`, fontSize: 11 });
        } else {
            // 1. Cálculo Progressivo
            inssContent.push({ text: '1. Cálculo Progressivo (Faixa por Faixa):', style: 'subTitle' });

            let anterior = 0;
            let somaProgressiva = 0;
            const progressivoItens = [];

            TABELA_INSS.forEach((f, i) => {
                let baseFaixa = Math.min(detalhes.inss.baseINSS, f.limite) - anterior;
                if (baseFaixa > 0) {
                    let valor = baseFaixa * f.aliquota;
                    somaProgressiva += valor;
                    progressivoItens.push(`Faixa ${i + 1}: ${formatar(baseFaixa)} x ${(f.aliquota * 100).toFixed(1)}% = ${formatar(valor)}`);
                }
                anterior = f.limite;
            });

            inssContent.push({ ul: progressivoItens, margin: [10, 5, 0, 10], fontSize: 11, color: '#334155' });
            inssContent.push({ text: `Total Acumulado: ${formatar(somaProgressiva)}`, bold: true, fontSize: 11, margin: [0, 0, 0, 15] });

            // 2. Cálculo Simplificado
            const faixa = TABELA_INSS.find(f => detalhes.inss.baseINSS <= f.limite) || TABELA_INSS[TABELA_INSS.length - 1];
            let calculoSimplificado = (detalhes.inss.baseINSS * faixa.aliquota) - faixa.deducao;

            inssContent.push({ text: '2. Cálculo Simplificado (Conferência):', style: 'subTitle' });
            inssContent.push({ text: '(Salário Base x Alíquota) - Dedução = Total de INSS', italics: true, fontSize: 11, margin: [0, 5, 0, 5], color: '#64748b' });
            inssContent.push({ text: `(${formatar(detalhes.inss.baseINSS)} x ${(faixa.aliquota * 100).toFixed(1)}%) - ${formatar(faixa.deducao)} = ${formatar(calculoSimplificado)}`, fontSize: 11, margin: [0, 0, 0, 10] });
        }

        if (detalhes.inss.outrasBases > 0 && detalhes.inss.jaContribuido > 0) {
            inssContent.push({ text: `* Valor de INSS ajustado pela contribuição já realizada de ${formatar(detalhes.inss.jaContribuido)}.`, italics: true, fontSize: 10, margin: [0, 5, 0, 5], color: '#64748b' });
        }

        return inssContent;
    };

    // Função interna para recriar o detalhamento comparativo do IRRF
    const gerarBlocoIRRF = () => {
        let irrfContent = [];
        const impostoDevidoSemReducao = Math.min(detalhes.irrf.impostoLegal, detalhes.irrf.impostoSimplificado);

        irrfContent.push({ text: 'Comparativo de Modelos:', style: 'subTitle' });
        irrfContent.push({
            table: {
                widths: ['*', '*'],
                body: [
                    [
                        { text: 'Modelo: Deduções Legais', style: 'tableHeader' },
                        { text: 'Modelo: Desconto Simplificado', style: 'tableHeader' }
                    ],
                    [
                        [
                            { text: `Salário: ${formatar(dados.salario)}`, margin: [0, 2] },
                            { text: `(-) INSS: ${formatar(resultados.totalINSS)}`, margin: [0, 2] },
                            { text: `(-) Dep. (${dados.dependentes}): ${formatar(dados.dependentes * VALOR_DEDUCAO_DEPENDENTE)}`, margin: [0, 2] },
                            { text: `Base: ${formatar(detalhes.irrf.baseLegal)}`, bold: true, margin: [0, 8, 0, 2] },
                            { text: `Imposto: ${formatar(detalhes.irrf.impostoLegal)}`, color: resultados.modeloIRRF === 'Deduções Legais' ? '#166534' : '#334155', bold: resultados.modeloIRRF === 'Deduções Legais' }
                        ],
                        [
                            { text: `Salário: ${formatar(dados.salario)}`, margin: [0, 2] },
                            { text: `(-) Desc. Padrão: ${formatar(DESCONTO_SIMPLIFICADO)}`, margin: [0, 2] },
                            { text: `\n`, margin: [0, 2] }, // Linha vazia para manter simetria vertical com os dependentes
                            { text: `Base: ${formatar(detalhes.irrf.baseSimplificada)}`, bold: true, margin: [0, 8, 0, 2] },
                            { text: `Imposto: ${formatar(detalhes.irrf.impostoSimplificado)}`, color: resultados.modeloIRRF === 'Simplificado' ? '#166534' : '#334155', bold: resultados.modeloIRRF === 'Simplificado' }
                        ]
                    ]
                ]
            },
            layout: 'lightHorizontalLines',
            style: 'table',
            margin: [0, 5, 0, 15]
        });

        // Regra de Redução 2026
        if (detalhes.irrf.valorReducao > 0 || dados.salario <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
            let explicacaoReducao = '';
            let valorCalculado = 0;

            if (dados.salario <= TABELA_REDUCAO_MENSAL.limiteInferior) {
                explicacaoReducao = `Rendimentos até ${formatar(TABELA_REDUCAO_MENSAL.limiteInferior)}: redução de até ${formatar(TABELA_REDUCAO_MENSAL.reducaoFixa)} (limitado a zerar o imposto).`;
            } else if (dados.salario > TABELA_REDUCAO_MENSAL.limiteInferior && dados.salario <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
                valorCalculado = TABELA_REDUCAO_MENSAL.formulaVariavel(dados.salario);
                explicacaoReducao = `Fórmula decrescente: R$ 978,62 - (0,133145 x ${formatar(dados.salario)}) = ${formatar(valorCalculado)}`;
            }

            irrfContent.push({
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                stack: [
                                    { text: 'Regra de Redução:', bold: true, color: '#1e40af', margin: [0, 0, 0, 5] },
                                    { text: `Formula: R$ 978,62 - (0,133145 x rendimentos tributáveis sujeitos à incidência mensal) = valor a deduzir`, fontSize: 10, margin: [0, 2] },
                                    { text: explicacaoReducao, italics: true, fontSize: 10, color: '#475569', margin: [0, 0, 0, 10] },
                                    { text: `Valor Devido (sem redução): ${formatar(impostoDevidoSemReducao)}`, fontSize: 11, margin: [0, 2] },
                                    { text: `(-) Valor da redução aplicada: ${formatar(detalhes.irrf.valorReducao)}`, fontSize: 11, color: '#b91c1c', margin: [0, 2] },
                                    { text: `Valor IRRF Mensal com redução: ${formatar(resultados.impostoFinal)}`, bold: true, fontSize: 11, margin: [0, 5, 0, 0] }
                                ],
                                fillColor: '#eff6ff',
                                margin: [0, 0]
                            }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 0,
                    vLineWidth: (i) => (i === 0 ? 4 : 0),
                    vLineColor: () => '#3b82f6',
                    paddingLeft: () => 10,
                    paddingRight: () => 10,
                    paddingTop: () => 10,
                    paddingBottom: () => 10
                },
                margin: [0, 0, 0, 15]
            });
        }

        return irrfContent;
    };

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
            { text: 'RELATÓRIO DETALHADO DE DESCONTOS', style: 'header' },

            // 1. DADOS DA SIMULAÇÃO
            { text: '1. Parâmetros da Simulação', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', '*', '*'],
                    body: [
                        [
                            { text: 'Salário Bruto', style: 'tableHeader' },
                            { text: 'Tipo de Contribuinte', style: 'tableHeader' },
                            { text: 'Dependentes', style: 'tableHeader' }
                        ],
                        [
                            formatar(dados.salario),
                            dados.tipoContribuinte === 'prolabore' ? 'Sócio (Pró-labore)' : (dados.tipoContribuinte === 'individual' ? 'Contribuinte Individual' : 'Funcionário (CLT)'),
                            dados.dependentes.toString()
                        ]
                    ]
                },
                layout: 'lightHorizontalLines',
                style: 'table'
            },

            // 2. DETALHAMENTO DO INSS
            { text: '2. Detalhamento da Previdência (INSS)', style: 'sectionHeader' },
            ...gerarBlocoINSS(),
            { text: `Total de INSS Devido: ${formatar(resultados.totalINSS)}`, style: 'resultHighlight' },

            // 3. DETALHAMENTO DO IRRF
            { text: '3. Detalhamento do Imposto de Renda (IRRF)', style: 'sectionHeader' },
            ...gerarBlocoIRRF(),

            {
                stack: [
                    { text: `Modelo Mais Vantajoso Escolhido: ${resultados.modeloIRRF}`, style: 'subTitle' },
                    { text: `Imposto Final de IRRF: ${formatar(resultados.impostoFinal)}`, style: 'resultHighlight' }
                ],
                margin: [0, 10, 0, 20] // Margem para separar das tabelas abaixo
            },

            // 4. TABELAS DE REFERÊNCIA
            { text: '4. Tabelas Progressivas Vigentes', style: 'sectionHeader' },
            {
                columns: [
                    {
                        width: '48%',
                        stack: [
                            { text: 'Tabela INSS', style: 'subTitle' },
                            {
                                table: {
                                    headerRows: 1,
                                    widths: ['*', 'auto', 'auto'],
                                    body: [
                                        [{ text: 'Faixa / Limite', bold: true }, { text: 'Alíquota', bold: true }, { text: 'Dedução', bold: true }],
                                        ...TABELA_INSS.map(t => [formatar(t.limite), (t.aliquota * 100).toFixed(1) + '%', formatar(t.deducao)])
                                    ]
                                },
                                layout: 'lightHorizontalLines',
                                style: 'tableSmall'
                            }
                        ]
                    },
                    { width: '4%', text: '' },
                    {
                        width: '48%',
                        stack: [
                            { text: 'Tabela IRRF', style: 'subTitle' },
                            {
                                table: {
                                    headerRows: 1,
                                    widths: ['*', 'auto', 'auto'],
                                    body: [
                                        [{ text: 'Base de Cálculo', bold: true }, { text: 'Alíquota', bold: true }, { text: 'Dedução', bold: true }],
                                        ...TABELA_IRRF.map(t => [t.base >= 999999 ? 'Acima' : formatar(t.base), (t.aliquota * 100).toFixed(1) + '%', formatar(t.deducao)])
                                    ]
                                },
                                layout: 'lightHorizontalLines',
                                style: 'tableSmall'
                            }
                        ]
                    }
                ]
            }
        ].filter(Boolean),

        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 20], alignment: 'center', color: '#0f172a' },
            sectionHeader: { fontSize: 14, bold: true, margin: [0, 20, 0, 10], color: '#1e40af', decoration: 'underline' },
            subTitle: { fontSize: 11, bold: true, color: '#334155', margin: [0, 10, 0, 5] },
            tableHeader: { bold: true, fontSize: 11, color: '#1e293b', fillColor: '#f1f5f9' },
            resultHighlight: { fontSize: 14, bold: true, color: '#000000', margin: [0, 5, 0, 15] },
            table: { margin: [0, 5, 0, 15], fontSize: 11 },
            tableSmall: { fontSize: 9, margin: [0, 5, 0, 10] }
        },
        defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download(`Detalhamento_Descontos.pdf`);
}