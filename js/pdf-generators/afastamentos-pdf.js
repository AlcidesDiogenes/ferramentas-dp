// js/pdf-generators/afastamentos-pdf.js

export function gerarPDFAfastamento(listaDados) {
    // 1. Pré-processamento: Calcular acúmulo de dias por doença por colaborador
    const somaDoencas = {};
    const ehMotivoDoenca = (motivo) => {
        const m = motivo.toLowerCase();
        return m.includes("doença") || motivo.includes("18-") || motivo.includes("12-");
    };

    // Preenche o objeto com a soma total de dias por doença para cada código
    listaDados.forEach(d => {
        if (ehMotivoDoenca(d.motivo)) {
            const dias = parseInt(d.diasAfastado || 0);
            somaDoencas[d.codigo] = (somaDoencas[d.codigo] || 0) + dias;
        }
    });

    // 2. Mapeamento das linhas com a regra de acúmulo aplicada
    const rows = listaDados.map(d => {
        const totalAcumulado = somaDoencas[d.codigo] || 0;
        
        // Regra: Alerta se for motivo doença E acumular >= 15 dias
        const precisaAlerta = ehMotivoDoenca(d.motivo) && totalAcumulado >= 15;
        
        const alertaTexto = precisaAlerta 
            ? { text: `! Atenção (${totalAcumulado} dias)`, bold: true, color: 'red' } 
            : '-';

        return [
            d.nome || 'Não informado',
            d.motivo || '-',
            d.inicio || '-',
            d.retorno || '-',
            d.diasAfastado ? d.diasAfastado.toString() : '0',
            alertaTexto
        ];
    });

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape', // Alterado para landscape para acomodar melhor a tabela
        pageMargins: [40, 40, 40, 40],
        content: [
            { text: 'RELATÓRIO DE AFASTAMENTOS E RISCO INSS', style: 'header' },
            
            { text: 'Detalhamento de Afastamentos', style: 'sectionHeader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*', '*', '*', 30, 80],
                    body: [
                        ['Colaborador', 'Motivo', 'Início', 'Retorno', 'Dias', 'Status'],
                        ...rows
                    ]
                },
                layout: 'lightHorizontalLines',
                style: 'table'
            }
        ],
        styles: {
            header: { fontSize: 16, bold: true, margin: [0, 0, 0, 20], color: '#1e293b', alignment: 'center' },
            sectionHeader: { fontSize: 12, bold: true, margin: [0, 20, 0, 8], color: '#2563eb', decoration: 'underline' },
            table: { margin: [0, 0, 0, 15], fontSize: 9 }
        },
        defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download(`Relatorio_Afastamentos_Analitico.pdf`);
}