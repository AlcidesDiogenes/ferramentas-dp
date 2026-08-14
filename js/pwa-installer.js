// js/pwa-installer.js
/**
 * Gerenciador de Instalação PWA e Conectividade Offline
 * Controla o registro do Service Worker, escuta eventos de instalação (beforeinstallprompt)
 * e fornece botões e alertas visuais de conectividade.
 */

(function () {
    let deferredPrompt = null;
    let isAppInstalled = false;

    // 1. Registro do Service Worker
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                // Descobre a raiz do projeto para apontar corretamente para /sw.js
                const swPath = '/sw.js';
                navigator.serviceWorker.register(swPath)
                    .then((reg) => {
                        console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
                        
                        // Verifica se há atualização do Service Worker
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        if (window.showToast) {
                                            window.showToast("Nova versão disponível! Recarregue a página para atualizar.", "info", 4000, `<svg class="lucide lucide-zap" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" /> </svg> Atualização PWA`);
                                        }
                                    }
                                });
                            }
                        });
                    })
                    .catch((err) => {
                        console.warn('[PWA] Falha ao registrar Service Worker:', err);
                    });
            });
        }
    }

    // 2. Detecção de status Standalone / Instalado
    function checkStandaloneMode() {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            isAppInstalled = true;
            document.body.classList.add('pwa-standalone');
        }
    }

    // 3. Captura do Evento de Instalação (beforeinstallprompt)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Previne o banner padrão do navegador para usar nosso botão customizado
        e.preventDefault();
        deferredPrompt = e;
        
        // Notifica e exibe botões de instalação
        updatePWAInstallButtons(true);

        // Notificação de boas-vindas para instalação
        if (window.showToast && !localStorage.getItem('pwaPromptShown')) {
            setTimeout(() => {
                window.showToast("Você pode instalar o Ferramentas DP no seu computador ou celular para acesso rápido e offline!", "success", 5000, `<svg class="lucide lucide-smartphone" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" /> </svg> Instalar PWA`);
                localStorage.setItem('pwaPromptShown', 'true');
            }, 3000);
        }
    });

    // 4. Executa o Prompt de Instalação
    async function promptInstall() {
        if (!deferredPrompt) {
            if (isAppInstalled) {
                if (window.showToast) {
                    window.showToast("O Ferramentas DP já está instalado e rodando em modo aplicativo!", "info", 3000, `<svg class="lucide lucide-smartphone" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" /> </svg> App Instalado`);
                }
            } else {
                if (window.showToast) {
                    window.showToast("Para instalar o aplicativo no seu dispositivo, acesse pelo menu do navegador e selecione 'Instalar Ferramentas DP' ou 'Adicionar à Tela Inicial'.", "info", 5000, `<svg class="lucide lucide-smartphone" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" /> </svg> Dica de Instalação`);
                }
            }
            return;
        }

        // Exibe o prompt nativo
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] Usuário respondeu ao prompt de instalação: ${outcome}`);

        if (outcome === 'accepted') {
            if (window.showToast) {
                window.showToast("Obrigado por instalar o Ferramentas DP! Agora você pode acessá-lo direto da sua área de trabalho.", "success", 4000, `<svg class="lucide lucide-party-popper" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5.8 11.3 2 22l10.7-3.79" /> <path d="M4 3h.01" /> <path d="M22 8h.01" /> <path d="M15 2h.01" /> <path d="M22 20h.01" /> <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /> <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /> <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /> <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" /> </svg> Sucesso!`);
            }
        }

        deferredPrompt = null;
        updatePWAInstallButtons(false);
    }

    // 5. Escuta quando o app foi instalado com sucesso
    window.addEventListener('appinstalled', () => {
        isAppInstalled = true;
        deferredPrompt = null;
        updatePWAInstallButtons(false);
        console.log('[PWA] Aplicativo instalado com sucesso!');
    });

    // 6. Atualização Visual dos Botões de Instalação
    function updatePWAInstallButtons(available) {
        const installBtns = document.querySelectorAll('.pwa-install-btn');
        installBtns.forEach(btn => {
            if (available && !isAppInstalled) {
                btn.style.display = 'inline-flex';
                btn.classList.add('pulse-animation');
            } else if (isAppInstalled) {
                btn.style.display = 'none';
            }
        });
    }

    // 7. Monitoramento de Conexão Online/Offline
    function initOfflineMonitor() {
        function updateOnlineStatus() {
            if (navigator.onLine) {
                document.body.classList.remove('is-offline');
                const offlineBadge = document.getElementById('offline-indicator');
                if (offlineBadge) offlineBadge.remove();

                if (window.showToast && document.datasetIsOffline) {
                    window.showToast("Conexão reestabelecida! Todos os simuladores estão sincronizados.", "success", 3000, `<svg class="lucide lucide-globe" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /> <path d="M2 12h20" /> </svg> Conectado`);
                    document.datasetIsOffline = false;
                }
            } else {
                document.body.classList.add('is-offline');
                document.datasetIsOffline = true;

                if (window.showToast) {
                    window.showToast("Você está sem conexão com a internet. Os simuladores e cálculos continuam funcionando em Modo Offline!", "warning", 5000, `<svg class="lucide lucide-radio" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M16.247 7.761a6 6 0 0 1 0 8.478" /> <path d="M19.075 4.933a10 10 0 0 1 0 14.134" /> <path d="M4.925 19.067a10 10 0 0 1 0-14.134" /> <path d="M7.753 16.239a6 6 0 0 1 0-8.478" /> <circle cx="12" cy="12" r="2" /> </svg> Modo Offline`);
                }
            }
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        if (!navigator.onLine) {
            updateOnlineStatus();
        }
    }

    // 8. Injeção do Botão no Cabeçalho
    function injectPWAButton() {
        const wrapper = document.querySelector('.header-controls-wrapper');
        if (!wrapper) return;

        if (document.getElementById('btn-pwa-install')) return;

        const pwaBtn = document.createElement('button');
        pwaBtn.type = 'button';
        pwaBtn.className = 'pwa-install-btn';
        pwaBtn.id = 'btn-pwa-install';
        pwaBtn.setAttribute('aria-label', 'Instalar Aplicativo PWA');
        pwaBtn.innerHTML = `
            <span class="pwa-icon">
<svg class="lucide lucide-smartphone" xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" style="vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" /> </svg> </span>
            <span class="pwa-label">Instalar App</span>
        `;

        pwaBtn.addEventListener('click', promptInstall);

        // Insere como primeiro controle antes do Modo Foco e Tema
        wrapper.insertBefore(pwaBtn, wrapper.firstChild);

        if (deferredPrompt) {
            pwaBtn.style.display = 'inline-flex';
        }
    }

    // Inicialização
    registerServiceWorker();
    checkStandaloneMode();
    initOfflineMonitor();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPWAButton);
    } else {
        injectPWAButton();
    }

    // MutationObserver para garantir injeção se novos cabeçalhos renderizarem
    const observer = new MutationObserver(() => {
        if (document.querySelector('.header-controls-wrapper') && !document.getElementById('btn-pwa-install')) {
            injectPWAButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Expõe funções no escopo global
    window.promptPWAInstall = promptInstall;
})();
