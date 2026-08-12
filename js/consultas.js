// js/consultas.js
/**
 * Módulo de Busca e Filtragem Dinâmica para a Central de Consultas
 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.getElementById('busca-consultas');
    const consultaItems = document.querySelectorAll('.consulta-item');
    const listContainer = document.querySelector('.docs-list-container');

    if (!inputBusca || !consultaItems.length) return;

    // Cria elemento de estado vazio para quando a busca não retornar resultados
    let emptyState = document.getElementById('empty-consultas-state');
    if (!emptyState && listContainer) {
        emptyState = document.createElement('div');
        emptyState.id = 'empty-consultas-state';
        emptyState.className = 'empty-state';
        emptyState.style.display = 'none';
        emptyState.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
            <p style="font-weight: 600; color: var(--cor-texto-principal); margin-bottom: 4px;">Nenhuma consulta ou certidão encontrada</p>
            <p style="font-size: 0.88rem; color: var(--cor-texto-secundario);">Tente buscar por termos diferentes como "CNPJ", "FGTS", "eSocial", "CPF" ou "Trabalhista".</p>
        `;
        listContainer.appendChild(emptyState);
    }

    function filtrarConsultas() {
        const termo = inputBusca.value.trim().toLowerCase();
        let visiveis = 0;

        consultaItems.forEach(item => {
            const texto = item.innerText.toLowerCase();
            const keywords = item.getAttribute('data-keywords') ? item.getAttribute('data-keywords').toLowerCase() : '';
            const textoCompleto = `${texto} ${keywords}`;

            if (termo === '' || textoCompleto.includes(termo)) {
                item.style.setProperty('display', 'grid', 'important');
                visiveis++;
            } else {
                item.style.setProperty('display', 'none', 'important');
            }
        });

        if (emptyState) {
            emptyState.style.display = visiveis === 0 ? 'block' : 'none';
        }
    }

    inputBusca.addEventListener('input', filtrarConsultas);
    inputBusca.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            inputBusca.value = '';
            filtrarConsultas();
        }
    });
});
