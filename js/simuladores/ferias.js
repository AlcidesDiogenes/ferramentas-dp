function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Tabelas 2024 para simplificação
function calcularINSS(salarioBruto) {
    let inss = 0;
    
    if (salarioBruto <= 1412.00) {
        inss = salarioBruto * 0.075;
    } else if (salarioBruto <= 2666.68) {
        inss = (1412.00 * 0.075) + ((salarioBruto - 1412.00) * 0.09);
    } else if (salarioBruto <= 4000.03) {
        inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((salarioBruto - 2666.68) * 0.12);
    } else if (salarioBruto <= 7786.02) {
        inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((salarioBruto - 4000.03) * 0.14);
    } else {
        inss = 908.85; // Teto INSS 2024
    }

    return inss;
}

function calcularIRRF(baseCalculo) {
    let irrf = 0;

    // Desconto simplificado de 528.00 ou dedução legal - usar dedução legal para simulação exata
    // Vamos usar a tabela progressiva padrão 2024
    if (baseCalculo <= 2259.20) {
        irrf = 0;
    } else if (baseCalculo <= 2826.65) {
        irrf = (baseCalculo * 0.075) - 169.44;
    } else if (baseCalculo <= 3751.05) {
        irrf = (baseCalculo * 0.15) - 381.44;
    } else if (baseCalculo <= 4664.68) {
        irrf = (baseCalculo * 0.225) - 662.77;
    } else {
        irrf = (baseCalculo * 0.275) - 896.00;
    }

    // Compara com desconto simplificado de 528 (Lei 14.663/2023)
    let baseCalculoSimplificada = baseCalculo + (calcularDeducao(baseCalculo)) - 528.00;
    let irrfSimplificado = 0;
    if (baseCalculoSimplificada <= 2259.20) {
        irrfSimplificado = 0;
    } else if (baseCalculoSimplificada <= 2826.65) {
        irrfSimplificado = (baseCalculoSimplificada * 0.075) - 169.44;
    } else if (baseCalculoSimplificada <= 3751.05) {
        irrfSimplificado = (baseCalculoSimplificada * 0.15) - 381.44;
    } else if (baseCalculoSimplificada <= 4664.68) {
        irrfSimplificado = (baseCalculoSimplificada * 0.225) - 662.77;
    } else {
        irrfSimplificado = (baseCalculoSimplificada * 0.275) - 896.00;
    }

    return Math.max(0, Math.min(irrf, irrfSimplificado));
}

function calcularDeducao(base) {
   return 0; // Dummy
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
        const deducaoDependentes = dependentes * 189.59;
        
        // Vamos aplicar a regra simples ou progressiva no IRRF (usando a tabela progressiva com opção do desconto simplificado de R$528,00)
        const baseIRRF = totalProventosSemAbono - descontoINSS - deducaoDependentes;
        const baseIRRFSimplificada = totalProventosSemAbono - 528.00; // Desconto simplificado legal 
        
        let valorIRRF_Tradicional = 0;
        if (baseIRRF > 2259.20 && baseIRRF <= 2826.65) valorIRRF_Tradicional = (baseIRRF * 0.075) - 169.44;
        else if (baseIRRF > 2826.65 && baseIRRF <= 3751.05) valorIRRF_Tradicional = (baseIRRF * 0.15) - 381.44;
        else if (baseIRRF > 3751.05 && baseIRRF <= 4664.68) valorIRRF_Tradicional = (baseIRRF * 0.225) - 662.77;
        else if (baseIRRF > 4664.68) valorIRRF_Tradicional = (baseIRRF * 0.275) - 896.00;
        valorIRRF_Tradicional = Math.max(0, valorIRRF_Tradicional);

        let valorIRRF_Simplificado = 0;
        if (baseIRRFSimplificada > 2259.20 && baseIRRFSimplificada <= 2826.65) valorIRRF_Simplificado = (baseIRRFSimplificada * 0.075) - 169.44;
        else if (baseIRRFSimplificada > 2826.65 && baseIRRFSimplificada <= 3751.05) valorIRRF_Simplificado = (baseIRRFSimplificada * 0.15) - 381.44;
        else if (baseIRRFSimplificada > 3751.05 && baseIRRFSimplificada <= 4664.68) valorIRRF_Simplificado = (baseIRRFSimplificada * 0.225) - 662.77;
        else if (baseIRRFSimplificada > 4664.68) valorIRRF_Simplificado = (baseIRRFSimplificada * 0.275) - 896.00;
        valorIRRF_Simplificado = Math.max(0, valorIRRF_Simplificado);

        // A lei diz que o sistema deve usar a dedução que for mais benéfica
        const descontoIRRF = Math.min(valorIRRF_Tradicional, valorIRRF_Simplificado);

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

        // Cálculo das Referências (Alíquotas) para o Holerite
        let refINSS = 'Isento';
        if (descontoINSS > 0 && totalProventosSemAbono > 0) {
            if (totalProventosSemAbono <= 1412.00) {
                refINSS = '7,50%';
            } else if (totalProventosSemAbono <= 2666.68) {
                refINSS = '9,00%';
            } else if (totalProventosSemAbono <= 4000.03) {
                refINSS = '12,00%';
            } else if (totalProventosSemAbono <= 7786.02) {
                refINSS = '14,00%';
            } else {
                refINSS = 'Teto (14,00%)';
            }
        }

        let refIRRF = 'Isento';
        if (descontoIRRF > 0) {
            let aliqFaixa = 0;
            const baseUsada = (valorIRRF_Simplificado < valorIRRF_Tradicional && valorIRRF_Simplificado > 0) 
                ? baseIRRFSimplificada 
                : baseIRRF;

            if (baseUsada > 4664.68) aliqFaixa = 27.5;
            else if (baseUsada > 3751.05) aliqFaixa = 22.5;
            else if (baseUsada > 2826.65) aliqFaixa = 15.0;
            else if (baseUsada > 2259.20) aliqFaixa = 7.5;

            refIRRF = `${aliqFaixa.toFixed(2).replace('.', ',')}%`;
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
