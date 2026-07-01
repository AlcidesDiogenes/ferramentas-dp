// js/simuladores/detalhamento-calculos.js
import { 
    TABELA_INSS, 
    TABELA_IRRF, 
    TETO_INSS, 
    VALOR_DEDUCAO_DEPENDENTE, 
    DESCONTO_SIMPLIFICADO,
    TABELA_REDUCAO_MENSAL
} from './tabelas.js';

import { gerarPDFDetalhamento } from '../pdf-generators/detalhamento-pdf.js';

let dadosExportacao = { dados: null, resultados: null };

const form = document.getElementById('form-calculo');
const inputOutrasBases = document.getElementById('outras-bases');
const wrapperJaContribuido = document.getElementById('wrapper-inss-contribuido');
const inputJaContribuido = document.getElementById('inss-contribuido');

// Listener para visibilidade condicional
inputOutrasBases.addEventListener('input', () => {
    if (parseFloat(inputOutrasBases.value) > 0) {
        wrapperJaContribuido.style.display = 'block';
    } else {
        wrapperJaContribuido.style.display = 'none';
        inputJaContribuido.value = '';
    }
});

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcularImpostoIRRF(base) {
    if (base <= 0) return 0;
    const faixa = TABELA_IRRF.find(f => base <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
    return (base * faixa.aliquota) - faixa.deducao;
}

// Tabela de referência para a exibição no HTML
function renderizarTabela(tabela, tipo) {
    let html = `<div class="calc-box">
        <strong>Tabela ${tipo}:</strong>
        <table class="data-table">
            <thead>
                <tr><th>Faixa/Base</th><th>Alíquota</th><th>Dedução</th></tr>
            </thead>
            <tbody>`;
    tabela.forEach(f => {
        html += `<tr>
            <td>R$ ${formatarMoeda(f.limite || f.base)}</td>
            <td>${(f.aliquota * 100).toFixed(1)}%</td>
            <td>R$ ${formatarMoeda(f.deducao)}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    processarCalculo();
});

function processarCalculo() {
    const tipo = document.getElementById('tipo-calculo').value;
    const tipoContribuinte = document.getElementById('tipo-contribuinte').value;
    const salario = parseFloat(document.getElementById('salario-bruto').value) || 0;
    const dependentes = parseInt(document.getElementById('dependentes').value) || 0;
    const outrasBases = parseFloat(inputOutrasBases.value) || 0;
    const jaContribuido = parseFloat(inputJaContribuido.value) || 0;

    if (outrasBases > 0 && inputJaContribuido.value === '') {
        alert("O campo 'INSS Já Contribuído' é obrigatório quando há outras bases informadas.");
        return; 
    }

    // Inicialização segura de variáveis para o escopo da função (Evita ReferenceError)
    let totalINSS = 0;
    let impostoFinal = 0;
    let modeloIRRF = 'N/A';
    let baseLegal = 0, impostoLegal = 0, baseSimplificada = 0, impostoSimplificado = 0, valorReducao = 0;

    const baseINSS = Math.min(salario + outrasBases, TETO_INSS);
    
    let html = `<h3>Detalhamento do Cálculo</h3>`;

    // --- 1. TABELAS DE REFERÊNCIA ---
    html += `<div class="calc-comparison">`;
    if (tipo === 'ambos' || tipo === 'inss') html += renderizarTabela(TABELA_INSS, 'INSS');
    if (tipo === 'ambos' || tipo === 'irrf') html += renderizarTabela(TABELA_IRRF, 'IRRF');
    html += `</div><hr>`;

    // --- 2. CÁLCULO INSS ---
    if (tipo === 'ambos' || tipo === 'inss') {
        html += `<div class="calculo-bloco"><h4>Previdência (INSS)</h4>`;
        
        if (tipoContribuinte === 'prolabore') {
            // CÁLCULO PRO-LABORE (FIXO 11%)
            const aliquotaFixa = 0.11;
            totalINSS = Math.max(0, (baseINSS * aliquotaFixa) - jaContribuido);
            
            html += `<p><strong>Cálculo para Sócio (Pró-labore):</strong></p>`;
            html += `<p>Como se trata de um sócio (Pró-labore), aplica-se a alíquota fixa de <strong>11%</strong> sobre a base de cálculo.</p>`;
            html += `<p>Cálculo: R$ ${formatarMoeda(baseINSS)} x 11% = <strong>R$ ${formatarMoeda(baseINSS * aliquotaFixa)}</strong></p>`;
        } else {
            // CÁLCULO CLT (PROGRESSIVO)
            html += `<p><strong>1. Cálculo Progressivo (Faixa por Faixa):</strong></p><ul>`;
            let anterior = 0;
            let somaProgressiva = 0;
            TABELA_INSS.forEach((f, i) => {
                let baseFaixa = Math.min(baseINSS, f.limite) - anterior;
                if (baseFaixa > 0) {
                    let valor = baseFaixa * f.aliquota;
                    somaProgressiva += valor;
                    html += `<li>Faixa ${i + 1}: R$ ${formatarMoeda(baseFaixa)} x ${(f.aliquota * 100).toFixed(1)}% = R$ ${formatarMoeda(valor)}</li>`;
                }
                anterior = f.limite;
            });
            html += `</ul><p>Total Acumulado: R$ ${formatarMoeda(somaProgressiva)}</p>`;

            const faixa = TABELA_INSS.find(f => baseINSS <= f.limite) || TABELA_INSS[TABELA_INSS.length - 1];
            let calculoSimplificado = (baseINSS * faixa.aliquota) - faixa.deducao;
            
            html += `<p><strong>2. Cálculo Simplificado (Conferência):</strong></p>`;
            html += `<p><em>(Salário Base x Alíquota) - Dedução = Total de INSS</em></p>`;
            html += `<p>(R$ ${formatarMoeda(baseINSS)} x ${(faixa.aliquota * 100).toFixed(1)}%) - R$ ${formatarMoeda(faixa.deducao)} = <strong>R$ ${formatarMoeda(calculoSimplificado)}</strong></p>`;
            
            totalINSS = Math.max(0, calculoSimplificado - jaContribuido);
        }
        
        html += `<p class="calc-spacing">`;
        if (outrasBases > 0 && jaContribuido > 0) {
            html += `<em>* Valor de INSS ajustado pela contribuição já realizada (R$ ${formatarMoeda(jaContribuido)})</em><br>`;
        }
        html += `<strong>${(outrasBases > 0 && jaContribuido > 0) ? 'Valor final INSS (descontado o já contribuído)' : 'Total de INSS a pagar'}: R$ ${formatarMoeda(totalINSS)}</strong></p></div>`;
    }

    // --- 3. CÁLCULO IRRF ---

    if (tipo === 'ambos' || tipo === 'irrf') {
        baseLegal = Math.max(0, salario - totalINSS - (dependentes * VALOR_DEDUCAO_DEPENDENTE));
        baseSimplificada = Math.max(0, salario - DESCONTO_SIMPLIFICADO);

        impostoLegal = calcularImpostoIRRF(baseLegal);
        impostoSimplificado = calcularImpostoIRRF(baseSimplificada);
        
        const ehMaisFavoravelSimplificado = impostoSimplificado < impostoLegal;
        const impostoDevidoSemReducao = Math.min(impostoLegal, impostoSimplificado);

        // Nova Lógica de Explicação da Redução 2026
        let explicacaoReducao = '';
        if (salario <= TABELA_REDUCAO_MENSAL.limiteInferior) {
            valorReducao = TABELA_REDUCAO_MENSAL.reducaoFixa; 
            explicacaoReducao = `<em>Rendimentos até R$ ${formatarMoeda(TABELA_REDUCAO_MENSAL.limiteInferior)}: redução de até R$ ${formatarMoeda(TABELA_REDUCAO_MENSAL.reducaoFixa)} (limitado a zerar o imposto).</em>`;
        } else if (salario > TABELA_REDUCAO_MENSAL.limiteInferior && salario <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
            valorReducao = TABELA_REDUCAO_MENSAL.formulaVariavel(salario);
            explicacaoReducao = `<em>Fórmula decrescente: R$ 978,62 - (0,133145 x R$ ${formatarMoeda(salario)}) = <strong>R$ ${formatarMoeda(valorReducao)}</strong></em>`;
        }
        
        valorReducao = Math.max(0, valorReducao);
        
        // Aplicação do conceito "Até Zerar"
        let reducaoEfetiva = Math.min(impostoDevidoSemReducao, valorReducao);
        impostoFinal = Math.max(0, impostoDevidoSemReducao - reducaoEfetiva);
        modeloIRRF = ehMaisFavoravelSimplificado ? 'Simplificado' : 'Deduções Legais';

        html += `<div class="calculo-bloco"><h4>Imposto de Renda (IRRF)</h4>`;
        
        html += `<div class="calc-comparison">
            <div class="calc-box">
                <strong>Deduções Legais</strong><br>
                Salário: R$ ${formatarMoeda(salario)}<br>
                (-) INSS: R$ ${formatarMoeda(totalINSS)}<br>
                (-) Dep. (${dependentes}): R$ ${formatarMoeda(dependentes * VALOR_DEDUCAO_DEPENDENTE)}<br>
                <strong>Base: R$ ${formatarMoeda(baseLegal)}</strong><br>
                <span style="color: ${!ehMaisFavoravelSimplificado ? 'green' : 'inherit'};">Imposto: R$ ${formatarMoeda(impostoLegal)}</span>
            </div>
            <div class="calc-box">
                <strong>Desconto Simplificado</strong><br>
                Salário: R$ ${formatarMoeda(salario)}<br>
                (-) Desc. Padrão: R$ ${formatarMoeda(DESCONTO_SIMPLIFICADO)}<br>
                <br>
                <strong>Base: R$ ${formatarMoeda(baseSimplificada)}</strong><br>
                <span style="color: ${ehMaisFavoravelSimplificado ? 'green' : 'inherit'};">Imposto: R$ ${formatarMoeda(impostoSimplificado)}</span>
            </div>
        </div>`;

        if (reducaoEfetiva > 0 || salario <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
            html += `<div class="calc-info-box calc-info-box-blue">
                <strong>Regra de Redução:</strong><br>
                Formula: R$ 978,62 - (0,133145 x rendimentos tributáveis sujeitos à incidência mensal) = valor a deduzir<br>
                ${explicacaoReducao}<br><br>
                Valor Devido (sem redução): R$ ${formatarMoeda(impostoDevidoSemReducao)}<br>
                (-) Valor da redução aplicada: R$ ${formatarMoeda(reducaoEfetiva)}<br>
                <strong>Valor IRRF Mensal com redução: R$ ${formatarMoeda(impostoFinal)}</strong>
            </div>`;
        }

        html += `<p class="calc-info-box">
            <strong>Modelo Selecionado:</strong> ${modeloIRRF}.<br>
            <strong>Imposto de Renda Final: R$ ${formatarMoeda(impostoFinal)}</strong>
        </p></div>`;
        
        // Atualiza a variável para garantir que o PDF herde o valor corretamente travado no "até zerar"
        valorReducao = reducaoEfetiva;
    }

    document.getElementById('explicacao-conteudo').innerHTML = html;
    document.getElementById('secao-explicacao').style.display = 'block';

    // --- PREPARAÇÃO E VÍNCULO PARA EXPORTAÇÃO PDF ---
    dadosExportacao.dados = { salario, dependentes, tipoContribuinte };
    dadosExportacao.resultados = { totalINSS, impostoFinal, modeloIRRF };
    const detalhes = {
        inssTexto: tipoContribuinte === 'prolabore' ? 'Cálculo fixo 11%' : 'Cálculo Progressivo (Faixa por Faixa)',
        inss: { baseINSS, outrasBases, jaContribuido },
        irrf: { baseLegal, impostoLegal, baseSimplificada, impostoSimplificado, valorReducao }
    };

    const btnPdf = document.getElementById('btn-export-pdf-detalhado');
    if(btnPdf) {
        // Usa onclick para garantir que não acumule eventos de cliques se o usuário simular várias vezes
        btnPdf.onclick = () => {
            gerarPDFDetalhamento(dadosExportacao.dados, dadosExportacao.resultados, detalhes);
        };
    }
}