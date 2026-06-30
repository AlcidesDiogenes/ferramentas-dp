// js/pdf-generators/fiscal-pdf.js
import { GeradorDossieFiscal } from '../detalhamento-fiscal.js';

export function gerarPDFFiscal(empresasComPendencia) {
    if (!empresasComPendencia || empresasComPendencia.length === 0) return;

    const content = [];
    content.push({ text: 'Dossiê de Situação Fiscal', style: 'header' });
    content.push({ text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, style: 'subheader' });

    empresasComPendencia.forEach(emp => {
        // Cabeçalho da Empresa
        content.push({ text: emp.nome, style: 'companyHeader' });
        content.push({ text: `CNPJ/CPF: ${emp.documento} | Consulta: ${emp.dataConsulta}`, style: 'companyInfo' });

        // Tabela formatada
        const rows = emp.detalhes.map(detalhe => {
            const partes = detalhe.split(" ||| ");
            const linhaRaw = partes.length > 1 ? partes[1] : detalhe;
            
            // Usamos o motor de parsing do seu próprio sistema!
            const dados = GeradorDossieFiscal.parseLinhaDebito(linhaRaw);

            return [
                { text: dados.pa, alignment: 'center', fontSize: 8 }, // Competência
                { text: dados.vcto, alignment: 'center', fontSize: 8 }, // Vencimento
                { text: dados.descricao, fontSize: 8 }, // Descrição
                { text: dados.valorTotal, alignment: 'right', bold: true, fontSize: 8 }, // Valor
                { text: dados.situacao, fontSize: 7, alignment: 'center', color: '#b91c1c' } // Status
            ];
        });

        content.push({
            table: {
                headerRows: 1,
                widths: [40, 60, '*', 60, 60],
                body: [
                    [
                        { text: 'Comp.', style: 'tableHeader' },
                        { text: 'Venc.', style: 'tableHeader' },
                        { text: 'Descrição do Débito', style: 'tableHeader' },
                        { text: 'Valor', style: 'tableHeader' },
                        { text: 'Status', style: 'tableHeader' }
                    ],
                    ...rows
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 20]
        });
    });

    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [30, 30, 30, 30],
        content: content,
        styles: {
            header: { fontSize: 18, bold: true, color: '#0f172a', alignment: 'center' },
            subheader: { fontSize: 10, color: '#64748b', alignment: 'center', margin: [0, 0, 0, 20] },
            companyHeader: { fontSize: 12, bold: true, color: '#1e40af', margin: [0, 15, 0, 2] },
            companyInfo: { fontSize: 9, color: '#475569', margin: [0, 0, 0, 10] },
            tableHeader: { fontSize: 9, bold: true, fillColor: '#f1f5f9', color: '#334155', padding: [5, 5, 5, 5] },
            table: { fontSize: 8 }
        },
        defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download(`Dossie_Fiscal_${new Date().getTime()}.pdf`);
}