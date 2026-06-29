// js/simuladores/prolabore.js
import { calcularProlabore } from './calculos-prolabore.js';
import { gerarPDFProlabore } from './pdf-generator.js';

const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function renderizarInterface(res, dados, periodicidade, custoTotal) {
    const divResultado = document.getElementById('resultado-calculo');
    const textoPeriodicidade = periodicidade == 1 ? 'Mensal' : (periodicidade == 6 ? 'Semestral' : 'Anual');

    // Construção dinâmica das informações extras (só aparecem se tiverem valor)
    let extrasHtml = `
        <div class="sim-item"><span class="sim-label">Regime</span><span class="sim-value">${dados.regime === 'lucro' ? 'Lucro Presumido/Real' : 'Simples Nacional'}</span></div>
    `;

    if (dados.regime === 'lucro') {
        extrasHtml += `<div class="sim-item"><span class="sim-label">INSS Patronal</span><span class="sim-value">${dados.percPatronal}%</span></div>`;
    }
    if (dados.filhos > 0) {
        extrasHtml += `<div class="sim-item"><span class="sim-label">Dependentes</span><span class="sim-value">${dados.filhos}</span></div>`;
    }
    if (dados.outrasBases > 0) {
        extrasHtml += `<div class="sim-item"><span class="sim-label">Outras Bases</span><span class="sim-value">R$ ${formatarMoeda(dados.outrasBases)}</span></div>`;
    }
    if (dados.valorJaContribuido > 0) {
        extrasHtml += `<div class="sim-item"><span class="sim-label">INSS Contribuído</span><span class="sim-value">R$ ${formatarMoeda(dados.valorJaContribuido)}</span></div>`;
    }

    divResultado.innerHTML = `
        <div class="sim-card" id="area-impressao">
            <div class="sim-section">
                <h4>Configurações da Simulação</h4>
                <div class="sim-grid">
                    ${extrasHtml}
                </div>
            </div>

            <div class="sim-section">
                <h4>Bases de Cálculo</h4>
                <div class="sim-grid">
                    <div class="sim-item"><span class="sim-label">Base INSS</span><span class="sim-value">R$ ${formatarMoeda(res.baseInss)}</span></div>
                    <div class="sim-item"><span class="sim-label">Base IRRF</span><span class="sim-value">R$ ${formatarMoeda(res.baseIrrf)}</span></div>
                </div>
            </div>

            <div class="sim-section">
                <h4>Resumo Financeiro</h4>
                <div class="sim-grid">
                    <div class="sim-item"><span class="sim-label">Provento</span><span class="sim-value">R$ ${formatarMoeda(dados.salarioBruto)}</span></div>
                    <div class="sim-item"><span class="sim-label">INSS Segurado</span><span class="sim-value">R$ ${formatarMoeda(res.inssSegurado)}</span></div>
                    <div class="sim-item"><span class="sim-label">IRRF</span><span class="sim-value">R$ ${formatarMoeda(res.irrf)}</span></div>
                </div>
                <div class="total-bar">
                    <span class="highlight-label">Líquido a Receber</span>
                    <span class="highlight-value">R$ ${formatarMoeda(res.valorLiquido)}</span>
                </div>
            </div>

            <div class="sim-section">
                <h4>Custos da Empresa (${textoPeriodicidade})</h4>
                <div class="sim-grid">
                    <div class="sim-item"><span class="sim-label">Custo INSS Patronal</span><span class="sim-value">R$ ${formatarMoeda(res.inssPatronal * periodicidade)}</span></div>
                    <div class="sim-item"><span class="sim-label">Custo Total</span><span class="sim-value highlight-label" style="color: #1e40af;">R$ ${formatarMoeda(custoTotal)}</span></div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button id="btn-salvar-pdf" type="button" class="btn-action">Baixar em PDF</button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-prolabore');
    const resultadoSection = document.getElementById('resultado-section');

    // Toggles de visibilidade (já existentes)
    document.getElementById('regime').addEventListener('change', (e) => {
        document.getElementById('div-inss-patronal').style.display = (e.target.value === 'lucro') ? 'block' : 'none';
    });

    document.getElementById('outrasBases').addEventListener('input', (e) => {
        document.getElementById('div-valor-contribuido').style.display = (parseFloat(e.target.value) > 0) ? 'block' : 'none';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        const dados = {
            salarioBruto: parseFloat(formData.get('salario')) || 0,
            filhos: parseInt(formData.get('filhos')) || 0,
            outrasBases: parseFloat(formData.get('outrasBases')) || 0,
            valorJaContribuido: parseFloat(formData.get('valorContribuido')) || 0,
            percPatronal: parseFloat(formData.get('inssPatronal')) || 0,
            regime: formData.get('regime'),
            // Captura o valor do select (retorna true se for 'sim')
            descontarInss: formData.get('descontarInss') === 'sim'
        };
        const periodicidade = parseInt(formData.get('periodicidade'));

        const res = calcularProlabore(dados);
        const custoTotal = (dados.salarioBruto * periodicidade) + (res.inssPatronal * periodicidade);

        renderizarInterface(res, dados, periodicidade, custoTotal);
        resultadoSection.style.display = 'block';

        document.getElementById('btn-salvar-pdf').addEventListener('click', () => {
            gerarPDFProlabore(res, dados, periodicidade);
        });
    });
});