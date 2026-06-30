// js/simuladores/detalhamento-calculos.js
import { 
    TABELA_INSS, 
    TABELA_IRRF, 
    TETO_INSS, 
    VALOR_DEDUCAO_DEPENDENTE, 
    DESCONTO_SIMPLIFICADO 
} from './tabelas.js';

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

form.addEventListener('submit', (e) => {
    e.preventDefault();
    processarCalculo();
});

function processarCalculo() {
    const tipo = document.getElementById('tipo-calculo').value;
    const salario = parseFloat(document.getElementById('salario-bruto').value) || 0;
    const dependentes = parseInt(document.getElementById('dependentes').value) || 0;
    const outrasBases = parseFloat(inputOutrasBases.value) || 0;
    const jaContribuido = parseFloat(inputJaContribuido.value) || 0;

    if (outrasBases > 0 && inputJaContribuido.value === '') {
        alert("O campo 'INSS Já Contribuído' é obrigatório quando há outras bases informadas.");
        return; 
    }

    const baseINSS = Math.min(salario + outrasBases, TETO_INSS);
    let totalINSS = 0;
    
    let html = `<h3>Detalhamento do Cálculo</h3>`;

    // --- 1. TABELAS DE REFERÊNCIA ---
    html += `<div style="display: flex; gap: 10px; flex-wrap: wrap;">`;
    if (tipo === 'ambos' || tipo === 'inss') html += renderizarTabela(TABELA_INSS, 'INSS');
    if (tipo === 'ambos' || tipo === 'irrf') html += renderizarTabela(TABELA_IRRF, 'IRRF');
    html += `</div><hr>`;

    // --- 2. CÁLCULO INSS ---
    if (tipo === 'ambos' || tipo === 'inss') {
        html += `<div class="calculo-bloco"><h4>Previdência (INSS)</h4>`;
        
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
        html += `<p style="margin-bottom: 2px;"><em>(Salário Base x Alíquota) - Dedução = Total de INSS</em></p>`;
        html += `<p>(R$ ${formatarMoeda(baseINSS)} x ${(faixa.aliquota * 100).toFixed(1)}%) - R$ ${formatarMoeda(faixa.deducao)} = <strong>R$ ${formatarMoeda(calculoSimplificado)}</strong></p>`;

        totalINSS = Math.max(0, calculoSimplificado - jaContribuido);
        
        html += `<p style="margin-top:10px;">`;
        if (outrasBases > 0 && jaContribuido > 0) {
            html += `<em>* Valor de INSS ajustado pela contribuição já realizada (R$ ${formatarMoeda(jaContribuido)})</em><br>`;
        }
        html += `<strong>${(outrasBases > 0 && jaContribuido > 0) ? 'Valor final INSS (descontado o já contribuído)' : 'Total de INSS a pagar'}: R$ ${formatarMoeda(totalINSS)}</strong></p></div>`;
    }

    // --- 3. CÁLCULO IRRF ---
    if (tipo === 'ambos' || tipo === 'irrf') {
        const baseLegal = Math.max(0, salario - totalINSS - (dependentes * VALOR_DEDUCAO_DEPENDENTE));
        const baseSimplificada = Math.max(0, salario - DESCONTO_SIMPLIFICADO);

        const impostoLegal = calcularImpostoIRRF(baseLegal);
        const impostoSimplificado = calcularImpostoIRRF(baseSimplificada);
        
        const ehMaisFavoravelSimplificado = impostoSimplificado < impostoLegal;
        const impostoFinal = Math.min(impostoLegal, impostoSimplificado);

        html += `<div class="calculo-bloco"><h4>Imposto de Renda (IRRF)</h4>`;
        
        // Comparativo Visual
        html += `<div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px;">`;
        html += `<div style="flex: 1; background: #f1f5f9; padding: 12px; border-radius: 8px;">
            <strong>Deduções Legais</strong><br>
            Salário: R$ ${formatarMoeda(salario)}<br>
            (-) INSS: R$ ${formatarMoeda(totalINSS)}<br>
            (-) Dep. (${dependentes}): R$ ${formatarMoeda(dependentes * VALOR_DEDUCAO_DEPENDENTE)}<br>
            <strong>Base: R$ ${formatarMoeda(baseLegal)}</strong><br>
            <span style="color: ${!ehMaisFavoravelSimplificado ? 'green' : 'inherit'};">Imposto: R$ ${formatarMoeda(impostoLegal)}</span>
        </div>`;
        html += `<div style="flex: 1; background: #f1f5f9; padding: 12px; border-radius: 8px;">
            <strong>Desconto Simplificado</strong><br>
            Salário: R$ ${formatarMoeda(salario)}<br>
            (-) Desc. Padrão: R$ ${formatarMoeda(DESCONTO_SIMPLIFICADO)}<br>
            <br>
            <strong>Base: R$ ${formatarMoeda(baseSimplificada)}</strong><br>
            <span style="color: ${ehMaisFavoravelSimplificado ? 'green' : 'inherit'};">Imposto: R$ ${formatarMoeda(impostoSimplificado)}</span>
        </div>`;
        html += `</div>`;

        // Detalhamento do Vencedor
        html += `<p style="padding: 10px; border-left: 4px solid green; background: #f0fdf4;">
            <strong>Modelo Selecionado:</strong> ${ehMaisFavoravelSimplificado ? 'Simplificado' : 'Deduções Legais'}.<br>
            <strong>Imposto de Renda Devido: R$ ${formatarMoeda(impostoFinal)}</strong>
        </p>`;
        
        
        html += `</div>`;
    }

    document.getElementById('explicacao-conteudo').innerHTML = html;
    document.getElementById('secao-explicacao').style.display = 'block';
}

function renderizarTabela(tabela, tipo) {
    let html = `<div style="flex: 1; min-width: 280px; font-size: 0.75rem; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px;">
        <strong>Tabela ${tipo}:</strong>
        <table style="width:100%; border-collapse: collapse; margin-top:5px;">
            <tr style="background:#e2e8f0; text-align: left;"><th>Faixa/Base</th><th>Alíquota</th><th>Dedução</th></tr>`;
    tabela.forEach(f => {
        html += `<tr style="border-bottom: 1px solid #f1f5f9;">
            <td>R$ ${formatarMoeda(f.limite || f.base)}</td>
            <td>${(f.aliquota * 100).toFixed(1)}%</td>
            <td>R$ ${formatarMoeda(f.deducao)}</td>
        </tr>`;
    });
    html += `</table></div>`;
    return html;
}