// js/pdf-generators/ferias-pdf.js

export function gerarPDFFerias(listaDados, dataBase) {
    // Mapeamento dos dados para as linhas da tabela
    const rows = listaDados.map(d => [
        d.empresa || '-',
        d.codigo || '-',
        d.nome || 'Não informado',
        d.dataLimiteFormatada || '-',
        d.diasRestantes ? d.diasRestantes.toString() : '0',
        { 
            text: d.diasRestantes < 0 ? 'VENCIDO' : 'CRÍTICO', 
            bold: true, 
            color: d.diasRestantes < 0 ? 'red' : 'orange' 
        }
    ]);

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
            { text: 'RELATÓRIO DE FÉRIAS CRÍTICAS', style: 'header' },
            { text: `Data Base do Processamento: ${dataBase.toLocaleDateString('pt-BR')}`, style: 'subheader' },
            { text: 'Lista de colaboradores com férias vencendo ou vencidas', style: 'subheader' },
            
            {
                table: {
                    headerRows: 1,
                    widths: ['*', 40, '*', 70, 40, 60],
                    body: [
                        ['Empresa', 'Cód', 'Colaborador', 'Dt. Limite', 'Dias', 'Status'],
                        ...rows
                    ]
                },
                layout: 'lightHorizontalLines',
                style: 'table'
            }
        ],
        styles: {
            header: { fontSize: 16, bold: true, margin: [0, 0, 0, 5], color: '#1e293b', alignment: 'center' },
            subheader: { fontSize: 10, margin: [0, 0, 0, 20], color: '#64748b', alignment: 'center' },
            table: { margin: [0, 0, 0, 15], fontSize: 9 }
        },
        defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download(`Relatorio_Ferias_Criticas.pdf`);
}