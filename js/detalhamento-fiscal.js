/**
 * @module DetalhamentoFiscal
 * @description Módulo dedicado à geração do Dossiê Detalhado de Passivos Fiscais (Com Isolamento de Processo)
 */

"use strict";

class GeradorDossieFiscal {
    
    static gerar(empresasComPendencia) {
        if (!empresasComPendencia || empresasComPendencia.length === 0) {
            alert("Boas notícias! Nenhuma das empresas importadas apresenta pendências detalháveis no momento.");
            return;
        }

        const dadosParaPlanilha = [];

        empresasComPendencia.forEach(emp => {
            if (emp.detalhes && emp.detalhes.length > 0) {
                emp.detalhes.forEach(detalhe => {
                    const partes = detalhe.split(" ||| ");
                    let categoria = "Débitos Diversos / Não Especificado";
                    let linhaRaw = detalhe;
                    
                    if (partes.length > 1) {
                        categoria = partes[0];
                        linhaRaw = partes[1];
                    }

                    const extraido = this.parseLinhaDebito(linhaRaw);

                    dadosParaPlanilha.push({
                        'CPF/CNPJ': emp.documento,
                        'Empresa': emp.nome,
                        'Categoria da Pendência': categoria,
                        'Competência': extraido.pa,
                        'Código / Processo': extraido.codigo,
                        'Descrição do Débito': extraido.descricao,
                        'Vencimento': extraido.vcto,
                        'Valor Original': extraido.valorOriginal,
                        'Valor Total': extraido.valorTotal,
                        'Status': extraido.situacao,
                        'Data da Consulta': emp.dataConsulta
                    });
                });
            } else {
                dadosParaPlanilha.push({
                    'CPF/CNPJ': emp.documento,
                    'Empresa': emp.nome,
                    'Categoria da Pendência': '-',
                    'Competência': '-',
                    'Código / Processo': '-',
                    'Descrição do Débito': '⚠️ AVISO: Quadro financeiro detalhado ausente no documento principal.',
                    'Vencimento': '-',
                    'Valor Original': '-',
                    'Valor Total': '-',
                    'Status': 'PENDENTE',
                    'Data da Consulta': emp.dataConsulta
                });
            }
        });

        if (typeof XLSX === 'undefined') {
            alert("Erro de sistema: A biblioteca do Excel (XLSX) não foi carregada na página.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(dadosParaPlanilha);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dossiê de Passivos");

        ws['!cols'] = [
            {wch: 20}, {wch: 40}, {wch: 45}, {wch: 15}, {wch: 25}, 
            {wch: 45}, {wch: 15}, {wch: 18}, {wch: 18}, {wch: 25}, {wch: 22}
        ];

        XLSX.writeFile(wb, "Dossie_Analitico_Passivos_Fiscais.xlsx");
    }

    static parseLinhaDebito(linhaRaw) {
        let texto = linhaRaw.replace(/[\|☐]/g, ' ').replace(/\s{2,}/g, ' ').trim();

        // 1. Extrair Situação
        let situacao = "PENDENTE";
        const regexSit = /(DEVEDOR|ATIVA AJUIZADA|ATIVA EM COBRANCA|ATIVA NAO AJUIZAVEL|PARCELAMENTO RESCINDIDO|SUSPENSO-JULGAMENTO)/i;
        const matchSit = texto.match(regexSit);
        if (matchSit) {
            situacao = matchSit[1].toUpperCase();
            texto = texto.replace(matchSit[0], ''); 
        } else if (texto.toUpperCase().includes('DEVEDOR')) {
            situacao = "DEVEDOR";
            texto = texto.replace(/DEVEDOR/ig, '');
        }

        // 2. Isolamento do Número do Processo (Correção do Bug do Falso Positivo em Datas)
        let codigoProcesso = "-";
        // Padrão PGFN longo (ex: 30.2.16.000447-68 ou 10469.501.506/2005-19)
        const regexProcesso = /([\d\.\/]{10,}-\d{2})/;
        const matchProcesso = texto.match(regexProcesso);
        if (matchProcesso && matchProcesso[1].includes('.')) {
            codigoProcesso = matchProcesso[1];
            // Remove o processo do texto temporariamente para que o extrator de datas não o confunda
            texto = texto.replace(codigoProcesso, '{{PROCESSO}}'); 
        }

        // 3. Extrair Vencimento com Trava Estrita de Calendário (\b)
        let vcto = "-";
        const regexVcto = /\b(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}\b/;
        const matchVcto = texto.match(regexVcto);
        if (matchVcto) {
            vcto = matchVcto[0];
            texto = texto.replace(matchVcto[0], '');
        }

        // 4. Extrair Competência com Trava do Mês de 01 a 12 (Previne 51/2015, 98/2019)
        let pa = "-";
        const regexPa = /\b(0[1-9]|1[0-2])\/\d{4}\b/;
        const matchPa = texto.match(regexPa);
        if (matchPa) {
            pa = matchPa[0];
            texto = texto.replace(matchPa[0], '');
        }

        // 5. Extrair Valores Financeiros
        const regexValor = /\d{1,3}(?:\.\d{3})*,\d{1,2}/g;
        let valoresEncontrados = texto.match(regexValor) || [];
        
        let valorOriginal = "-";
        let valorTotal = "-";
        
        if (valoresEncontrados.length > 0) {
            valorOriginal = valoresEncontrados[0]; 
            valorTotal = valoresEncontrados[valoresEncontrados.length - 1]; 
            
            valoresEncontrados.forEach(v => {
                texto = texto.replace(v, '');
            });
        }

        // 6. Devolve o processo ao texto para ser limpo
        texto = texto.replace('{{PROCESSO}}', codigoProcesso !== "-" ? codigoProcesso : "");

        let tributoBruto = texto
            .replace(/CNPJ:.*?\d+\s*/i, '') 
            .replace(/.*?LTDA/i, '')        
            .replace(/^[-\s]+/, '')         
            .replace(/[-\s]+$/, '')         
            .replace(/\s{2,}/g, ' ')
            .trim();

        if (tributoBruto.length === 0) tributoBruto = "Débito / Processo Identificado";

        let codigo = "-";
        let descricao = tributoBruto;

        const matchReceita = tributoBruto.match(/^(\d{4}-\d{2})[\s\-]+(.*)/);
        
        if (matchReceita) {
            codigo = matchReceita[1];
            descricao = matchReceita[2];
        } else {
            const matchProcessoFinal = tributoBruto.match(/^([\d\.\/]{10,}-\d{2})[\s\-]*(.*)/);
            if (matchProcessoFinal) {
                codigo = matchProcessoFinal[1];
                descricao = matchProcessoFinal[2].trim() || "Dívida Ativa da União";
            } else if (codigoProcesso !== "-") {
                codigo = codigoProcesso;
                descricao = tributoBruto.replace(codigoProcesso, '').replace(/^[-\s]+/, '').trim() || "Dívida Ativa da União";
            }
        }

        descricao = descricao.replace(/^[-\s]+/, '').trim();

        return {
            codigo: codigo,
            descricao: descricao,
            pa: pa,
            vcto: vcto,
            valorOriginal: valorOriginal !== '-' ? 'R$ ' + valorOriginal : '-',
            valorTotal: valorTotal !== '-' ? 'R$ ' + valorTotal : '-',
            situacao: situacao
        };
    }
}