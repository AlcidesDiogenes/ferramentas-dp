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

    const bibliotecas = [
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', // <-- Biblioteca do Supabase adicionada aqui
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js'
    ];

    bibliotecas.forEach(url => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false; // Garante a ordem de carregamento
        document.head.appendChild(script);
    });

    // Calcula automaticamente o caminho relativo para a raiz dependendo de onde a página está
    let prefixo = '';
    const path = window.location.pathname;
    if (path.includes('/pages/simuladores/') || path.includes('/pages/dominioSistema/') || path.includes('/pages/auth/') || path.includes('/pages/gestao/') || path.includes('/pages/central-de-dados/')) {
        prefixo = '../../';
    } else if (path.includes('/pages/')) {
        prefixo = '../';
    }

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

    // Injeta automaticamente o script de autenticação do sidebar em qualquer página
    const sidebarAuth = document.createElement('script');
    sidebarAuth.type = 'module';
    sidebarAuth.src = prefixo + 'js/services/sidebar-auth.js';
    document.head.appendChild(sidebarAuth);
})();

// Otimização de performance (Preconnect)
const preconnect = document.createElement('link');
preconnect.rel = 'preconnect';
preconnect.href = 'https://fonts.gstatic.com';
preconnect.crossOrigin = 'anonymous';
document.head.appendChild(preconnect);