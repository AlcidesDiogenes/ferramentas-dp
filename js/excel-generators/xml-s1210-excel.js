/**
 * @module ExcelGeneratorS1210
 * @description Módulo responsável por exportar os dados processados do S-1210 para Excel (.xlsx) com formatação de colunas.
 */

export function exportarExcelS1210(dadosGlobais) {
    if (!dadosGlobais || dadosGlobais.length === 0) {
        alert("Não há dados processados para exportar.");
        return;
    }

    // 1. Mapeamento e tradução dos dados para colunas amigáveis
    const dadosPlanilha = dadosGlobais.map(registro => ({
        'Arquivo Fonte': registro.nome_arquivo || '-',
        'Insc. Empregador': registro.nrInsc_Empregador || '-',
        'Insc. Transmissor': registro.nrInsc_Transmissor || '-',
        'ID Evento': registro.evento_Id || '-',
        'Período Apuração': registro.perApur || '-',
        'CPF Beneficiário': registro.cpfBenef || '-',
        'Data Pagamento': registro.dtPgto || '-',
        'Período Referência': registro.perRef || '-',
        'ID DM Dev (Recibo)': registro.ideDmDev || '-',
        'Valor Líquido (R$)': registro.vrLiq !== null ? parseFloat(registro.vrLiq) : 0
    }));

    // 2. Converte o array de objetos em uma planilha (Worksheet)
    const ws = XLSX.utils.json_to_sheet(dadosPlanilha);

    // 3. Configuração de largura das colunas (em número de caracteres)
    ws['!cols'] = [
        { wch: 35 }, // Arquivo Fonte
        { wch: 20 }, // Insc. Empregador
        { wch: 20 }, // Insc. Transmissor
        { wch: 45 }, // ID Evento (Costuma ser longo no eSocial)
        { wch: 18 }, // Período Apuração
        { wch: 18 }, // CPF Beneficiário
        { wch: 18 }, // Data Pagamento
        { wch: 20 }, // Período Referência
        { wch: 40 }, // ID DM Dev (Recibo)
        { wch: 20 }  // Valor Líquido (R$)
    ];

    // 4. Cria um novo arquivo (Workbook) e adiciona a planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Conferência S-1210");

    // 5. Gera o arquivo final e força o download
    const dataAtual = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Relatorio_XML_S1210_${dataAtual}.xlsx`);
}