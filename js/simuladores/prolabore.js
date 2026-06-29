// js/simuladores/prolabore.js
import { TABELA_IRRF, TABELA_REDUCAO_MENSAL, VALOR_DEDUCAO_DEPENDENTE, TETO_INSS } from './tabelas.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-prolabore');
    const selectRegime = document.getElementById('regime');
    const divInssPatronal = document.getElementById('div-inss-patronal');
    const inputInssPatronal = document.getElementById('inssPatronal');
    
    const inputOutrasBases = document.getElementById('outrasBases');
    const divValorContribuido = document.getElementById('div-valor-contribuido');
    const inputValorContribuido = document.getElementById('valorContribuido');
    
    const resultadoSection = document.getElementById('resultado-section');
    const divResultado = document.getElementById('resultado-calculo');

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    selectRegime.addEventListener('change', (e) => {
        if (e.target.value === 'lucro') {
            divInssPatronal.style.display = 'block';
            inputInssPatronal.value = '20';
        } else {
            divInssPatronal.style.display = 'none';
            inputInssPatronal.value = '';
        }
    });

    inputOutrasBases.addEventListener('input', () => {
        if (parseFloat(inputOutrasBases.value) > 0) {
            divValorContribuido.style.display = 'block';
            inputValorContribuido.required = true;
        } else {
            divValorContribuido.style.display = 'none';
            inputValorContribuido.required = false;
            inputValorContribuido.value = '';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const regime = formData.get('regime');
        const periodicidade = parseInt(formData.get('periodicidade')) || 1;
        const salarioBruto = parseFloat(formData.get('salario')) || 0;
        const filhos = parseInt(formData.get('filhos')) || 0;
        const outrasBases = parseFloat(formData.get('outrasBases')) || 0;
        const valorJaContribuido = parseFloat(formData.get('valorContribuido')) || 0;
        const percPatronal = regime === 'lucro' ? parseFloat(formData.get('inssPatronal')) || 0 : 0;

        // Cálculos
        const baseInssCalculada = Math.min(salarioBruto + outrasBases, TETO_INSS);
        const inssSegurado = Math.max(0, (baseInssCalculada * 0.11) - valorJaContribuido);
        const inssPatronal = (salarioBruto * (percPatronal / 100));

        // Cálculo IRRF
        const baseIrrf = Math.max(0, salarioBruto - inssSegurado - (filhos * VALOR_DEDUCAO_DEPENDENTE));
        let irrf = 0;
        if (baseIrrf > 0) {
            const faixaIrrf = TABELA_IRRF.find(f => baseIrrf <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
            let impostoBruto = (baseIrrf * faixaIrrf.aliquota) - faixaIrrf.deducao;

            let reducao = (salarioBruto <= TABELA_REDUCAO_MENSAL.limiteInferior) ? TABELA_REDUCAO_MENSAL.reducaoFixa : 
                          (salarioBruto <= TABELA_REDUCAO_MENSAL.limiteSuperior ? TABELA_REDUCAO_MENSAL.formulaVariavel(salarioBruto) : 0);
            
            irrf = Math.max(0, impostoBruto - reducao);
        }

        const valorLiquido = salarioBruto - inssSegurado - (irrf > 0 ? irrf : 0);
        
        // Cálculo de Custos
        const custoProvento = salarioBruto * periodicidade;
        const custoEncargos = inssPatronal * periodicidade;
        const custoTotalEmpresa = custoProvento + custoEncargos;

        // Renderização Profissional
        divResultado.innerHTML = `
            <div class="sim-card">
                <div class="sim-section">
                    <h4>Informações da Simulação</h4>
                    <div class="sim-grid">
                        <div class="sim-item"><span class="sim-label">Regime</span><span class="sim-value">${regime === 'lucro' ? 'Lucro Presumido/Real' : 'Simples Nacional'}</span></div>
                        <div class="sim-item"><span class="sim-label">Periodicidade</span><span class="sim-value">${periodicidade === 1 ? 'Mensal' : (periodicidade === 6 ? 'Semestral' : 'Anual')}</span></div>
                        ${regime === 'lucro' ? `<div class="sim-item"><span class="sim-label">Alíquota Patronal</span><span class="sim-value">${percPatronal}%</span></div>` : ''}
                        ${filhos > 0 ? `<div class="sim-item"><span class="sim-label">Dependentes</span><span class="sim-value">${filhos}</span></div>` : ''}
                        ${outrasBases > 0 ? `<div class="sim-item"><span class="sim-label">Base Externa</span><span class="sim-value">R$ ${formatarMoeda(outrasBases)}</span></div>` : ''}
                        ${valorJaContribuido > 0 ? `<div class="sim-item"><span class="sim-label">Contr. Anterior</span><span class="sim-value">R$ ${formatarMoeda(valorJaContribuido)}</span></div>` : ''}
                    </div>
                </div>

                <div class="sim-section">
                    <h4>Bases de Cálculo</h4>
                    <div class="sim-grid">
                        <div class="sim-item"><span class="sim-label">Base INSS</span><span class="sim-value">R$ ${formatarMoeda(baseInssCalculada)}</span></div>
                        <div class="sim-item"><span class="sim-label">Base IRRF</span><span class="sim-value">R$ ${formatarMoeda(baseIrrf)}</span></div>
                    </div>
                </div>

                <div class="sim-section">
                    <h4>Resumo Financeiro</h4>
                    <div class="sim-grid">
                        <div class="sim-item"><span class="sim-label">Provento</span><span class="sim-value">R$ ${formatarMoeda(salarioBruto)}</span></div>
                        <div class="sim-item"><span class="sim-label">INSS Segurado</span><span class="sim-value">R$ ${formatarMoeda(inssSegurado)}</span></div>
                        <div class="sim-item"><span class="sim-label">IRRF</span><span class="sim-value">R$ ${irrf > 0 ? formatarMoeda(irrf) : '0,00'}</span></div>
                    </div>
                    <div class="total-bar">
                        <span style="font-weight: 600;">Líquido a Receber</span>
                        <span class="highlight-value">R$ ${formatarMoeda(valorLiquido)}</span>
                    </div>
                </div>

                <div class="sim-section" style="margin-bottom: 0;">
                    <h4>Custos da Empresa (${periodicidade === 1 ? 'Mensal' : (periodicidade === 6 ? 'Semestral' : 'Anual')})</h4>
                    <div class="sim-grid">
                        <div class="sim-item"><span class="sim-label">Custo Provento</span><span class="sim-value">R$ ${formatarMoeda(custoProvento)}</span></div>
                        <div class="sim-item"><span class="sim-label">Custo Encargos</span><span class="sim-value">R$ ${formatarMoeda(custoEncargos)}</span></div>
                    </div>
                    <div class="total-bar" style="background-color: #eff6ff; margin-top: 10px;">
                        <span style="font-weight: 600;">Custo Total da Empresa</span>
                        <span class="highlight-value" style="color: #1e40af;">R$ ${formatarMoeda(custoTotalEmpresa)}</span>
                    </div>
                </div>
            </div>
        `;
        resultadoSection.style.display = 'block';
    });
});