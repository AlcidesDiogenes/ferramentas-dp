# Ferramentas DP

App HTML/CSS/JS vanilla (sem bundler/framework), PWA. Para rodar localmente: `node server.js` e acessar `http://localhost:3000`. Para rodar os testes: `npm test`.

## Cálculo de folha (INSS/IRRF/avos/aviso prévio) — não reimplemente, importe

Toda a lógica de cálculo de folha de pagamento (avos de 13º/férias proporcionais, INSS progressivo, IRRF — dedução legal vs. desconto simplificado + redução mensal —, aviso prévio proporcional, validação de ano de data) vive em **`js/simuladores/calculos-folha.js`**. São funções puras (sem acesso a DOM), testadas em `tests/calculos-folha.test.js`.

**Regra:** antes de calcular qualquer uma dessas coisas num simulador/utilidade novo ou existente, importe de `calculos-folha.js`. Não copie/reimplemente a fórmula — essa duplicação já causou bugs reais e divergentes entre simuladores nesta mesma base de código (ex: `rescisao.js` e `comparador-rescisao.js` calculavam IRRF sem aplicar a redução mensal nem comparar com o desconto simplificado, superestimando o imposto, enquanto `custo-funcionario.js` já fazia certo — só foi descoberto porque os dois existiam em paralelo).

Se um simulador precisa exibir a memória de cálculo passo a passo (ex: qual faixa foi aplicada, qual modelo venceu), use `calcularIRRFCompleto(...)` em vez de `calcularIRRF(...)` — ele devolve o objeto completo (bases, faixas, modelo vencedor) além do valor final, para alimentar a UI sem recalcular nada à parte.

Qualquer `<input type="date">` cujo valor alimente cálculo deve validar o ano com `anoDataValido(data)` antes de usar (ver exemplos em `rescisao.js`, `dias-uteis.js` etc.) — um ano digitado incompleto (ex: "26" em vez de "2026") é aceito silenciosamente pelo navegador e já causou avos errados e, em `dias-uteis.js`, um loop que iteraria ~730 mil dias.

Ao editar `calculos-folha.js`, rode `npm test` antes de dar como concluído — e ao migrar um arquivo para importar dele, confirme ao vivo no navegador (não só `node --check`): remover uma função local pode deixar um import agora não usado de `tabelas.js` que outro trecho do mesmo arquivo ainda referencia, o que só aparece como erro em tempo de execução, não na checagem de sintaxe.

## Regra de Theming (Claro/Escuro) — leia antes de mexer em cores

O app suporta tema claro/escuro via atributo `data-theme="dark"` na raiz (`<html>`), alternável pelo usuário (botão no header). As cores de cada tema são variáveis CSS definidas em `css/variables.css`:
- bloco `:root` → valores do tema claro (padrão)
- bloco `[data-theme="dark"]` → overrides do tema escuro

**Regra:** qualquer cor de texto ou de fundo, seja em CSS ou gerada dinamicamente via JS (template strings de relatórios/simuladores em `js/simuladores/*.js`, `js/utilidades/*.js`, `js/dominioSistema/*.js` etc.), DEVE vir de `var(--nome-da-variavel, #fallback-hex)` — nunca hex fixo direto. Um hex fixo só é aceitável quando comprovadamente seguro nos dois temas (ex: texto branco fixo sobre um fundo também fixo e escuro nos dois temas, tipo `.custo-kpi-card`/sidebar; ou um badge com par fundo+texto fixos que já garante contraste, tipo `background:#dcfce7; color:#166534`). Nesses casos, deixe um comentário perto explicando por quê, se não for óbvio.

Variáveis mais usadas (ver lista completa em `css/variables.css`):
- `--cor-texto-principal` / `--cor-texto-secundario`
- `--cor-text-success` / `--cor-text-danger` / `--cor-text-info`
- `--cor-card-bg` / `--cor-card-subtle-bg` / `--cor-borda` / `--cor-fundo` / `--cor-destaque`

Exemplo (bug real já corrigido em `js/simuladores/detalhamento-calculos.js`):

```js
// Antes (hex fixo — some no tema escuro)
`<span style="color: #475569;">...</span>`

// Depois (segue o tema automaticamente)
`<span style="color: var(--cor-texto-secundario, #64748b);">...</span>`
```

Antes de dar como resolvido um ajuste de cor, confirme visualmente no navegador nos dois temas (claro e escuro), não só pela leitura do código — muitas vezes um fundo com `var()` some/aparece dependendo do tema, e um texto com hex fixo por trás fica ilegível só em um dos dois.

### Cuidado extra: nomes de variáveis errados/antigos

Já apareceram no projeto `var(--cor-texto)`, `var(--cor-primaria)`, `var(--cor-sucesso)`, `var(--cor-erro)`, `var(--cor-fundo-app)`, `var(--cor-fundo-card)` — nomes de uma convenção antiga que **não existem** em `css/variables.css` (os nomes certos são `--cor-texto-principal`, `--cor-destaque`, `--cor-text-success`, `--cor-text-danger`, `--cor-fundo`, `--cor-card-bg`). Uma `var()` para uma variável inexistente e sem fallback não gera erro no console — a propriedade só é ignorada silenciosamente (texto herda a cor do elemento pai, fundo vira transparente), então o bug passa despercebido até alguém notar visualmente que uma cor "sumiu" ou que um destaque semântico (ex: hora extra em verde, atraso em vermelho) parou de aparecer. Ao mexer em qualquer `var(--cor-...)`, confira que o nome existe de fato em `css/variables.css`.
