/**
 * Ferramentas DP - Simulador de Cota Aprendiz
 * Integração: SheetJS (XLSX) + Motor Legal (Art. 429 da CLT) e Documentação Técnica Atualizada
 */

let mapaCboOficial = new Map();
let mapaFamiliasEscolaridade = new Map(); // Novo mapa para as regras de escolaridade
window.dadosRelatorioAprendiz = {};

const REGRAS_GRANDE_GRUPO = {
    0: { descricao: "Forças Armadas, Policiais e Bombeiros Militares", nivel: "Militar", excluido: true },
    1: { descricao: "Membros superiores do poder público e dirigentes", nivel: "Cargos de confiança", excluido: false },
    2: { descricao: "Profissionais das ciências e das artes", nivel: "Formação superior", excluido: false },
    3: { descricao: "Técnicos de nível médio", nivel: "Formação técnica", excluido: false },
    4: { descricao: "Trabalhadores de serviços administrativos", nivel: "Demandam formação profissional", excluido: false },
    5: { descricao: "Trabalhadores dos serviços e vendedores", nivel: "Demandam formação profissional", excluido: false },
    6: { descricao: "Trabalhadores agropecuários, florestais e da pesca", nivel: "Demandam formação profissional", excluido: false },
    7: { descricao: "Trabalhadores da produção industrial (discretos)", nivel: "Demandam formação profissional", excluido: false },
    8: { descricao: "Trabalhadores da produção industrial (contínuos)", nivel: "Demandam formação profissional", excluido: false },
    9: { descricao: "Trabalhadores de manutenção e reparação", nivel: "Demandam formação profissional", excluido: false }
};

// =========================================================================
// FUNÇÕES AUXILIARES E RENDERIZAÇÃO
// =========================================================================

function atualizarFeedback(mensagem, classeCss) {
    const feedbackEl = document.getElementById("nome-arquivo-selecionado");
    if (feedbackEl) {
        feedbackEl.textContent = mensagem;
        feedbackEl.className = `feedback-arquivo ${classeCss}`;
    }
}

function sanitizarCbo(cbo) {
    if (!cbo && cbo !== 0) return "";
    const num = String(cbo).replace(/\D/g, "");
    if (num.length === 0) return "";
    if (num.length <= 4) return num.padStart(4, '0');
    return num.padStart(6, '0');
}

function popularTabela(idTbody, listaDados, templateRow) {
    const tbody = document.getElementById(idTbody);
    if (!tbody) return;
    
    if (listaDados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="col-center text-neutral" style="padding: 15px;">Nenhum registro encontrado.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = listaDados.map(templateRow).join("");
}

function renderizarPainelResultados(dados) {
    const lblEmpresa = document.getElementById("lbl-empresa");
    const lblCnpj = document.getElementById("lbl-cnpj");
    if(lblEmpresa) lblEmpresa.textContent = dados.empresa.razaoSocial;
    if(lblCnpj) lblCnpj.textContent = dados.empresa.cnpj;

    document.getElementById("res-total-funcionarios").textContent = dados.resumoTotais.totalAnalisadosCount;
    document.getElementById("res-base-calculo").textContent = dados.resumoTotais.baseCalculoEfetivaCount;
    document.getElementById("res-excluidos").textContent = dados.resumoTotais.totalExcluidosCount;
    
    const elNaoEnc = document.getElementById("res-nao-encontrados");
    if(elNaoEnc) elNaoEnc.textContent = dados.resumoTotais.totalNaoEncontradosCount;

    // Controla visibilidade do bloco e do detalhamento de "Não Encontrados"
    const cardMetricNaoEnc = document.getElementById("card-metric-nao-encontrados");
    const detailsNaoEnc = document.getElementById("details-nao-encontrados");

    if (dados.resumoTotais.totalNaoEncontradosCount > 0) {
        if (cardMetricNaoEnc) cardMetricNaoEnc.style.display = "";
        if (detailsNaoEnc) detailsNaoEnc.style.display = "";
    } else {
        if (cardMetricNaoEnc) cardMetricNaoEnc.style.display = "none";
        if (detailsNaoEnc) detailsNaoEnc.style.display = "none";
    }

    const elMinima = document.getElementById("res-cota-minima");
    const elMedia = document.getElementById("res-cota-media"); 
    const elMaxima = document.getElementById("res-cota-maxima");
    
    if(elMinima) elMinima.textContent = dados.dimensionamentoCotas.cotaMinima;
    if(elMedia) elMedia.textContent = dados.dimensionamentoCotas.cotaMedia;
    if(elMaxima) elMaxima.textContent = dados.dimensionamentoCotas.cotaMaxima;

    popularTabela("tbody-base-calculo", dados.detalhes.base, (item) => `
        <tr>
            <td>${item.cbo}</td>
            <td>${item.titulo}</td>
            <td>${item.escolaridade}</td>
            <td class="col-center"><strong>${item.quantidade}</strong></td>
        </tr>
    `);

    popularTabela("tbody-excluidos", dados.detalhes.excluidos, (item) => `
        <tr>
            <td>${item.cbo}</td>
            <td>${item.titulo}</td>
            <td class="text-warning">${item.motivoExclusao}</td>
            <td class="col-center"><strong>${item.quantidade}</strong></td>
        </tr>
    `);

    popularTabela("tbody-nao-encontrados", dados.detalhes.naoEncontrados, (item) => `
        <tr>
            <td><strong class="text-danger">${item.cbo}</strong></td>
            <td>${item.titulo}</td>
            <td class="text-danger">Ajuste Obrigatório na Planilha</td>
            <td class="col-center"><strong>${item.quantidade}</strong></td>
        </tr>
    `);

    popularTabela("tbody-total-analisado", dados.detalhes.total, (item) => `
        <tr>
            <td>${item.cbo}</td>
            <td>${item.titulo}</td>
            <td>${item.escolaridade}</td>
            <td class="col-center"><strong>${item.quantidade}</strong></td>
        </tr>
    `);
}

// =========================================================================
// MOTOR DE CARREGAMENTO E PROCESSAMENTO (3 BASES JSON)
// =========================================================================

async function fetchJsonComFallback(caminho) {
    const caminhos = [
        caminho,
        caminho.startsWith('/') ? caminho : '/' + caminho.replace(/^(\.\.\/)+/, ''),
        caminho.replace(/^(\.\.\/)+/, '')
    ];
    for (const p of caminhos) {
        try {
            const res = await fetch(p);
            if (res.ok) {
                return await res.json();
            }
        } catch (e) {
            // Tenta o próximo caminho
        }
    }
    return null;
}

async function carregarBaseCbo() {
    // 1. Carrega o Dicionário Estrutural do CBO
    try {
        const listaCbo = await fetchJsonComFallback("../../assets/dados/cbo-dicionario.json");
        if (listaCbo && Array.isArray(listaCbo)) {
            mapaCboOficial.clear();
            listaCbo.forEach((item) => {
                const cboLimpo = sanitizarCbo(item.COD_OCUPACAO);
                if (cboLimpo && !mapaCboOficial.has(cboLimpo)) {
                    mapaCboOficial.set(cboLimpo, {
                        ...item,
                        TITULO_OCUPACAO: item.NOME_ATIVIDADE || item.NOME_GRANDE_AREA || "Sem descrição"
                    });
                }
            });
        }
    } catch (e) {
        console.warn("Aviso: Falha ao carregar cbo-dicionario.json. O motor continuará com as demais bases.", e);
    }

    // 2. Carrega as Regras de Escolaridade por Família (cbo_familias_escolaridade.json)
    try {
        const dadosFamilias = await fetchJsonComFallback("../../assets/dados/cbo_familias_escolaridade.json");
        if (dadosFamilias && Array.isArray(dadosFamilias)) {
            mapaFamiliasEscolaridade.clear();
            dadosFamilias.forEach(familia => {
                if (familia.COD_FAMILIA) {
                    mapaFamiliasEscolaridade.set(String(familia.COD_FAMILIA).trim(), familia);
                }
            });
        }
    } catch (e) {
        console.warn("Aviso: Arquivo cbo_familias_escolaridade.json ausente ou inválido. O motor usará regras restritas aos Grandes Grupos.", e);
    }

    // 3. Carrega os Títulos Reais (cbo-titulo.json) para refinamento
    try {
        const dadosTitulos = await fetchJsonComFallback("../../assets/dados/cbo-titulo.json");
        if (dadosTitulos) {
            if (!Array.isArray(dadosTitulos) && typeof dadosTitulos === 'object') {
                for (let chave in dadosTitulos) {
                    if (chave.toLowerCase() === 'cbo') continue;
                    const cboLimpo = sanitizarCbo(chave);
                    if (mapaCboOficial.has(cboLimpo)) {
                        mapaCboOficial.get(cboLimpo).TITULO_OCUPACAO = dadosTitulos[chave];
                    } else {
                        mapaCboOficial.set(cboLimpo, {
                            COD_OCUPACAO: cboLimpo,
                            TITULO_OCUPACAO: dadosTitulos[chave],
                            COD_GRANDE_GRUPO: cboLimpo.substring(0, 1)
                        });
                    }
                }
            } 
            else if (Array.isArray(dadosTitulos)) {
                dadosTitulos.forEach(item => {
                    const chaveCbo = item.CBO || item.cbo || item.CODIGO || item.COD_OCUPACAO;
                    const titulo = item.TITULO || item.titulo || item.NOME || item.Titulo;
                    
                    if (chaveCbo && titulo) {
                        const cboLimpo = sanitizarCbo(chaveCbo);
                        if (mapaCboOficial.has(cboLimpo)) {
                            mapaCboOficial.get(cboLimpo).TITULO_OCUPACAO = titulo;
                        } else {
                            mapaCboOficial.set(cboLimpo, {
                                COD_OCUPACAO: cboLimpo,
                                TITULO_OCUPACAO: titulo,
                                COD_GRANDE_GRUPO: cboLimpo.substring(0, 1)
                            });
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.warn("Aviso: Arquivo cbo-titulo.json ausente ou inválido.", e);
    }

    return true;
}

function processarCotaAprendizLocal(entradas = [], infoEmpresa = {}) {
    const contagemEntradas = new Map();
    let totalBrutoLido = 0;

    entradas.forEach((item) => {
        const cboLimpo = sanitizarCbo(item.cbo);
        if (!cboLimpo || cboLimpo.length < 4) return;

        totalBrutoLido++;
        const eConfianca = String(item.eCargoConfianca || "").trim().toLowerCase() === "sim";
        const chaveAgrupamento = `${cboLimpo}_${eConfianca ? 'C' : 'N'}`; 

        if (!contagemEntradas.has(chaveAgrupamento)) {
            contagemEntradas.set(chaveAgrupamento, {
                cboRaw: item.cbo,
                cboLimpo: cboLimpo,
                quantidade: 0,
                cargoConfianca: eConfianca
            });
        }

        contagemEntradas.get(chaveAgrupamento).quantidade += 1;
    });

    const arrTotalAnalisados = [];
    const arrExcluidos = [];
    const arrNaoEncontrados = [];
    const arrBaseCalculo = [];

    let somaBaseEfetiva = 0;
    let somaExcluidos = 0;
    let somaNaoEncontrados = 0;

    contagemEntradas.forEach((item) => {
        let dadosOficial = mapaCboOficial.get(item.cboLimpo);

        // Se não localizado diretamente, tenta buscar por Família (4 dígitos)
        if (!dadosOficial && item.cboLimpo.length >= 4) {
            const familiaCode = item.cboLimpo.substring(0, 4);
            const infoFamilia = mapaFamiliasEscolaridade.get(familiaCode);

            let tituloFallback = null;
            for (let [cboChave, val] of mapaCboOficial.entries()) {
                if (cboChave.startsWith(familiaCode) && val.TITULO_OCUPACAO) {
                    tituloFallback = val.TITULO_OCUPACAO;
                    break;
                }
            }

            if (infoFamilia || tituloFallback) {
                dadosOficial = {
                    COD_OCUPACAO: item.cboLimpo,
                    TITULO_OCUPACAO: tituloFallback || `Ocupação / Família CBO ${familiaCode}`,
                    COD_GRANDE_GRUPO: item.cboLimpo.substring(0, 1),
                    COD_FAMILIA: familiaCode
                };
            }
        }

        let cboFormatado = item.cboLimpo.length === 6 ? `${item.cboLimpo.substring(0,4)}-${item.cboLimpo.substring(4,6)}` : item.cboRaw;

        // Caso de não localizado nas bases
        if (!dadosOficial) {
            const naoEnc = {
                cbo: cboFormatado,
                titulo: "⚠️ CBO Inexistente",
                escolaridade: "Revisão Necessária",
                quantidade: item.quantidade
            };
            arrNaoEncontrados.push(naoEnc);
            arrTotalAnalisados.push(naoEnc);
            somaNaoEncontrados += item.quantidade;
            return;
        }

        const grupoNum = Number(dadosOficial.COD_GRANDE_GRUPO || item.cboLimpo.substring(0, 1));
        const regraGrupo = REGRAS_GRANDE_GRUPO[grupoNum] || { descricao: "Desconhecido", nivel: "Não especificado", excluido: false };
        
        // Regra de CBO Familia via cbo_familias_escolaridade.json
        const familiaCbo = dadosOficial.COD_FAMILIA || item.cboLimpo.substring(0, 4);
        const infoFamilia = mapaFamiliasEscolaridade.get(familiaCbo);
        
        let escolaridadeFormatada = regraGrupo.nivel;
        let elegivel = false;
        let excluidoPorFormacao = false;

        // Analisa elegibilidade da Familia se disponível no JSON
        if (infoFamilia) {
            escolaridadeFormatada = infoFamilia["Formação Requerida"] || escolaridadeFormatada;
            const demandaAprendiz = (infoFamilia.DEMANDA_FORMACAO_APRENDIZ || "").trim();
            const exigeFormacao = demandaAprendiz === "Demanda formação profissional para cálculo de aprendizes";
            
            const formacaoAjustada = (infoFamilia["Formação Requerida"] || "").toLowerCase();
            const escolaridadeValida = formacaoAjustada.includes("fundamental") || 
                                       formacaoAjustada.includes("médio") || 
                                       formacaoAjustada.includes("medio") || 
                                       formacaoAjustada.includes("livre");

            if (exigeFormacao && escolaridadeValida) {
                elegivel = true;
            } else {
                excluidoPorFormacao = true;
            }
        } else if (!regraGrupo.excluido) {
            // Fallback: Se não encontrou a familia específica, usa a regra do Grande Grupo
            elegivel = true;
        }

        const objetoAnalisado = {
            cbo: cboFormatado,
            titulo: dadosOficial.TITULO_OCUPACAO || "Sem descrição",
            escolaridade: escolaridadeFormatada,
            quantidade: item.quantidade,
            grandeGrupo: grupoNum,
            motivoExclusao: ""
        };

        arrTotalAnalisados.push(objetoAnalisado);

        // Árvore de Decisão
        if (item.cargoConfianca) {
            objetoAnalisado.motivoExclusao = "Cargo de Confiança (Planilha)";
            arrExcluidos.push(objetoAnalisado);
            somaExcluidos += item.quantidade;
        } 
        else if (grupoNum === 0 || grupoNum === 1 || grupoNum === 2) {
            // Exclusões de cargo diretivos/militares ou nível superior pelo Grande Grupo
            objetoAnalisado.motivoExclusao = `Exceção Legal (${regraGrupo.nivel})`;
            arrExcluidos.push(objetoAnalisado);
            somaExcluidos += item.quantidade;
        }
        else if (excluidoPorFormacao) {
            // Exclusão detectada pelo mapeamento escolaridade da familia
            objetoAnalisado.motivoExclusao = "Escolaridade Não Elegível para Aprendizagem";
            arrExcluidos.push(objetoAnalisado);
            somaExcluidos += item.quantidade;
        }
        else if (elegivel) {
            // Base apta para a cota
            arrBaseCalculo.push(objetoAnalisado);
            somaBaseEfetiva += item.quantidade;
        } 
        else {
            // Exceção de escape para demais casos de técnicos e restritos
            objetoAnalisado.motivoExclusao = `Exceção Legal (${regraGrupo.nivel})`;
            arrExcluidos.push(objetoAnalisado);
            somaExcluidos += item.quantidade;
        }
    });

    const diagnostico = {
        empresa: { razaoSocial: infoEmpresa.razaoSocial, cnpj: infoEmpresa.cnpj },
        resumoTotais: {
            totalAnalisadosCount: totalBrutoLido,
            baseCalculoEfetivaCount: somaBaseEfetiva,
            totalExcluidosCount: somaExcluidos,
            totalNaoEncontradosCount: somaNaoEncontrados
        },
        dimensionamentoCotas: {
            cotaMinima: Math.ceil(somaBaseEfetiva * 0.05),
            cotaMedia: Math.ceil(somaBaseEfetiva * 0.10),
            cotaMaxima: Math.ceil(somaBaseEfetiva * 0.15)
        },
        detalhes: {
            total: arrTotalAnalisados,
            excluidos: arrExcluidos,
            naoEncontrados: arrNaoEncontrados,
            base: arrBaseCalculo
        }
    };

    window.dadosRelatorioAprendiz = diagnostico;
    return diagnostico;
}

// =========================================================================
// INICIALIZAÇÃO DE EVENTOS DO DOM
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("upload-planilha-aprendiz");
    const painelResultados = document.getElementById("painel-resultados");

    if (!fileInput) return;

    fileInput.addEventListener("change", async (evento) => {
        const file = evento.target.files[0];
        if (!file) return;

        atualizarFeedback(`⏳ Processando arquivo "${file.name}"...`, "text-warning");
        if (painelResultados) painelResultados.classList.add("hidden");

        try {
            if (mapaCboOficial.size === 0) {
                await carregarBaseCbo();
            }

            const xlsxObj = window.XLSX || (typeof XLSX !== 'undefined' ? XLSX : null);
            if (!xlsxObj) {
                throw new Error("A biblioteca de leitura de planilhas (XLSX) não foi carregada. Por favor, recarregue a página.");
            }

            const dataBuffer = await file.arrayBuffer();
            const workbook = xlsxObj.read(dataBuffer, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            const razaoSocial = worksheet['B1'] ? worksheet['B1'].v : "Não informada";
            const cnpj = worksheet['B2'] ? worksheet['B2'].v : "Não informado";

            const entradasCbo = [];
            const range = xlsxObj.utils.decode_range(worksheet['!ref']);
            
            for (let R = 5; R <= range.e.r; ++R) {
                const cellA = worksheet[xlsxObj.utils.encode_cell({ c: 0, r: R })];
                const cellC = worksheet[xlsxObj.utils.encode_cell({ c: 2, r: R })];
                
                if (cellA && cellA.v && String(cellA.v).trim() !== "") {
                    entradasCbo.push({
                        cbo: String(cellA.v),
                        eCargoConfianca: cellC ? String(cellC.v) : ""
                    });
                }
            }

            if (entradasCbo.length === 0) {
                throw new Error("A planilha não possui dados a partir da linha 6 (A6).");
            }

            const resultado = processarCotaAprendizLocal(entradasCbo, { razaoSocial, cnpj });
            renderizarPainelResultados(resultado);

            atualizarFeedback(`✅ Processamento concluído: ${entradasCbo.length} registros processados.`, "text-success");
            
            if (painelResultados) {
                painelResultados.classList.remove("hidden");
                painelResultados.style.display = "block";
            }

        } catch (erro) {
            console.error("Falha no processamento:", erro);
            atualizarFeedback(`❌ Falha: ${erro.message}`, "text-danger");
        } finally {
            fileInput.value = "";
        }
    });
});