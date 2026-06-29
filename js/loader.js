document.addEventListener('DOMContentLoaded', async () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    try {
        // Cálculo dinâmico do caminho base para o root
        // Verifica profundidade para saber quantos níveis voltar (../)
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
                // Remove prefixos para garantir caminho limpo a partir da raiz
                href = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
                link.setAttribute('href', basePath + href);
            }
        });

        // ==========================================
        // 2. Lógica para identificar a página ativa
        const caminhoAtual = window.location.pathname;
        links.forEach(link => {
            const href = link.getAttribute('href');
            // Verifica se a URL atual termina com o endereço do link
            if (caminhoAtual.endsWith(href.replace(/^\.\//, ''))) {
                link.classList.add('active');
            }
        });
        
        // ==========================================
        // 3. Toggle da Sidebar
        const toggleBtn = document.getElementById('toggle-sidebar');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle("menu-fechado");
                localStorage.setItem("menuRetraido", document.documentElement.classList.contains("menu-fechado"));
            });
        }
    } catch (error) {
        console.error("Erro no loader.js:", error);
    }
});