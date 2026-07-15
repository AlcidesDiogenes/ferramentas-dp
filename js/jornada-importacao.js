/**
 * @module GestaoJornada - Importação
 * @description Leitura estruturada do mapa Excel, sanitização e renderização no DOM com CSS modular.
 */

"use strict";

document.addEventListener('DOMContentLoaded', () => {
    const inputUpload = document.getElementById('ponto-upload');
    const infoColaborador = document.getElementById('info-colaborador');
    const lblNome = document.getElementById('lbl-nome');
    const lblComp = document.getElementById('lbl-comp');
    const lblCargaSemanal = document.getElementById('lbl-carga-semanal');
    const lblCargaMensal = document.getElementById('lbl-carga-mensal');
    
    const secaoPonto = document.getElementById('secao-ponto');
    const corpoTabela = document.getElementById('corpo-tabela-ponto');
    const corpoEscala = document.getElementById('corpo-escala-reconhecida'); // Captura a nova tabela do HTML

    // Utilitário de conversão segura para horários extraídos do Excel
    function sanitizarHoraExcel(val) {
        if (val === undefined || val === null || val === "") return "";
        
        if (typeof val === 'number') {
            let totalMinutos = Math.round(val * 24 * 60);
            let h = Math.floor(totalMinutos / 60); 
            let m = totalMinutos % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        
        let str = String(val).trim();
        let match = str.match(/(\d{1,3}):(\d{2})/);
        if (match) {
            return `${String(match[1]).padStart(2, '0')}:${match[2]}`;
        }
        
        return "";
    }

    if(inputUpload) {
        inputUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: false });

                // 1. Cabeçalho
                const nome = rows[12] && rows[12][1] ? rows[12][1] : "Não identificado";
                const mes = rows[13] && rows[13][1] ? String(rows[13][1]).padStart(2, '0') : "01";
                const ano = rows[14] && rows[14][1] ? rows[14][1] : new Date().getFullYear();

                // 2. Totais da Escala Padrão
                const cargaSemanal = rows[9] && rows[9][5] ? sanitizarHoraExcel(rows[9][5]) : "00:00";
                const cargaMensal = rows[10] && rows[10][5] ? sanitizarHoraExcel(rows[10][5]) : "00:00";

                lblNome.textContent = nome;
                lblComp.textContent = `${mes}/${ano}`;
                lblCargaSemanal.textContent = `${cargaSemanal} Semanal`;
                lblCargaMensal.textContent = `${cargaMensal} Mensal`;
                infoColaborador.style.display = 'block';

                // 3. Memória da Escala da Jornada Semanal
                const escalaJornada = {};
                const mapDias = [1, 2, 3, 4, 5, 6, 0]; 
                
                for(let i = 0; i <= 6; i++) {
                    let r = rows[2 + i];
                    if(r) {
                        escalaJornada[mapDias[i]] = {
                            e1: sanitizarHoraExcel(r[1]), 
                            s1: sanitizarHoraExcel(r[2]), 
                            e2: sanitizarHoraExcel(r[3]), 
                            s2: sanitizarHoraExcel(r[4])  
                        };
                    }
                }
                
                window.escalaColaborador = escalaJornada;

                // 3.5 RENDERIZA A ESCALA RECONHECIDA NA TELA (O Ajuste que faltava)
                if (corpoEscala) {
                    let htmlEscala = '';
                    const nomesDias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                    const ordemDias = [1, 2, 3, 4, 5, 6, 0]; 
                    
                    ordemDias.forEach(diaIndex => {
                        const esc = escalaJornada[diaIndex];
                        if (esc) {
                            const isFolga = !esc.e1 && !esc.s1 && !esc.e2 && !esc.s2;
                            if (isFolga) {
                                htmlEscala += `<tr>
                                    <td><strong>${nomesDias[diaIndex]}</strong></td>
                                    <td colspan="4" class="jornada-text-secondary" style="text-align: center; background-color: var(--cor-fundo-app);">Folga / Sem Escala</td>
                                </tr>`;
                            } else {
                                htmlEscala += `<tr>
                                    <td><strong>${nomesDias[diaIndex]}</strong></td>
                                    <td>${esc.e1 || '--:--'}</td>
                                    <td>${esc.s1 || '--:--'}</td>
                                    <td>${esc.e2 || '--:--'}</td>
                                    <td>${esc.s2 || '--:--'}</td>
                                </tr>`;
                            }
                        }
                    });
                    corpoEscala.innerHTML = htmlEscala;
                }

                // 4. Extração da Tabela de Lançamentos
                let html = '';
                for (let i = 17; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || !row[0] || String(row[0]).toLowerCase().includes('total')) break;

                    const diaNum = i - 16; 
                    const diaSemanaText = row[1] ? String(row[1]).split('-')[0] : ""; 
                    
                    const dataAtual = new Date(ano, mes - 1, diaNum);
                    const diaSemanaIndex = dataAtual.getDay();
                    
                    const isFimDeSemana = diaSemanaIndex === 0 || diaSemanaIndex === 6;
                    const bgClass = isFimDeSemana ? 'style="background-color: var(--cor-fundo-app);"' : '';

                    const e1 = sanitizarHoraExcel(row[2]);
                    const s1 = sanitizarHoraExcel(row[3]);
                    const e2 = sanitizarHoraExcel(row[4]);
                    const s2 = sanitizarHoraExcel(row[5]);

                    html += `<tr ${bgClass} class="linha-ponto" data-dia-semana="${diaSemanaIndex}">
                        <td style="text-align: center;">
                            <strong>${String(diaNum).padStart(2, '0')}</strong> 
                            <span class="jornada-text-secondary" style="font-size:0.85em; display:block; text-transform: capitalize;">${diaSemanaText.substring(0,3)}</span>
                        </td>
                        <td><input type="time" class="form-control e1" value="${e1}"></td>
                        <td><input type="time" class="form-control s1" value="${s1}"></td>
                        <td><input type="time" class="form-control e2" value="${e2}"></td>
                        <td><input type="time" class="form-control s2" value="${s2}"></td>
                        <td class="res-trab" style="font-weight: 600;">00:00</td>
                        <td class="res-extra color-extra" style="font-weight: 600;">00:00</td>
                        <td class="res-noturno color-noturno" style="font-weight: 600;">00:00</td>
                        <td class="res-ficta color-ficta" style="font-weight: 600;">00:00</td>
                        <td class="res-atraso color-atraso" style="font-weight: 600;">00:00</td>
                    </tr>`;
                }
                
                corpoTabela.innerHTML = html;
                secaoPonto.style.display = 'block';
                inputUpload.value = '';

                document.dispatchEvent(new Event('pontoImportado'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
});