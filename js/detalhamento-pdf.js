/**
 * @module DetalhamentoPDF
 * @description Módulo dedicado exclusivamente à geração do Dossiê em PDF
 */

"use strict";

class GeradorDossiePDF {
    static gerarPDF(empresasComPendencia) {
        if (!empresasComPendencia || empresasComPendencia.length === 0) {
            alert("Boas notícias! Nenhuma das empresas importadas apresenta pendências detalháveis no momento.");
            return;
        }

        // NOVO: Trava de Segurança de Memória (Bloqueia lotes gigantes)
        let totalDebitos = 0;
        empresasComPendencia.forEach(emp => { if (emp.detalhes) totalDebitos += emp.detalhes.length; });
        
        if (totalDebitos > 150 || empresasComPendencia.length > 30) {
            alert("⚠️ Lote muito grande para PDF (Processo abortado para evitar travamento).\n\nO seu navegador não suporta gerar uma imagem tão grande. Por favor, utilize a opção '🟠 Detalhar Planilha' para processar este volume massivo de dados em Excel.");
            return;
        }

        const divDossie = document.createElement('div');
        divDossie.style.width = "100%";
        divDossie.style.fontFamily = "Inter, Arial, sans-serif";
        divDossie.style.color = "#1e293b";

        let html = `
            <div style="text-align: center; border-bottom: 2px solid #cbd5e1; margin-bottom: 20px; padding-bottom: 10px;">
                <h2 style="margin: 0; color: #b91c1c; font-size: 20px; text-transform: uppercase;">Relatório Analítico de Passivos Fiscais</h2>
            </div>
        `;

        empresasComPendencia.forEach(emp => {
            html += `
                <div style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; page-break-inside: avoid;">
                    <div style="background: #f8fafc; padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">
                        <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 14px; text-transform: uppercase;">${emp.nome}</h3>
                        <p style="margin: 0; font-size: 11px; color: #475569;">
                            <strong>CPF/CNPJ:</strong> ${emp.documento} 
                            <span style="color:#cbd5e1; margin: 0 8px;">|</span> 
                            <strong>Data Consulta Oficial:</strong> ${emp.dataConsulta}
                        </p>
                    </div>
                    <div style="padding: 0 15px 10px 15px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left; margin-top: 10px; table-layout: fixed;">
                            <thead>
                                <tr style="border-bottom: 2px solid #cbd5e1; color: #64748b; font-size: 9px; text-transform: uppercase;">
                                    <th style="padding: 8px 4px; width: 15%;">Categoria</th>
                                    <th style="padding: 8px 4px; width: 8%;">Comp.</th>
                                    <th style="padding: 8px 4px; width: 16%;">Cód/Processo</th>
                                    <th style="padding: 8px 4px; width: 22%;">Descrição</th>
                                    <th style="padding: 8px 4px; width: 8%;">Vcto</th>
                                    <th style="padding: 8px 4px; width: 11%;">Original</th>
                                    <th style="padding: 8px 4px; width: 11%;">Total</th>
                                    <th style="padding: 8px 4px; width: 9%; text-align: right;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            if (emp.detalhes && emp.detalhes.length > 0) {
                emp.detalhes.forEach(detalhe => {
                    const partes = detalhe.split(" ||| ");
                    let categoria = "Não Especificada";
                    let linhaRaw = detalhe;
                    if (partes.length > 1) {
                        categoria = partes[0];
                        linhaRaw = partes[1];
                    }
                    
                    // Reutiliza o motor perfeito do ficheiro Excel para extrair os dados
                    const extraido = GeradorDossieFiscal.parseLinhaDebito(linhaRaw);

                    let corBadge = "#fee2e2"; 
                    let corTextoBadge = "#991b1b"; 
                    if (extraido.situacao.includes("ATIVA")) { corBadge = "#ffedd5"; corTextoBadge = "#9a3412"; } 
                    else if (extraido.situacao.includes("SUSPENSO")) { corBadge = "#fef9c3"; corTextoBadge = "#854d0e"; }

                    html += `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 4px; color: #475569; word-wrap: break-word; font-size: 9px;">${categoria}</td>
                            <td style="padding: 8px 4px; color: #475569;">${extraido.pa}</td>
                            <td style="padding: 8px 4px; color: #334155; font-weight: 600; word-wrap: break-word;">${extraido.codigo}</td>
                            <td style="padding: 8px 4px; color: #475569; word-wrap: break-word;">${extraido.descricao}</td>
                            <td style="padding: 8px 4px; color: #475569;">${extraido.vcto}</td>
                            <td style="padding: 8px 4px; color: #475569;">${extraido.valorOriginal}</td>
                            <td style="padding: 8px 4px; color: #b91c1c; font-weight: 700;">${extraido.valorTotal}</td>
                            <td style="padding: 8px 4px; text-align: right;">
                                <span style="background: ${corBadge}; color: ${corTextoBadge}; padding: 3px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; text-transform: uppercase;">${extraido.situacao.substring(0, 15)}</span>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html += `
                                <tr>
                                    <td colspan="8" style="padding: 12px 4px; color: #b91c1c; font-weight: 500; text-align: center; background: #fef2f2;">
                                        Aviso: Quadro financeiro detalhado ausente no documento.
                                    </td>
                                </tr>
                `;
            }

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        divDossie.innerHTML = html;

        const opcoes = {
            margin: [10, 10, 10, 10], 
            filename: 'Relatorio_Analitico_Passivos.pdf',
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opcoes).from(divDossie).save();
    }
}