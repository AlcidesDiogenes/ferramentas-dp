/**
 * Ferramentas DP - Gerador de Excel para Cota de Aprendiz
 * Dependência: SheetJS (xlsx.full.min.js) e window.dadosRelatorioAprendiz
 */

document.addEventListener("DOMContentLoaded", () => {
    const btnExcel = document.getElementById("btn-exportar-planilha");
    if (!btnExcel) return;

    btnExcel.addEventListener("click", () => {
        const dados = window.dadosRelatorioAprendiz;

        if (!dados || Object.keys(dados).length === 0) {
            alert("Nenhum dado processado. Por favor, importe e processe uma planilha primeiro.");
            return;
        }

        const wb = XLSX.utils.book_new();

        // 1. Aba Resumo
        const resumoData = [
            ["RELATÓRIO DE DIMENSIONAMENTO - COTA DE JOVEM APRENDIZ (Art. 429 CLT)"],
            [""],
            ["DADOS DA EMPRESA"],
            ["Razão Social:", dados.empresa.razaoSocial],
            ["CNPJ:", dados.empresa.cnpj],
            [""],
            ["RESUMO DA APURAÇÃO"],
            ["Total de CBOs Analisados na Planilha:", dados.resumoTotais.totalAnalisadosCount],
            ["Base de Cálculo Líquida (Elegíveis):", dados.resumoTotais.baseCalculoEfetivaCount],
            ["Funções Excluídas por Força de Lei:", dados.resumoTotais.totalExcluidosCount],
            ["CBOs Não Encontrados na Base Oficial:", dados.resumoTotais.totalNaoEncontradosCount],
            [""],
            ["DIMENSIONAMENTO DA COTA OBRIGATÓRIA"],
            ["Mínimo Obrigatório (5%):", dados.dimensionamentoCotas.cotaMinima],
            ["Média Recomendada (10%):", dados.dimensionamentoCotas.cotaMedia],
            ["Limite Máximo (15%):", dados.dimensionamentoCotas.cotaMaxima]
        ];
        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
        
        // Dimensionamento Visual da Aba Resumo
        wsResumo['!cols'] = [
            { wch: 45 }, // Coluna A (Títulos) bem larga
            { wch: 30 }  // Coluna B (Valores)
        ];
        XLSX.utils.book_append_sheet(wb, wsResumo, "1. Resumo");

        const formatarTabela = (lista, colunasMapeamento) => {
            return lista.map(item => {
                const obj = {};
                colunasMapeamento.forEach(col => {
                    obj[col.header] = item[col.key] || "";
                });
                return obj;
            });
        };

        // 2. Aba Base de Cálculo
        if (dados.detalhes.base.length > 0) {
            const baseFormatada = formatarTabela(dados.detalhes.base, [
                { header: "CBO", key: "cbo" },
                { header: "Título da Função", key: "titulo" },
                { header: "Escolaridade Exigida", key: "escolaridade" },
                { header: "Quantidade na Planilha", key: "quantidade" }
            ]);
            const wsBase = XLSX.utils.json_to_sheet(baseFormatada);
            
            // Dimensionamento Visual da Aba Base de Cálculo
            wsBase['!cols'] = [
                { wch: 12 }, // CBO
                { wch: 55 }, // Título da Função (Espaço para nomes longos)
                { wch: 35 }, // Escolaridade Exigida
                { wch: 25 }  // Quantidade na Planilha
            ];
            XLSX.utils.book_append_sheet(wb, wsBase, "2. Base de Cálculo");
        }

        // 3. Aba Funções Excluídas
        if (dados.detalhes.excluidos.length > 0) {
            const excluidosFormatado = formatarTabela(dados.detalhes.excluidos, [
                { header: "CBO", key: "cbo" },
                { header: "Título da Função", key: "titulo" },
                { header: "Motivo da Exclusão", key: "motivoExclusao" },
                { header: "Quantidade na Planilha", key: "quantidade" }
            ]);
            const wsExcluidos = XLSX.utils.json_to_sheet(excluidosFormatado);
            
            // Dimensionamento Visual da Aba Excluídos
            wsExcluidos['!cols'] = [
                { wch: 12 }, // CBO
                { wch: 55 }, // Título da Função
                { wch: 45 }, // Motivo da Exclusão
                { wch: 25 }  // Quantidade na Planilha
            ];
            XLSX.utils.book_append_sheet(wb, wsExcluidos, "3. Funções Excluídas");
        }

        // 4. Aba Não Encontrados
        if (dados.detalhes.naoEncontrados && dados.detalhes.naoEncontrados.length > 0) {
            const naoEncFormatado = formatarTabela(dados.detalhes.naoEncontrados, [
                { header: "CBO Fornecido", key: "cbo" },
                { header: "Status na Base", key: "titulo" },
                { header: "Ação Necessária", key: "escolaridade" },
                { header: "Quantidade Encontrada", key: "quantidade" }
            ]);
            const wsNaoEnc = XLSX.utils.json_to_sheet(naoEncFormatado);
            
            // Dimensionamento Visual da Aba Não Encontrados
            wsNaoEnc['!cols'] = [
                { wch: 16 }, // CBO Fornecido
                { wch: 30 }, // Status
                { wch: 30 }, // Ação Necessária
                { wch: 25 }  // Quantidade
            ];
            XLSX.utils.book_append_sheet(wb, wsNaoEnc, "4. Não Encontrados");
        }

        // Gera o Arquivo
        const cnpjNome = dados.empresa.cnpj.replace(/\D/g, '');
        XLSX.writeFile(wb, `Planilha_Aprendiz ${cnpjNome}.xlsx`);
    });
});