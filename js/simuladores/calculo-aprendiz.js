// js/simuladores/calculo-aprendiz.js

// Variável global para ser consumida futuramente pelos geradores de PDF e Planilha
window.dadosRelatorioAprendiz = {};

document.addEventListener('DOMContentLoaded', () => {
    const inputUpload = document.getElementById('upload-planilha-aprendiz');
    let cboLookup = {};

    // 1. Preparação Estruturada do Dicionário
    if (typeof dicionarioCBO !== 'undefined' && Array.isArray(dicionarioCBO) && dicionarioCBO.length > 1) {
        const titulos = dicionarioCBO[0];
        const formacoes = dicionarioCBO[1]; 
        
        for (let chave in formacoes) {
            if (chave !== 'CBO') {
                let cboLimpo = chave.replace(/\D/g, ''); 
                cboLookup[cboLimpo] = {
                    titulo: titulos[chave] || 'Título Não Especificado',
                    nivel: formacoes[chave] || 'Não Especificado'
                };
            }
        }
    } else {
        console.error("Falha ao carregar a base de CBOs. Verifique o arquivo cbo-dicionario.js.");
    }

    // 2. Escuta de Importação e Processamento Automático
    if(inputUpload) {
        inputUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            document.getElementById('nome-arquivo-selecionado').innerText = "Analisando: " + file.name + "...";

            const reader = new FileReader();
            reader.onload = function(event) {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Mapeamento: B1 = Empresa | B2 = CNPJ | A5 para baixo = CBOs
                const empresa = worksheet['B1'] ? worksheet['B1'].v : 'Não informada';
                const cnpj = worksheet['B2'] ? worksheet['B2'].v : 'Não informado';
                
                document.getElementById('lbl-empresa').innerText = empresa;
                document.getElementById('lbl-cnpj').innerText = cnpj;

                const cbosCapturados = [];
                const range = XLSX.utils.decode_range(worksheet['!ref']);
                
                // A linha 5 corresponde ao índice 4 no SheetJS (A5)
                for (let R = 4; R <= range.e.r; ++R) {
                    const cellRef = XLSX.utils.encode_cell({c: 0, r: R}); // c: 0 = Coluna A
                    const cell = worksheet[cellRef];
                    if (cell && cell.v) {
                        cbosCapturados.push(String(cell.v));
                    }
                }

                processarCotasTrabalhistas(cbosCapturados, empresa, cnpj);
                
                document.getElementById('nome-arquivo-selecionado').innerText = "Planilha processada com sucesso!";
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // 3. Motor de Processamento com Segregação Absoluta
    function processarCotasTrabalhistas(cbosGerais, empresa, cnpj) {
        if (cbosGerais.length === 0) {
            alert("Nenhum CBO foi encontrado a partir da célula A5.");
            return;
        }

        // Agrupador para contar as repetições
        const cboAgrupado = {};
        let contTotal = 0;

        cbosGerais.forEach(cboRaw => {
            let cboLimpo = cboRaw.replace(/\D/g, ''); 
            if (cboLimpo.length >= 4) { // Validação mínima para ignorar células vazias ou com lixo
                cboLimpo = cboLimpo.padStart(6, '0');
                cboAgrupado[cboLimpo] = (cboAgrupado[cboLimpo] || 0) + 1;
                contTotal++;
            }
        });

        let htmlBase = "";
        let htmlExcluidos = "";
        let htmlNaoEncontrados = "";
        let htmlTotal = "";

        let contExcluidos = 0;
        let contBase = 0;
        let contNaoEncontrados = 0;

        const foraDaCota = ['Superior', 'Formação militar', 'Lideranças internas', 'Votação', 'Concursado', 'Livre'];
        
        const arrBaseDetalhes = [];
        const arrExcluidosDetalhes = [];
        const arrNaoEncontradosDetalhes = [];
        const arrTotalDetalhes = [];

        for (let cbo in cboAgrupado) {
            let qtd = cboAgrupado[cbo];
            let infoCBO = cboLookup[cbo];
            
            // Formatando o CBO para exibição amigável XXXX-XX
            let cboFormatado = cbo.length === 6 ? `${cbo.substring(0,4)}-${cbo.substring(4,6)}` : cbo;
            
            if (!infoCBO) {
                // Cenário 1: CBO NÃO EXISTE NA BASE
                contNaoEncontrados += qtd;
                let objNE = { cbo: cboFormatado, titulo: 'CBO Não Localizado', escolaridade: 'Necessária Revisão', quantidade: qtd };
                arrNaoEncontradosDetalhes.push(objNE);
                arrTotalDetalhes.push(objNE);

                let tr = `<tr>
                    <td>${cboFormatado}</td>
                    <td style="color:#ef4444; font-weight:bold;">⚠️ CBO Não Localizado</td>
                    <td>Revisão Necessária</td>
                    <td style="text-align:center; font-weight:bold;">${qtd}</td>
                </tr>`;
                htmlNaoEncontrados += tr;
                htmlTotal += tr;

            } else {
                // Cenário 2: CBO EXISTE
                let obj = { cbo: cboFormatado, titulo: infoCBO.titulo, escolaridade: infoCBO.nivel, quantidade: qtd };
                arrTotalDetalhes.push(obj);
                
                let tr = `<tr>
                    <td>${cboFormatado}</td>
                    <td>${infoCBO.titulo}</td>
                    <td>${infoCBO.nivel}</td>
                    <td style="text-align:center; font-weight:bold; color:#0ea5e9;">${qtd}</td>
                </tr>`;
                
                htmlTotal += tr;

                // Segregação Lógica
                if (foraDaCota.includes(infoCBO.nivel)) {
                    contExcluidos += qtd;
                    htmlExcluidos += tr;
                    arrExcluidosDetalhes.push(obj);
                } else {
                    contBase += qtd;
                    htmlBase += tr;
                    arrBaseDetalhes.push(obj);
                }
            }
        }

        // A Cota é dimensionada EXCLUSIVAMENTE sobre a "Base de Cálculo Líquida" (Exclui os não encontrados matematicamente)
        let cotaMinima = Math.ceil(contBase * 0.05);
        let cotaMaxima = Math.ceil(contBase * 0.15);

        // 4. Injeção na Tela
        document.getElementById('res-total-funcionarios').innerText = contTotal;
        document.getElementById('res-excluidos').innerText = contExcluidos;
        document.getElementById('res-base-calculo').innerText = contBase;
        document.getElementById('res-nao-encontrados').innerText = contNaoEncontrados;
        
        document.getElementById('res-cota-minima').innerText = cotaMinima;
        document.getElementById('res-cota-maxima').innerText = cotaMaxima;

        document.getElementById('tbody-base-calculo').innerHTML = htmlBase || '<tr><td colspan="4" style="text-align:center;">Nenhum registro apto</td></tr>';
        document.getElementById('tbody-excluidos').innerHTML = htmlExcluidos || '<tr><td colspan="4" style="text-align:center;">Nenhuma função excluída</td></tr>';
        document.getElementById('tbody-nao-encontrados').innerHTML = htmlNaoEncontrados || '<tr><td colspan="4" style="text-align:center;">Todos os CBOs foram validados com sucesso</td></tr>';
        document.getElementById('tbody-total-analisado').innerHTML = htmlTotal || '<tr><td colspan="4" style="text-align:center;">Nenhum CBO analisado</td></tr>';

        // 5. Salva dados na Memória Global para os futuros geradores de PDF e Excel
        window.dadosRelatorioAprendiz = {
            empresa: empresa,
            cnpj: cnpj,
            totalFuncionarios: contTotal,
            excluidos: contExcluidos,
            baseCalculo: contBase,
            naoEncontrados: contNaoEncontrados,
            cotaMinima: cotaMinima,
            cotaMaxima: cotaMaxima,
            tabelas: {
                base: arrBaseDetalhes,
                excluidos: arrExcluidosDetalhes,
                naoEncontrados: arrNaoEncontradosDetalhes,
                total: arrTotalDetalhes
            }
        };

        // Revela o painel de resultados
        document.getElementById('painel-resultados').style.display = 'block';
    }
});