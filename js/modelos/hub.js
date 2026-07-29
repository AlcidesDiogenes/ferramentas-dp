// js/modelos/hub.js

document.addEventListener('DOMContentLoaded', () => {
    const inputBusca = document.getElementById('busca-documentos');
    const docItems = document.querySelectorAll('.doc-item');

    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            
            docItems.forEach(item => {
                // Captura todo o texto (Título + Descrição) de forma segura
                const textoConteudo = item.innerText.toLowerCase();
                
                if (textoConteudo.includes(termo)) {
                    // Restaura o grid e força a visibilidade contra qualquer outra regra
                    item.style.setProperty('display', 'grid', 'important');
                } else {
                    // Esconde o elemento forçando o !important pelo JavaScript
                    item.style.setProperty('display', 'none', 'important');
                }
            });
        });
    }
});