// js/simuladores/pdf-generator.js

/**
 * Módulo de Geração de PDF Profissional (via pdfMake)
 * Agora com formatação de moeda fixa em 2 casas decimais.
 */

export function gerarPDFProlabore(res, dados, periodicidade) {
    const textoPeriodicidade = periodicidade == 1 ? 'Mensal' : (periodicidade == 6 ? 'Semestral' : 'Anual');
    
    // CORREÇÃO: Adicionado maximumFractionDigits: 2 para garantir sempre 2 casas
    const f = (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Definição da Estrutura do Documento
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
            { text: 'RELATÓRIO DE SIMULAÇÃO DE PRÓ-LABORE', style: 'header' },
            
            { text: '1. Configurações da Simulação', style: 'sectionHeader' },
            {
                table: {
                    widths: [200, '*'],
                    body: [
                        ['Regime Tributário', dados.regime === 'lucro' ? 'Lucro Presumido/Real' : 'Simples Nacional'],
                        ['Periodicidade', textoPeriodicidade],
                        ['INSS Patronal', dados.regime === 'lucro' ? dados.percPatronal + '%' : '-'],
                        ['Dependentes', dados.filhos > 0 ? dados.filhos : 'Nenhum'],
                        ['Outras Bases', dados.outrasBases > 0 ? f(dados.outrasBases) : 'R$ 0,00'],
                        ['INSS Já Contribuído', dados.valorJaContribuido > 0 ? f(dados.valorJaContribuido) : 'R$ 0,00']
                    ]
                },
                layout: 'lightHorizontalLines',
                style: 'table'
            },

            { text: '2. Bases de Cálculo', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', '*'],
                    body: [
                        ['Base INSS', f(res.baseInss)],
                        ['Base IRRF', f(res.baseIrrf)]
                    ]
                },
                layout: 'lightHorizontalLines',
                style: 'table'
            },

            { text: '3. Resumo Financeiro', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        ['Provento', 'INSS Segurado', 'IRRF', 'Líquido'],
                        [f(dados.salarioBruto), f(res.inssSegurado), f(res.irrf), { text: f(res.valorLiquido), bold: true, color: '#1e40af' }]
                    ]
                },
                style: 'table'
            },

            { text: '4. Custos da Empresa', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', '*'],
                    body: [
                        ['Custo INSS Patronal', f(res.inssPatronal * periodicidade)],
                        ['Custo Total Totalizado', { text: f((dados.salarioBruto * periodicidade) + (res.inssPatronal * periodicidade)), bold: true }]
                    ]
                },
                style: 'table'
            }
        ],
        styles: {
            header: { fontSize: 16, bold: true, margin: [0, 0, 0, 20], color: '#1e293b', alignment: 'center' },
            sectionHeader: { fontSize: 12, bold: true, margin: [0, 20, 0, 8], color: '#020202', decoration: 'underline' },
            table: { margin: [0, 0, 0, 15], fontSize: 10 }
        },
        defaultStyle: { font: 'Roboto' }
    };

    // Gera o PDF
    pdfMake.createPdf(docDefinition).download(`Simulacao_Prolabore.pdf`);
}