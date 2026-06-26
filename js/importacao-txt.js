/**
 * @module ImportacaoTXT
 * @description Processamento com Reset Automático a cada novo upload
 */

"use strict";

class GeradorArquivoDominio {
    static formatarLinha(codigoEmpregado, competencia, rubrica, valor, empresa) {
        return [
            "10",
            String(codigoEmpregado || '').replace(/\D/g, '').padStart(10, '0'),
            String(competencia || '').replace(/\D/g, '').padStart(6, '0'),
            String(rubrica || '').replace(/\D/g, '').padStart(9, '0'),
            "11",
            String(Math.round(valor * 100)).padStart(9, '0'),
            String(empresa || '').replace(/\D/g, '').padStart(10, '0')
        ].join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnProcessar = document.getElementById('btn-processar-txt');
    const inputCsv = document.getElementById('csv-input');
    const tabelaCorpo = document.getElementById('tabela-corpo');
    const secaoRelatorio = document.getElementById('report-section');
    const infoHeader = document.getElementById('info-header');
    const statusContainer = document.getElementById('import-status-txt');
    const listaArquivos = document.getElementById('lista-arquivos-txt');
    const painelAcoes = document.getElementById('actions-panel');

    // Reset de estado interno
    function resetInterface() {
        tabelaCorpo.innerHTML = '';
        secaoRelatorio.style.display = 'none';
        infoHeader.style.display = 'none';
        painelAcoes.style.display = 'none';
        window.appData = { linhasTxt: [], empresa: "", competencia: "" };
    }

    inputCsv.addEventListener('change', (e) => {
        if (e.target.files.length === 0) return;

        // Limpa tudo antes de processar o novo arquivo
        resetInterface();

        listaArquivos.innerHTML = `<li>${e.target.files[0].name} - ✅ Carregado</li>`;
        statusContainer.style.display = 'block';

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: false });

            // 1. Mapeamento Fixo
            // C3 (índice [2][2]) -> Empresa | C6 (índice [5][2]) -> Competencia
            const empresa = String(rows[2] ? rows[2][2] || "" : "").replace(/\D/g, '');
            const rawCompetencia = String(rows[5] ? rows[5][2] || "" : "");
            
            const compDigits = rawCompetencia.replace(/\D/g, '');
            const compAAAAMM = compDigits.length === 8 ? compDigits.substring(4,8) + compDigits.substring(2,4) : (compDigits.length === 6 ? compDigits.substring(2,6) + compDigits.substring(0,2) : compDigits);

            document.getElementById('display-empresa').textContent = empresa;
            document.getElementById('display-competencia').textContent = compAAAAMM;
            infoHeader.style.display = 'block';

            // 2. Mapeamento de Rubricas (Linha 10 = índice 9, Colunas D+ = índice 3+)
            const rowRubricas = rows[9]; 
            let mapaRubricas = {};
            
            if (rowRubricas) {
                for (let i = 3; i < rowRubricas.length; i++) {
                    const val = String(rowRubricas[i] || "").replace(/\D/g, '');
                    if (val.length > 0) {
                        mapaRubricas[i] = val; 
                    }
                }
            }

            // 3. Processamento dos Dados (Linha 11 = índice 10+)
            let linhasTxt = [];
            let htmlRows = [];

            for (let i = 10; i < rows.length; i++) {
                const row = rows[i];
                if (!row) continue;

                const calculo = String(row[0] || "").trim(); // Col A
                const folha = String(row[1] || "").trim();   // Col B
                const nome = String(row[2] || "").trim();    // Col C

                if (!folha || folha.toUpperCase().includes("TOTAL") || calculo.toUpperCase().includes("TOTAL")) continue;

                Object.keys(mapaRubricas).forEach(colIndex => {
                    const valorBruto = row[colIndex];
                    const rubrica = mapaRubricas[colIndex];

                    if (valorBruto) {
                        const valor = parseFloat(String(valorBruto).replace(',', '.'));
                        if (valor > 0) {
                            linhasTxt.push(GeradorArquivoDominio.formatarLinha(folha, compAAAAMM, rubrica, valor, empresa));
                            htmlRows.push(`<tr><td>${calculo}</td><td>${folha}</td><td>${nome}</td><td>${rubrica}</td><td>${valor.toFixed(2)}</td></tr>`);
                        }
                    }
                });
            }

            // 4. Exibição
            tabelaCorpo.innerHTML = htmlRows.join('');
            secaoRelatorio.style.display = 'block';
            painelAcoes.style.display = 'flex';

            window.appData = { linhasTxt, empresa, competencia: compAAAAMM };
        };
        reader.readAsArrayBuffer(inputCsv.files[0]);
    });

    btnProcessar.addEventListener('click', () => {
        if (!window.appData || window.appData.linhasTxt.length === 0) return alert("Nenhum dado processado.");
        
        const blob = new Blob([window.appData.linhasTxt.join('\r\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lancamentos_${window.appData.empresa}_${window.appData.competencia}.txt`;
        a.click();
    });
});