document.addEventListener('DOMContentLoaded', () => {
    const btnSimular = document.getElementById('btn-simular');
    const secaoResultado = document.getElementById('resultado-section');
    const divResultado = document.getElementById('resultado-calculo');

    btnSimular.addEventListener('click', () => {
        const regime = document.getElementById('regime').value;
        const salario = parseFloat(document.getElementById('salario').value) || 0;
        const filhos = parseInt(document.getElementById('filhos').value) || 0;
        const descInss = document.getElementById('descontar-inss').value;
        const outrasBases = parseFloat(document.getElementById('outras-bases').value) || 0;

        // Aqui entra a sua regra de cálculo (Exemplo simples)
        // Você pode implementar o cálculo de INSS e IRRF aqui
        const inss = descInss === 'sim' ? (salario * 0.11) : 0; 
        const totalLiquido = salario - inss;

        secaoResultado.style.display = 'block';
        divResultado.innerHTML = `
            <p><strong>Regime:</strong> ${regime.toUpperCase()}</p>
            <p><strong>Base INSS:</strong> R$ ${salario.toFixed(2)}</p>
            <p><strong>Desconto INSS:</strong> R$ ${inss.toFixed(2)}</p>
            <hr style="margin: 10px 0;">
            <p><strong>Valor Líquido:</strong> R$ ${totalLiquido.toFixed(2)}</p>
        `;
    });
});