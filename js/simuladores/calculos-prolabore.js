// js/simuladores/calculos-prolabore.js
import { TETO_INSS } from './tabelas.js';
import { calcularIRRFCompleto } from './calculos-folha.js';

export function calcularProlabore({ salarioBruto, filhos, outrasBases, valorJaContribuido, percPatronal, regime, descontarInss }) {

    // 1. Base INSS
    const baseInss = Math.min(salarioBruto + outrasBases, TETO_INSS);

    // 2. INSS Segurado (Só calcula se descontarInss for true)
    const inssSegurado = descontarInss ? Math.max(0, (baseInss * 0.11) - valorJaContribuido) : 0;

    // 3. INSS Patronal
    const inssPatronal = regime === 'lucro' ? (salarioBruto * (percPatronal / 100)) : 0;

    // 4. IRRF — compara dedução legal (INSS + dependentes) com o desconto simplificado
    // e aplica a redução mensal, igual aos demais simuladores (ver calculos-folha.js).
    const resultadoIRRF = calcularIRRFCompleto(salarioBruto, inssSegurado, filhos);
    const baseIrrf = resultadoIRRF.baseLegal;
    const irrf = resultadoIRRF.impostoFinal;

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
