/**
 * MOTOR ANALÍTICO - PROGRAMAÇÃO DE FÉRIAS (V2 - Com Validação e Filtros)
 */

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let analiseGlobal = [];
const dataBaseAtual = new Date();

// MAPEAMENTO DOM
const inputArquivo = document.getElementById('file-input');
const listaArquivos = document.getElementById('lista-arquivos-importados');
const areaStatus = document.getElementById('import-status-area');
const painelAcoes = document.getElementById('actions-panel');
const secaoRelatorio = document.getElementById('report-section');
const corpoTabela = document.getElementById('tabela-corpo');
const lblDataBase = document.getElementById('report-date-base');
const inputFiltro = document.getElementById('input-filtro');

document.getElementById('btn-export-excel').addEventListener('click', gerarExcel);
document.getElementById('btn-export-pdf').addEventListener('click', gerarPDF);

// GATILHO DE IMPORTAÇÃO
inputArquivo.addEventListener('change', async (event) => {
    const arquivos = event.target.files;
    if (arquivos.length === 0) return;

    analiseGlobal = [];
    corpoTabela.innerHTML = '';
    listaArquivos.innerHTML = '';
    inputFiltro.value = ''; // Limpa o filtro a cada nova importação
    
    lblDataBase.innerText = `Data Base do Processamento: ${dataBaseAtual.toLocaleDateString('pt-BR')} (Alerta: Vencimento em até 60 dias)`;
    areaStatus.style.display = 'block';

    for (let i = 0; i < arquivos.length; i++) {
        const arquivo = arquivos[i];
        
        const li = document.createElement('li');
        li.innerText = `Processando: ${arquivo.name}...`;
        listaArquivos.appendChild(li);

        try {
            const arrayBuffer = await lerArquivo(arquivo);
            await processarConteudoPDF(arrayBuffer, arquivo.name);
            li.innerText = `${arquivo.name} - ✅ Sucesso`;
            li.style.color = "green";
        } catch (error) {
            console.error("Erro:", error);
            li.innerText = `${arquivo.name} - ❌ Recusado (${error.message})`;
            li.style.color = "red";
            alert(`ATENÇÃO: O arquivo "${arquivo.name}" foi recusado.\nMotivo: ${error.message}`);
        }
    }

    renderizarTabela(analiseGlobal);
    painelAcoes.style.display = 'flex';
    secaoRelatorio.style.display = 'block';
});

// SISTEMA DE FILTRO EM TEMPO REAL
inputFiltro.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();
    
    // Se o campo estiver vazio, mostra tudo. Senão, filtra.
    const dadosFiltrados = termo === '' 
        ? analiseGlobal 
        : analiseGlobal.filter(d => 
            d.nome.toLowerCase().includes(termo) || 
            d.codigo.includes(termo) ||
            d.empresa.toLowerCase().includes(termo)
          );
          
    renderizarTabela(dadosFiltrados);
});

function lerArquivo(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

function parseDataBR(dataStr) {
    const partes = dataStr.split('/');
    return new Date(partes[2], partes[1] - 1, partes[0]);
}

// CÉREBRO: EXTRAÇÃO E VALIDAÇÃO
async function processarConteudoPDF(arrayBuffer, nomeDoArquivo) {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let paginasTexto = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let items = textContent.items;

        items.sort((a, b) => {
            let diffY = Math.round(b.transform[5]) - Math.round(a.transform[5]);
            if (diffY !== 0) return diffY;
            return a.transform[4] - b.transform[4];
        });

        let linhasPagina = [];
        let linhaAtual = "";
        let ultimoY = items.length > 0 ? Math.round(items[0].transform[5]) : -1;

        for (let item of items) {
            let y = Math.round(item.transform[5]);
            if (y !== ultimoY) {
                if (linhaAtual.trim()) linhasPagina.push(linhaAtual.trim());
                linhaAtual = "";
                ultimoY = y;
            }
            linhaAtual += item.str + " ";
        }
        if (linhaAtual.trim()) linhasPagina.push(linhaAtual.trim());
        paginasTexto.push({ numPagina: i, linhas: linhasPagina });
    }

    // TRAVA DE SEGURANÇA: Validação do Padrão do Arquivo
    const textoPagina1 = paginasTexto[0].linhas.join(" ");
    if (!textoPagina1.includes("CNPJ:") && !textoPagina1.includes("CPF:")) {
        throw new Error("Padrão não reconhecido. O relatório não contém o cabeçalho oficial com CNPJ ou CPF.");
    }

    let nomeEmpresa = "Desconhecida";
    const dataLimiteCalculo = new Date(dataBaseAtual);
    dataLimiteCalculo.setDate(dataBaseAtual.getDate() + 60);

    // Captura o Nome do Empregador (Pessoa Jurídica ou Física)
    const linhasP1 = paginasTexto[0].linhas;
    for (let i = 0; i < linhasP1.length; i++) {
        if ((linhasP1[i].includes("CNPJ:") || linhasP1[i].includes("CPF:")) && i > 0) {
            nomeEmpresa = linhasP1[i - 1].replace(/Página:.*/, '').replace(/\d+\/\d+/, '').trim();
            break;
        }
    }

    let ultimoCodigo = "N/A";
    let ultimoNome = "N/A";

    for (let p = 0; p < paginasTexto.length; p++) {
        const linhas = paginasTexto[p].linhas;
        const paginaControle = `Página: ${paginasTexto[p].numPagina}`;

        for (let linha of linhas) {
            if (["Data base", "Página", "Emissão", "Horas", "Total", "Observações"].some(palavra => linha.includes(palavra))) {
                continue;
            }

            const regexData = /(\d{2}\/\d{2}\/\d{4})/g;
            const datasEncontradas = [...linha.matchAll(regexData)].map(m => m[0]);
            
            if (datasEncontradas.length === 0) continue;

            const dataLimiteStr = datasEncontradas[datasEncontradas.length - 1];
            const dataLimiteObj = parseDataBR(dataLimiteStr);

            if (dataLimiteObj <= dataLimiteCalculo) {
                const matchColaborador = linha.match(/^(\d+)\s+(.+?)\s+\d{2}\/\d{2}/);
                if (matchColaborador) {
                    ultimoCodigo = matchColaborador[1];
                    ultimoNome = matchColaborador[2].replace(/(\d{2}\/\d{2}\/\d{4})|\.{2,}|\/[.\/]+/g, '').trim();
                }

                const diffTempo = dataLimiteObj - dataBaseAtual;
                const diasRestantes = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

                analiseGlobal.push({
                    arquivo: nomeDoArquivo,
                    empresa: nomeEmpresa,
                    pagina: paginaControle,
                    codigo: ultimoCodigo,
                    nome: ultimoNome,
                    dataLimiteFormatada: dataLimiteStr,
                    diasRestantes: diasRestantes,
                    timestampOrdenacao: dataLimiteObj.getTime()
                });
            }
        }
    }
}

// CONSTRUÇÃO E RENDERIZAÇÃO DA TABELA (Agora aceita dados filtrados)
function renderizarTabela(dadosParaRenderizar) {
    // Copia o array para não alterar o original durante a ordenação
    let dadosOrdemados = [...dadosParaRenderizar];
    dadosOrdemados.sort((a, b) => a.diasRestantes - b.diasRestantes);

    corpoTabela.innerHTML = '';

    if (dadosOrdemados.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum registro crítico encontrado ou compatível com o filtro.</td></tr>`;
        return;
    }

    dadosOrdemados.forEach(dado => {
        // Nova lógica visual elegante e sem estilos "hardcoded"
        let badgeClasse = dado.diasRestantes < 0 ? 'badge-critico' : 'badge-alerta';
        let status = dado.diasRestantes < 0 ? 'VENCIDO (PASSIVO)' : 'CRÍTICO';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dado.empresa}</td>
            <td>${dado.codigo}</td>
            <td><strong>${dado.nome}</strong></td>
            <td>${dado.dataLimiteFormatada}</td>
            <td style="text-align:center; font-weight:bold;">${dado.diasRestantes}</td>
            <td><span class="badge ${badgeClasse}">${status}</span></td>
        `;
        corpoTabela.appendChild(tr);
    });
}

function gerarExcel() {
    // Agora o Excel só exporta o que está filtrado/visível na tela
    const linhasVisiveis = Array.from(corpoTabela.querySelectorAll('tr')).filter(tr => tr.children.length > 1);
    
    if (linhasVisiveis.length === 0) return alert("Nenhum dado para exportar.");

    // Mapeia usando os dados globais cruzados com os visíveis para não perder a referência do arquivo original
    const codigosVisiveis = linhasVisiveis.map(tr => tr.children[1].innerText);
    const dadosParaPlanilha = analiseGlobal
        .filter(d => codigosVisiveis.includes(d.codigo))
        .sort((a, b) => a.diasRestantes - b.diasRestantes)
        .map(d => ({
            'Arquivo Origem': d.arquivo,
            'Empresa': d.empresa,
            'Página PDF': d.pagina,
            'Cód. Matrícula': d.codigo,
            'Nome do Colaborador': d.nome,
            'Data Limite Concessiva': d.dataLimiteFormatada,
            'Dias para Vencimento': d.diasRestantes
        }));

    const ws = XLSX.utils.json_to_sheet(dadosParaPlanilha);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Férias Críticas");

    ws['!cols'] = [{wch:20}, {wch:35}, {wch:12}, {wch:15}, {wch:40}, {wch:22}, {wch:20}];
    XLSX.writeFile(wb, "Relatorio_Ferias_Criticas.xlsx");
}

function gerarPDF() {
    const elementoRelatorio = document.getElementById('print-area');
    
    const opcoes = {
        margin:       [10, 10, 10, 10], // Margens [Cima, Esquerda, Baixo, Direita]
        filename:     'Relatorio_Auditoria_Ferias.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true,
            scrollY: 0 // COMANDO CRÍTICO: Evita a página em branco no topo
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opcoes).from(elementoRelatorio).save();
}