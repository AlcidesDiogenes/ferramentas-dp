// js/simuladores/calculos-prolabore.js
import { TABELA_IRRF, TABELA_REDUCAO_MENSAL, VALOR_DEDUCAO_DEPENDENTE, TETO_INSS } from './tabelas.js';

export function calcularProlabore({ salarioBruto, filhos, outrasBases, valorJaContribuido, percPatronal, regime, descontarInss }) {
    
    // 1. Base INSS
    const baseInss = Math.min(salarioBruto + outrasBases, TETO_INSS);
    
    // 2. INSS Segurado (Só calcula se descontarInss for true)
    const inssSegurado = descontarInss ? Math.max(0, (baseInss * 0.11) - valorJaContribuido) : 0;
    
    // 3. INSS Patronal
    const inssPatronal = regime === 'lucro' ? (salarioBruto * (percPatronal / 100)) : 0;

    // 4. IRRF
    const baseIrrf = Math.max(0, salarioBruto - inssSegurado - (filhos * VALOR_DEDUCAO_DEPENDENTE));
    let irrf = 0;
    
    if (baseIrrf > 0) {
        const faixa = TABELA_IRRF.find(f => baseIrrf <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
        const impostoBruto = (baseIrrf * faixa.aliquota) - faixa.deducao;
        
        let reducao = 0;
        if (salarioBruto <= TABELA_REDUCAO_MENSAL.limiteInferior) {
            reducao = TABELA_REDUCAO_MENSAL.reducaoFixa;
        } else if (salarioBruto <= TABELA_REDUCAO_MENSAL.limiteSuperior) {
            reducao = TABELA_REDUCAO_MENSAL.formulaVariavel(salarioBruto);
        }
        
        irrf = Math.max(0, impostoBruto - reducao);
    }

    const valorLiquido = salarioBruto - inssSegurado - irrf;

    return {
        baseInss,
        inssSegurado,
        inssPatronal,
        baseIrrf,
        irrf,
        valorLiquido
    };
}