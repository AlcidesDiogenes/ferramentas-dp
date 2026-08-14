/**
 * Ferramentas DP - Gerenciador Universal de Upload de Arquivos
 * Proporciona experiência moderna de Drag & Drop, pré-visualização, progresso e validação em todos os módulos.
 * Permite tanto arrastar arquivos quanto selecionar via clique/janela de arquivos.
 */

"use strict";

class FileUploaderHelper {
    constructor() {
        this.initializedZones = new WeakSet();
        this.initGlobalEvents();
        this.initAllZones();
    }

    /**
     * Evita que o navegador abra o arquivo caso o usuário solte o arquivo fora da área delimitada.
     */
    initGlobalEvents() {
        window.addEventListener("dragover", (e) => e.preventDefault(), false);
        window.addEventListener("drop", (e) => e.preventDefault(), false);
    }

    /**
     * Formata bytes para tamanhos legíveis (ex: 1.2 MB)
     */
    formatBytes(bytes, decimals = 1) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Retorna um ícone e cor condizente com a extensão do arquivo
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['xlsx', 'xls', 'csv'].includes(ext)) {
            return { icon: '<svg class="lucide lucide-bar-chart-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 21v-6" /> <path d="M12 21V3" /> <path d="M19 21V9" /> </svg> ', color: '#16a34a', bg: '#dcfce7', label: 'Planilha Excel' };
        }
        if (ext === 'pdf') {
            return { icon: '<svg class="lucide lucide-circle-dot" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="1" /> </svg> ', color: '#dc2626', bg: '#fee2e2', label: 'Documento PDF' };
        }
        if (ext === 'xml') {
            return { icon: '<svg class="lucide lucide-zap" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" /> </svg> ', color: '#0284c7', bg: '#e0f2fe', label: 'Arquivo XML' };
        }
        return { icon: '<svg class="lucide lucide-file-text" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" /> </svg> ', color: '#475569', bg: '#f1f5f9', label: 'Arquivo' };
    }

    /**
     * Extrai extensões permitidas da tag accept (ex: ".xls,.xlsx,.csv")
     */
    getAcceptedExtensions(input) {
        const acceptAttr = input.getAttribute('accept') || input.parentElement?.getAttribute('data-accept') || '';
        if (!acceptAttr) return [];
        return acceptAttr
            .split(',')
            .map(ext => ext.trim().toLowerCase())
            .filter(ext => ext.length > 0);
    }

    /**
     * Valida se o arquivo possui uma extensão permitida
     */
    validateFiles(files, acceptedExts) {
        if (!acceptedExts || acceptedExts.length === 0) return true;
        for (let file of files) {
            const fileNameLower = file.name.toLowerCase();
            const matches = acceptedExts.some(ext => {
                if (ext.startsWith('.')) return fileNameLower.endsWith(ext);
                return fileNameLower.includes(ext.replace('*', ''));
            });
            if (!matches) return false;
        }
        return true;
    }

    /**
     * Constrói e inicializa todas as zonas de upload na página atual
     */
    initAllZones() {
        const zones = document.querySelectorAll('.upload-zone');
        zones.forEach(zone => this.setupZone(zone));
    }

    /**
     * Configura uma zona de upload individual
     */
    setupZone(zone) {
        if (this.initializedZones.has(zone)) return;
        this.initializedZones.add(zone);

        const input = zone.querySelector('input[type="file"]');
        if (!input) return;

        // Garante ID único no input
        if (!input.id) {
            input.id = 'upload-input-' + Math.random().toString(36).substring(2, 9);
        }

        const isMultiple = input.hasAttribute('multiple') || zone.getAttribute('data-multiple') === 'true';
        const acceptedExts = this.getAcceptedExtensions(input);

        // Renderiza estrutura interna visual
        this.renderInitialUI(zone, input, acceptedExts, isMultiple);

        // Clique na zona abre o seletor nativo de arquivos
        zone.addEventListener('click', (e) => {
            // Se o clique veio diretamente do input nativo, deixa agir naturalmente
            if (e.target === input) return;

            // Se o clique veio do botão de remover/alterar, ignora
            if (e.target.closest('.uploader-btn-remove')) return;

            // Se o clique veio de um label associado ao input ou de dentro dele, o próprio navegador já vai disparar o clique no input.
            // Para evitar clique duplo, não chamamos input.click() se o clique veio do label associado.
            const label = e.target.closest('label');
            if (label && (label.getAttribute('for') === input.id || label.contains(input))) {
                return;
            }

            // Abre janela de seleção de arquivos do sistema
            input.click();
        }, false);

        // Event listeners para Drag & Drop
        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'dragend'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.remove('drag-active');
            }, false);
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('drag-active');

            const droppedFiles = e.dataTransfer?.files;
            if (droppedFiles && droppedFiles.length > 0) {
                this.handleFiles(zone, input, droppedFiles, acceptedExts, isMultiple, true);
            }
        }, false);

        // Listener nativo do clique/mudança no input
        input.addEventListener('change', (e) => {
            if (input.files && input.files.length > 0) {
                this.handleFiles(zone, input, input.files, acceptedExts, isMultiple, false);
            } else {
                this.resetZoneUI(zone, input, acceptedExts, isMultiple, false);
            }
        });
    }

    /**
     * Renderiza o layout inicial limpo na zona
     */
    renderInitialUI(zone, input, acceptedExts, isMultiple) {
        input.classList.add('input-file-hidden');

        const titleText = zone.getAttribute('data-title') || (isMultiple ? 'Arraste e solte seus arquivos aqui' : 'Arraste e solte seu arquivo aqui');
        const descText = zone.getAttribute('data-desc') || (isMultiple ? 'Suporta múltiplos arquivos simultâneos para processamento em lote' : 'Ou selecione do seu computador para iniciar o processamento');
        
        let iconSymbol = '<svg class="lucide lucide-cloud" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /> </svg> ';
        if (acceptedExts.some(e => e.includes('pdf'))) iconSymbol = '<svg class="lucide lucide-circle-dot" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <circle cx="12" cy="12" r="1" /> </svg> ';
        else if (acceptedExts.some(e => e.includes('xls') || e.includes('csv'))) iconSymbol = '<svg class="lucide lucide-bar-chart-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 21v-6" /> <path d="M12 21V3" /> <path d="M19 21V9" /> </svg> ';
        else if (acceptedExts.some(e => e.includes('xml'))) iconSymbol = '<svg class="lucide lucide-zap" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" /> </svg> ';

        const badgesHtml = acceptedExts.length > 0 
            ? `<div class="uploader-badges">${acceptedExts.map(ext => `<span class="uploader-badge">${ext.toUpperCase().replace('.', '')}</span>`).join('')}</div>` 
            : '';

        const uploaderContent = document.createElement('div');
        uploaderContent.className = 'uploader-content';
        uploaderContent.id = `uploader-content-${input.id}`;
        uploaderContent.innerHTML = `
            <div class="uploader-icon-box">${iconSymbol}</div>
            <p class="uploader-title">${titleText}</p>
            <p class="uploader-subtitle">${descText}</p>
            ${badgesHtml}
            <label for="${input.id}" class="uploader-btn-trigger">
<svg class="lucide lucide-folder" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /> </svg> Escolher Arquivo${isMultiple ? 's' : ''}</label>
        `;

        Array.from(zone.children).forEach(child => {
            if (child !== input) {
                child.remove();
            }
        });

        zone.appendChild(uploaderContent);
    }

    /**
     * Processa os arquivos selecionados ou soltos na zona
     */
    handleFiles(zone, input, fileList, acceptedExts, isMultiple, updateInput = true) {
        const filesArray = Array.from(fileList);

        if (!this.validateFiles(filesArray, acceptedExts)) {
            const mensagem = `Formato de arquivo inválido. Formatos permitidos: ${acceptedExts.join(', ')}`;
            if (window.showToast) {
                window.showToast(mensagem, "warning");
            } else {
                alert(mensagem);
            }
            this.resetZoneUI(zone, input, acceptedExts, isMultiple, false);
            return;
        }

        let finalFiles = filesArray;
        if (!isMultiple && filesArray.length > 1) {
            finalFiles = [filesArray[0]];
        }

        if (updateInput) {
            try {
                const dt = new DataTransfer();
                finalFiles.forEach(f => dt.items.add(f));
                input.files = dt.files;
            } catch (e) {
                console.warn("Navegador não suporta DataTransfer:", e);
            }
        }

        this.renderFileCardUI(zone, input, finalFiles, isMultiple, acceptedExts);

        if (updateInput) {
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Renderiza o Card do Arquivo Selecionado
     */
    renderFileCardUI(zone, input, files, isMultiple, acceptedExts) {
        const uploaderContent = zone.querySelector('.uploader-content');
        if (uploaderContent) uploaderContent.style.display = 'none';

        const oldCard = zone.querySelector('.uploader-file-card');
        if (oldCard) oldCard.remove();

        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const firstFile = files[0];
        const iconInfo = this.getFileIcon(firstFile.name);

        const card = document.createElement('div');
        card.className = 'uploader-file-card';

        let filesDetailHtml = '';
        if (files.length === 1) {
            filesDetailHtml = `
                <div class="uploader-file-header">
                    <div class="uploader-file-icon" style="background-color: ${iconInfo.bg};">${iconInfo.icon}</div>
                    <div class="uploader-file-details">
                        <div class="uploader-file-name" title="${firstFile.name}">${firstFile.name}</div>
                        <div class="uploader-file-meta">
                            <span>${this.formatBytes(firstFile.size)}</span> • 
                            <span class="uploader-status-pill success">
<svg class="lucide lucide-check-circle-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" /> </svg> Pronto para Processamento</span>
                        </div>
                    </div>
                    <div class="uploader-file-actions">
                        <button type="button" class="uploader-btn-remove" title="Remover e escolher outro arquivo">
                            
<svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> </svg> ️ Alterar
                        </button>
                    </div>
                </div>
            `;
        } else {
            const multiListItems = files.map(f => `
                <div class="uploader-multi-item">
                    <span class="uploader-multi-item-name" title="${f.name}">
<svg class="lucide lucide-file-text" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" /> </svg> ${f.name}</span>
                    <span class="uploader-multi-item-size">${this.formatBytes(f.size)}</span>
                </div>
            `).join('');

            filesDetailHtml = `
                <div class="uploader-file-header">
                    <div class="uploader-file-icon" style="background-color: ${iconInfo.bg};">${iconInfo.icon}</div>
                    <div class="uploader-file-details">
                        <div class="uploader-file-name">${files.length} Arquivos Selecionados</div>
                        <div class="uploader-file-meta">
                            <span>Total: ${this.formatBytes(totalSize)}</span> • 
                            <span class="uploader-status-pill success">
<svg class="lucide lucide-check-circle-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" /> </svg> Carregados</span>
                        </div>
                    </div>
                    <div class="uploader-file-actions">
                        <button type="button" class="uploader-btn-remove" title="Remover arquivos">
                            
<svg class="lucide lucide-trash-2" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /> </svg> ️ Limpar Todos
                        </button>
                    </div>
                </div>
                <div class="uploader-multi-list">
                    ${multiListItems}
                </div>
            `;
        }

        const progressBarHtml = `
            <div class="uploader-progress-bar-bg">
                <div class="uploader-progress-bar-fill" style="width: 100%;"></div>
            </div>
        `;

        card.innerHTML = filesDetailHtml + progressBarHtml;

        const btnRemove = card.querySelector('.uploader-btn-remove');
        if (btnRemove) {
            btnRemove.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.resetZoneUI(zone, input, acceptedExts, isMultiple, true);
                setTimeout(() => {
                    input.click();
                }, 50);
            });
        }

        zone.appendChild(card);
    }

    /**
     * Reseta a zona para o estado inicial
     */
    resetZoneUI(zone, input, acceptedExts, isMultiple, triggerChangeEvent = true) {
        input.value = '';
        
        const card = zone.querySelector('.uploader-file-card');
        if (card) card.remove();

        const uploaderContent = zone.querySelector('.uploader-content');
        if (uploaderContent) {
            uploaderContent.style.display = 'flex';
        } else {
            this.renderInitialUI(zone, input, acceptedExts, isMultiple);
        }

        if (triggerChangeEvent) {
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

// Inicialização Autônoma
let globalUploaderHelperInstance = null;

function initUploaderHelper() {
    if (!globalUploaderHelperInstance) {
        globalUploaderHelperInstance = new FileUploaderHelper();
    } else {
        globalUploaderHelperInstance.initAllZones();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUploaderHelper);
} else {
    initUploaderHelper();
}

window.initUploaderHelper = initUploaderHelper;
