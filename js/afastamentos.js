/**
 * MOTOR ANALÍTICO - AFASTAMENTOS (V2 - Máquina de Estado e Tolerância de Eixo)
 * Captura dados fracionados e desalinhados gerados por sistemas contábeis.
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

// FILTRO EM TEMPO REAL (Usando Motor Global Multi-termos)
inputFiltro.addEventListener('input', (e) => {
    // Busca em: Nome, Código, Motivo e Empresa
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

// CÉREBRO DE EXTRAÇÃO (MÁQUINA DE ESTADO)
async function processarPDF(arrayBuffer, nomeArquivo) {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let paginasTexto = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let items = textContent.items;

        // Tolerância de 5 pixels no eixo Y para agrupar linhas desalinhadas da tabela
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

    let nomeEmpresa = "Desconhecida";
    let periodoApuracao = "Desconhecido";

   // Captura Cabeçalho Limpo
    const linhasP1 = paginasTexto[0] || [];
    const textoCompletoP1 = linhasP1.join(" ");

    const regexPeriodo = /Periodo:\s*(\d{2}\/\d{2}\/\d{4}\s*até\s*\d{2}\/\d{2}\/\d{4})/i;
    const matchPeriodo = textoCompletoP1.match(regexPeriodo);
    
    if (matchPeriodo) {
        periodoApuracao = matchPeriodo[1].trim();
    } else {
        const matchDataAlternativa = textoCompletoP1.match(/(\d{2}\/\d{2}\/\d{4}\s*a\s*\d{2}\/\d{2}\/\d{4})/);
        periodoApuracao = matchDataAlternativa ? matchDataAlternativa[0] : "Período não identificado";
    }
    
    // Atualiza o DOM uma única vez
    lblPeriodo.innerText = `Período de Apuração: ${periodoApuracao}`;

    // Variáveis da Máquina de Estado (A memória fluida do motor)
    let codigoAtual = "";
    let nomeAtual = "";
    let inicioPendente = "";
    let retornoPendente = "";

    // Padrões super flexíveis de busca
    // Ex: "669 CAROLINE BATISTA" ou "17 12884822196 FABIO MELO"
    const regexEmpregado = /^(\d{1,6})\s+(?:\d{11}\s+)?([A-ZÀ-Ú\s]{5,}[A-ZÀ-Ú])/; 
    const regexDatas = /\d{2}\/\d{2}\/\d{2,4}/g;
    const regexMotivo = /(\d{2}\s*[-–]\s*.+)/;

    for (let p = 0; p < paginasTexto.length; p++) {
        const linhas = paginasTexto[p];

        for (let linha of linhas) {
            // Pula os cabeçalhos das páginas
            if (linha.includes("Página:") || linha.includes("RELAÇÃO DE AFASTAMENTOS") || linha.includes("Periodo:") || linha.includes("COD NOME")) {
                continue;
            }

            // 1. Tenta atualizar o funcionário atual
            const matchEmpregado = linha.match(regexEmpregado);
            if (matchEmpregado && !linha.includes("Total de")) {
                codigoAtual = matchEmpregado[1];
                nomeAtual = matchEmpregado[2].trim();
            }

            // 2. Tenta capturar as datas de afastamento (ignora data de admissão se estiver junto)
            const datasEncontradas = [...linha.matchAll(regexDatas)].map(m => m[0]);
            if (datasEncontradas.length >= 2) {
                // Sempre pega as duas últimas datas da linha (Início e Retorno)
                inicioPendente = datasEncontradas[datasEncontradas.length - 2];
                retornoPendente = datasEncontradas[datasEncontradas.length - 1];
            }

            // 3. Tenta encontrar o Motivo
            const matchMotivo = linha.match(regexMotivo);
            
            // 4. O Cruzamento: Se a memória tem funcionário, datas guardadas e achou o motivo, SALVA.
            if (matchMotivo && inicioPendente && retornoPendente && codigoAtual !== "") {
                let motivoStr = matchMotivo[1].trim();
                motivoStr = motivoStr.replace(/\s{2,}.*/, ''); // Limpa espaços perdidos no fim

                const inicioObj = parseDataParaMatematica(inicioPendente);
                const retornoObj = parseDataParaMatematica(retornoPendente);
                
                let dias = 0;
                if(inicioObj && retornoObj) {
                    const diferencaTempo = retornoObj.getTime() - inicioObj.getTime();
                    // O Retorno é dia trabalhado. A diferença direta entrega os dias exatos de atestado.
                    dias = Math.ceil(diferencaTempo / (1000 * 3600 * 24)); 
                }

                analiseAfastamentosGlobal.push({
                    empresa: nomeEmpresa,
                    periodo: periodoApuracao,
                    codigo: codigoAtual,
                    nome: nomeAtual,
                    inicio: inicioPendente,
                    retorno: retornoPendente,
                    motivo: motivoStr,
                    diasAfastado: dias
                });

                // Esvazia o bolso das datas para não duplicar no próximo atestado
                inicioPendente = "";
                retornoPendente = "";
            }
        }
    }
}

// RENDERIZAÇÃO E INTELIGÊNCIA DE SOMA
function renderizarTabelaAfastamentos(dados) {
    corpoTabela.innerHTML = '';
    
    if (dados.length === 0) {
        corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum atestado ou período mapeado nos arquivos selecionados.</td></tr>`;
        return;
    }

    // 1. Mapeia o total acumulado de dias de doença por funcionário
    const somaDoencas = {};
    dados.forEach(d => {
        // Filtra apenas atestados médicos (motivo 18 ou palavra doença/novo afastamento)
        const motivoLower = d.motivo.toLowerCase();
        if (motivoLower.includes("doença") || d.motivo.includes("18-") || d.motivo.includes("12-")) {
            somaDoencas[d.codigo] = (somaDoencas[d.codigo] || 0) + d.diasAfastado;
        }
    });

    // 2. Constrói a tabela com os alertas de risco injetados
    dados.forEach(dado => {
        let badgeDias = dado.diasAfastado >= 15 ? 'badge-critico' : 'badge-alerta';
        let spanVisualDias = `<span class="badge ${badgeDias}">${dado.diasAfastado} dias</span>`;

        // Lógica do Alerta INSS
        let alertaAcumulo = "";
        const motivoLower = dado.motivo.toLowerCase();
        
        if (motivoLower.includes("doença") || dado.motivo.includes("18-") || dado.motivo.includes("12-")) {
            const totalEmpregado = somaDoencas[dado.codigo];
            if (totalEmpregado >= 15) {
                alertaAcumulo = `<br><span style="font-size: 0.75rem; color: #b91c1c; font-weight: bold;">⚠️ Risco INSS: Acumulou ${totalEmpregado} dias no período</span>`;
            } else if (totalEmpregado >= 10) {
                alertaAcumulo = `<br><span style="font-size: 0.75rem; color: #b45309;">Atenção: Acumulou ${totalEmpregado} dias no período</span>`;
            }
        }

        const tr = document.createElement('tr');
        // REMOVIDO: A coluna de período não será mais renderizada aqui
        tr.innerHTML = `
            <td style="font-size: 0.8rem; color: #64748b;">${dado.empresa}</td>
            <td><strong>${dado.codigo}</strong></td>
            <td>${dado.nome}${alertaAcumulo}</td>
            <td>${dado.inicio}</td>
            <td>${dado.retorno}</td>
            <td style="font-size: 0.85rem;">${dado.motivo}</td>
            <td style="text-align:center;">${spanVisualDias}</td>
        `;
        corpoTabela.appendChild(tr);
    });
}

// EXPORTAÇÃO EXCEL E PDF
function gerarExcel() {
    const linhasVisiveis = Array.from(corpoTabela.querySelectorAll('tr')).filter(tr => tr.children.length > 1);
    if (linhasVisiveis.length === 0) return alert("Nenhum dado para exportar.");

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
    
    // Corrigido para 7 colunas exatas (uma para cada campo acima)
    ws['!cols'] = [
        {wch: 30}, // Empresa
        {wch: 10}, // Cód
        {wch: 40}, // Colaborador
        {wch: 12}, // Início
        {wch: 12}, // Retorno
        {wch: 15}, // Dias Afastado
        {wch: 40}  // Motivo
    ];
    
    XLSX.writeFile(wb, "Relatorio_Afastamentos.xlsx");
}

function gerarPDF() {
    const elementoRelatorio = document.getElementById('print-area');
    const opcoes = {
        margin: [10, 10, 10, 10],
        filename: 'Analise_Afastamentos.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opcoes).from(elementoRelatorio).save();
}