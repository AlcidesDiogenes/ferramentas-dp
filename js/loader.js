document.addEventListener('DOMContentLoaded', async () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    try {
        const isSubpage = window.location.pathname.includes('/pages/');
        const basePath = isSubpage ? '../' : './';
        
        const response = await fetch(`${basePath}components/sidebar.html`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar sidebar: ${response.status}`);
        }
        
        const html = await response.text();
        placeholder.innerHTML = html;
        
        // ==========================================
        const links = placeholder.querySelectorAll('a');
        links.forEach(link => {
            let href = link.getAttribute('href');
            
            // Só altera links internos (ignora links externos com http ou âncoras #)
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                // Remove qualquer "../" ou "./" que você possa ter digitado por engano no sidebar.html
                href = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
                
                // Aplica a base correta (volta uma pasta se estiver no módulo, ou mantém na raiz se estiver no index)
                link.setAttribute('href', basePath + href);   
            }
        });

        const caminhoAtual = window.location.pathname;
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Removemos os pontos e barras iniciais para comparar apenas o nome do arquivo/pasta
            const caminhoComparacao = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
            
            // Verifica se o caminho atual termina com o endereço do link
            if (caminhoAtual.endsWith(caminhoComparacao)) {
                link.classList.add('active');
            }
        });
        // ==========================================
        
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