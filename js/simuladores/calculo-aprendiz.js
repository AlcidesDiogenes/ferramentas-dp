/**
 * Ferramentas DP - Simulador de Cota Aprendiz
 * Integração: SheetJS (XLSX) + Motor Legal (Art. 429 da CLT) e Documentação Técnica
 */

let mapaCboOficial = new Map();
window.dadosRelatorioAprendiz = {};

const REGRAS_GRANDE_GRUPO = {
    0: { descricao: "Forças Armadas, Policiais e Bombeiros Militares", nivel: "Militar", excluido: true },
    1: { descricao: "Membros superiores do poder público e dirigentes", nivel: "Cargos de confiança", excluido: true },
    2: { descricao: "Profissionais das ciências e das artes", nivel: "Formação superior", excluido: true },
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
    return String(cbo).replace(/\D/g, "").padStart(6, '0');
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
// MOTOR DE CARREGAMENTO (DUAL-FETCH) E PROCESSAMENTO
// =========================================================================

async function carregarBaseCbo() {
    try {
        // 1. Carrega as Regras e Grupos (cbo-dicionario.json)
        const resDicionario = await fetch("../../assets/dados/cbo-dicionario.json");
        if (!resDicionario.ok) throw new Error(`Erro HTTP (Dicionário): ${resDicionario.status}`);
        
        const listaCbo = await resDicionario.json();
        mapaCboOficial.clear();
        
        listaCbo.forEach((item) => {
            const cboLimpo = sanitizarCbo(item.COD_OCUPACAO);
            if (cboLimpo && !mapaCboOficial.has(cboLimpo)) {
                mapaCboOficial.set(cboLimpo, {
                    ...item,
                    TITULO_OCUPACAO: item.NOME_ATIVIDADE || item.NOME_GRANDE_AREA || "Sem descrição" // Fallback
                });
            }
        });

        // 2. Carrega os Títulos Reais (cbo-titulo.json) e faz a mesclagem
        try {
            const resTitulos = await fetch("../../assets/dados/cbo-titulo.json");
            if (resTitulos.ok) {
                const dadosTitulos = await resTitulos.json();
                
                // Trata formato Objeto: {"010105": "Oficial", "010110": "Diretor"}
                if (!Array.isArray(dadosTitulos) && typeof dadosTitulos === 'object') {
                    for (let chave in dadosTitulos) {
                        if (chave === 'CBO' || chave === 'cbo') continue;
                        
                        const cboLimpo = sanitizarCbo(chave);
                        if (mapaCboOficial.has(cboLimpo)) {
                            mapaCboOficial.get(cboLimpo).TITULO_OCUPACAO = dadosTitulos[chave];
                        } else {
                            // Se existir o título, mas a regra falhou, cria para evitar 404 lógico
                            mapaCboOficial.set(cboLimpo, {
                                COD_OCUPACAO: cboLimpo,
                                TITULO_OCUPACAO: dadosTitulos[chave],
                                COD_GRANDE_GRUPO: cboLimpo.substring(0, 1) // Dedução pelo 1º dígito
                            });
                        }
                    }
                } 
                // Trata formato Array: [{"CBO": "010105", "TITULO": "Oficial"}]
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
            console.warn("Aviso: Arquivo cbo-titulo.json ausente ou inválido. Usando descrições originais.", e);
        }

        return true;
    } catch (error) {
        console.error("Falha ao carregar bases do CBO:", error);
        throw error;
    }
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
        const dadosOficial = mapaCboOficial.get(item.cboLimpo);
        let cboFormatado = item.cboLimpo.length === 6 ? `${item.cboLimpo.substring(0,4)}-${item.cboLimpo.substring(4,6)}` : item.cboRaw;

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

        const grupoNum = Number(dadosOficial.COD_GRANDE_GRUPO);
        const regraGrupo = REGRAS_GRANDE_GRUPO[grupoNum] || { descricao: "Desconhecido", nivel: "Não especificado", excluido: false };

        const objetoAnalisado = {
            cbo: cboFormatado,
            titulo: dadosOficial.TITULO_OCUPACAO || "Sem descrição",
            escolaridade: regraGrupo.nivel,
            quantidade: item.quantidade,
            grandeGrupo: grupoNum,
            motivoExclusao: ""
        };

        arrTotalAnalisados.push(objetoAnalisado);

        if (item.cargoConfianca) {
            objetoAnalisado.motivoExclusao = "Cargo de Confiança (Planilha)";
            arrExcluidos.push(objetoAnalisado);
            somaExcluidos += item.quantidade;
        } 
        else if (regraGrupo.excluido) {
            objetoAnalisado.motivoExclusao = `Exceção Legal (${regraGrupo.nivel})`;
            arrExcluidos.push(objetoAnalisado);
            somaExcluidos += item.quantidade;
        } 
        else {
            arrBaseCalculo.push(objetoAnalisado);
            somaBaseEfetiva += item.quantidade;
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

            const dataBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(dataBuffer, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            const razaoSocial = worksheet['B1'] ? worksheet['B1'].v : "Não informada";
            const cnpj = worksheet['B2'] ? worksheet['B2'].v : "Não informado";

            const entradasCbo = [];
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            
            for (let R = 5; R <= range.e.r; ++R) {
                const cellA = worksheet[XLSX.utils.encode_cell({ c: 0, r: R })];
                const cellC = worksheet[XLSX.utils.encode_cell({ c: 2, r: R })];
                
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