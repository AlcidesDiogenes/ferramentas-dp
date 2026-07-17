// js/loader.js

document.addEventListener('DOMContentLoaded', async () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    try {
        // Cálculo dinâmico do caminho base para o root
        // Verifica a profundidade para saber quantos níveis voltar (../)
        const pathParts = window.location.pathname.split('/').filter(p => p.length > 0);
        const depth = pathParts.includes('pages') ? (pathParts.length - (pathParts.indexOf('pages') + 1)) : 0;
        const basePath = depth === 0 ? './' : '../'.repeat(depth);
        
        const response = await fetch(`${basePath}components/sidebar.html`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar sidebar: ${response.status}`);
        }
        
        const html = await response.text();
        placeholder.innerHTML = html;
        
        // ==========================================
        // 1. Ajuste dos links da sidebar (Caminhos)
        const links = placeholder.querySelectorAll('a');
        links.forEach(link => {
            let href = link.getAttribute('href');
            
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                // Remove prefixos para garantir um caminho limpo a partir da raiz
                href = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
                link.setAttribute('href', basePath + href);
            }
        });

        // ==========================================
        // 2. CORREÇÃO: Lógica para identificar a página ativa
        const caminhoAtual = window.location.pathname;
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                // Limpa o basePath adicionado no passo 1 (remove os ../) para fazer a comparação exata
                const linkLimpo = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
                
                // Se a URL do navegador terminar com o link limpo, esta é a página ativa
                if (caminhoAtual.endsWith(linkLimpo)) {
                    link.classList.add('active');
                }
            }
        });
        
        // ==========================================
        // 3. Toggle da Sidebar e Persistência de Estado
        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            // Recupera o estado salvo no cache do navegador ao carregar a página
            if(localStorage.getItem("menuRetraido") === "true") {
                document.documentElement.classList.add("menu-fechado");
            }

            // Adiciona o evento de clique para minimizar/expandir
            toggleBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle("menu-fechado");
                localStorage.setItem("menuRetraido", document.documentElement.classList.contains("menu-fechado"));
            });
        }

        // ==========================================
        // 4. Libera a Tela (Prevenção de FOUC)
        if (document.body.classList.contains('preload')) {
            document.body.classList.remove('preload');
        }

    } catch (error) {
        console.error("Erro no loader.js:", error);
    }
});