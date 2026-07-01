/**
 * @module ImportacaoTXT
 * @description Processamento de arquivo com mapeamento inquebrável de posições e extração dinâmica de cálculo
 */

"use strict";

class GeradorArquivoDominio {
    // A função agora recebe um objeto, eliminando qualquer risco de ordem errada de parâmetros
    static formatarLinha({ codigoEmpregado, competencia, rubrica, calculo, valor, empresa }) {
        
        // Aplicação rigorosa das posições exigidas pelo layout da Domínio
        const p1_fixo = "10"; // Pos: 01-02 (2)
        const p2_emp  = String(codigoEmpregado || '').replace(/\D/g, '').slice(-10).padStart(10, '0'); // Pos: 03-12 (10)
        const p3_comp = String(competencia || '').replace(/\D/g, '').slice(-6).padStart(6, '0'); // Pos: 13-18 (6)
        const p4_rub  = String(rubrica || '').replace(/\D/g, '').slice(-9).padStart(9, '0'); // Pos: 19-27 (9)
        const p5_calc = String(calculo || '').replace(/\D/g, '').slice(-2).padStart(2, '0'); // Pos: 28-29 (2) - Tipo do Processo
        const p6_val  = String(Math.round(valor * 100)).slice(-9).padStart(9, '0'); // Pos: 30-38 (9) - Valor
        const p7_cia  = String(empresa || '').replace(/\D/g, '').slice(-10).padStart(10, '0'); // Pos: 39-48 (10)

        // Concatena as variáveis travadas na ordem exata do layout
        return `${p1_fixo}${p2_emp}${p3_comp}${p4_rub}${p5_calc}${p6_val}${p7_cia}`;
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

    function resetInterface() {
        tabelaCorpo.innerHTML = '';
        secaoRelatorio.style.display = 'none';
        infoHeader.style.display = 'none';
        painelAcoes.style.display = 'none';
        window.appData = { linhasTxt: [], empresa: "", competencia: "", htmlRowsBackup: [] };
    }

    inputCsv.addEventListener('change', (e) => {
        if (e.target.files.length === 0) return;

        resetInterface();

        const file = e.target.files[0];
        listaArquivos.innerHTML = `<li>${file.name} - ✅ Processado com Sucesso</li>`;
        statusContainer.style.display = 'block';

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: false });

            // 1. Mapeamento Fixo da Planilha
            const empresa = String(rows[2] && rows[2][2] ? rows[2][2] : "").replace(/\D/g, '');
            const rawCompetencia = String(rows[5] && rows[5][2] ? rows[5][2] : "");
            
            const compDigits = rawCompetencia.replace(/\D/g, '');
            const compAAAAMM = compDigits.length === 8 ? compDigits.substring(4,8) + compDigits.substring(2,4) : (compDigits.length === 6 ? compDigits.substring(2,6) + compDigits.substring(0,2) : compDigits);

            const elEmpresa = document.getElementById('display-empresa');
            const elComp = document.getElementById('display-competencia');
            if (elEmpresa) elEmpresa.textContent = empresa;
            if (elComp) elComp.textContent = compAAAAMM;
            
            infoHeader.style.display = 'block';

            // 2. Mapeamento das Rubricas
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

            // 3. Iteração Dinâmica de Funcionários
            let linhasTxt = [];
            let htmlRows = [];

            for (let i = 10; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                // Extração dinâmica do Tipo de Cálculo (Célula A11 em diante)
                const calculo = String(row[0] || "").trim(); 
                const folha = String(row[1] || "").trim();   
                const nome = String(row[2] || "").trim();    

                if (!folha || folha.toUpperCase().includes("TOTAL") || calculo.toUpperCase().includes("TOTAL")) continue;

                Object.keys(mapaRubricas).forEach(colIndex => {
                    const valorBruto = row[colIndex];
                    const rubrica = mapaRubricas[colIndex];

                    if (valorBruto !== undefined && valorBruto !== null && String(valorBruto).trim() !== "") {
                        
                        // Restauração integral da lógica que estava validada financeiramente
                        const valor = parseFloat(String(valorBruto).replace(',', '.'));
                        
                        if (!isNaN(valor)) {
                            // Uso do objeto para passagem de parâmetros: impossível inverter a ordem acidentalmente
                            linhasTxt.push(GeradorArquivoDominio.formatarLinha({
                                codigoEmpregado: folha, 
                                competencia: compAAAAMM, 
                                rubrica: rubrica, 
                                calculo: calculo, 
                                valor: valor, 
                                empresa: empresa
                            }));
                            
                            htmlRows.push(`<tr><td>${calculo}</td><td>${folha}</td><td>${nome}</td><td>${rubrica}</td><td>${valor.toFixed(2)}</td></tr>`);
                        }
                    }
                });
            }

            // 4. Exibição da Tabela e Barra de Ações
            tabelaCorpo.innerHTML = htmlRows.join('');
            secaoRelatorio.style.display = 'block';
            painelAcoes.style.display = 'flex';

            window.appData = { linhasTxt, empresa, competencia: compAAAAMM, htmlRowsBackup: htmlRows };
        };
        reader.readAsArrayBuffer(inputCsv.files[0]);
    });

    // 5. Integração com o campo de Filtro
    const inputFiltro = document.getElementById('input-filtro');
    if (inputFiltro) {
        inputFiltro.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            if (!window.appData || !window.appData.htmlRowsBackup) return;
            
            if (termo === '') {
                tabelaCorpo.innerHTML = window.appData.htmlRowsBackup.join('');
                return;
            }

            const linhasFiltradas = window.appData.htmlRowsBackup.filter(rowHtml => rowHtml.toLowerCase().includes(termo));
            tabelaCorpo.innerHTML = linhasFiltradas.join('');
        });
    }

    // 6. Botão responsável exclusivo por disparar o download
    btnProcessar.addEventListener('click', () => {
        if (!window.appData || window.appData.linhasTxt.length === 0) {
            return alert("Nenhum dado processado para download.");
        }
        
        const blob = new Blob([window.appData.linhasTxt.join('\r\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lancamentos_${window.appData.empresa}_${window.appData.competencia}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});