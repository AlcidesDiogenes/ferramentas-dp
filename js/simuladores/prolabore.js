// js/simuladores/prolabore.js
import { TABELA_IRRF, TABELA_REDUCAO_MENSAL, VALOR_DEDUCAO_DEPENDENTE, TETO_INSS } from './tabelas.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-prolabore');
    const selectRegime = document.getElementById('regime');
    const divInssPatronal = document.getElementById('div-inss-patronal');
    const inputInssPatronal = document.getElementById('inssPatronal');
    
    // Elementos de "Outras Bases" e "Contribuição já realizada"
    const inputOutrasBases = document.getElementById('outrasBases');
    const divValorContribuido = document.getElementById('div-valor-contribuido');
    const inputValorContribuido = document.getElementById('valorContribuido');
    
    const resultadoSection = document.getElementById('resultado-section');
    const divResultado = document.getElementById('resultado-calculo');

    // Função para formatar números (Padrão 1.234,56)
    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // 1. Lógica Visual: Regime e Campos Dinâmicos
    selectRegime.addEventListener('change', (e) => {
        if (e.target.value === 'lucro') {
            divInssPatronal.style.display = 'block';
            inputInssPatronal.value = '20';
        } else {
            divInssPatronal.style.display = 'none';
            inputInssPatronal.value = '';
        }
    });

    // Monitora "Outras Bases" para exibir campo de "Valor Já Contribuído"
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

    // 2. Lógica de Cálculo
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const regime = formData.get('regime');
        const salarioBruto = parseFloat(formData.get('salario')) || 0;
        const filhos = parseInt(formData.get('filhos')) || 0;
        const outrasBases = parseFloat(formData.get('outrasBases')) || 0;
        const valorJaContribuido = parseFloat(formData.get('valorContribuido')) || 0;
        const percPatronal = regime === 'lucro' ? parseFloat(formData.get('inssPatronal')) || 0 : 0;

        // A. Cálculo INSS (Segurado)
        // Regra: Alíquota fixa de 11% sobre o total (salário + outras bases), limitado ao teto.
        // O valor do desconto é: (Total Calculado - Valor já pago em outras fontes)
        const baseTotal = salarioBruto + outrasBases;
        const baseTeto = Math.min(baseTotal, TETO_INSS);
        const inssTotalCalculado = baseTeto * 0.11;
        
        // Garante que o INSS não seja negativo
        const inssSegurado = Math.max(0, inssTotalCalculado - valorJaContribuido);

        // B. Cálculo INSS Patronal
        const inssPatronal = (salarioBruto * (percPatronal / 100));

        // C. Cálculo IRRF
        const baseIrrf = salarioBruto - inssSegurado - (filhos * VALOR_DEDUCAO_DEPENDENTE);
        let irrf = 0;

        if (baseIrrf > 0) {
            const faixaIrrf = TABELA_IRRF.find(f => baseIrrf <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
            let impostoBruto = (baseIrrf * faixaIrrf.aliquota) - faixaIrrf.deducao;

            // Aplicação da Nova Regra de Redução Mensal (2026)
            let reducao = 0;
            if (salarioBruto <= TABELA_REDUCAO_MENSAL.limiteInferior) {
                reducao = TABELA_REDUCAO_MENSAL.reducaoFixa;
            } else if (salarioBruto > TABELA_REDUCAO_MENSAL.limiteInferior && salarioBruto <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
                reducao = TABELA_REDUCAO_MENSAL.formulaVariavel(salarioBruto);
            }

            irrf = Math.max(0, impostoBruto - reducao);
        }

        // D. Valor Líquido
        const valorLiquido = salarioBruto - inssSegurado - (irrf > 0 ? irrf : 0);

        // 3. Renderização
        divResultado.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <p><strong>Salário Bruto:</strong> R$ ${formatarMoeda(salarioBruto)}</p>
                <p><strong>INSS Segurado:</strong> R$ ${formatarMoeda(inssSegurado)}</p>
                ${regime === 'lucro' ? `<p><strong>INSS Patronal:</strong> R$ ${formatarMoeda(inssPatronal)}</p>` : ''}
                <p><strong>IRRF:</strong> R$ ${irrf > 0 ? formatarMoeda(irrf) : '0,00'}</p>
            </div>
            <hr style="margin: 15px 0;">
            <p style="font-size: 1.5rem; font-weight: bold; color: var(--cor-destaque);">
                Líquido: R$ ${formatarMoeda(valorLiquido)}
            </p>
        `;
        resultadoSection.style.display = 'block';
    });
});