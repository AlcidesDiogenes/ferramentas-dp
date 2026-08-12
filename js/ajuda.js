// js/ajuda.js
/**
 * Lógica de busca interativa e filtragem na Central de Ajuda e Atalhos
 */
document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.getElementById('busca-ajuda');
    const items = document.querySelectorAll('.shortcut-item, .instruction-item');
    const emptyState = document.getElementById('empty-ajuda-state');

    if (!inputBusca) return;

    function filtrarAjuda() {
        const termo = inputBusca.value.trim().toLowerCase();
        let visiveis = 0;

        items.forEach(item => {
            const texto = item.innerText.toLowerCase();
            const keywords = item.getAttribute('data-keywords') ? item.getAttribute('data-keywords').toLowerCase() : '';
            const textoCompleto = `${texto} ${keywords}`;

            if (termo === '' || textoCompleto.includes(termo)) {
                if (item.classList.contains('shortcut-item')) {
                    item.style.setProperty('display', 'flex', 'important');
                } else if (item.classList.contains('instruction-item')) {
                    item.style.setProperty('display', 'flex', 'important');
                }
                visiveis++;
            } else {
                item.style.setProperty('display', 'none', 'important');
            }
        });

        if (emptyState) {
            emptyState.style.display = visiveis === 0 ? 'block' : 'none';
        }
    }

    inputBusca.addEventListener('input', filtrarAjuda);
    inputBusca.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            inputBusca.value = '';
            filtrarAjuda();
        }
    });
});
