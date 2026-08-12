/**
 * Ferramentas DP - Gerador de Excel para Cota de Aprendiz
 * Dependência: SheetJS (xlsx.full.min.js) e window.dadosRelatorioAprendiz
 */

function exportarExcelCotaAprendiz() {
    const dados = window.dadosRelatorioAprendiz;

    if (!dados || Object.keys(dados).length === 0) {
        if (window.showToast) {
            window.showToast("Nenhum dado processado. Por favor, importe e processe uma planilha primeiro.", "warning");
        } else {
            alert("Nenhum dado processado. Por favor, importe e processe uma planilha primeiro.");
        }
        return;
    }

    const xlsxObj = window.XLSX || (typeof XLSX !== 'undefined' ? XLSX : null);

    if (!xlsxObj) {
        if (window.showToast) {
            window.showToast("A biblioteca de planilhas (SheetJS / XLSX) ainda não foi carregada. Por favor, aguarde alguns segundos e tente novamente.", "error");
        } else {
            alert("A biblioteca de planilhas (SheetJS / XLSX) ainda não foi carregada.");
        }
        return;
    }

    try {
        const wb = xlsxObj.utils.book_new();

        // 1. Aba Resumo
        const resumoData = [
            ["RELATÓRIO DE DIMENSIONAMENTO - COTA DE JOVEM APRENDIZ (Art. 429 CLT)"],
            [""],
            ["DADOS DA EMPRESA"],
            ["Razão Social:", dados.empresa ? dados.empresa.razaoSocial : ""],
            ["CNPJ:", dados.empresa ? dados.empresa.cnpj : ""],
            [""],
            ["RESUMO DA APURAÇÃO"],
            ["Total de CBOs Analisados na Planilha:", dados.resumoTotais ? dados.resumoTotais.totalAnalisadosCount : 0],
            ["Base de Cálculo Líquida (Elegíveis):", dados.resumoTotais ? dados.resumoTotais.baseCalculoEfetivaCount : 0],
            ["Funções Excluídas por Força de Lei:", dados.resumoTotais ? dados.resumoTotais.totalExcluidosCount : 0]
        ];

        if (dados.resumoTotais && dados.resumoTotais.totalNaoEncontradosCount > 0) {
            resumoData.push(["CBOs Não Encontrados na Base Oficial:", dados.resumoTotais.totalNaoEncontradosCount]);
        }

        resumoData.push(
            [""],
            ["DIMENSIONAMENTO DA COTA OBRIGATÓRIA"],
            ["Mínimo Obrigatório (5%):", dados.dimensionamentoCotas ? dados.dimensionamentoCotas.cotaMinima : 0],
            ["Média Recomendada (10%):", dados.dimensionamentoCotas ? dados.dimensionamentoCotas.cotaMedia : 0],
            ["Limite Máximo (15%):", dados.dimensionamentoCotas ? dados.dimensionamentoCotas.cotaMaxima : 0]
        );
        const wsResumo = xlsxObj.utils.aoa_to_sheet(resumoData);
        
        // Dimensionamento Visual da Aba Resumo
        wsResumo['!cols'] = [
            { wch: 45 }, // Coluna A (Títulos)
            { wch: 30 }  // Coluna B (Valores)
        ];
        xlsxObj.utils.book_append_sheet(wb, wsResumo, "1. Resumo");

        const formatarTabela = (lista, colunasMapeamento) => {
            return (lista || []).map(item => {
                const obj = {};
                colunasMapeamento.forEach(col => {
                    obj[col.header] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : "";
                });
                return obj;
            });
        };

        // 2. Aba Base de Cálculo
        if (dados.detalhes && dados.detalhes.base && dados.detalhes.base.length > 0) {
            const baseFormatada = formatarTabela(dados.detalhes.base, [
                { header: "CBO", key: "cbo" },
                { header: "Título da Função", key: "titulo" },
                { header: "Escolaridade Exigida", key: "escolaridade" },
                { header: "Quantidade na Planilha", key: "quantidade" }
            ]);
            const wsBase = xlsxObj.utils.json_to_sheet(baseFormatada);
            
            wsBase['!cols'] = [
                { wch: 12 },
                { wch: 55 },
                { wch: 35 },
                { wch: 25 }
            ];
            xlsxObj.utils.book_append_sheet(wb, wsBase, "2. Base de Cálculo");
        }

        // 3. Aba Funções Excluídas
        if (dados.detalhes && dados.detalhes.excluidos && dados.detalhes.excluidos.length > 0) {
            const excluidosFormatado = formatarTabela(dados.detalhes.excluidos, [
                { header: "CBO", key: "cbo" },
                { header: "Título da Função", key: "titulo" },
                { header: "Motivo da Exclusão", key: "motivoExclusao" },
                { header: "Quantidade na Planilha", key: "quantidade" }
            ]);
            const wsExcluidos = xlsxObj.utils.json_to_sheet(excluidosFormatado);
            
            wsExcluidos['!cols'] = [
                { wch: 12 },
                { wch: 55 },
                { wch: 45 },
                { wch: 25 }
            ];
            xlsxObj.utils.book_append_sheet(wb, wsExcluidos, "3. Funções Excluídas");
        }

        // 4. Aba Não Encontrados
        if (dados.detalhes && dados.detalhes.naoEncontrados && dados.detalhes.naoEncontrados.length > 0) {
            const naoEncFormatado = formatarTabela(dados.detalhes.naoEncontrados, [
                { header: "CBO Fornecido", key: "cbo" },
                { header: "Status na Base", key: "titulo" },
                { header: "Ação Necessária", key: "escolaridade" },
                { header: "Quantidade Encontrada", key: "quantidade" }
            ]);
            const wsNaoEnc = xlsxObj.utils.json_to_sheet(naoEncFormatado);
            
            wsNaoEnc['!cols'] = [
                { wch: 16 },
                { wch: 30 },
                { wch: 30 },
                { wch: 25 }
            ];
            xlsxObj.utils.book_append_sheet(wb, wsNaoEnc, "4. Não Encontrados");
        }

        // Gera o Arquivo
        const cnpjNome = (dados.empresa && dados.empresa.cnpj) ? dados.empresa.cnpj.replace(/\D/g, '') : 'export';
        xlsxObj.writeFile(wb, `Planilha_Aprendiz_${cnpjNome || 'geral'}.xlsx`);

        if (window.showToast) {
            window.showToast("Relatório em planilha exportado com sucesso!", "success");
        }
    } catch (err) {
        console.error("Erro ao exportar planilha:", err);
        if (window.showToast) {
            window.showToast("Erro ao gerar a planilha Excel: " + err.message, "error");
        } else {
            alert("Erro ao gerar a planilha Excel: " + err.message);
        }
    }
}

function initCotaAprendizExcel() {
    const btnExcel = document.getElementById("btn-exportar-planilha");
    if (!btnExcel) return;

    btnExcel.removeEventListener("click", exportarExcelCotaAprendiz);
    btnExcel.addEventListener("click", exportarExcelCotaAprendiz);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCotaAprendizExcel);
} else {
    initCotaAprendizExcel();
}
