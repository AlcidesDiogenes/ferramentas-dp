document.addEventListener('DOMContentLoaded', async () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    
    if (placeholder) {
        // Lógica: se estiver em 'pages', volta uma pasta. Se não, busca na pasta atual.
        const isPages = window.location.pathname.includes('pages');
        const path = isPages ? '../components/sidebar.html' : 'components/sidebar.html';

        try {
            console.log("Tentando buscar sidebar em:", path); // Isso vai aparecer no seu F12
            const response = await fetch(path);
            
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado em: ${window.location.origin}/${path}`);
            }
            
            const html = await response.text();
            placeholder.innerHTML = html;
            inicializarMenu();
        } catch (error) {
            console.error("Erro no loader:", error);
            placeholder.innerHTML = `<p style="color:red;">Erro: ${error.message}</p>`;
        }
    }
});

function inicializarMenu() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle("menu-fechado");
            localStorage.setItem("menuRetraido", document.documentElement.classList.contains("menu-fechado"));
        });
    }
}