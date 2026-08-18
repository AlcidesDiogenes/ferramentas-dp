// js/head-manager.js
(function() {
    // Aplicação imediata do tema salvo (evita efeito piscar / flicker)
    try {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.setAttribute("data-theme", "light");
        }
    } catch (e) {
        console.warn("Erro ao acessar localStorage para o tema:", e);
    }

    // Bibliotecas sem dependência de ordem entre si: carregam em paralelo e executam assim
    // que prontas, sem bloquear a execução das demais (cada página só de fato usa a que precisa).
    const bibliotecasIndependentes = [
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    ];
    bibliotecasIndependentes.forEach(url => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        document.head.appendChild(script);
    });

    // pdfmake precisa carregar antes de vfs_fonts (que registra fontes no objeto pdfMake) —
    // essas duas mantêm ordem garantida entre si.
    const bibliotecasOrdenadas = [
        'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js'
    ];
    bibliotecasOrdenadas.forEach(url => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false;
        document.head.appendChild(script);
    });

    // Calcula automaticamente o caminho relativo para a raiz dependendo de onde a página está
    // (mesmo algoritmo de js/loader.js e js/command-palette.js — funciona para qualquer
    // profundidade de subpasta, não só as conhecidas hoje)
    const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
    const pagesIndex = pathParts.indexOf('pages');
    const depth = pagesIndex === -1 ? 0 : (pathParts.length - pagesIndex - 1);
    const prefixo = depth === 0 ? '' : '../'.repeat(depth);

    // Injeta a configuração global de módulos e status de badges
    const modulesConfig = document.createElement('script');
    modulesConfig.src = prefixo + 'js/modules-config.js';
    document.head.appendChild(modulesConfig);

    // Injeta o sistema de Notificações Toast (Substituição de alert)
    const toastScript = document.createElement('script');
    toastScript.src = prefixo + 'js/toast.js';
    document.head.appendChild(toastScript);

    // Injeta o gerenciador de tema
    const themeToggle = document.createElement('script');
    themeToggle.src = prefixo + 'js/theme-toggle.js';
    document.head.appendChild(themeToggle);

    // Injeta o carregador otimizado da sidebar (carregamento instantâneo)
    const sidebarLoader = document.createElement('script');
    sidebarLoader.src = prefixo + 'js/loader.js';
    document.head.appendChild(sidebarLoader);

    // Injeta o componente visual de loading (spinner)
    const pageLoader = document.createElement('script');
    pageLoader.src = prefixo + 'js/page-loader.js';
    document.head.appendChild(pageLoader);

    // Injeta o suporte global à navegação por teclado
    const keyboardNav = document.createElement('script');
    keyboardNav.src = prefixo + 'js/keyboard-nav.js';
    document.head.appendChild(keyboardNav);

    // Injeta a Pesquisa Rápida Global (Command Palette Ctrl+K) e Atalhos
    const cmdPalette = document.createElement('script');
    cmdPalette.src = prefixo + 'js/command-palette.js';
    document.head.appendChild(cmdPalette);

    // Injeta o Gerenciador Universal de Uploads (Drag & Drop e pré-visualização)
    const fileUploaderHelper = document.createElement('script');
    fileUploaderHelper.src = prefixo + 'js/file-uploader-helper.js';
    document.head.appendChild(fileUploaderHelper);

    // Injeta o Gerenciador de Instalação e Suporte PWA (Offline)
    const pwaInstaller = document.createElement('script');
    pwaInstaller.src = prefixo + 'js/pwa-installer.js';
    document.head.appendChild(pwaInstaller);

    // Injeção de Meta Tags e Manifest PWA
    if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = prefixo + 'manifest.json';
        document.head.appendChild(manifestLink);
    }

    if (!document.querySelector('link[rel="icon"]')) {
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/svg+xml';
        faviconLink.href = prefixo + 'icons/icon.svg';
        document.head.appendChild(faviconLink);

        const appleTouch = document.createElement('link');
        appleTouch.rel = 'apple-touch-icon';
        appleTouch.href = prefixo + 'icons/icon-192.png';
        document.head.appendChild(appleTouch);
    }

    // Meta tags PWA para mobile / iOS
    const pwaMetaTags = [
        { name: 'theme-color', content: '#1e293b' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Ferramentas DP' }
    ];

    pwaMetaTags.forEach(meta => {
        if (!document.querySelector(`meta[name="${meta.name}"]`)) {
            const metaEl = document.createElement('meta');
            metaEl.name = meta.name;
            metaEl.content = meta.content;
            document.head.appendChild(metaEl);
        }
    });
})();

// Otimização de performance (Preconnect)
const preconnect = document.createElement('link');
preconnect.rel = 'preconnect';
preconnect.href = 'https://fonts.gstatic.com';
preconnect.crossOrigin = 'anonymous';
document.head.appendChild(preconnect);