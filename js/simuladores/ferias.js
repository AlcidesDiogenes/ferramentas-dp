import {
    TABELA_INSS,
    TABELA_IRRF,
    TETO_INSS,
    VALOR_DEDUCAO_DEPENDENTE,
    DESCONTO_SIMPLIFICADO
} from './tabelas.js';

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Usa a mesma tabela progressiva de INSS/IRRF compartilhada com os demais simuladores
// (js/simuladores/tabelas.js), para que o mesmo salário gere o mesmo resultado em qualquer
// ferramenta do sistema.
function calcularINSS(baseCalculo) {
    const base = Math.min(Math.max(0, baseCalculo), TETO_INSS);
    let anterior = 0;
    let soma = 0;

    for (const f of TABELA_INSS) {
        const baseFaixa = Math.min(base, f.limite) - anterior;
        if (baseFaixa > 0) {
            soma += baseFaixa * f.aliquota;
        }
        anterior = f.limite;
    }
    return Math.max(0, soma);
}

function calcularIRRFTabela(baseCalculo) {
    if (baseCalculo <= 0) return 0;
    const faixa = TABELA_IRRF.find(f => baseCalculo <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
    const imposto = (baseCalculo * faixa.aliquota) - faixa.deducao;
    return Math.max(0, imposto);
}

// A lei permite usar a dedução legal (INSS + dependentes) ou o desconto simplificado
// (Lei 14.663/2023), o que for mais benéfico ao trabalhador.
function calcularIRRF(baseProventos, descontoINSS, deducaoDependentes) {
    const baseTradicional = baseProventos - descontoINSS - deducaoDependentes;
    const baseSimplificada = baseProventos - DESCONTO_SIMPLIFICADO;

    const irrfTradicional = calcularIRRFTabela(baseTradicional);
    const irrfSimplificado = calcularIRRFTabela(baseSimplificada);

    return Math.min(irrfTradicional, irrfSimplificado);
}


function calcularDireitoFerias(faltas, avos) {
    if (faltas > 32) return 0; // Mais de 32 faltas perde o direito
    
    let multiplicador = 2.5;
    if (faltas >= 6 && faltas <= 14) multiplicador = 2.0;
    else if (faltas >= 15 && faltas <= 23) multiplicador = 1.5;
    else if (faltas >= 24 && faltas <= 32) multiplicador = 1.0;
    
    return avos * multiplicador;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-ferias');
    const inputFaltas = document.getElementById('faltas');
    const inputAvos = document.getElementById('avos');
    const inputDiasGozo = document.getElementById('diasGozo');
    const msgDiasDireito = document.getElementById('diasDireitoMsg');
    const inputAbono = document.getElementById('abono');
    
    function atualizarDireito() {
        const faltas = parseInt(inputFaltas.value) || 0;
        const avos = parseInt(inputAvos.value) || 12;
        const diasDireito = calcularDireitoFerias(faltas, avos);
        
        if (diasDireito < 30 || avos < 12) {
            msgDiasDireito.textContent = `Direito a ${diasDireito} dias (Avos: ${avos}, Faltas: ${faltas}).`;
            msgDiasDireito.style.display = 'block';
        } else {
            msgDiasDireito.style.display = 'none';
        }
        
        // Ajustar valor máximo permitido no input de gozo
        inputDiasGozo.max = diasDireito;
        if (parseFloat(inputDiasGozo.value) > diasDireito) {
            inputDiasGozo.value = diasDireito;
        }
    }

    // Atualizar dias de direito com base nas faltas e avos
    inputFaltas.addEventListener('input', atualizarDireito);
    if (inputAvos) inputAvos.addEventListener('input', atualizarDireito);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const salario = parseFloat(document.getElementById('salario').value) || 0;
        const medias = parseFloat(document.getElementById('medias').value) || 0;
        const faltas = parseInt(inputFaltas.value) || 0;
        const avos = parseInt(inputAvos.value) || 12;
        let diasGozo = parseFloat(inputDiasGozo.value) || 0;
        const dependentes = parseInt(document.getElementById('dependentes').value) || 0;
        const venderFerias = inputAbono.value === 'sim';

        // Validação básica
        if (salario <= 0) {
            alert('Informe um salário válido (maior que zero) antes de calcular.');
            return;
        }

        const diasDireito = calcularDireitoFerias(faltas, avos);
        if (diasDireito === 0) {
            alert('Com esta quantidade de faltas (>32), o colaborador perde o direito a férias.');
            return;
        }
        
        if (venderFerias) {
            const maxGozo = diasDireito - (diasDireito / 3);
            if (diasGozo > maxGozo) {
                diasGozo = maxGozo;
                inputDiasGozo.value = diasGozo;
                alert(`Para vender 1/3, os dias de gozo foram ajustados para o limite máximo permitido: ${diasGozo} dias.`);
            }
        } else {
             if (diasGozo > diasDireito) {
                 diasGozo = diasDireito;
                 inputDiasGozo.value = diasGozo;
             }
        }

        let abonoDias = venderFerias ? (diasDireito / 3) : 0;
        
        // CÁLCULOS
        const baseCalculoDia = (salario + medias) / 30;
        
        const valorFerias = baseCalculoDia * diasGozo;
        const valorTercoFerias = valorFerias / 3;
        
        const valorAbono = baseCalculoDia * abonoDias;
        const valorTercoAbono = valorAbono / 3;
        
        const totalProventosSemAbono = valorFerias + valorTercoFerias;
        const totalAbono = valorAbono + valorTercoAbono;
        
        const totalProventos = totalProventosSemAbono + totalAbono;

        // Descontos incidem apenas sobre férias normais
        const descontoINSS = calcularINSS(totalProventosSemAbono);

        // IRRF
        const deducaoDependentes = dependentes * VALOR_DEDUCAO_DEPENDENTE;
        const baseIRRF = totalProventosSemAbono - descontoINSS - deducaoDependentes;
        const descontoIRRF = calcularIRRF(totalProventosSemAbono, descontoINSS, deducaoDependentes);

        const totalDescontos = descontoINSS + descontoIRRF;
        const valorLiquido = totalProventos - totalDescontos;

        // Renderização
        const resultSection = document.getElementById('resultado-section');
        const resultDiv = document.getElementById('resultado-calculo');
        
        // Formata as porcentagens de forma simples
        const formatPerc = (val) => {
            if (val === 0) return '-';
            return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        }

        // Cálculo das Referências (Alíquotas) para o Holerite — derivadas da tabela compartilhada
        let refINSS = 'Isento';
        if (descontoINSS > 0 && totalProventosSemAbono > 0) {
            const baseInssLimitada = Math.min(totalProventosSemAbono, TETO_INSS);
            const faixaInss = TABELA_INSS.find(f => baseInssLimitada <= f.limite) || TABELA_INSS[TABELA_INSS.length - 1];
            const percInss = (faixaInss.aliquota * 100).toFixed(2).replace('.', ',');
            refINSS = totalProventosSemAbono >= TETO_INSS ? `Teto (${percInss}%)` : `${percInss}%`;
        }

        let refIRRF = 'Isento';
        if (descontoIRRF > 0) {
            const baseIRRFSimplificada = totalProventosSemAbono - DESCONTO_SIMPLIFICADO;
            const usouSimplificado = calcularIRRFTabela(baseIRRFSimplificada) < calcularIRRFTabela(baseIRRF);
            const baseUsada = usouSimplificado ? baseIRRFSimplificada : baseIRRF;
            const faixaIrrf = TABELA_IRRF.find(f => baseUsada <= f.base) || TABELA_IRRF[TABELA_IRRF.length - 1];
            refIRRF = `${(faixaIrrf.aliquota * 100).toFixed(2).replace('.', ',')}%`;
        }

        resultDiv.innerHTML = `
            <div class="holerite-container">
                <div class="holerite-header">
                    <h3 class="holerite-title">Recibo de Férias (Simulação)</h3>
                    <div class="holerite-info">
                        <span><strong>Avos:</strong> ${avos}/12</span>
                        <span><strong>Direito:</strong> ${diasDireito} dias</span>
                        <span><strong>Gozo:</strong> ${diasGozo} dias</span>
                        ${venderFerias ? `<span><strong>Abono:</strong> ${abonoDias} dias</span>` : ''}
                    </div>
                </div>
                
                <div class="holerite-table-wrapper">
                    <table class="holerite-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Referência</th>
                                <th class="col-value">Vencimentos</th>
                                <th class="col-value">Descontos</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Férias Normais</td>
                                <td class="col-ref">${diasGozo} dias</td>
                                <td class="col-value col-provento">${formatarMoeda(valorFerias)}</td>
                                <td class="col-value">-</td>
                            </tr>
                            <tr>
                                <td>1/3 Constitucional (Férias)</td>
                                <td class="col-ref">33,33%</td>
                                <td class="col-value col-provento">${formatarMoeda(valorTercoFerias)}</td>
                                <td class="col-value">-</td>
                            </tr>
                            ${venderFerias ? `
                            <tr>
                                <td>Abono Pecuniário</td>
                                <td class="col-ref">${abonoDias} dias</td>
                                <td class="col-value col-provento">${formatarMoeda(valorAbono)}</td>
                                <td class="col-value">-</td>
                            </tr>
                            <tr>
                                <td>1/3 Constitucional (Abono)</td>
                                <td class="col-ref">33,33%</td>
                                <td class="col-value col-provento">${formatarMoeda(valorTercoAbono)}</td>
                                <td class="col-value">-</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td>INSS</td>
                                <td class="col-ref">${refINSS}</td>
                                <td class="col-value">-</td>
                                <td class="col-value col-desconto">${formatarMoeda(descontoINSS)}</td>
                            </tr>
                            <tr>
                                <td>IRRF</td>
                                <td class="col-ref">${refIRRF}</td>
                                <td class="col-value">-</td>
                                <td class="col-value col-desconto">${formatarMoeda(descontoIRRF)}</td>
                            </tr>
                        </tbody>
                        <tfoot class="holerite-tfoot">
                            <tr>
                                <td colspan="2" style="text-align: right;">Totais:</td>
                                <td class="col-value col-provento">${formatarMoeda(totalProventos)}</td>
                                <td class="col-value col-desconto">${formatarMoeda(totalDescontos)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="holerite-summary">
                    <div class="summary-item">Base Salarial c/ Médias <strong>${formatarMoeda(salario + medias)}</strong></div>
                    <div class="summary-item">Base INSS <strong>${formatarMoeda(totalProventosSemAbono)}</strong></div>
                    <div class="summary-item">Base IRRF <strong>${formatarMoeda(baseIRRF)}</strong></div>
                    <div class="summary-item">Faltas <strong>${faltas}</strong></div>
                    <div class="summary-item">Dependentes <strong>${dependentes}</strong></div>
                </div>

                <div class="holerite-net">
                    <div class="net-label">Líquido a Receber</div>
                    <div class="net-value">${formatarMoeda(valorLiquido)}</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center;">
                <button onclick="window.print()" class="btn-action" style="background: var(--cor-texto-principal); color: var(--cor-card-bg);">
<svg class="lucide lucide-printer" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /> <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /> <rect x="6" y="14" width="12" height="8" rx="1" /> </svg> ️ Imprimir Simulação</button>
            </div>
        `;
        
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    });
});
