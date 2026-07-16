/**
 * @module GeradorPDFJornada
 * @description Módulo dedicado à construção visual do Espelho de Ponto usando pdfMake.
 * Versão Ultra-Compacta (Page-Fit): Fontes reduzidas e padding decimal para garantir folha única.
 */

export function gerarPDFJornada(colaborador, escala, linhas, totais) {
    
    // ==========================================
    // 0. Motor de Layout Customizado (Micro-Padding)
    // ==========================================
    const layoutCompacto = {
        hLineWidth: function (i, node) { return 0.5; },
        vLineWidth: function (i, node) { return 0; },
        hLineColor: function (i, node) { return '#cbd5e1'; },
        paddingLeft: function(i, node) { return 2; },
        paddingRight: function(i, node) { return 2; },
        // O SEGREDO MÁXIMO: Redução decimal do espaço vertical
        paddingTop: function(i, node) { return 0.5; }, 
        paddingBottom: function(i, node) { return 0.5; } 
    };

    // ==========================================
    // 1. Constrói as Linhas da Escala Semanal
    // ==========================================
    const nomesDias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const ordemDias = [1, 2, 3, 4, 5, 6, 0]; 
    
    const bodyEscala = [
        [
            { text: 'Dia da Semana', style: 'tableHeader' },
            { text: 'Entrada', style: 'tableHeader' },
            { text: 'Saída Int.', style: 'tableHeader' },
            { text: 'Ret. Int.', style: 'tableHeader' },
            { text: 'Saída Final', style: 'tableHeader' }
        ]
    ];

    if (escala && Object.keys(escala).length > 0) {
        ordemDias.forEach(diaIndex => {
            const esc = escala[diaIndex];
            if (esc) {
                const isFolga = !esc.e1 && !esc.s1 && !esc.e2 && !esc.s2;
                if (isFolga) {
                    bodyEscala.push([
                        { text: nomesDias[diaIndex], bold: true },
                        { text: 'Folga / Sem Escala', colSpan: 4, alignment: 'center', color: '#64748b', fillColor: '#f8fafc' },
                        {}, {}, {}
                    ]);
                } else {
                    bodyEscala.push([
                        { text: nomesDias[diaIndex], bold: true },
                        { text: esc.e1 || '--:--', alignment: 'center' },
                        { text: esc.s1 || '--:--', alignment: 'center' },
                        { text: esc.e2 || '--:--', alignment: 'center' },
                        { text: esc.s2 || '--:--', alignment: 'center' }
                    ]);
                }
            }
        });
    }

    // ==========================================
    // 2. Constrói as Linhas de Apuração Diária
    // ==========================================
    const bodyLançamentos = linhas.map(linha => [
        { text: linha.dia, alignment: 'center', bold: true },
        { text: linha.e1, alignment: 'center' },
        { text: linha.s1, alignment: 'center' },
        { text: linha.e2, alignment: 'center' },
        { text: linha.s2, alignment: 'center' },
        { text: linha.trab, alignment: 'center' },
        { text: linha.extra, alignment: 'center', color: '#16a34a' },
        { text: linha.noturno, alignment: 'center', color: '#2563eb' },
        { text: linha.ficta, alignment: 'center', color: '#6366f1' },
        { text: linha.atraso, alignment: 'center', color: '#dc2626' }
    ]);

    // ==========================================
    // 3. Desenho Geral do Documento PDF
    // ==========================================
    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        // Margens externas achatadas: [Esquerda, Cima, Direita, Baixo]
        pageMargins: [15, 12, 15, 12], 
        
        content: [
            // Cabeçalho Principal (Fonte bastante reduzida)
            { text: 'ESPELHO DE PONTO - APURAÇÃO DE JORNADA', style: 'header' },
            
            // Cabeçalho de Informações do Colaborador (Forçando fonte pequena)
            {
                table: {
                    widths: ['*', '*'],
                    body: [
                        [
                            { text: [{ text: 'Colaborador: ', bold: true, color: '#475569' }, colaborador.nome] },
                            { text: [{ text: 'Competência: ', bold: true, color: '#475569' }, colaborador.competencia], alignment: 'right' }
                        ],
                        [
                            { text: [{ text: 'Carga Base: ', bold: true, color: '#475569' }, colaborador.cargaSemanal] },
                            { text: [{ text: 'Carga Mensal: ', bold: true, color: '#475569' }, colaborador.cargaMensal], alignment: 'right' }
                        ]
                    ]
                },
                layout: 'noBorders',
                fontSize: 8, // Letra miúda para o cabeçalho info
                margin: [0, 0, 0, 2] 
            },

            // Tabela da Escala Semanal
            { text: 'Escala Semanal Base Reconhecida:', bold: true, fontSize: 7.5, color: '#1e293b', margin: [0, 2, 0, 1] },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*', '*', '*', '*'],
                    body: bodyEscala
                },
                layout: layoutCompacto, 
                style: 'tableEscala',
                margin: [0, 10, 10, 4] 
            },

            // Tabela Principal de Lançamentos
            { text: 'Lançamentos e Apuração Diária:', bold: true, fontSize: 7.5, color: '#1e293b', margin: [0, 10, 10, 1] },
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'Dia', style: 'tableHeader' },
                            { text: 'Entrada', style: 'tableHeader' },
                            { text: 'Saída Int.', style: 'tableHeader' },
                            { text: 'Ret. Int.', style: 'tableHeader' },
                            { text: 'Saída Final', style: 'tableHeader' },
                            { text: 'Trabalhadas', style: 'tableHeader' },
                            { text: 'Hrs Extras', style: 'tableHeader' },
                            { text: 'Noturnas', style: 'tableHeader' },
                            { text: 'Fictas (CLT)', style: 'tableHeader' },
                            { text: 'Atraso/Falta', style: 'tableHeader' }
                        ],
                        ...bodyLançamentos,
                        // Rodapé com os Totais
                        [
                            { text: 'TOTAIS DO MÊS:', colSpan: 5, alignment: 'right', bold: true, fillColor: '#f8fafc' },
                            {}, {}, {}, {},
                            { text: totais.trab, alignment: 'center', bold: true, fillColor: '#f8fafc' },
                            { text: totais.extra, alignment: 'center', bold: true, color: '#16a34a', fillColor: '#f8fafc' },
                            { text: totais.noturno, alignment: 'center', bold: true, color: '#2563eb', fillColor: '#f8fafc' },
                            { text: totais.ficta, alignment: 'center', bold: true, color: '#6366f1', fillColor: '#f8fafc' },
                            { text: totais.atraso, alignment: 'center', bold: true, color: '#dc2626', fillColor: '#f8fafc' }
                        ]
                    ]
                },
                layout: layoutCompacto, 
                style: 'tableMain'
            },

            // Assinaturas - Aproximadas e menores
            {
                columns: [
                    { text: '___________________________________________________\nAssinatura do Colaborador', alignment: 'center', margin: [0, 30, 0, 0], fontSize: 8 },
                    { text: '___________________________________________________\nAssinatura do Empregador', alignment: 'center', margin: [0, 30, 0, 0], fontSize: 8 }
                ]
            }
        ],
        styles: {
            header: { fontSize: 11, bold: true, margin: [0, 0, 0, 2], color: '#1e293b', alignment: 'center' },
            tableHeader: { bold: true, fontSize: 7, color: '#1e293b', fillColor: '#f1f5f9', alignment: 'center' },
            tableEscala: { margin: [0, 0, 0, 0], fontSize: 7.5 },
            tableMain: { margin: [0, 0, 0, 0], fontSize: 7 } // A fonte da tabela principal desceu para 7
        },
        defaultStyle: { font: 'Roboto' }
    };

    const nomeFicheiro = `Espelho_Ponto_${colaborador.nome.replace(/\s+/g, '_')}_${colaborador.competencia.replace('/', '-')}.pdf`;
    pdfMake.createPdf(docDefinition).download(nomeFicheiro);
}