document.addEventListener('DOMContentLoaded', async () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    
    // Early return: se não houver menu na página, ignora o script
    if (!placeholder) return;

    try {
        // Lógica inteligente: Verifica se a URL atual contém a pasta "/pages/"
        const isSubpage = window.location.pathname.includes('/pages/');
        
        // Se estiver numa subpágina, volta uma pasta (../). Se estiver no index, usa a pasta atual (./).
        const basePath = isSubpage ? '../' : './';
        
        // Faz a busca do HTML do menu lateral
        const response = await fetch(`${basePath}components/sidebar.html`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar sidebar: ${response.status}`);
        }
        
        // Injeta o HTML na página
        const html = await response.text();
        placeholder.innerHTML = html;
        
        // Inicializa o botão de retrair o menu (Antigo inicializarMenu)
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