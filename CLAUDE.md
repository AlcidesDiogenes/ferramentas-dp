# Ferramentas DP

App HTML/CSS/JS vanilla (sem bundler/framework), PWA. Para rodar localmente: `node server.js` e acessar `http://localhost:3000`.

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
