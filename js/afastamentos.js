/**
 * MOTOR ANALÍTICO - AFASTAMENTOS (V2 - Arquivo Único e Consolidado)
 */

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let analiseAfastamentosGlobal = [];

// MAPEAMENTO DOM
const inputArquivo = document.getElementById('file-input');
const listaArquivos = document.getElementById('lista-arquivos-importados');
const areaStatus = document.getElementById('import-status-area');
const painelAcoes = document.getElementById('actions-panel');
const secaoRelatorio = document.getElementById('report-section');
const corpoTabela = document.getElementById('tabela-corpo');
const lblPeriodo = document.getElementById('report-period');
const inputFiltro = document.getElementById('input-filtro');

document.getElementById('btn-export-excel').addEventListener('click', gerarExcel);
document.getElementById('btn-export-pdf').addEventListener('click', gerarPDF);

// Inicialização Global do Filtro
document.addEventListener('DOMContentLoaded', () => {
    MotorFiltros.init('#input-filtro', "Ex: 'Israel 15 dias' ou '624 Doença'");
});

// GATILHO DE IMPORTAÇÃO
inputArquivo.addEventListener('change', async (event) => {
    const arquivos = event.target.files;
    if (arquivos.length === 0) return;

    analiseAfastamentosGlobal = [];
    corpoTabela.innerHTML = '';
    listaArquivos.innerHTML = '';
    inputFiltro.value = '';
    areaStatus.style.display = 'block';

    for (let i = 0; i < arquivos.length; i++) {
        const arquivo = arquivos[i];
        const li = document.createElement('li');
        li.innerText = `Processando: ${arquivo.name}...`;
        listaArquivos.appendChild(li);

        try {
            const arrayBuffer = await lerArquivo(arquivo);
            await processarPDF(arrayBuffer, arquivo.name);
            li.innerText = `${arquivo.name} - ✅ Sucesso`;
            li.style.color = "green";
        } catch (error) {
            console.error(error);
            li.innerText = `${arquivo.name} - ❌ Falha na Leitura`;
            li.style.color = "red";
        }
    }

    renderizarTabelaAfastamentos(analiseAfastamentosGlobal);
    painelAcoes.style.display = 'flex';
    secaoRelatorio.style.display = 'block';
});

// FILTRO EM TEMPO REAL
inputFiltro.addEventListener('input', (e) => {
    const dadosFiltrados = MotorFiltros.filtrarMultiplo(
        analiseAfastamentosGlobal, 
        e.target.value, 
        ['nome', 'codigo', 'motivo', 'empresa'] 
    );
    renderizarTabelaAfastamentos(dadosFiltrados);
});

// FUNÇÕES DE APOIO
function lerArquivo(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

function parseDataParaMatematica(dataStr) {
    const partes = dataStr.split('/');
    if(partes.length < 3) return null;
    const ano = partes[2].length === 2 ? `20${partes[2]}` : partes[2];
    return new Date(ano, partes[1] - 1, partes[0]);
}

// CÉREBRO DE EXTRAÇÃO
async function processarPDF(arrayBuffer, nomeArquivo) {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let paginasTexto = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let items = textContent.items;

        items.sort((a, b) => {
            let diffY = Math.round(b.transform[5]) - Math.round(a.transform[5]);
            if (Math.abs(diffY) > 5) return diffY;
            return a.transform[4] - b.transform[4];
        });

        let linhasPagina = [];
        let linhaAtual = "";
        let ultimoY = items.length > 0 ? Math.round(items[0].transform[5]) : -100;

        for (let item of items) {
            let y = Math.round(item.transform[5]);
            if (Math.abs(y - ultimoY) > 5) {
                if (linhaAtual.trim()) linhasPagina.push(linhaAtual.trim());
                linhaAtual = "";
                ultimoY = y;
            }
            linhaAtual += item.str + " ";
        }
        if (linhaAtual.trim()) linhasPagina.push(linhaAtual.trim());
        paginasTexto.push(linhasPagina);
    }

    // EXTRAÇÃO ROBUSTA DE CABEÇALHO
    // --- EXTRAÇÃO ROBUSTA ---
    const todasLinhas = paginasTexto.flat();

    // 1. Extração da Empresa: Pega a linha e remove qualquer "Data: ..." que apareça nela
    let nomeEmpresa = "Desconhecida";
    const indexRelacao = todasLinhas.findIndex(l => l.includes("RELAÇÃO DE AFASTAMENTOS"));
    if (indexRelacao !== -1 && todasLinhas[indexRelacao + 1]) {
        // Limpa qualquer "Data:" ou sujeira que vier grudada
        nomeEmpresa = todasLinhas[indexRelacao + 1].replace(/Data:.*$/i, '').trim();
    }

    // 2. Extração do Período: Busca agressiva pelo padrão de datas DD/MM/AAAA até DD/MM/AAAA
    let periodoApuracao = "Período não identificado";
    
    // Junta todas as linhas para procurar o padrão de data sem se preocupar com quebras de linha
    const textoCompleto = todasLinhas.join(" ");
    
    // Regex que busca: Data (2/2/4 dígitos) + espaço/até + Data (2/2/4 dígitos)
    const regexDataRange = /(\d{2}\/\d{2}\/\d{4}\s+(?:até|a)\s+\d{2}\/\d{2}\/\d{4})/i;
    const match = textoCompleto.match(regexDataRange);

    if (match) {
        periodoApuracao = match[0]; // Pega o intervalo encontrado (ex: 01/04/2026 até 30/06/2026)
    } else {
        // Fallback: se não achar pelo padrão, tenta procurar pela palavra "Periodo" de forma flexível
        const linhaPeriodo = todasLinhas.find(l => l.toLowerCase().includes("periodo"));
        if (linhaPeriodo) {
            periodoApuracao = linhaPeriodo.toLowerCase().split("periodo")[1].replace(/:/g, '').trim();
        }
    }
    
    // Atualiza o DOM
    lblPeriodo.innerText = `Empresa: ${nomeEmpresa} | Período: ${periodoApuracao}`;
    
    // Atualiza o DOM
    lblPeriodo.innerText = `Empresa: ${nomeEmpresa} | Período: ${periodoApuracao}`;

    // MÁQUINA DE ESTADO
    let codigoAtual = "";
    let nomeAtual = "";
    let inicioPendente = "";
    let retornoPendente = "";

    const regexEmpregado = /^(\d{1,6})\s+(?:\d{11}\s+)?([A-ZÀ-Ú\s]{5,}[A-ZÀ-Ú])/; 
    const regexDatas = /\d{2}\/\d{2}\/\d{2,4}/g;
    const regexMotivo = /(\d{2}\s*[-–]\s*.+)/;

    for (let p = 0; p < paginasTexto.length; p++) {
        const linhas = paginasTexto[p];
        for (let linha of linhas) {
            if (linha.includes("Página:") || linha.includes("RELAÇÃO DE AFASTAMENTOS") || linha.includes("Periodo:") || linha.includes("COD NOME")) continue;

            const matchEmpregado = linha.match(regexEmpregado);
            if (matchEmpregado && !linha.includes("Total de")) {
                codigoAtual = matchEmpregado[1];
                nomeAtual = matchEmpregado[2].trim();
            }

            const datasEncontradas = [...linha.matchAll(regexDatas)].map(m => m[0]);
            if (datasEncontradas.length >= 2) {
                inicioPendente = datasEncontradas[datasEncontradas.length - 2];
                retornoPendente = datasEncontradas[datasEncontradas.length - 1];
            }

            const matchMotivo = linha.match(regexMotivo);
            if (matchMotivo && inicioPendente && retornoPendente && codigoAtual !== "") {
                let motivoStr = matchMotivo[1].trim().replace(/\s{2,}.*/, '');

                const inicioObj = parseDataParaMatematica(inicioPendente);
                const retornoObj = parseDataParaMatematica(retornoPendente);
                
                let dias = 0;
                if(inicioObj && retornoObj) {
                    const diferencaTempo = retornoObj.getTime() - inicioObj.getTime();
                    dias = Math.ceil(diferencaTempo / (1000 * 3600 * 24)); 
                }

                analiseAfastamentosGlobal.push({
                    empresa: nomeEmpresa,
                    codigo: codigoAtual,
                    nome: nomeAtual,
                    inicio: inicioPendente,
                    retorno: retornoPendente,
                    motivo: motivoStr,
                    diasAfastado: dias
                });
                inicioPendente = "";
                retornoPendente = "";
            }
        }
    }
}

// RENDERIZAÇÃO
function renderizarTabelaAfastamentos(dados) {
    corpoTabela.innerHTML = '';
    if (dados.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum atestado mapeado.</td></tr>`;
        return;
    }

    const somaDoencas = {};
    dados.forEach(d => {
        const m = d.motivo.toLowerCase();
        if (m.includes("doença") || d.motivo.includes("18-") || d.motivo.includes("12-")) {
            somaDoencas[d.codigo] = (somaDoencas[d.codigo] || 0) + d.diasAfastado;
        }
    });

    dados.forEach(dado => {
        let badgeDias = dado.diasAfastado >= 15 ? 'badge-critico' : 'badge-alerta';
        let alertaAcumulo = "";
        const m = dado.motivo.toLowerCase();
        
        if (m.includes("doença") || dado.motivo.includes("18-") || dado.motivo.includes("12-")) {
            const total = somaDoencas[dado.codigo];
            if (total >= 15) alertaAcumulo = `<br><span style="font-size: 0.75rem; color: #b91c1c; font-weight: bold;">⚠️ Risco INSS: Acumulou ${total} dias</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-size: 0.8rem; color: #64748b;">${dado.empresa}</td>
            <td><strong>${dado.codigo}</strong></td>
            <td>${dado.nome}${alertaAcumulo}</td>
            <td>${dado.inicio}</td>
            <td>${dado.retorno}</td>
            <td style="font-size: 0.85rem;">${dado.motivo}</td>
            <td style="text-align:center;"><span class="badge ${badgeDias}">${dado.diasAfastado} dias</span></td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// EXPORTAÇÃO
function gerarExcel() {
    const dadosParaPlanilha = analiseAfastamentosGlobal.map(d => ({
        'Empresa': d.empresa,
        'Cód': d.codigo,
        'Colaborador': d.nome,
        'Início': d.inicio,
        'Retorno': d.retorno,
        'Dias Afastado': d.diasAfastado,
        'Motivo': d.motivo
    }));
    const ws = XLSX.utils.json_to_sheet(dadosParaPlanilha);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Afastamentos");
    ws['!cols'] = [{wch: 30}, {wch: 10}, {wch: 40}, {wch: 12}, {wch: 12}, {wch: 15}, {wch: 40}];
    XLSX.writeFile(wb, "Relatorio_Afastamentos.xlsx");
}

function gerarPDF() {
    html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: 'Analise_Afastamentos.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(document.getElementById('print-area')).save();
}